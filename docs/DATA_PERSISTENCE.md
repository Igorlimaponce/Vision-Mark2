# 🗄️ Guia de Persistência de Dados - Jarvis Vision System

## 📋 Visão Geral

Este documento explica como garantir a persistência de dados no Jarvis Vision System, essencial para uso em produção comercial.

## 🚨 Problema Identificado

**Sintoma**: Dados são perdidos quando o Docker é reiniciado  
**Causa**: Configuração inadequada de volumes Docker  
**Impacto**: CRÍTICO para comercialização  

## ✅ Solução Implementada

### 1. **Estrutura de Dados Persistentes**

```
data/
├── postgres/          # Dados do PostgreSQL (CRÍTICO)
├── media/            # Imagens de eventos salvos
└── logs/             # Logs do sistema

backups/
├── 20250630/         # Backups diários
├── pre_restore/      # Backups de segurança
└── logs/             # Logs de backup
```

### 2. **Volumes Docker Configurados**

- **`vision_db_data`**: Persiste dados PostgreSQL + TimescaleDB
- **`vision_saved_media`**: Persiste imagens de eventos
- **`vision_rabbitmq_data`**: Persiste filas RabbitMQ
- **`vision_models_data`**: Persiste modelos YOLO baixados

### 3. **Configurações de Banco Melhoradas**

- ✅ Nome do banco corrigido: `jarvis_vision` (sem caracteres especiais)
- ✅ Senha segura configurada
- ✅ Encoding UTF-8 garantido
- ✅ Configurações de logging para debug
- ✅ Health checks robustos

## 🛠️ Scripts de Manutenção

### Inicialização Segura
```bash
./start_jarvis.sh
```

### Backup Manual
```bash
./scripts/backup_database.sh
```

### Restaurar Backup
```bash
./scripts/restore_database.sh <caminho_para_backup.sql>
```

### Verificação de Saúde
```bash
./scripts/health_check.sh
```

## 🔄 Procedimentos de Backup

### Automático
- Backups diários são mantidos por 7 dias
- Limpeza automática de arquivos antigos
- Compactação automática para economizar espaço

### Manual
```bash
# Backup completo
./scripts/backup_database.sh

# Verificar backups
ls -la backups/
```

## 🚀 Deploy em Produção

### 1. **Variáveis de Ambiente**
```env
POSTGRES_PASSWORD=senha_super_segura_producao
POSTGRES_DB=jarvis_vision
```

### 2. **Volumes Externos** (Recomendado)
```yaml
volumes:
  vision_db_data:
    external: true
    name: jarvis_production_db
```

### 3. **Monitoramento**
- Configure alertas para espaço em disco
- Monitore logs de erro do PostgreSQL
- Execute health checks regulares

## 🔒 Segurança dos Dados

### Proteções Implementadas
- ✅ Dados sensíveis no `.gitignore`
- ✅ Backups com timestamp único
- ✅ Validação de integridade
- ✅ Logs de auditoria

### Recomendações Adicionais
- Use senhas complexas em produção
- Configure SSL para PostgreSQL
- Implemente backup em nuvem
- Configure monitoramento de disk usage

## 🚨 Troubleshooting

### Problema: Dados ainda são perdidos
```bash
# 1. Verificar volumes
docker volume ls | grep vision

# 2. Verificar mapeamento
docker inspect vision_database | grep -A 10 "Mounts"

# 3. Verificar permissões
ls -la data/postgres/

# 4. Logs do banco
docker logs vision_database
```

### Problema: Erro de permissão
```bash
# Linux
sudo chown -R 999:999 data/postgres/

# macOS
chmod -R 755 data/
```

### Problema: Banco não inicializa
```bash
# Limpar volumes problemáticos
docker-compose down -v
docker volume prune -f

# Reiniciar limpo
./start_jarvis.sh
```

## 📞 Suporte

Para problemas de persistência:

1. Execute `./scripts/health_check.sh`
2. Verifique logs: `docker logs vision_database`
3. Teste backup: `./scripts/backup_database.sh`
4. Se necessário, restaure backup conhecido

## ✨ Benefícios da Solução

- 🛡️ **Dados 100% seguros** entre reinicializações
- 📊 **Backups automáticos** para recuperação
- 🔍 **Monitoramento proativo** de integridade
- 🚀 **Pronto para produção** comercial
- 📈 **Escalável** para milhares de eventos

---

**Atualizado em**: 30 de junho de 2025  
**Versão**: 2.0 - Solução Comercial
