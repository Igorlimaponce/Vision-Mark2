#!/bin/bash

# Script de backup automatizado - executa sem intervenção do usuário
# Autor: Igor - Jarvis Ecosystem  
# Execução: Automática via cron (todo dia às 2h)

set -e

# Configurações automáticas
export CONTAINER_NAME="vision_database"
export DB_NAME="jarvis_vision"
export DB_USER="postgres"
export BACKUP_DIR="/app/backups/$(date +%Y%m%d)"
export LOG_DIR="/app/logs"
export MAX_BACKUPS=30

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de log com timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/backup_auto.log"
}

log "${GREEN}🤖 BACKUP AUTOMÁTICO INICIADO${NC}"
log "${BLUE}📅 Data/Hora: $(date)${NC}"

# Criar diretórios necessários
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Verificar se o container está rodando
if ! docker ps --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
    log "${RED}❌ ERRO: Container $CONTAINER_NAME não está rodando!${NC}"
    exit 1
fi

log "${GREEN}✅ Container verificado e funcionando${NC}"

# Backup incremental inteligente
BACKUP_FILE="jarvis_auto_backup_$(date +%Y%m%d_%H%M%S)"

log "${YELLOW}📦 Iniciando backup completo...${NC}"

# Backup completo com compressão
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_DIR/${BACKUP_FILE}.sql.gz"; then
    log "${GREEN}✅ Backup completo criado com sucesso${NC}"
else
    log "${RED}❌ ERRO: Falha no backup completo${NC}"
    exit 1
fi

# Backup apenas dos dados (para recuperação rápida)
log "${YELLOW}📊 Criando backup de dados...${NC}"
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only | gzip > "$BACKUP_DIR/${BACKUP_FILE}_data.sql.gz"; then
    log "${GREEN}✅ Backup de dados criado${NC}"
else
    log "${YELLOW}⚠️ Aviso: Backup de dados falhou (não crítico)${NC}"
fi

# Verificar integridade do backup
log "${YELLOW}🔍 Verificando integridade do backup...${NC}"
if gunzip -t "$BACKUP_DIR/${BACKUP_FILE}.sql.gz"; then
    log "${GREEN}✅ Integridade do backup verificada${NC}"
else
    log "${RED}❌ ERRO: Backup corrompido!${NC}"
    exit 1
fi

# Calcular tamanho do backup
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILE}.sql.gz" | cut -f1)
log "${BLUE}📊 Tamanho do backup: $BACKUP_SIZE${NC}"

# Limpeza automática de backups antigos
log "${YELLOW}🧹 Limpando backups antigos (>${MAX_BACKUPS} dias)...${NC}"
find /app/backups -type d -name "20*" -mtime +$MAX_BACKUPS -exec rm -rf {} \; 2>/dev/null || true

# Estatísticas finais
TOTAL_BACKUPS=$(find /app/backups -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh /app/backups | cut -f1)

log "${GREEN}🎉 BACKUP AUTOMÁTICO CONCLUÍDO COM SUCESSO!${NC}"
log "${BLUE}📈 Estatísticas:${NC}"
log "${BLUE}   • Total de backups: $TOTAL_BACKUPS${NC}"
log "${BLUE}   • Espaço total usado: $TOTAL_SIZE${NC}"
log "${BLUE}   • Último backup: $BACKUP_DIR/${BACKUP_FILE}.sql.gz${NC}"

# Notificação opcional (webhook, email, etc.)
# Aqui você pode adicionar notificações para sistemas externos
log "${GREEN}✅ Sistema de backup funcionando perfeitamente!${NC}"

exit 0
