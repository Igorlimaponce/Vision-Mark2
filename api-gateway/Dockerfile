# Use uma imagem base do Python
FROM python:3.9-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia primeiro o arquivo de dependências para aproveitar o cache do Docker
COPY requirements.txt .

# Instala as dependências
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia todo o código da aplicação para o diretório de trabalho
COPY . .

# Expõe a porta que a aplicação vai rodar
EXPOSE 8000

# O comando para iniciar a aplicação será fornecido pelo docker-compose.yml
CMD ["/bin/sh", "-c", "export PYTHONPATH=/app && uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload"]