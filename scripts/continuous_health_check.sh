#!/bin/bash

# Script de monitoramento contínuo de saúde do sistema
# Autor: Igor - Jarvis Ecosystem
# Execução: Contínua em loop (a cada 5 minutos)

set -e

# Configurações
CONTAINER_NAME="vision_database"
DB_NAME="jarvis_vision"
DB_USER="postgres"
LOG_DIR="/app/logs"
ALERT_THRESHOLD_MB=500  # Alerta se banco > 500MB
MAX_LOG_SIZE_MB=100     # Rotaciona logs se > 100MB

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de log com rotação automática
log() {
    local log_file="$LOG_DIR/health_monitor.log"
    mkdir -p "$LOG_DIR"
    
    # Rotação de log se muito grande
    if [[ -f "$log_file" ]] && [[ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0) -gt $((MAX_LOG_SIZE_MB * 1024 * 1024)) ]]; then
        mv "$log_file" "$log_file.old"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Log rotacionado automaticamente" > "$log_file"
    fi
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$log_file"
}

# Verificação de saúde do container
check_container_health() {
    if docker ps --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
        log "${GREEN}✅ Container $CONTAINER_NAME está rodando${NC}"
        return 0
    else
        log "${RED}❌ ALERTA: Container $CONTAINER_NAME parou de funcionar!${NC}"
        return 1
    fi
}

# Verificação de conectividade do banco
check_database_connectivity() {
    if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        log "${GREEN}✅ Banco de dados acessível${NC}"
        return 0
    else
        log "${RED}❌ ALERTA: Banco de dados inacessível!${NC}"
        return 1
    fi
}

# Verificação do tamanho do banco
check_database_size() {
    local size_result
    size_result=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ')
    
    if [[ -n "$size_result" ]]; then
        log "${BLUE}📊 Tamanho do banco: $size_result${NC}"
        
        # Extrair valor numérico para comparação
        local size_num=$(echo "$size_result" | grep -o '[0-9]*' | head -1)
        local size_unit=$(echo "$size_result" | grep -o '[A-Za-z]*' | head -1)
        
        if [[ "$size_unit" == "GB" ]] || [[ "$size_unit" == "gb" ]] || 
           ([[ "$size_unit" == "MB" ]] || [[ "$size_unit" == "mb" ]]) && [[ $size_num -gt $ALERT_THRESHOLD_MB ]]; then
            log "${YELLOW}⚠️ Aviso: Banco de dados está grande ($size_result)${NC}"
        fi
    else
        log "${YELLOW}⚠️ Não foi possível verificar tamanho do banco${NC}"
    fi
}

# Verificação de espaço em disco
check_disk_space() {
    local disk_usage
    disk_usage=$(df -h /app/backups 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
    
    if [[ -n "$disk_usage" ]]; then
        if [[ $disk_usage -gt 90 ]]; then
            log "${RED}❌ ALERTA: Espaço em disco crítico (${disk_usage}% usado)!${NC}"
        elif [[ $disk_usage -gt 80 ]]; then
            log "${YELLOW}⚠️ Aviso: Espaço em disco baixo (${disk_usage}% usado)${NC}"
        else
            log "${GREEN}✅ Espaço em disco OK (${disk_usage}% usado)${NC}"
        fi
    fi
}

# Verificação de backup recente
check_recent_backup() {
    local recent_backup
    recent_backup=$(find /app/backups -name "*.sql.gz" -mtime -1 | head -1)
    
    if [[ -n "$recent_backup" ]]; then
        log "${GREEN}✅ Backup recente encontrado: $(basename "$recent_backup")${NC}"
    else
        log "${YELLOW}⚠️ Aviso: Nenhum backup nas últimas 24h${NC}"
    fi
}

# Contadores de status
HEALTH_CHECKS=0
ALERTS_GENERATED=0

log "${BLUE}🔍 Monitor de saúde contínuo iniciado${NC}"

# Loop principal de monitoramento
while true; do
    HEALTH_CHECKS=$((HEALTH_CHECKS + 1))
    
    log "${BLUE}🔄 Health Check #$HEALTH_CHECKS$(NC)"
    
    # Executar todas as verificações
    check_container_health || ALERTS_GENERATED=$((ALERTS_GENERATED + 1))
    check_database_connectivity || ALERTS_GENERATED=$((ALERTS_GENERATED + 1))
    check_database_size
    check_disk_space
    check_recent_backup
    
    # Log de estatísticas a cada 12 verificações (1 hora)
    if [[ $((HEALTH_CHECKS % 12)) -eq 0 ]]; then
        log "${BLUE}📈 Estatísticas da última hora:${NC}"
        log "${BLUE}   • Verificações realizadas: 12${NC}"
        log "${BLUE}   • Alertas gerados: $ALERTS_GENERATED${NC}"
        log "${BLUE}   • Sistema funcionando: ${GREEN}✅${NC}"
        
        # Reset contador de alertas
        ALERTS_GENERATED=0
    fi
    
    # Aguardar próxima verificação (definido pela variável de ambiente)
    sleep "${HEALTH_CHECK_INTERVAL:-300}"
done
