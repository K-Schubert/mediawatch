import os
from typing import Union
from dotenv import load_dotenv
load_dotenv()

import jwt
from datetime import datetime
from jwt.exceptions import InvalidTokenError
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..models import TokenTable
#from ..routers.auth import get_session

from ..database import SessionLocal
def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

load_dotenv()

ACCESS_TOKEN_EXPIRE_MINUTES = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", None)
REFRESH_TOKEN_EXPIRE_MINUTES = os.environ.get("REFRESH_TOKEN_EXPIRES_MINUTES", None)
ALGORITHM = os.environ.get("ALGORITHM", None)
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", None)
JWT_REFRESH_SECRET_KEY = os.environ.get("JWT_REFRESH_SECRET_KEY", None)

def decodeJWT(jwtoken: str):
    try:
        # Decode and verify the token
        payload = jwt.decode(jwtoken, JWT_SECRET_KEY, ALGORITHM)
        return payload
    except InvalidTokenError:
        return None

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request, db: Session = Depends(get_session)):
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)

        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authorization code."
            )

        if not credentials.scheme == "Bearer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authentication scheme."
            )

        # Verify token validity
        if not (token_data := self.verify_jwt(credentials.credentials)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid token or expired token."
            )

        # Check if token is in database and still valid
        token_record = db.query(TokenTable).filter(
            TokenTable.access_token == credentials.credentials,
            TokenTable.status == True,
            TokenTable.expires_at > datetime.utcnow()
        ).first()

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token is invalid or expired"
            )

        return credentials.credentials

    def verify_jwt(self, token: str) -> Union[dict, None]:
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
            if datetime.fromtimestamp(payload['exp']) < datetime.utcnow():
                return None
            return payload
        except jwt.JWTError:
            return None

jwt_bearer = JWTBearer()
