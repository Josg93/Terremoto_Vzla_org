from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL=os.getenv("DATABASE_URL")

#El engine maneja la conexion con la base de datos

engine = create_engine(DATABASE_URL)
SessionLocal= sessionmaker(autocommit=False , autoFlush = False , bind= engine )  

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()    