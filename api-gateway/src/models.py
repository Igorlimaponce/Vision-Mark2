from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, Text
from pgvector.sqlalchemy import VECTOR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
# Importação absoluta
from src.database import Base

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    rtsp_url = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Pipeline(Base):
    __tablename__ = "pipelines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    graph_data = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="SET NULL"))
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    camera_name = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    message = Column(Text)
    media_path = Column(String)
    details = Column(JSON)

class Identity(Base):
    __tablename__ = 'identities'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    embeddings = relationship("FaceEmbedding", back_populates="identity", cascade="all, delete-orphan")

class FaceEmbedding(Base):
    __tablename__ = 'face_embeddings'
    id = Column(Integer, primary_key=True, index=True)
    identity_id = Column(Integer, ForeignKey('identities.id', ondelete="CASCADE"), nullable=False)
    embedding = Column(VECTOR(512))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    identity = relationship("Identity", back_populates="embeddings")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="viewer")