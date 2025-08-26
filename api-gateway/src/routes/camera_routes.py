import io
import cv2
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from .. import models
from ..auth import auth
from ..database import get_db
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/cameras",
    tags=["Cameras"]
)

# --- Pydantic Models ---
class CameraBase(BaseModel):
    name: str
    rtsp_url: str
    is_active: bool = True

class CameraCreate(CameraBase):
    pass

class CameraResponse(CameraBase):
    id: int
    class Config:
        from_attributes = True

class TestCameraPayload(BaseModel):
    rtsp_url: str

# --- Endpoints ---
@router.get("", response_model=List[CameraResponse], dependencies=[Depends(auth.get_current_user)])
def get_all_cameras(db: Session = Depends(get_db)):
    cameras = db.query(models.Camera).order_by(models.Camera.name).all()
    return cameras

@router.post("", status_code=201, response_model=CameraResponse, dependencies=[Depends(auth.get_current_admin_user)])
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = models.Camera(**camera.dict())
    db.add(db_camera)
    try:
        db.commit()
        db.refresh(db_camera)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=409, detail="Câmera com este nome já existe.")
    return db_camera

@router.delete("/{camera_id}", status_code=204, dependencies=[Depends(auth.get_current_admin_user)])
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    db_camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Câmera não encontrada.")
    db.delete(db_camera)
    db.commit()
    return Response(status_code=204)

@router.post("/test", dependencies=[Depends(auth.get_current_admin_user)])
def test_camera_connection(payload: TestCameraPayload):
    try:
        cap = cv2.VideoCapture(payload.rtsp_url)
        if not cap.isOpened():
            raise ConnectionError("Não foi possível abrir o stream de vídeo.")
        ret, _ = cap.read()
        cap.release()
        if not ret:
            raise ConnectionError("Não foi possível ler um frame do stream.")
        return {"message": "Conexão com a câmera bem-sucedida!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Falha na conexão: {e}")

@router.get("/{camera_id}/snapshot", response_class=StreamingResponse, dependencies=[Depends(auth.get_current_user)])
def get_camera_snapshot(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(models.Camera).filter(models.Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Câmera não encontrada.")
    
    cap = cv2.VideoCapture(camera.rtsp_url)
    if not cap.isOpened():
        raise HTTPException(status_code=500, detail="Não foi possível conectar à câmera.")
    
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise HTTPException(status_code=500, detail="Não foi possível capturar o frame.")

    _, img_encoded = cv2.imencode(".jpg", frame)
    return StreamingResponse(io.BytesIO(img_encoded.tobytes()), media_type="image/jpeg")