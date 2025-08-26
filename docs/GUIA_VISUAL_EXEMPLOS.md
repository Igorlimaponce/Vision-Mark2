# 🎨 GUIA VISUAL E EXEMPLOS PRÁTICOS - JARVIS VISION

## 🎯 **GUIAS VISUAIS POR NÓ**

### 📹 **VIDEOINPUTNODE - CONFIGURAÇÃO PASSO A PASSO**

#### **Exemplo 1: Configurar Webcam**
```
1. ➕ Adicionar VideoInputNode ao pipeline
2. 🔧 Clicar no nó para abrir configurações
3. ⚙️ Configurar:
   • Tipo: "Webcam"
   • Dispositivo: 0 (primeira câmera)
   • Resolução: 1280x720
   • FPS: 30
4. ✅ Salvar configurações
5. ▶️ Iniciar pipeline
```

#### **Exemplo 2: Stream RTSP de Câmera IP**
```
1. ➕ Adicionar VideoInputNode
2. ⚙️ Configurar:
   • Tipo: "Stream RTSP"
   • URL: rtsp://admin:12345@192.168.1.100:554/stream1
   • Buffer: 3
   • Timeout: 15 segundos
3. 🔍 Testar conexão
4. ✅ Confirmar se o vídeo aparece
```

### 🎯 **OBJECTDETECTIONNODE - CONFIGURAÇÕES OTIMIZADAS**

#### **Cenário 1: Monitoramento em Tempo Real (Performance)**
```
🎬 VideoInput (720p, 30fps)
    ↓
🎯 ObjectDetection:
   📊 Modelo: YOLOv8n (Nano)
   🎚️ Confiança: 0.35
   🔄 DeepSORT: ✅ Habilitado
   🆔 Re-ID: ✅ Habilitado
   📏 Min Hits: 3
   ⏱️ Max Age: 50
   🎯 Classes: person, car, truck
```

#### **Cenário 2: Análise Forense (Precisão Máxima)**
```
🎬 VideoInput (1080p, 24fps)
    ↓
🎯 ObjectDetection:
   📊 Modelo: YOLOv8x (XLarge)
   🎚️ Confiança: 0.6
   🔄 DeepSORT: ✅ Habilitado
   📈 Todas as análises: ✅ Habilitadas
   🆔 Feature Threshold: 0.7
   📏 IoU Threshold: 0.4
```

### 🏢 **POLYGONFILTERNODE - DEFININDO ZONAS**

#### **Como Desenhar uma Zona:**
```
1. ➕ Adicionar PolygonFilterNode
2. 🖱️ Clicar "Configurar Área Visualmente"
3. 📺 Visualizador abre com feed de vídeo
4. 🖱️ Clicar pontos para definir polígono:
   • Ponto 1: Canto superior esquerdo
   • Ponto 2: Canto superior direito
   • Ponto 3: Canto inferior direito
   • Ponto 4: Canto inferior esquerdo
5. ✅ Confirmar área
6. 📝 Nomear zona: "Entrada Principal"
```

#### **Configurações para Porta de Entrada:**
```
🏢 PolygonFilter "Porta Principal":
   🚨 Eventos:
      • ✅ Detectar Entrada
      • ✅ Detectar Saída
      • ❌ Detectar Cruzamento
   
   ⏱️ Permanência:
      • ✅ Análise Habilitada
      • 🕐 Limite: 15 segundos
      • 📊 Min Frames: 10
   
   ⚙️ Avançado:
      • 📍 Ponto: Centro da Base
      • 👥 Capacidade: 5 pessoas
      • 📊 Densidade: ✅ Habilitada
```

### ⏰ **LOITERINGDETECTIONNODE - DETECÇÃO DE VADIAGEM**

