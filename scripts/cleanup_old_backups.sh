#!/bin/bash

# Script de limpeza automática de backups antigos
# Autor: Igor - Jarvis Ecosystem
# Execução: Automática via cron (toda semana)

set -e

# Configurações
BACKUP_BASE_DIR="/app/backups"
RETENTION_DAYS=30
LOG_DIR="/app/logs"

# Cores para logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/cleanup_auto.log"
}

log "${GREEN}🧹 LIMPEZA AUTOMÁTICA DE BACKUPS INICIADA${NC}"

# Criar diretório de log se não existir
mkdir -p "$LOG_DIR"

# Contar backups antes da limpeza
BACKUPS_BEFORE=$(find "$BACKUP_BASE_DIR" -name "*.sql.gz" -o -name "*.tar.gz" | wc -l)
SPACE_BEFORE=$(du -sh "$BACKUP_BASE_DIR" 2>/dev/null | cut -f1 || echo "0")

log "${BLUE}📊 Estado antes da limpeza:${NC}"
log "${BLUE}   • Backups existentes: $BACKUPS_BEFORE${NC}"
log "${BLUE}   • Espaço ocupado: $SPACE_BEFORE${NC}"

# Limpeza de diretórios de backup antigos
log "${YELLOW}🗂️ Removendo diretórios de backup antigos (>${RETENTION_DAYS} dias)...${NC}"
REMOVED_DIRS=0
while IFS= read -r -d '' dir; do
    if [[ -d "$dir" ]]; then
        rm -rf "$dir"
        REMOVED_DIRS=$((REMOVED_DIRS + 1))
        log "${YELLOW}   Removido: $(basename "$dir")${NC}"
    fi
done < <(find "$BACKUP_BASE_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)

# Limpeza de arquivos de backup órfãos
log "${YELLOW}📄 Removendo arquivos de backup órfãos...${NC}"
REMOVED_FILES=0
while IFS= read -r -d '' file; do
    if [[ -f "$file" ]]; then
        rm -f "$file"
        REMOVED_FILES=$((REMOVED_FILES + 1))
        log "${YELLOW}   Removido: $(basename "$file")${NC}"
    fi
done < <(find "$BACKUP_BASE_DIR" -type f \( -name "*.sql.gz" -o -name "*.tar.gz" -o -name "*.sql" \) -mtime +$RETENTION_DAYS -print0 2>/dev/null)

# Contar backups após a limpeza
BACKUPS_AFTER=$(find "$BACKUP_BASE_DIR" -name "*.sql.gz" -o -name "*.tar.gz" | wc -l)
SPACE_AFTER=$(du -sh "$BACKUP_BASE_DIR" 2>/dev/null | cut -f1 || echo "0")

log "${GREEN}🎉 LIMPEZA CONCLUÍDA!${NC}"
log "${BLUE}📊 Resumo da limpeza:${NC}"
log "${BLUE}   • Diretórios removidos: $REMOVED_DIRS${NC}"
log "${BLUE}   • Arquivos removidos: $REMOVED_FILES${NC}"
log "${BLUE}   • Backups restantes: $BACKUPS_AFTER${NC}"
log "${BLUE}   • Espaço liberado: $SPACE_BEFORE → $SPACE_AFTER${NC}"

# Validação pós-limpeza
if [[ $BACKUPS_AFTER -gt 0 ]]; then
    log "${GREEN}✅ Limpeza bem-sucedida - backups recentes preservados${NC}"
else
    log "${YELLOW}⚠️ Aviso: Nenhum backup restante após limpeza${NC}"
fi

exit 0
