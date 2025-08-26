#!/bin/bash

# Script para verificar a integridade e status do banco de dados
# Jarvis Vision System - Database Health Check

set -e

CONTAINER_NAME="vision_database"
DB_NAME="jarvis_vision"
DB_USER="postgres"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Jarvis Vision Database - Health Check${NC}"
echo -e "${BLUE}==========================================${NC}"

# 1. Verificar se o container está rodando
echo -e "\n${YELLOW}📦 Verificando status do container...${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✅ Container está rodando${NC}"
else
    echo -e "${RED}❌ Container não está rodando!${NC}"
    exit 1
fi

# 2. Verificar conectividade do banco
echo -e "\n${YELLOW}🔌 Testando conectividade...${NC}"
if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Banco de dados acessível${NC}"
else
    echo -e "${RED}❌ Não foi possível conectar ao banco!${NC}"
    exit 1
fi

# 3. Verificar extensões instaladas
echo -e "\n${YELLOW}🧩 Verificando extensões...${NC}"
EXTENSIONS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT extname FROM pg_extension;" | tr -d ' ')
echo -e "${BLUE}Extensões instaladas:${NC}"
for ext in $EXTENSIONS; do
    if [[ ! -z "$ext" ]]; then
        echo -e "  ✓ $ext"
    fi
done

# 4. Verificar tabelas principais
echo -e "\n${YELLOW}📊 Verificando tabelas principais...${NC}"
TABLES=("cameras" "pipelines" "events" "identities" "face_embeddings" "users")
for table in "${TABLES[@]}"; do
    COUNT=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "0")
    if [[ "$COUNT" =~ ^[0-9]+$ ]]; then
        echo -e "  ✓ $table: ${GREEN}$COUNT registros${NC}"
    else
        echo -e "  ❌ $table: ${RED}Erro ao acessar${NC}"
    fi
done

# 5. Verificar espaço em disco
echo -e "\n${YELLOW}💾 Verificando uso de espaço...${NC}"
DB_SIZE=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | tr -d ' ')
echo -e "  📁 Tamanho do banco: ${BLUE}$DB_SIZE${NC}"

# 6. Verificar volume de dados
echo -e "\n${YELLOW}📂 Verificando persistência...${NC}"
VOLUME_INFO=$(docker volume inspect vision-service_vision_db_data 2>/dev/null || echo "Volume não encontrado")
if [[ "$VOLUME_INFO" != "Volume não encontrado" ]]; then
    echo -e "${GREEN}✅ Volume de dados configurado corretamente${NC}"
else
    echo -e "${RED}❌ Volume de dados não encontrado!${NC}"
fi

# 7. Verificar logs recentes
echo -e "\n${YELLOW}📝 Últimas 5 linhas do log...${NC}"
docker logs $CONTAINER_NAME --tail 5 2>/dev/null || echo -e "${RED}Não foi possível acessar os logs${NC}"

echo -e "\n${BLUE}==========================================${NC}"
echo -e "${GREEN}🎉 Health Check concluído!${NC}"
