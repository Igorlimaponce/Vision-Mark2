# 🚀 Scripts de Controle do Jarvis Vision System

## 📁 **Scripts Disponíveis**

### ✅ **Scripts Recomendados (NOVOS)**

#### 🚀 `start_jarvis_complete.sh` - **INICIAR SISTEMA COMPLETO**
```bash
./start_jarvis_complete.sh
```
**Funcionalidades:**
- ✅ Detecta automaticamente GPU NVIDIA
- ✅ Cria estrutura de diretórios necessária
- ✅ Verifica dependências (Docker, .env)
- ✅ Para containers antigos antes de iniciar
- ✅ Constrói imagens Docker
- ✅ Aguarda inicialização completa do banco
- ✅ Executa health check automático
- ✅ Mostra status final e URLs de acesso
- ✅ Suporte a GPU e CPU automaticamente

#### 🛑 `stop_jarvis_complete.sh` - **PARAR SISTEMA COMPLETO**
```bash
./stop_jarvis_complete.sh
```
**Funcionalidades:**
- ✅ Para todos os containers do sistema
- ✅ Opção de backup antes de parar
- ✅ Detecta GPU e para configuração adequada
- ✅ Força parada se necessário
- ✅ Opções de limpeza (volumes, imagens)
- ✅ Verificação de containers residuais

---

### 📜 **Scripts Originais (Mantidos para compatibilidade)**

#### `start.sh` - Script simples de inicialização
- Apenas detecta GPU e inicia containers
- Não faz verificações avançadas

#### `start_jarvis.sh` - Script avançado original
- Funcionalidades similares ao novo script
- Mantido para compatibilidade

---

## 🎯 **Uso Recomendado**

### **Para usuários normais:**
```bash
# Iniciar sistema
./start_jarvis_complete.sh

# Parar sistema
./stop_jarvis_complete.sh
```

### **Para desenvolvimento rápido:**
```bash
# Iniciar sem rebuild
docker-compose up -d

# Parar rápido
docker-compose down
```

---

## 🆘 **Troubleshooting**

### **Se o sistema não iniciar:**
1. Verificar se Docker está rodando
2. Verificar se arquivo `.env` existe
3. Executar: `docker-compose down --remove-orphans`
4. Tentar novamente: `./start_jarvis_complete.sh`

### **Se containers não pararem:**
1. Executar: `./stop_jarvis_complete.sh`
2. Escolher "y" para forçar parada
3. Se ainda houver problemas: `docker stop $(docker ps -q)`

### **Para limpeza completa:**
```bash
./stop_jarvis_complete.sh
# Escolher "y" para todas as opções de limpeza
```

---

## 📊 **URLs do Sistema**

Após iniciar com `./start_jarvis_complete.sh`:

- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API Gateway**: http://localhost:8000  
- 🐰 **RabbitMQ**: http://localhost:15672
- 🗄️ **PostgreSQL**: localhost:5433

**Login padrão:**
- Username: `admin`
- Password: `admin`

---

## 💡 **Comandos Úteis**

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f frontend

# Backup do banco
./scripts/backup_database.sh

# Health check
./scripts/health_check.sh

# Ver recursos do sistema
docker stats
```