#### **Configuração para Shopping Center:**
```
⏰ LoiteringDetection:
   ⚙️ Básico:
      • 🕐 Tempo Limite: 90 segundos
      • 📏 Movimento: 30 pixels
      • 🚨 Nível: Médio
   
   🔄 DeepSORT:
      • ✅ Tracking Avançado
      • 📊 Min Hits: 5
      • ⏱️ Max Age: 70
      • 🎯 IoU: 0.35
      • 🆔 Features: 0.65
   
   📊 Movimento:
      • ✅ Padrões de Movimento
      • ✅ Estimativa Velocidade
      • ✅ Tracking Direção
      • 📈 Histórico: 40 pontos
```

### 🧭 **DIRECTIONFILTERNODE - CONTROLE DE FLUXO**

#### **Configuração para Corredor Unidirecional:**
```
🧭 DirectionFilter "Corredor Sul→Norte":
   🎯 Direção Alvo:
      • 📐 X: 0 (sem movimento horizontal)
      • 📐 Y: -1 (movimento para cima)
      • 🧭 Ângulo: 270° ⬆️
      • 📏 Tolerância: 45°
   
   🚫 Direção Incorreta:
      • ✅ Detectar Incorreta
      • 🚨 Limite: 135°
      • ⚡ Vel. Mínima: 15 px/s
      • 📊 Confirmação: 7 frames
   
   ⚡ Velocidade:
      • ✅ Análise Habilitada
      • 🏃 Máxima: 60 px/s
      • 📊 Janela: 8 pontos
```

### 📈 **TRAJECTORYANALYSISNODE - ANÁLISE DE PADRÕES**

#### **Configuração para Análise Comportamental:**
```
📈 TrajectoryAnalysis:
   ⚙️ Básico:
      • 📏 Min. Trajetória: 15 pontos
      • 📊 Max. Histórico: 80 pontos
      • ⏱️ Intervalo: 3 frames
   
   🔄 Suavização:
      • 📐 Suavização: 0.4
      • 🔧 Kalman: ✅ Habilitado
      • 📊 Interpolação: ✅ Habilitada
      • 🔇 Redução Ruído: ✅ Habilitada
   
   📊 Padrões:
      • ✅ Circulares
      • ✅ Lineares
      • ✅ Zigzag
      • ✅ Mudanças Bruscas
```

---

## 🛠️ **PIPELINES PRONTOS PARA USO**

### 🏪 **PIPELINE: MONITORAMENTO DE LOJA**

```ascii
    📹 VideoInput          🎯 ObjectDetection       🏢 PolygonFilter
   ┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐
   │ Câmera Loja     │───▶│ YOLOv8s + DeepSORT│────▶│ Zona "Caixa"    │
   │ 1280x720@30fps  │    │ person, conf 0.4│     │ Entrada+Saída   │
   └─────────────────┘    └─────────────────┘     └─────────────────┘
                                                           │
    🔔 Notification        ⏰ LoiteringDetection           │
   ┌─────────────────┐    ┌─────────────────┐            │
   │ Email Gerente   │◀───│ 60s, Nível Médio│◀───────────┘
   │ manager@loja.com│    │ DeepSORT Ativo  │
   └─────────────────┘    └─────────────────┘
```

**📋 Checklist de Configuração:**
- [ ] **VideoInput**: Webcam configurada, resolução 1280x720
- [ ] **ObjectDetection**: YOLOv8s, confiança 0.4, DeepSORT ativo
- [ ] **PolygonFilter**: Zona desenhada ao redor do caixa
- [ ] **LoiteringDetection**: 60s limite, nível médio
- [ ] **Notification**: SMTP configurado, email do gerente
- [ ] **Teste**: Simular evento de loitering

### 🚗 **PIPELINE: CONTROLE DE TRÁFEGO**

```ascii
    📹 VideoInput          🎯 ObjectDetection       🧭 DirectionFilter
   ┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐
   │ Stream RTSP     │───▶│ YOLOv8m         │────▶│ Direção Via     │
   │ Câmera Rua      │    │ car,truck,motor │     │ ←West to East→  │
   └─────────────────┘    └─────────────────┘     └─────────────────┘
                                                           │
                          🤖 Telegram                     │
                         ┌─────────────────┐             │
                         │ @TrafficBot     │◀────────────┘
                         │ Alertas + Foto  │
                         └─────────────────┘
```

