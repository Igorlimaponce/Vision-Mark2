# api-gateway/src/routes/auth_routes.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from .. import models
from ..auth import auth
from ..database import get_db

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

# --- Modelos Pydantic ---
class UserRegister(BaseModel):
    username: str
    password: str
    role: Optional[str] = "viewer"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserProfile(BaseModel):
    username: str
    role: str

# --- Endpoints ---
@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registra um novo usuário no sistema.
    """
    # Verifica se o usuário já existe
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário já existe"
        )
    
    # Cria o hash da senha
    hashed_password = auth.get_password_hash(user_data.password)
    
    # Cria o usuário
    db_user = models.User(
        username=user_data.username,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Autentica um usuário e retorna um token JWT.
    """
    # Busca o usuário
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # Verifica credenciais
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Cria o token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        role=user.role
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    """
    Retorna o perfil do usuário autenticado.
    """
    return UserProfile(username=current_user.username, role=current_user.role)

@router.post("/logout")
def logout_user():
    """
    Endpoint de logout (no lado do cliente, apenas remove o token).
    """
    return {"message": "Logout realizado com sucesso"}

@router.get("/check")
def check_auth(current_user: models.User = Depends(auth.get_current_user)):
    """
    Verifica se o usuário está autenticado.
    """
    return {"authenticated": True, "username": current_user.username, "role": current_user.role}
