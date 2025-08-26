from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional  # <--- PASSO 1: Importe 'Optional'
from datetime import datetime

from .. import models
from ..auth import auth
from ..database import get_db
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/events",
    tags=["Events"]
)

# --- Modelo Pydantic Corrigido ---
class EventResponse(BaseModel):
    id: int
    camera_name: str
    event_type: str
    message: str
    timestamp: datetime
    # PASSO 2: Use Optional[] em vez de | None
    image_filename: Optional[str] = None 
    pipeline_id: Optional[int] = None

    class Config:
        # Pydantic v2 prefere 'from_attributes' mas 'orm_mode' ainda funciona com um aviso.
        # Vamos manter o seu original para não introduzir mais mudanças.
        from_attributes = True

# --- Endpoint (nenhuma mudança necessária aqui) ---
@router.get("", response_model=List[EventResponse], dependencies=[Depends(auth.get_current_user)])
def get_events(
    limit: int = Query(50, ge=1, le=200, description="Número de eventos a retornar"),
    offset: int = Query(0, ge=0, description="Número de eventos a pular"),
    db: Session = Depends(get_db)
):
    """
    Busca os eventos mais recentes do banco de dados com paginação.
    """
    events = db.query(models.Event).order_by(models.Event.timestamp.desc()).offset(offset).limit(limit).all()
    return events