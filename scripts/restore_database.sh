#!/bin/bash

# Script profissional para restaurar o banco de dados Jarvis Vision System
# Autor: Igor - Jarvis Ecosystem

set -e

# Configurações
CONTAINER_NAME="vision_database"
DB_NAME="jarvis_vision"
DB_USER="postgres"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Uso: $0 <caminho_para_backup.sql>${NC}"
    echo -e "${YELLOW}💡 Exemplo: $0 ./backups/20250630/jarvis_full_backup.sql${NC}"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Arquivo de backup não encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}🔄 Iniciando restauração do banco de dados...${NC}"

# Verificar se o container está rodando
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}❌ Container $CONTAINER_NAME não está rodando!${NC}"
    exit 1
fi

# Fazer backup atual antes da restauração
echo -e "${YELLOW}🛡️ Criando backup de segurança antes da restauração...${NC}"
mkdir -p ./backups/pre_restore
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "./backups/pre_restore/backup_$(date +%Y%m%d_%H%M%S).sql"

# Restaurar o backup
echo -e "${YELLOW}📥 Restaurando backup: $BACKUP_FILE${NC}"
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE

echo -e "${GREEN}✅ Restauração concluída com sucesso!${NC}"
echo -e "${GREEN}🔍 Verifique se os dados foram restaurados corretamente${NC}"
