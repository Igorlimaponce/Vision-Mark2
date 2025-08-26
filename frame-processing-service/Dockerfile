FROM python:3.9-slim

WORKDIR /app

# Instalar dependências do sistema para OpenCV e outras bibliotecas
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install tf-keras
# Baixar os modelos YOLOv8 pré-definidos
RUN mkdir -p /app/models
WORKDIR /app/models
RUN wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -O yolov8n.pt
RUN wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt -O yolov8s.pt
RUN wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt -O yolov8m.pt
RUN wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8l.pt -O yolov8l.pt
RUN wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8x.pt -O yolov8x.pt

# Retorna ao diretório de trabalho principal
WORKDIR /app

# Criar diretório de logs
RUN mkdir -p /app/logs

COPY ./src .

CMD ["python", "main.py"]