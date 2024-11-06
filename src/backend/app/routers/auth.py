import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import jwt
from datetime import datetime
from functools import wraps

from .. import schemas
from .. import models
from ..database import Base, engine, SessionLocal
from ..utils.utils import create_access_token, create_refresh_token, verify_password, get_hashed_password
from ..utils.auth_bearer import JWTBearer

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_MINUTES: int
    ALGORITHM: str
    JWT_SECRET_KEY: str
    JWT_REFRESH_SECRET_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()


ACCESS_TOKEN_EXPIRE_MINUTES = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", None)
REFRESH_TOKEN_EXPIRE_MINUTES = os.environ.get("REFRESH_TOKEN_EXPIRES_MINUTES", None)
ALGORITHM = os.environ.get("ALGORITHM", None)
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", None)
JWT_REFRESH_SECRET_KEY = os.environ.get("JWT_REFRESH_SECRET_KEY", None)

Base.metadata.create_all(engine)

def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

router = APIRouter(prefix="/login", tags=["login"])

@router.post("/register")
def register_user(user: schemas.UserCreate, session: Session = Depends(get_session)):
    existing_user = session.query(models.User).filter_by(email=user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    encrypted_password = get_hashed_password(user.password)

    new_user = models.User(username=user.username, email=user.email, password=encrypted_password )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return {"message":"user created successfully"}

from fastapi import BackgroundTasks
from datetime import datetime, timedelta
import time
from fastapi.security import OAuth2PasswordRequestForm

# Add rate limiting
login_attempts = {}
MAX_ATTEMPTS = 5
LOCKOUT_TIME = 300  # 5 minutes

from fastapi import Request  # Add this import

# Modified login endpoint
@router.post('/login', response_model=schemas.TokenSchema)
async def login(
    request: Request,  # Add request parameter
    form_data: OAuth2PasswordRequestForm = Depends(),  # Rename from 'request' to 'form_data'
    db: Session = Depends(get_session),
    background_tasks: BackgroundTasks = None
):
    # Get IP from request
    ip = request.client.host

    # Check rate limiting
    if ip in login_attempts:
        if login_attempts[ip]['attempts'] >= MAX_ATTEMPTS:
            if time.time() - login_attempts[ip]['timestamp'] < LOCKOUT_TIME:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many failed attempts. Try again in {LOCKOUT_TIME} seconds"
                )
            login_attempts[ip]['attempts'] = 0

    # Verify user
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        # Track failed attempt
        if ip not in login_attempts:
            login_attempts[ip] = {'attempts': 1, 'timestamp': time.time()}
        else:
            login_attempts[ip]['attempts'] += 1
            login_attempts[ip]['timestamp'] = time.time()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Create tokens
    access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token_expires = timedelta(minutes=int(REFRESH_TOKEN_EXPIRE_MINUTES))

    access_token = create_access_token(
        user.id,
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        user.id,
        expires_delta=refresh_token_expires
    )

    # Store token in database
    token_db = models.TokenTable(
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        status=True,
        expires_at=datetime.utcnow() + access_token_expires
    )
    db.add(token_db)
    db.commit()

    # Clean up old tokens in background
    if background_tasks:
        background_tasks.add_task(cleanup_old_tokens, db, user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

async def cleanup_old_tokens(db: Session, user_id: int):
    """Remove expired and invalid tokens from database"""
    db.query(models.TokenTable).filter(
        models.TokenTable.user_id == user_id,
        models.TokenTable.expires_at < datetime.utcnow()
    ).delete()
    db.commit()

@router.get('/getusers')
def getusers(dependencies = Depends(JWTBearer()), session: Session = Depends(get_session)):
    user = session.query(models.User).all()
    return user

@router.post('/change-password')
def change_password(request: schemas.changepassword, db: Session = Depends(get_session)):
    user = db.query(models.User).filter(models.User.email == request.email).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    if not verify_password(request.old_password, user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid old password")

    encrypted_password = get_hashed_password(request.new_password)
    user.password = encrypted_password
    db.commit()

    return {"message": "Password changed successfully"}

@router.post('/logout')
def logout(dependencies = Depends(JWTBearer()), db: Session = Depends(get_session)):
    token=dependencies
    payload = jwt.decode(token, JWT_SECRET_KEY, ALGORITHM)
    user_id = payload['sub']
    token_record = db.query(models.TokenTable).all()
    info=[]

    for record in token_record :
        print("record",record)
        if (datetime.utcnow() - record.created_date).days >1:
            info.append(record.user_id)
    if info:
        existing_token = db.query(models.TokenTable).where(models.TokenTable.user_id.in_(info)).delete()
        db.commit()

    existing_token = db.query(models.TokenTable).filter(models.TokenTable.user_id == user_id, models.TokenTable.access_toke==token).first()

    if existing_token:
        existing_token.status=False
        db.add(existing_token)
        db.commit()
        db.refresh(existing_token)

    return {"message":"Logout Successfully"}

def token_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):

        payload = jwt.decode(kwargs['dependencies'], JWT_SECRET_KEY, ALGORITHM)
        user_id = payload['sub']
        data= kwargs['session'].query(models.TokenTable).filter_by(user_id=user_id,access_toke=kwargs['dependencies'],status=True).first()

        if data:
            return func(kwargs['dependencies'],kwargs['session'])

        else:
            return {'msg': "Token blocked"}

    return wrapper

@router.post('/refresh')
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_session)
):
    try:
        payload = jwt.decode(
            refresh_token, JWT_REFRESH_SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id = payload.get('sub')
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Create new access token
        access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
        access_token = create_access_token(
            user_id,
            expires_delta=access_token_expires
        )

        return {"access_token": access_token}
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
