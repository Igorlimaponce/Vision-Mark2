import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = os.getenv('DATABASE_URL')

# O engine do SQLAlchemy
engine = create_engine(DATABASE_URL)

# SessionLocal é a classe que usaremos para criar sessões de DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para nossos modelos ORM
Base = declarative_base()

# Dependência para obter uma sessão do DB em cada requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()