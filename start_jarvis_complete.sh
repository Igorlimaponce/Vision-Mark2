#!/bin/bash

# Script unificado para inicialização completa do Jarvis Vision System
# Combina funcionalidades do start.sh e start_jarvis.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Jarvis Vision System - Inicialização Completa${NC}"
echo -e "${BLUE}================================================${NC}"

# 1. Verificar se o Docker está rodando
echo -e "\n${YELLOW}🐳 Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando. Por favor, inicie o Docker primeiro.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"

# 2. Verificar arquivo .env
echo -e "\n${YELLOW}⚙️ Verificando configuração...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"

# 3. Criar diretórios necessários
echo -e "\n${YELLOW}📁 Criando estrutura de diretórios...${NC}"
mkdir -p data/postgres data/media backups logs scripts

# Definir permissões corretas para PostgreSQL
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo chown -R 999:999 data/postgres 2>/dev/null || true
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - usar permissões mais abertas
    chmod -R 755 data/
fi
echo -e "${GREEN}✅ Estrutura de diretórios criada${NC}"

# 4. Limpar containers antigos
echo -e "\n${YELLOW}🧹 Limpando containers antigos...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true

# 5. Verificar GPU NVIDIA e escolher configuração
echo -e "\n${YELLOW}🔍 Verificando GPU...${NC}"
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}✅ GPU NVIDIA detectada. Usando configuração com GPU.${NC}"
    GPU_SUPPORT=true
else
    echo -e "${YELLOW}⚠️ Nenhuma GPU NVIDIA detectada. Usando configuração apenas com CPU.${NC}"
    GPU_SUPPORT=false
fi

# 6. Construir imagens
echo -e "\n${YELLOW}🔨 Construindo imagens Docker...${NC}"
if [ "$GPU_SUPPORT" = true ]; then
    docker-compose -f docker-compose.yml -f docker-compose.gpu.yml build
else
    docker-compose build
fi

# 7. Iniciar serviços
echo -e "\n${YELLOW}🚀 Iniciando serviços...${NC}"
if [ "$GPU_SUPPORT" = true ]; then
    docker-compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
else
    docker-compose up -d
fi

# 8. Aguardar inicialização do banco de dados
echo -e "\n${YELLOW}⏳ Aguardando inicialização do banco de dados...${NC}"
attempt=0
max_attempts=30
while [ $attempt -lt $max_attempts ]; do
    if docker exec vision_database pg_isready -U postgres -d jarvis_vision > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Banco de dados pronto!${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo -e "${YELLOW}⏳ Tentativa $attempt/$max_attempts...${NC}"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Timeout: Banco de dados não inicializou${NC}"
    echo -e "${YELLOW}💡 Verifique os logs: docker logs vision_database${NC}"
    exit 1
fi

# 9. Aguardar estabilização dos serviços
echo -e "\n${YELLOW}⏳ Aguardando estabilização dos serviços...${NC}"
sleep 10

# 10. Executar health check se disponível
if [ -f "./scripts/health_check.sh" ]; then
    echo -e "\n${YELLOW}🔍 Executando verificação de saúde...${NC}"
    ./scripts/health_check.sh || echo -e "${YELLOW}⚠️ Health check não passou, mas sistema pode estar funcionando${NC}"
fi

# 11. Verificar status dos containers
echo -e "\n${YELLOW}📋 Verificando status dos containers...${NC}"
docker-compose ps

# 12. Mostrar status final
echo -e "\n${BLUE}================================================${NC}"
echo -e "${GREEN}🎉 Jarvis Vision System iniciado com sucesso!${NC}"
echo -e "\n${BLUE}📊 Serviços disponíveis:${NC}"
echo -e "  🌐 Frontend: http://localhost:3000"
echo -e "  🔌 API Gateway: http://localhost:8000"
echo -e "  🐰 RabbitMQ: http://localhost:15672"
echo -e "  🗄️ PostgreSQL: localhost:5433"
echo -e "\n${BLUE}👤 Login padrão:${NC}"
echo -e "  Username: admin"
echo -e "  Password: admin"
echo -e "\n${YELLOW}💡 Comandos úteis:${NC}"
echo -e "  📈 Status: docker-compose ps"
echo -e "  📝 Logs: docker-compose logs -f [serviço]"
echo -e "  🛑 Parar: ./stop_jarvis_complete.sh"
echo -e "  💾 Backup: ./scripts/backup_database.sh"
echo -e "  🔍 Health Check: ./scripts/health_check.sh"

if [ "$GPU_SUPPORT" = true ]; then
    echo -e "\n${GREEN}🚀 GPU Support: ATIVADO${NC}"
else
    echo -e "\n${YELLOW}🖥️ GPU Support: DESATIVADO (CPU apenas)${NC}"
fi

echo -e "\n${GREEN}✨ Sistema pronto para uso!${NC}"
echo -e "${BLUE}================================================${NC}"
