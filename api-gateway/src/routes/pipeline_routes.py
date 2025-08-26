# Em: api-gateway/src/routes/pipeline_routes.py

from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import expression
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from .. import models
from ..auth import auth
from ..database import get_db

# Importa o gerenciador assíncrono e a função de dependência
from ..websockets.handler import RabbitMQManager, get_rabbit_manager

router = APIRouter(
    prefix="/api/pipelines",
    tags=["Pipelines"]
)

# --- Funções Auxiliares (permanecem as mesmas) ---
def get_camera_name_from_graph(graph_data: Dict[str, Any]) -> Optional[str]:
    """ Extrai o nome da câmera do nó de entrada de vídeo no grafo do pipeline. """
    for node in graph_data.get('nodes', []):
        if node.get('type') == 'videoInput':
            return node.get('data', {}).get('camera_name')
    return None

# --- Modelos Pydantic (permanecem os mesmos) ---
class PipelineBase(BaseModel):
    name: str
    is_active: bool = True
    graph_data: Dict[str, Any]

class PipelineCreate(PipelineBase):
    pass

class PipelineResponse(PipelineBase):
    id: int
    class Config:
        from_attributes = True

# --- Endpoints Assíncronos e Síncronos Corretos ---

# POST, PUT, DELETE são 'async' porque interagem com o RabbitMQ (operação de I/O)
@router.post("", status_code=201, response_model=PipelineResponse, dependencies=[Depends(auth.get_current_admin_user)])
async def create_pipeline(
    pipeline: PipelineCreate, 
    db: Session = Depends(get_db), 
    rabbit: RabbitMQManager = Depends(get_rabbit_manager)
):
    db_pipeline = models.Pipeline(**pipeline.dict())
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    
    # Notificação Inteligente com 'await'
    camera_name = get_camera_name_from_graph(db_pipeline.graph_data)
    if camera_name:
        await rabbit.publish_config_update(camera_name)
        
    return db_pipeline

# GETs podem permanecer síncronos, pois apenas acessam o banco de dados via SQLAlchemy,
# que, por padrão, opera de forma síncrona com a configuração do FastAPI.
@router.get("", response_model=List[PipelineResponse], dependencies=[Depends(auth.get_current_user)])
def get_pipelines(
    camera_name: Optional[str] = Query(None, description="Filtra os pipelines por nome da câmera associada."),
    db: Session = Depends(get_db)
):
    query = db.query(models.Pipeline)
    if camera_name:
        query = query.filter(
            models.Pipeline.is_active == True,
            expression.cast(models.Pipeline.graph_data, models.JSONB)['nodes'].astext.like(f'%{{"camera_name": "{camera_name}"%')
        )
    pipelines = query.order_by(models.Pipeline.name).all()
    return pipelines

@router.get("/{pipeline_id}", response_model=PipelineResponse, dependencies=[Depends(auth.get_current_user)])
def get_pipeline_by_id(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = db.query(models.Pipeline).filter(models.Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    return pipeline

@router.put("/{pipeline_id}", response_model=PipelineResponse, dependencies=[Depends(auth.get_current_admin_user)])
async def update_pipeline(
    pipeline_id: int, 
    pipeline_update: PipelineCreate, 
    db: Session = Depends(get_db), 
    rabbit: RabbitMQManager = Depends(get_rabbit_manager)
):
    db_pipeline = db.query(models.Pipeline).filter(models.Pipeline.id == pipeline_id).first()
    if not db_pipeline:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado.")
    
    old_camera_name = get_camera_name_from_graph(db_pipeline.graph_data)

    # Atualiza os dados
    update_data = pipeline_update.model_dump()
    for key, value in update_data.items():
        setattr(db_pipeline, key, value)
        
    db.commit()
    db.refresh(db_pipeline)
    
    # Notificação Inteligente com 'await'
    new_camera_name = get_camera_name_from_graph(db_pipeline.graph_data)
    if new_camera_name:
        await rabbit.publish_config_update(new_camera_name)
    if old_camera_name and old_camera_name != new_camera_name:
        await rabbit.publish_config_update(old_camera_name)
        
    return db_pipeline

@router.delete("/{pipeline_id}", status_code=204, dependencies=[Depends(auth.get_current_admin_user)])
async def delete_pipeline(
    pipeline_id: int, 
    db: Session = Depends(get_db), 
    rabbit: RabbitMQManager = Depends(get_rabbit_manager)
):
    db_pipeline = db.query(models.Pipeline).filter(models.Pipeline.id == pipeline_id).first()
    if not db_pipeline:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado.")
    
    camera_name = get_camera_name_from_graph(db_pipeline.graph_data)

    db.delete(db_pipeline)
    db.commit()
    
    # Notificação Inteligente com 'await'
    if camera_name:
        await rabbit.publish_config_update(camera_name)
        
    return Response(status_code=204)