**⚙️ Configurações Específicas:**
- **VideoInput**: Stream RTSP da câmera de tráfego
- **ObjectDetection**: Classes vehicle apenas, confiança 0.6
- **DirectionFilter**: X=1,Y=0 (oeste→leste), tolerância 30°
- **Telegram**: Bot configurado, envio com foto

### 🏛️ **PIPELINE: SEGURANÇA PERÍMETRO**

```ascii
    📹 VideoInput          🎯 ObjectDetection       🏢 PolygonFilter
   ┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐
   │ Múltiplas       │───▶│ YOLOv8l + DeepSORT│────▶│ Área Restrita   │
   │ Câmeras IP      │    │ person only     │     │ Entrada Proibida│
   └─────────────────┘    └─────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
    🔔 Notification        ⏰ LoiteringDetection    📈 TrajectoryAnalysis
   ┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐
   │ Email+SMS       │◀───│ 5s, Crítico     │◀────│ Padrões Suspeitos│
   │ Equipe Segurança│    │ Alerta Imediato │     │ Comportamento   │
   └─────────────────┘    └─────────────────┘     └─────────────────┘
                                   ▲                       │
                          🤖 Telegram                     │
                         ┌─────────────────┐             │
                         │ @SecurityBot    │◀────────────┘
                         │ Alerta Urgente  │
                         └─────────────────┘
```

---

## 📊 **CONFIGURAÇÕES POR CENÁRIO**

### 🏪 **CENÁRIO: VAREJO**

#### **Objetivos:**
- Detectar clientes
- Monitorar tempo em áreas
- Alertar sobre comportamento suspeito
- Análise de fluxo

#### **Configuração Recomendada:**
```yaml
VideoInput:
  type: "webcam"
  resolution: "1280x720"
  fps: 30
  
ObjectDetection:
  model: "yolov8s"
  confidence: 0.4
  classes: ["person"]
  deepsort: true
  reid: true
  
PolygonFilter:
  zones:
    - name: "Entrada"
      events: [entry, exit]
      dwell_time: 10
    - name: "Vitrine"
      events: [entry, dwell]
      dwell_time: 60
    - name: "Caixa"
      events: [all]
      dwell_time: 120
      
LoiteringDetection:
  time_limit: 90
  level: "medium"
  deepsort: true
  
Notification:
  type: "email"
  recipients: ["manager@store.com"]
  include_image: true
```

### 🏢 **CENÁRIO: ESCRITÓRIO CORPORATIVO**

#### **Objetivos:**
- Controle de acesso
- Monitoramento de áreas sensíveis
- Detecção de permanência
- Relatórios de ocupação

#### **Configuração Recomendada:**
```yaml
VideoInput:
  type: "rtsp_stream"
  url: "rtsp://admin:pass@192.168.1.100:554/stream"
  buffer: 3
  
ObjectDetection:
  model: "yolov8m"
  confidence: 0.5
  classes: ["person"]
  deepsort: true
  reid: true
  max_age: 70
  
PolygonFilter:
  zones:
    - name: "Recepção"
      events: [entry, exit]
      max_capacity: 15
    - name: "Sala Servidor"
      events: [entry]
      dwell_time: 5
      alert_level: "critical"
      
TrajectoryAnalysis:
  min_length: 20
  patterns: [circular, erratic]
  anomaly_detection: true
  
NotificationChannels:
  - type: "email"
    recipients: ["security@company.com"]
  - type: "telegram"
    bot_token: "123456:ABC..."
    chat_id: "-123456789"
```

### 🚗 **CENÁRIO: MONITORAMENTO DE TRÁFEGO**

#### **Objetivos:**
- Detectar veículos
- Monitorar direção
- Detectar infrações
- Análise de fluxo

