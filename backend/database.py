from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from init_sqlite_db import init_and_seed_sqlite

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), "brahmand.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Ensure SQLite tables and seed data exist
try:
    init_and_seed_sqlite()
except Exception as e:
    print(f"[database.py] Warning initializing sqlite db: {e}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_sql_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

