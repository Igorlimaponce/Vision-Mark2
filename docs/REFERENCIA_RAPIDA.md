# ⚡ REFERÊNCIA RÁPIDA - JARVIS VISION

## 🚀 **INÍCIO RÁPIDO**

### **Acesso ao Sistema**
```
🌐 URL: http://localhost:3000
📊 API: http://localhost:8000
🔧 Admin: Faça login como administrador
```

### **Primeiro Pipeline em 5 Minutos**
```
1. ➕ Adicionar VideoInputNode
2. ➕ Adicionar ObjectDetectionNode  
3. 🔗 Conectar: VideoInput → ObjectDetection
4. ⚙️ Configurar câmera no VideoInput
5. ▶️ Iniciar pipeline
```

---

## 📋 **CHECKLIST DE NÓS**

### 📹 **VideoInputNode**
- [ ] Tipo de fonte selecionado
- [ ] URL/dispositivo configurado
- [ ] Resolução adequada para uso
- [ ] FPS otimizado
- [ ] Conexão testada

### 🎯 **ObjectDetectionNode**
- [ ] Modelo YOLO escolhido
- [ ] Confiança ajustada (0.3-0.7)
- [ ] Classes filtradas se necessário
- [ ] DeepSORT configurado
- [ ] Performance monitorada

### 🏢 **PolygonFilterNode**
- [ ] Zona desenhada visualmente
- [ ] Nome da zona definido
- [ ] Eventos configurados
- [ ] Ponto de referência escolhido
- [ ] Capacidade definida

### ⏰ **LoiteringDetectionNode**
- [ ] Tempo limite adequado
- [ ] Limite de movimento definido
- [ ] Nível de alerta escolhido
- [ ] DeepSORT habilitado
- [ ] Análises necessárias ativas

### 🧭 **DirectionFilterNode**
- [ ] Direção alvo configurada
- [ ] Tolerância angular ajustada
- [ ] Detecção de direção incorreta
- [ ] Limites de velocidade
- [ ] Zonas específicas (se aplicável)

### 📈 **TrajectoryAnalysisNode**
- [ ] Tamanho mínimo de trajetória
- [ ] Histórico máximo definido
- [ ] Suavização configurada
- [ ] Padrões de interesse selecionados
- [ ] Alertas de anomalia ativos

### 🔔 **NotificationNode**
- [ ] Tipo de notificação escolhido
- [ ] Configurações SMTP/SMS
- [ ] Destinatários definidos
- [ ] Templates personalizados
- [ ] Teste de envio realizado

### 🤖 **TelegramNode**
- [ ] Bot criado no BotFather
- [ ] Token copiado
- [ ] Chat ID obtido
- [ ] Bot adicionado ao chat
- [ ] Teste de mensagem enviado

---

## ⚙️ **CONFIGURAÇÕES PADRÃO**

### 🎥 **Para Webcam (Desenvolvimento)**
```yaml
VideoInput:
  type: webcam
  device: 0
  resolution: 1280x720
  fps: 30

ObjectDetection:
  model: yolov8s
  confidence: 0.4
  deepsort: true
```

### 🏪 **Para Loja (Produção)**
```yaml
VideoInput:
  type: rtsp
  resolution: 1920x1080
  fps: 24

ObjectDetection:
  model: yolov8m
  confidence: 0.5
  classes: [person]
  deepsort: true
  reid: true

LoiteringDetection:
  time_limit: 60
  level: medium
```

### 🚗 **Para Tráfego (Especializado)**
```yaml
VideoInput:
  type: rtsp
  resolution: 1920x1080
  fps: 30

ObjectDetection:
  model: yolov8l
  confidence: 0.6
  classes: [car, truck, bus, motorcycle]

DirectionFilter:
  tolerance: 30
  wrong_direction: true
  speed_analysis: true
```

---

## 🔍 **TROUBLESHOOTING RÁPIDO**

### ❌ **Problemas Comuns**

| Problema | Causa Provável | Solução Rápida |
|----------|---------------|----------------|
| 📹 Tela preta | Câmera não conectada | Verificar dispositivo/URL |
| 🐌 FPS baixo | Modelo muito pesado | Usar YOLOv8n |
| 🔗 Não conecta nós | Tipos incompatíveis | Verificar entrada/saída |
| 📧 Email não envia | SMTP incorreto | Testar configurações |
| 🤖 Telegram não funciona | Token/Chat ID errado | Reconfigurar bot |
| 🚨 Muitos alertas | Sensibilidade alta | Aumentar thresholds |
| 💾 Alto uso de memória | Histórico muito longo | Reduzir max_history |

### 🚀 **Otimizações Rápidas**

#### **Para melhor Performance:**
- Resolução: 720p → 480p
- Modelo: YOLOv8l → YOLOv8n
- FPS: 30 → 15
- Confiança: 0.3 → 0.4

#### **Para melhor Precisão:**
- Modelo: YOLOv8s → YOLOv8l
- Confiança: 0.4 → 0.6
- DeepSORT: Habilitar
- ReID: Habilitar

---

## 📊 **MONITORAMENTO RÁPIDO**

### 🎯 **Métricas Importantes**
- **FPS**: > 15 fps (bom), < 10 fps (problema)
- **CPU**: < 80% (OK), > 90% (crítico)
- **Memória**: < 4GB (OK), > 8GB (crítico)
- **Detecções/min**: Varia por cenário

### 🔍 **Comandos Úteis**
```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Recursos do sistema
docker stats

# Reiniciar serviço específico
docker-compose restart frontend
```

