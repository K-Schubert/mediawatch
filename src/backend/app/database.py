import os
import time
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

Base = declarative_base()

# Retry mechanism for database connection
max_retries = 5
retries = 0
engine = None

while retries < max_retries:
    try:
        time.sleep(10)
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        print("Database connection established.")
        break
    except OperationalError:
        retries += 1
        print(f"Database connection failed. Retrying in 5 seconds... ({retries}/{max_retries})")
        time.sleep(5)
else:
    raise Exception("Failed to connect to the database after multiple attempts.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