#### **Configuração Recomendada:**
```yaml
VideoInput:
  type: "rtsp_stream"
  url: "rtsp://traffic_cam:554/stream"
  resolution: "1920x1080"
  
ObjectDetection:
  model: "yolov8l"
  confidence: 0.6
  classes: ["car", "truck", "bus", "motorcycle"]
  deepsort: true
  
DirectionFilter:
  target_direction: [1, 0]  # West to East
  tolerance: 30
  wrong_direction_detection: true
  min_speed: 20
  max_speed: 100
  
PolygonFilter:
  zones:
    - name: "Faixa_1"
      events: [crossing]
    - name: "Faixa_2"
      events: [crossing]
      
SpeedAnalysis:
  speed_limit: 80  # pixels/second
  alert_threshold: 100
  
Notifications:
  telegram:
    bot: "@TrafficMonitorBot"
    alerts: ["speed_violation", "wrong_direction"]
    include_photo: true
```

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### ⚡ **OTIMIZAÇÃO DE PERFORMANCE**

#### **Para Sistemas com Recursos Limitados:**
```yaml
# Configuração Performance Mínima
VideoInput:
  resolution: "640x480"
  fps: 15
  
ObjectDetection:
  model: "yolov8n"  # Modelo mais leve
  confidence: 0.3
  max_detections: 10
  deepsort: false  # Desabilitar para economizar recursos
  
Processing:
  skip_frames: 2  # Processar 1 a cada 3 frames
  batch_size: 1
  
Notifications:
  cooldown: 60  # Reduzir frequência de alertas
```

#### **Para Máxima Precisão:**
```yaml
# Configuração Precisão Máxima
VideoInput:
  resolution: "1920x1080"
  fps: 30
  quality: 100
  
ObjectDetection:
  model: "yolov8x"  # Modelo mais preciso
  confidence: 0.7
  iou_threshold: 0.4
  deepsort: true
  reid: true
  feature_threshold: 0.8
  
TrajectoryAnalysis:
  smoothing: 0.5
  kalman_filter: true
  interpolation: true
  noise_reduction: true
  
Notifications:
  include_metadata: true
  include_trajectory: true
  high_resolution_images: true
```

### 🔐 **CONFIGURAÇÕES DE SEGURANÇA**

#### **Proteção de Dados:**
```yaml
Privacy:
  blur_faces: true  # Desfocar rostos
  anonymize_ids: true  # Anonimizar IDs
  data_retention: 30  # Dias para manter dados
  
Encryption:
  stream_encryption: true
  notification_encryption: true
  
Access_Control:
  require_authentication: true
  role_based_access: true
  audit_logging: true
```

---

## 📱 **INTERFACE MOBILE E REMOTA**

### 📱 **Acesso via Dispositivos Móveis**

#### **Configuração Responsiva:**
- **URL**: `http://seu-ip:3000`
- **Compatibilidade**: Chrome, Safari, Firefox mobile
- **Funcionalidades**: Visualização em tempo real, alertas push

#### **App Telegram para Alertas:**
```
1. 🤖 Criar bot: @BotFather → /newbot
2. 📱 Adicionar bot ao grupo de segurança
3. ⚙️ Configurar no TelegramNode
4. 📲 Receber alertas instantâneos
5. 📸 Visualizar capturas de tela
```

### 🌐 **Acesso Remoto Seguro**

#### **VPN Access:**
```bash
# Configurar acesso VPN
sudo apt install openvpn
# Configurar cliente VPN
# Acessar via: http://ip-interno:3000
```

