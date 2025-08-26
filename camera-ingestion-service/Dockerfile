FROM python:3.9-slim AS builder

WORKDIR /usr/src/app

# Instala dependências do sistema necessárias para o OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip wheel --no-cache-dir --wheel-dir /usr/src/app/wheels -r requirements.txt

# Estágio 2: Final
FROM python:3.9-slim

WORKDIR /app

# Copia as dependências pré-compiladas
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .

# Instala as dependências do sistema e do python
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache /wheels/*

COPY src/ .

CMD ["python", "main.py"]