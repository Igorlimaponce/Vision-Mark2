from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from .database import engine, Base
from .routes import camera_routes, pipeline_routes, event_routes, identity_routes, auth_routes
from .websockets.handler import router as websocket_router

# Cria as tabelas no banco de dados, se ainda não existirem
Base.metadata.create_all(bind=engine)

# Cria o diretório de uploads se não existir
uploads_dir = "uploads"
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "identities"), exist_ok=True)

app = FastAPI(
    title="Vision Service API",
    description="API central para a plataforma de análise de vídeo.",
    version="2.0.0"
)

# Adiciona CORS middleware (ajuste allow_origins para produção)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monta o diretório de uploads para acesso a arquivos
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Inclui os roteadores na aplicação principal
app.include_router(auth_routes.router)
app.include_router(camera_routes.router)
app.include_router(pipeline_routes.router)
app.include_router(event_routes.router)
app.include_router(identity_routes.router)
app.include_router(websocket_router)


# --- Endpoint de Verificação de Saúde (Health Check) ---
@app.get("/api/health", tags=["Health"])
def health_check():
    """ Endpoint simples para verificar se a API está online. """
    return {"status": "ok"}