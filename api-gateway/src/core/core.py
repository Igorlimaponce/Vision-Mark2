import psycopg2
from psycopg2 import pool # <-- A LINHA DE CORREÇÃO ESTÁ AQUI
from psycopg2.extensions import connection
from fastapi import Request, HTTPException
import os
import logging
from contextlib import contextmanager

from ..database import SessionLocal

DATABASE_URL = os.getenv('DATABASE_URL')
logging.basicConfig(level=logging.INFO)

# Pool de conexões para performance e resiliência
db_conn_pool = None

def startup_db_pool():
    global db_conn_pool
    try:
        logging.info("Creating database connection pool...")
        # Agora o psycopg2.pool.SimpleConnectionPool vai funcionar porque importámos 'pool'
        db_conn_pool = pool.SimpleConnectionPool(1, 10, dsn=DATABASE_URL)
        if db_conn_pool:
            logging.info("Database connection pool created successfully.")
    except psycopg2.OperationalError as e:
        logging.error(f"Failed to create database connection pool: {e}")
        db_conn_pool = None

def shutdown_db_pool():
    global db_conn_pool
    if db_conn_pool:
        logging.info("Closing database connection pool.")
        db_conn_pool.closeall()

@contextmanager
def get_db_connection_from_pool():
    if not db_conn_pool:
        raise HTTPException(status_code=503, detail="Database service not available")
    
    conn = None
    try:
        conn = db_conn_pool.getconn()
        yield conn
    finally:
        if conn:
            db_conn_pool.putconn(conn)

# Dependência do FastAPI
def get_db():
    try:
        with get_db_connection_from_pool() as conn:
            yield conn
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        raise HTTPException(status_code=503, detail="Could not connect to the database")
    
async def get_camera_by_id(camera_id: int):
    """
    Busca uma câmera específica pelo seu ID no banco de dados.
    """
    conn = await get_db_connection()
    camera = await conn.fetchrow("SELECT id, name, rtsp_url FROM cameras WHERE id = $1", camera_id)
    await conn.close()
    return dict(camera) if camera else None
