# Em: api-gateway/src/routes/identity_routes.py

import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

# Importações de banco de dados e modelos
from .. import models
from ..auth import auth
from ..database import get_db

# --- Configurações e Inicialização ---

# Configuração do diretório para salvar as imagens de identidade
UPLOAD_DIR = "../uploads/identities"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Configuração do Logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/identities",
    tags=["Identities"]
)


# --- Modelos Pydantic (Corrigidos e Completos) ---

class IdentityResponse(BaseModel):
    """ Modelo de resposta para uma identidade, incluindo o nome do arquivo da imagem. """
    id: int
    name: str
    description: Optional[str] = None
    image_filename: str

    class Config:
        from_attributes = True # Equivalente ao orm_mode = True

class MatchResponse(BaseModel):
    """ Modelo de resposta para uma tentativa de correspondência facial. """
    match_found: bool
    identity_id: Optional[int] = None
    identity_name: Optional[str] = None
    distance: Optional[float] = None


# --- Endpoints da API ---

@router.post("", status_code=201, response_model=IdentityResponse, dependencies=[Depends(auth.get_current_admin_user)])
def create_identity(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova identidade.
    Recebe uma imagem, detecta um rosto, gera o embedding e salva no banco de dados.
    """
    # Validação do tipo de arquivo para segurança básica
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado não é uma imagem válida.")

    file_extension = os.path.splitext(image.filename)[1]
    image_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, image_filename)

    try:
        # Salva o arquivo temporariamente
        with open(file_path, "wb") as buffer:
            buffer.write(image.file.read())

        # Lê a imagem com OpenCV
        img_array = cv2.imread(file_path)
        if img_array is None:
            raise ValueError("Falha ao ler o arquivo de imagem com OpenCV.")

        # Gera o embedding facial usando a DeepFace
        embedding_objs = DeepFace.represent(
            img_path=img_array, 
            model_name='ArcFace', 
            enforce_detection=True # Garante que um rosto seja encontrado
        )
        embedding = embedding_objs[0]["embedding"]

        # Cria a nova identidade no banco de dados
        db_identity = models.Identity(
            name=name,
            description=description,
            image_filename=image_filename,
            embedding=embedding # Salva o embedding como um vetor
        )
        db.add(db_identity)
        db.commit()
        db.refresh(db_identity)
        
        return db_identity

    except ValueError as ve:
        # Erro específico quando nenhum rosto é encontrado pela DeepFace
        if "Face could not be detected" in str(ve):
            if os.path.exists(file_path):
                os.remove(file_path) # Limpa a imagem salva
            raise HTTPException(status_code=400, detail="Nenhum rosto foi detectado na imagem enviada.")
        else:
             raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        # Captura outras exceções
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Erro inesperado ao criar identidade: {e}")
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno: {e}")

@router.post("/match", response_model=MatchResponse, dependencies=[Depends(auth.get_current_admin_user)])
def match_identity(
    image: UploadFile = File(...),
    threshold: float = Form(0.68, description="Limiar de distância. Valores menores indicam maior similaridade."),
    db: Session = Depends(get_db)
):
    """
    Recebe uma imagem, encontra um rosto e o compara com todas as identidades cadastradas,
    retornando a correspondência mais próxima se ela estiver dentro do limiar.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado não é uma imagem válida.")

    temp_path = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}.jpg")
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(image.file.read())
        
        # Gera o embedding para a imagem de verificação
        embedding_to_check_obj = DeepFace.represent(img_path=temp_path, model_name='ArcFace', enforce_detection=True)
        embedding_to_check = embedding_to_check_obj[0]['embedding']
    
    except ValueError as ve:
        if "Face could not be detected" in str(ve):
            raise HTTPException(status_code=400, detail="Nenhum rosto foi detectado na imagem de verificação.")
        else:
            raise HTTPException(status_code=500, detail=str(ve))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    # Busca no banco de dados pelo vetor mais próximo usando a distância L2 (Euclidiana)
    # A função l2_distance é fornecida pela extensão pgvector
    results = db.query(
        models.Identity,
        models.Identity.embedding.l2_distance(embedding_to_check).label('distance')
    ).order_by('distance').limit(1).first()

    if results:
        identity, distance = results
        if distance <= threshold:
            return MatchResponse(
                match_found=True,
                identity_id=identity.id,
                identity_name=identity.name,
                distance=distance
            )
        # Encontrou um rosto, mas não é parecido o suficiente com ninguém no banco
        return MatchResponse(match_found=False, distance=distance)

    # Não encontrou nenhuma identidade no banco de dados para comparar
    return MatchResponse(match_found=False, distance=None)


@router.get("", response_model=List[IdentityResponse], dependencies=[Depends(auth.get_current_user)])
def get_all_identities(db: Session = Depends(get_db)):
    """ Retorna uma lista de todas as identidades cadastradas. """
    identities = db.query(models.Identity).order_by(models.Identity.name).all()
    return identities

@router.delete("/{identity_id}", status_code=204, dependencies=[Depends(auth.get_current_admin_user)])
def delete_identity_by_id(identity_id: int, db: Session = Depends(get_db)):
    """ Deleta uma identidade pelo seu ID. """
    identity = db.query(models.Identity).filter(models.Identity.id == identity_id).first()
    if not identity:
        raise HTTPException(status_code=404, detail="Identidade não encontrada.")
    
    # Remove o arquivo de imagem associado antes de deletar do banco
    image_path = os.path.join(UPLOAD_DIR, identity.image_filename)
    if os.path.exists(image_path):
        os.remove(image_path)
        
    db.delete(identity)
    db.commit()
    return Response(status_code=204)