#### **Proxy Reverso (Nginx):**
```nginx
server {
    listen 443 ssl;
    server_name jarvis-vision.sua-empresa.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 **MONITORAMENTO E ANALYTICS**

### 📈 **Dashboard de Métricas**

#### **KPIs Principais:**
- **FPS Médio**: Frames processados por segundo
- **Detecções/Hora**: Objetos detectados por hora
- **Alertas Gerados**: Número de alertas por período
- **Uptime**: Tempo de funcionamento contínuo
- **Accuracy**: Precisão das detecções

#### **Relatórios Automáticos:**
```yaml
Reports:
  daily_summary:
    time: "08:00"
    recipients: ["manager@company.com"]
    include:
      - detection_count
      - alert_summary
      - system_health
      
  weekly_analysis:
    day: "monday"
    time: "09:00"
    include:
      - traffic_patterns
      - anomaly_analysis
      - performance_metrics
```

### 📊 **Exportação de Dados**

#### **Formatos Suportados:**
- **CSV**: Para análise em Excel/Google Sheets
- **JSON**: Para integração com APIs
- **PDF**: Relatórios executivos
- **XML**: Sistemas legados

#### **Exemplo de Exportação:**
```bash
# Via API
curl -X GET "http://localhost:8000/api/export/detections" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-06-01",
    "end_date": "2025-06-30",
    "format": "csv",
    "zones": ["entrada", "caixa"],
    "types": ["person_detected", "loitering_alert"]
  }'
```

---

## 🎓 **TREINAMENTO E MELHORES PRÁTICAS**

### 📚 **Curso Básico - 1 Hora**

#### **Módulo 1: Fundamentos (15 min)**
- Entendendo o pipeline de visão computacional
- Tipos de nós e suas funções
- Como conectar nós

#### **Módulo 2: Configuração Prática (20 min)**
- Configurar VideoInput
- Configurar ObjectDetection
- Criar primeira zona
- Configurar notificações

#### **Módulo 3: Casos de Uso (15 min)**
- Pipeline para loja
- Pipeline para segurança
- Pipeline para tráfego

#### **Módulo 4: Troubleshooting (10 min)**
- Problemas comuns
- Como otimizar performance
- Onde buscar ajuda

### 🏆 **Certificação Avançada - 4 Horas**

#### **Nível 1: Operador (1h)**
- Operar pipelines existentes
- Monitorar métricas
- Responder a alertas

#### **Nível 2: Configurador (1.5h)**
- Criar pipelines personalizados
- Configurar parâmetros avançados
- Otimizar performance

#### **Nível 3: Administrador (1.5h)**
- Gerenciar múltiplos pipelines
- Configurar integrações
- Análise de dados avançada

---

## 🌟 **RECURSOS AVANÇADOS**

### 🤖 **Integração com IA**

#### **Modelos Personalizados:**
```python
# Exemplo de modelo customizado
class CustomDetectionModel:
    def __init__(self, model_path):
        self.model = torch.load(model_path)
    
    def detect(self, frame):
        # Lógica de detecção personalizada
        return detections
```

#### **API de Machine Learning:**
```json
{
  "endpoint": "/api/ml/custom-model",
  "method": "POST",
  "payload": {
    "model_name": "custom-yolo",
    "confidence": 0.5,
    "classes": ["custom_object_1", "custom_object_2"]
  }
}
```

### 🔗 **Integrações Empresariais**

#### **ERP/CRM Integration:**
```yaml
Integrations:
  SAP:
    endpoint: "https://sap.company.com/api"
    auth_type: "oauth2"
    events: ["person_count", "zone_occupancy"]
    
  Salesforce:
    endpoint: "https://company.salesforce.com"
    events: ["customer_analytics"]
    
  Microsoft_Teams:
    webhook: "https://company.webhook.office.com"
    events: ["security_alerts"]
```

---

**🎯 CONCLUSÃO**

Este guia completo cobre todos os aspectos do sistema Jarvis Vision, desde configurações básicas até integrações avançadas. Use-o como referência para implementar soluções de visão computacional profissionais e eficazes.

**📞 SUPORTE TÉCNICO**
- 📧 Email: suporte@jarvis-vision.com
- 💬 Chat: Sistema integrado no dashboard
- 📚 Wiki: Documentação técnica completa
- 🎥 Vídeos: Tutoriais no YouTube
