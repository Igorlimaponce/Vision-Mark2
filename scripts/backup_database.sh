#!/bin/bash

# Script profissional para backup do banco de dados Jarvis Vision System
# Autor: Igor - Jarvis Ecosystem
# Data: $(date)

set -e

# Configurações
BACKUP_DIR="./backups/$(date +%Y%m%d)"
CONTAINER_NAME="vision_database"
DB_NAME="jarvis_vision"
DB_USER="postgres"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando backup do Jarvis Vision Database...${NC}"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Verificar se o container está rodando
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}❌ Container $CONTAINER_NAME não está rodando!${NC}"
    exit 1
fi

# Backup completo
echo -e "${YELLOW}📦 Criando backup completo...${NC}"
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME --clean --if-exists > $BACKUP_DIR/jarvis_full_backup.sql

# Backup apenas dos dados (sem schema)
echo -e "${YELLOW}📊 Criando backup apenas dos dados...${NC}"
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME --data-only > $BACKUP_DIR/jarvis_data_only.sql

# Backup apenas do schema
echo -e "${YELLOW}🏗️ Criando backup do schema...${NC}"
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME --schema-only > $BACKUP_DIR/jarvis_schema_only.sql

# Compactar backups
echo -e "${YELLOW}🗜️ Compactando backups...${NC}"
cd $BACKUP_DIR
tar -czf "jarvis_backup_$(date +%Y%m%d_%H%M%S).tar.gz" *.sql
rm *.sql

echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
echo -e "${GREEN}📁 Backup salvo em: $BACKUP_DIR${NC}"

# Limpeza de backups antigos (manter apenas 7 dias)
find ./backups -type d -name "20*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo -e "${GREEN}🧹 Limpeza de backups antigos concluída${NC}"