---

## 🎨 **ATALHOS DE INTERFACE**

### ⌨️ **Teclas de Atalho**
- `Ctrl + N`: Novo pipeline
- `Ctrl + S`: Salvar pipeline
- `Ctrl + Z`: Desfazer
- `Delete`: Excluir nó selecionado
- `Esc`: Cancelar conexão
- `Space`: Pausar/continuar

### 🖱️ **Ações do Mouse**
- **Clique simples**: Selecionar nó
- **Duplo clique**: Editar nó
- **Arrastar**: Mover nó
- **Ctrl + clique**: Seleção múltipla
- **Botão direito**: Menu de contexto

---

## 📚 **RECURSOS DE AJUDA**

### 🆘 **Onde Buscar Ajuda**
1. **Este manual**: Primeira referência
2. **Logs do sistema**: `docker-compose logs`
3. **Console do navegador**: F12 → Console
4. **Documentação técnica**: `/docs/`
5. **Comunidade**: GitHub Issues

### 🔧 **Ferramentas de Debug**
```bash
# Verificar saúde dos serviços
curl http://localhost:8000/health

# Testar detecção
curl -X POST http://localhost:8000/api/test/detection

# Ver configuração atual
curl http://localhost:8000/api/pipeline/config
```

---

## 📋 **TEMPLATES PRONTOS**

### 🏪 **Template: Loja Simples**
```json
{
  "name": "Monitoramento Loja",
  "nodes": [
    {
      "type": "VideoInput",
      "config": {"type": "webcam", "device": 0}
    },
    {
      "type": "ObjectDetection", 
      "config": {"model": "yolov8s", "confidence": 0.4}
    },
    {
      "type": "PolygonFilter",
      "config": {"zone_name": "Entrada"}
    },
    {
      "type": "LoiteringDetection",
      "config": {"time_limit": 60, "level": "medium"}
    },
    {
      "type": "Notification",
      "config": {"type": "email", "recipient": "manager@loja.com"}
    }
  ]
}
```

### 🚗 **Template: Tráfego Básico**
```json
{
  "name": "Controle Tráfego",
  "nodes": [
    {
      "type": "VideoInput",
      "config": {"type": "rtsp", "url": "rtsp://cam:554/stream"}
    },
    {
      "type": "ObjectDetection",
      "config": {
        "model": "yolov8m", 
        "classes": ["car", "truck", "bus"],
        "confidence": 0.6
      }
    },
    {
      "type": "DirectionFilter",
      "config": {
        "direction_x": 1, 
        "direction_y": 0,
        "tolerance": 30,
        "detect_wrong_direction": true
      }
    },
    {
      "type": "Telegram",
      "config": {
        "bot_token": "YOUR_BOT_TOKEN",
        "chat_id": "YOUR_CHAT_ID"
      }
    }
  ]
}
```

---

## 🎯 **METAS DE PERFORMANCE**

### 📊 **Benchmarks por Cenário**

| Cenário | FPS Mínimo | Precision | Recall | Latência |
|---------|------------|-----------|--------|----------|
| 🏪 Loja | 15 fps | 85% | 80% | < 200ms |
| 🏢 Escritório | 20 fps | 90% | 85% | < 150ms |
| 🚗 Tráfego | 25 fps | 80% | 90% | < 100ms |
| 🏛️ Segurança | 30 fps | 95% | 90% | < 100ms |

### ⚡ **Configurações para Atingir Metas**

#### **Alta Performance (30+ FPS):**
```yaml
video: {resolution: "640x480", fps: 30}
detection: {model: "yolov8n", confidence: 0.3}
tracking: {deepsort: false}
```

#### **Alta Precisão (95%+ Accuracy):**
```yaml
video: {resolution: "1920x1080", fps: 24}
detection: {model: "yolov8x", confidence: 0.7}
tracking: {deepsort: true, reid: true}
```

#### **Balanceado (20 FPS + 85% Accuracy):**
```yaml
video: {resolution: "1280x720", fps: 24}
detection: {model: "yolov8s", confidence: 0.5}
tracking: {deepsort: true}
```

---

## 🔐 **SEGURANÇA ESSENCIAL**

### 🛡️ **Checklist de Segurança**
- [ ] Senhas fortes para admin
- [ ] HTTPS habilitado (produção)
- [ ] Firewall configurado
- [ ] Backups automáticos
- [ ] Logs de auditoria ativos
- [ ] Atualizações regulares
- [ ] Monitoramento de acesso

### 🔒 **Configurações Mínimas**
```yaml
security:
  authentication: required
  password_policy: strong
  session_timeout: 30m
  max_failed_attempts: 3
  
privacy:
  anonymize_data: true
  data_retention: 30d
  blur_faces: optional
```

---

## 📞 **CONTATOS E SUPORTE**

### 🆘 **Suporte Técnico**
- **Email**: suporte@jarvis-vision.com
- **Telefone**: +55 11 1234-5678
- **Horário**: Segunda a Sexta, 8h às 18h
- **Urgência**: WhatsApp +55 11 9876-5432

### 📚 **Recursos Online**
- **Documentação**: https://docs.jarvis-vision.com
- **Tutoriais**: https://youtube.com/jarvis-vision
- **Comunidade**: https://github.com/jarvis-vision/community
- **Status**: https://status.jarvis-vision.com

---

**⚡ Esta é sua referência rápida para o Jarvis Vision. Mantenha sempre por perto!**
