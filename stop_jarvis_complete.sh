#!/bin/bash

# Script para parar completamente o Jarvis Vision System

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Jarvis Vision System - Parando Sistema${NC}"
echo -e "${BLUE}=======================================${NC}"

# 1. Verificar se há containers rodando
echo -e "\n${YELLOW}🔍 Verificando containers em execução...${NC}"
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️ Nenhum container do Jarvis Vision está rodando${NC}"
    exit 0
fi

# 2. Mostrar containers que serão parados
echo -e "\n${YELLOW}📋 Containers que serão parados:${NC}"
docker-compose ps

# 3. Perguntar se deseja fazer backup antes de parar
read -p "$(echo -e ${YELLOW}💾 Deseja fazer backup do banco antes de parar? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "./scripts/backup_database.sh" ]; then
        echo -e "${YELLOW}💾 Executando backup...${NC}"
        ./scripts/backup_database.sh
        echo -e "${GREEN}✅ Backup concluído${NC}"
    else
        echo -e "${RED}❌ Script de backup não encontrado${NC}"
    fi
fi

# 4. Parar todos os serviços
echo -e "\n${YELLOW}🛑 Parando todos os serviços...${NC}"

# Tentar parar com configuração GPU primeiro (se existir)
if command -v nvidia-smi &> /dev/null; then
    echo -e "${YELLOW}🔍 GPU detectada, parando configuração com GPU...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.gpu.yml down --remove-orphans 2>/dev/null || true
fi

# Parar configuração padrão
docker-compose down --remove-orphans

echo -e "${GREEN}✅ Serviços parados${NC}"

# 5. Verificar se todos os containers pararam
echo -e "\n${YELLOW}🔍 Verificando se todos os containers pararam...${NC}"
sleep 2

running_containers=$(docker ps --filter "name=vision" --format "table {{.Names}}\t{{.Status}}" | tail -n +2)
if [ -z "$running_containers" ]; then
    echo -e "${GREEN}✅ Todos os containers do Jarvis Vision foram parados${NC}"
else
    echo -e "${YELLOW}⚠️ Alguns containers ainda estão rodando:${NC}"
    echo "$running_containers"
    
    # Tentar forçar parada
    read -p "$(echo -e ${YELLOW}💪 Deseja forçar a parada destes containers? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}💪 Forçando parada dos containers...${NC}"
        docker ps --filter "name=vision" -q | xargs -r docker stop
        docker ps --filter "name=vision" -q | xargs -r docker rm
        echo -e "${GREEN}✅ Containers forçadamente parados${NC}"
    fi
fi

# 6. Opção para limpar recursos
echo -e "\n${YELLOW}🧹 Opções de limpeza:${NC}"
read -p "$(echo -e ${YELLOW}🗑️ Deseja remover volumes não utilizados? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️ Removendo volumes órfãos...${NC}"
    docker volume prune -f
    echo -e "${GREEN}✅ Volumes órfãos removidos${NC}"
fi

read -p "$(echo -e ${YELLOW}🗑️ Deseja remover imagens não utilizadas? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️ Removendo imagens órfãs...${NC}"
    docker image prune -f
    echo -e "${GREEN}✅ Imagens órfãs removidas${NC}"
fi

# 7. Mostrar status final
echo -e "\n${BLUE}=======================================${NC}"
echo -e "${GREEN}✅ Jarvis Vision System parado com sucesso!${NC}"
echo -e "\n${YELLOW}💡 Para reiniciar o sistema:${NC}"
echo -e "  🚀 Completo: ./start_jarvis_complete.sh"
echo -e "  ⚡ Simples: docker-compose up -d"
echo -e "\n${YELLOW}💡 Para verificar status:${NC}"
echo -e "  📋 Containers: docker ps"
echo -e "  💾 Volumes: docker volume ls"
echo -e "  🖼️ Imagens: docker images"
echo -e "\n${BLUE}=======================================${NC}"
