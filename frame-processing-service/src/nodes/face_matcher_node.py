import httpx
import logging
import os

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceMatcherNode:
    """
    Nó que recebe embeddings faciais e os envia para a API para reconhecimento.
    Esta abordagem é altamente escalável, pois a lógica de busca pesada é
    delegada à API e ao banco de dados otimizado (pgvector).
    """
    def __init__(self):
        # Obtém a URL da API do ambiente, com um valor padrão para desenvolvimento local
        api_base_url = os.getenv("API_BASE_URL", "http://api-gateway:8000")
        self.match_endpoint = f"{api_base_url}/api/identities/match"
        # Usamos um cliente HTTP assíncrono para melhor performance
        self.http_client = httpx.AsyncClient(timeout=10.0)
        logger.info(f"Nó FaceMatcherNode inicializado. Endpoint da API: {self.match_endpoint}")

    async def process(self, frame_data):
        """
        Processa cada frame, pega os embeddings e busca por correspondências via API.
        """
        detected_faces = frame_data.get("faces", [])
        if not detected_faces:
            return frame_data

        for face in detected_faces:
            if "embedding" not in face:
                continue

            try:
                # Envia o embedding para o endpoint de match da API
                response = await self.http_client.post(
                    self.match_endpoint,
                    json={"embedding": face["embedding"]}
                )
                response.raise_for_status()  # Lança exceção para respostas de erro (4xx ou 5xx)
                
                match_result = response.json()

                # Adiciona o resultado da correspondência à informação do rosto
                if match_result.get("match"):
                    face["identity"] = {
                        "name": match_result.get("name"),
                        "similarity": round(match_result.get("similarity", 0), 2)
                    }
                else:
                    face["identity"] = None

            except httpx.RequestError as e:
                logger.error(f"Erro ao conectar com a API de reconhecimento: {e}")
                face["identity"] = {"error": "API connection failed"}
            except Exception as e:
                logger.error(f"Erro inesperado no processo de match: {e}")
                face["identity"] = {"error": "Unknown matching error"}
        
        return frame_data

    async def close(self):
        """Fecha o cliente HTTP de forma limpa."""
        await self.http_client.aclose()
        logger.info("Cliente HTTP do FaceMatcherNode fechado.")