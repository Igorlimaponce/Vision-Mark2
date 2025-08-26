# 📚 MANUAL COMPLETO DOS NÓS DO FRONTEND - JARVIS VISION

## 🎯 **ÍNDICE**

1. [Introdução](#introdução)
2. [VideoInputNode - Entrada de Vídeo](#videoinputnode---entrada-de-vídeo)
3. [ObjectDetectionNode - Detecção de Objetos](#objectdetectionnode---detecção-de-objetos)
4. [LoiteringDetectionNode - Detecção de Vadiagem](#loiteringdetectionnode---detecção-de-vadiagem)
5. [PolygonFilterNode - Filtro de Zona](#polygonfilternode---filtro-de-zona)
6. [DirectionFilterNode - Análise de Direção](#directionfilternode---análise-de-direção)
7. [TrajectoryAnalysisNode - Análise de Trajetória](#trajectoryanalysisnode---análise-de-trajetória)
8. [NotificationNode - Notificações](#notificationnode---notificações)
9. [TelegramNode - Telegram Bot](#telegramnode---telegram-bot)
10. [Conectando os Nós](#conectando-os-nós)
11. [Exemplos de Pipelines](#exemplos-de-pipelines)
12. [Troubleshooting](#troubleshooting)

---

## 🎬 **INTRODUÇÃO**

O sistema Jarvis Vision utiliza um sistema de nós interconectáveis para criar pipelines de análise de vídeo personalizados. Cada nó tem uma função específica e pode ser configurado independentemente.

### **Como Acessar:**
1. Abra seu navegador em `http://localhost:3000`
2. Navegue para "Pipeline Studio"
3. Use o menu lateral para adicionar nós
4. Configure cada nó usando os painéis de configuração
5. Conecte os nós arrastando das saídas para as entradas

---

## 📹 **VIDEOINPUTNODE - ENTRADA DE VÍDEO**

**Função:** Captura vídeo de diferentes fontes (câmeras, arquivos, streams)

### **📋 CONFIGURAÇÕES BÁSICAS**

#### **Tipo de Fonte**
- **Webcam**: Câmera integrada ou USB
- **Arquivo**: Vídeo local (.mp4, .avi, .mov)
- **Stream RTSP**: Câmera IP ou stream de rede
- **Stream HTTP**: Stream via protocolo HTTP

#### **Configurações por Tipo**

**🎥 Webcam:**
```
• Dispositivo: 0 (padrão), 1, 2... (múltiplas câmeras)
• Resolução: 640x480, 1280x720, 1920x1080
• FPS: 15, 24, 30 (frames por segundo)
```

**📁 Arquivo:**
```
• Caminho: /path/to/video.mp4
• Loop: Repetir vídeo automaticamente
• Velocidade: 0.5x, 1.0x, 2.0x
```

**🌐 Stream RTSP:**
```
• URL: rtsp://user:pass@192.168.1.100:554/stream
• Buffer: 1-10 (tamanho do buffer)
• Timeout: 5-30 segundos
```

### **⚙️ CONFIGURAÇÕES AVANÇADAS**

#### **Processamento de Frame**
- **Redimensionar Automático**: Otimiza performance
- **Correção de Cor**: Ajuste automático de brilho/contraste
- **Estabilização**: Reduz tremores da câmera
- **Desentrelaçamento**: Para vídeos entrelaçados

#### **Qualidade e Performance**
- **Qualidade de Compressão**: 0-100 (maior = melhor qualidade)
- **Pular Frames**: Processa apenas frames alternados
- **Pré-carregamento**: Buffer de frames para processamento

### **💡 DICAS DE USO**

**✅ Boas Práticas:**
- Use resolução mais baixa para melhor performance
- Configure timeout adequado para streams de rede
- Teste a fonte antes de criar o pipeline completo

**⚠️ Problemas Comuns:**
- **Sem imagem**: Verifique se a fonte está acessível
- **Lag**: Reduza resolução ou FPS
- **Desconexão**: Aumente timeout para streams

---

## 🎯 **OBJECTDETECTIONNODE - DETECÇÃO DE OBJETOS**

**Função:** Detecta e classifica objetos usando modelos YOLO com rastreamento DeepSORT

### **🔍 CONFIGURAÇÕES DE DETECÇÃO**

#### **Modelo YOLO**
- **YOLOv8n (Nano)**: Mais rápido, menor precisão
- **YOLOv8s (Small)**: Balanceado
- **YOLOv8m (Medium)**: Boa precisão
- **YOLOv8l (Large)**: Alta precisão
- **YOLOv8x (XLarge)**: Máxima precisão, mais lento

#### **Classes de Detecção**
```
• person (pessoa)
• car (carro)
• truck (caminhão)
• bicycle (bicicleta)
• motorcycle (motocicleta)
• bus (ônibus)
• ... (80+ classes COCO)
```

#### **Thresholds**
- **Confiança**: 0.1-0.9 (padrão: 0.25)
- **IoU (Intersection over Union)**: 0.1-0.9 (padrão: 0.45)
- **Classes Máximas**: 1-100 detecções por frame

### **🔄 RASTREAMENTO DEEPSORT**

#### **Configurações Básicas**
- **Habilitar DeepSORT**: Rastreamento avançado com IDs
- **Re-identificação**: Mantém IDs após oclusão
- **Extração de Features**: Características visuais para ReID

#### **Parâmetros DeepSORT**
- **Mínimo de Hits**: 3-10 detecções para confirmar track
- **Máximo Age**: 30-100 frames sem detecção
- **Threshold IoU**: 0.1-0.8 para matching
- **Threshold Features**: 0.1-0.9 para similaridade visual

### **📊 ANÁLISE DE TRAJETÓRIA**

#### **Configurações de Movimento**
- **Análise de Velocidade**: Calcula velocidade em px/s
- **Rastreamento de Direção**: Detecta direção de movimento
- **Histórico de Trajetória**: 10-100 pontos de histórico
- **Suavização**: Filtro para reduzir ruído

#### **Detecção de Padrões**
- **Mudanças de Direção**: Detecta curvas e inversões
- **Paradas**: Identifica objetos parados
- **Velocidade Anômala**: Alerta para velocidades incomuns

### **💡 GUIA DE CONFIGURAÇÃO**

**🎮 Para Análise em Tempo Real:**
```
• Modelo: YOLOv8n ou YOLOv8s
• Confiança: 0.3-0.5
• DeepSORT: Habilitado
• ReID: Habilitado
```

**🔬 Para Análise Detalhada:**
```
• Modelo: YOLOv8l ou YOLOv8x
• Confiança: 0.5-0.7
• Todas as análises: Habilitadas
```

**⚡ Para Performance Máxima:**
```
• Modelo: YOLOv8n
• Confiança: 0.4
• DeepSORT: Desabilitado
• Classes limitadas
```

---

## ⏰ **LOITERINGDETECTIONNODE - DETECÇÃO DE VADIAGEM**

**Função:** Detecta pessoas que permanecem em uma área por tempo excessivo

### **⚙️ CONFIGURAÇÕES BÁSICAS**

#### **Parâmetros de Tempo**
- **Tempo Limite**: 5-300 segundos (padrão: 10s)
- **Limite de Movimento**: 5-100 pixels (padrão: 25px)
- **Nível de Alerta**: Baixo, Médio, Alto, Crítico

#### **Tipos de Alerta**
- **Baixo**: Notificação simples
- **Médio**: Alerta visual + som
- **Alto**: Alerta + registro de evento
- **Crítico**: Todas as notificações + ação imediata

### **🔄 DEEPSORT & RE-IDENTIFICAÇÃO**

#### **Rastreamento Avançado**
- **Usar DeepSORT**: Recomendado para maior precisão
- **Mínimo de Hits**: 1-10 (padrão: 3)
- **Máximo Age**: 10-200 frames (padrão: 50)
- **Threshold IoU**: 0.1-0.8 (padrão: 0.3)
- **Threshold Features**: 0.1-0.9 (padrão: 0.6)

### **📊 ANÁLISE DE MOVIMENTO**

#### **Detecção de Padrões**
- **Analisar Padrões**: Identifica comportamentos suspeitos
- **Estimativa de Velocidade**: Calcula velocidade do objeto
- **Rastreamento de Direção**: Monitora direção de movimento
- **Histórico de Trajetória**: 10-100 pontos (padrão: 30)

### **🚨 CONFIGURAÇÕES DE ALERTA**

#### **Alertas Detalhados**
- **Métricas Incluídas**: Tempo, posição, velocidade
- **Pontuação de Confiança**: Score de 0-100 para loitering
- **Cooldown**: 5-300s entre alertas do mesmo objeto

### **💡 CENÁRIOS DE USO**

**🏪 Loja/Comércio:**
```
• Tempo Limite: 60-120 segundos
• Movimento: 30-50 pixels
• Nível: Médio
• DeepSORT: Habilitado
```

**🏛️ Área Restrita:**
```
• Tempo Limite: 10-30 segundos
• Movimento: 15-25 pixels
• Nível: Alto/Crítico
• Todas as análises habilitadas
```

**🏠 Residencial:**
```
• Tempo Limite: 30-60 segundos
• Movimento: 25-40 pixels
• Nível: Baixo/Médio
```

---

## 🏢 **POLYGONFILTERNODE - FILTRO DE ZONA**

**Função:** Define áreas específicas e monitora eventos dentro delas

### **📍 DEFINIÇÃO DA ZONA**

#### **Configuração Visual**
- **Configurar Área Visualmente**: Desenhe polígono no vídeo
- **Nome da Zona**: Identificação única (ex: "Entrada Principal")
- **Pontos**: Mínimo 3 pontos para formar área válida

### **🚨 DETECÇÃO DE EVENTOS**

#### **Tipos de Eventos**
- **Entrada na Zona**: Objeto entra na área
- **Saída da Zona**: Objeto deixa a área
- **Cruzamento**: Objeto atravessa a zona

#### **Configurações de Evento**
- **Detectar Entrada**: ✅ Monitora entradas
- **Detectar Saída**: ✅ Monitora saídas
- **Detectar Cruzamento**: ✅ Monitora travessias

### **⏱️ ANÁLISE DE PERMANÊNCIA**

#### **Tempo de Permanência**
- **Habilitar Análise**: Monitora tempo na zona
- **Limite de Permanência**: 5-300 segundos (padrão: 30s)
- **Permanência Mínima**: 5-100 frames para gerar evento

### **⚙️ CONFIGURAÇÕES AVANÇADAS**

#### **Ponto de Referência**
- **Centro**: Centro do objeto detectado
- **Centro da Base**: Ponto inferior central (recomendado)
- **Centro da Caixa**: Centro da bounding box
- **Posição dos Pés**: Estimativa da posição dos pés

#### **Análise de Densidade**
- **Análise de Densidade**: Conta objetos por área
- **Capacidade Máxima**: 1-100 pessoas (padrão: 10)
- **Alerta de Superlotação**: Quando excede capacidade

#### **Análises Adicionais**
- **Estimativa de Velocidade**: Velocidade dentro da zona
- **Análise de Direção**: Direção de movimento na zona

### **💡 EXEMPLOS DE CONFIGURAÇÃO**

**🚪 Porta de Entrada:**
```
• Eventos: Entrada + Saída
• Permanência: 10-20 segundos
• Ponto: Centro da Base
• Capacidade: 3-5 pessoas
```

**🅿️ Área de Estacionamento:**
```
• Eventos: Entrada + Permanência
• Permanência: 300+ segundos
• Densidade: Habilitada
• Capacidade: 50+ pessoas
```

**🚫 Área Restrita:**
```
• Eventos: Todos habilitados
• Permanência: 5-10 segundos
• Alerta imediato
• Análises completas
```

---

## 🧭 **DIRECTIONFILTERNODE - ANÁLISE DE DIREÇÃO**

**Função:** Analisa e filtra objetos baseado em sua direção de movimento

### **🎯 CONFIGURAÇÃO DE DIREÇÃO**

#### **Direção Alvo**
- **Componente X**: -1.0 a 1.0 (direção horizontal)
- **Componente Y**: -1.0 a 1.0 (direção vertical)
- **Ângulo Calculado**: Mostra direção em graus com ícone
- **Tolerância Angular**: 10-180° (padrão: 45°)

#### **Exemplos de Direção**
```
• ➡️ Direita: X=1, Y=0
• ⬅️ Esquerda: X=-1, Y=0
• ⬆️ Cima: X=0, Y=-1
• ⬇️ Baixo: X=0, Y=1
• ↗️ Diagonal: X=0.7, Y=-0.7
```

### **🚫 DETECÇÃO DE DIREÇÃO INCORRETA**

#### **Configurações**
- **Detectar Direção Incorreta**: Identifica movimento oposto
- **Limite Direção Incorreta**: 90-180° (padrão: 120°)
- **Velocidade Mínima**: 5-50 px/s para evitar falsos positivos
- **Frames de Confirmação**: 3-30 frames consecutivos

### **⚡ ANÁLISE DE VELOCIDADE**

#### **Configurações de Velocidade**
- **Habilitar Análise**: Monitora velocidade
- **Velocidade Máxima**: 10-200 px/s (padrão: 80)
- **Janela de Cálculo**: 3-20 pontos para cálculo

### **🔧 CONFIGURAÇÕES AVANÇADAS**

#### **Processamento**
- **Suavização de Trajetória**: 0.1-0.9 (padrão: 0.3)
- **Rastrear Mudanças**: Detecta alterações de direção
- **Gerar Estatísticas**: Relatórios de direção
- **Cooldown de Alertas**: 5-300s entre alertas

#### **Aplicação Seletiva**
- **Aplicar em Zonas Específicas**: Apenas em áreas definidas
- **Nomes das Zonas**: Lista separada por vírgulas

### **💡 CASOS DE USO**

**🛣️ Controle de Tráfego:**
```
• Direção: Conforme a via
• Tolerância: 30°
• Direção Incorreta: Habilitada
• Velocidade Máxima: 50 px/s
```

**🚶 Fluxo de Pedestres:**
```
• Direção: Entrada → Saída
• Tolerância: 45°
• Mudanças: Habilitadas
• Velocidade: 10-30 px/s
```

**🏃 Área de Corrida:**
```
• Direção: Circular
• Tolerância: 60°
• Estatísticas: Habilitadas
• Velocidade: 30-100 px/s
```

---

## 📈 **TRAJECTORYANALYSISNODE - ANÁLISE DE TRAJETÓRIA**

**Função:** Analisa padrões de movimento e trajetórias dos objetos

### **⚙️ CONFIGURAÇÕES BÁSICAS**

#### **Parâmetros de Trajetória**
- **Tamanho Mín. Trajetória**: 3-50 pontos (padrão: 10)
- **Tamanho Máx. Histórico**: 10-200 pontos (padrão: 50)
- **Intervalo de Análise**: 1-30 frames (padrão: 5)

### **🔄 SUAVIZAÇÃO E FILTROS**

#### **Processamento de Dados**
- **Suavização de Trajetória**: 0.1-0.9 (padrão: 0.3)
- **Filtro Kalman**: Predição de movimento
- **Interpolação**: Preenche gaps na trajetória
- **Redução de Ruído**: Remove pontos incorretos

### **📊 ANÁLISE DE PADRÕES**

#### **Detecção de Comportamentos**
- **Padrões Circulares**: Movimento em círculos
- **Movimento Linear**: Linha reta
- **Padrões Zigzag**: Movimento irregular
- **Mudanças Bruscas**: Alterações súbitas

#### **Métricas Calculadas**
- **Velocidade Média**: Velocidade ao longo da trajetória
- **Aceleração**: Mudanças na velocidade
- **Distância Total**: Distância percorrida
- **Tempo de Movimento**: Duração ativa

### **🚨 ALERTAS E EVENTOS**

#### **Condições de Alerta**
- **Trajetória Anômala**: Padrões incomuns
- **Velocidade Anômala**: Velocidade fora do normal
- **Paradas Frequentes**: Muitas paradas
- **Movimento Errático**: Comportamento irregular

### **💡 APLICAÇÕES PRÁTICAS**

**🔒 Segurança:**
```
• Detectar comportamento suspeito
• Identificar padrões de reconhecimento
• Monitorar áreas sensíveis
```

**📊 Análise de Fluxo:**
```
• Otimizar layouts
• Identificar gargalos
• Medir eficiência de rotas
```

**🏃 Análise Esportiva:**
```
• Análise de performance
• Padrões de movimento
• Otimização de treino
```

---

## 🔔 **NOTIFICATIONNODE - NOTIFICAÇÕES**

**Função:** Gerencia e envia notificações baseadas em eventos detectados

### **📧 TIPOS DE NOTIFICAÇÃO**

#### **Canais Disponíveis**
- **Email**: Notificações por email
- **SMS**: Mensagens de texto
- **Push**: Notificações do navegador
- **Webhook**: Integração com APIs externas

### **⚙️ CONFIGURAÇÕES DE EMAIL**

#### **Servidor SMTP**
- **Servidor**: smtp.gmail.com, outlook.office365.com
- **Porta**: 587 (TLS), 465 (SSL), 25 (sem criptografia)
- **Segurança**: TLS, SSL, None
- **Usuário**: seu-email@dominio.com
- **Senha**: senha ou app password

#### **Configurações de Envio**
- **Remetente**: Nome exibido
- **Destinatário**: emails separados por vírgula
- **Assunto**: Template personalizável
- **Incluir Imagem**: Screenshot do evento

### **📱 CONFIGURAÇÕES AVANÇADAS**

#### **Filtros de Evento**
- **Tipos de Evento**: Quais eventos enviar
- **Nível Mínimo**: Filtro por severidade
- **Cooldown**: Tempo entre notificações
- **Agrupamento**: Agrupar eventos similares

#### **Templates de Mensagem**
- **Personalização**: Variables dinâmicas
- **Formatação**: HTML suportado
- **Anexos**: Imagens e logs

### **💡 CONFIGURAÇÃO RÁPIDA**

**📧 Gmail:**
```
• Servidor: smtp.gmail.com
• Porta: 587
• Segurança: TLS
• Usuário: seu-email@gmail.com
• Senha: app password (não a senha normal)
```

**📧 Outlook:**
```
• Servidor: smtp-mail.outlook.com
• Porta: 587
• Segurança: TLS
• Usuário: seu-email@outlook.com
```

---

## 🤖 **TELEGRAMNODE - TELEGRAM BOT**

**Função:** Envia alertas e notificações via Telegram

### **🔧 CONFIGURAÇÃO INICIAL**

#### **Criando o Bot**
1. **Abra o Telegram** e procure por @BotFather
2. **Digite** `/newbot`
3. **Escolha um nome** para seu bot
4. **Escolha um username** (deve terminar com 'bot')
5. **Copie o token** fornecido

#### **Obtendo Chat ID**
1. **Adicione o bot** ao seu chat/grupo
2. **Envie uma mensagem** para o bot
3. **Acesse** `https://api.telegram.org/botTOKEN/getUpdates`
4. **Encontre o chat_id** na resposta

### **⚙️ CONFIGURAÇÕES DO BOT**

#### **Informações Básicas**
- **Token do Bot**: Token fornecido pelo BotFather
- **Chat ID**: ID do chat de destino
- **Nome do Bot**: Nome para identificação
- **Timeout**: 5-60 segundos para envio

#### **Configurações de Mensagem**
- **Parse Mode**: Markdown, HTML, None
- **Desabilitar Preview**: Links sem preview
- **Notificação Silenciosa**: Sem som no recebimento
- **Incluir Localização**: Coordenadas do evento

### **📊 TIPOS DE ALERTA**

#### **Formatos de Mensagem**
- **Texto Simples**: Apenas texto
- **Formatado**: Com markdown/HTML
- **Com Foto**: Inclui screenshot
- **Com Documento**: Anexa arquivos

#### **Informações Incluídas**
- **Timestamp**: Data e hora do evento
- **Tipo de Evento**: Categoria do alerta
- **Localização**: Zona ou coordenadas
- **Detalhes**: Informações específicas

### **💡 EXEMPLO DE CONFIGURAÇÃO**

**🚨 Alertas de Segurança:**
```
• Parse Mode: Markdown
• Incluir Foto: ✅
• Notificação: Normal
• Timeout: 30s
```

**📊 Relatórios Periódicos:**
```
• Parse Mode: HTML
• Notificação: Silenciosa
• Incluir Estatísticas: ✅
```

---

## 🔗 **CONECTANDO OS NÓS**

### **🎯 FLUXO DE DADOS**

#### **Ordem Típica de Conexão**
```
VideoInput → ObjectDetection → [Filtros] → [Análises] → Notificações
```

#### **Tipos de Conexão**
- **Handle Target** (●): Entrada de dados
- **Handle Source** (●): Saída de dados
- **Dados Compatíveis**: Frames, detecções, eventos

### **🔧 REGRAS DE CONEXÃO**

#### **Conexões Válidas**
- **VideoInput** → **ObjectDetection**
- **ObjectDetection** → **Filtros** (Polygon, Direction)
- **Filtros** → **Análises** (Loitering, Trajectory)
- **Qualquer nó** → **Notificações** (Notification, Telegram)

#### **Conexões Inválidas**
- ❌ **Notificação** → **Qualquer** (nós de saída)
- ❌ **Loops circulares**
- ❌ **Múltiplas entradas** no mesmo handle

---

## 🛠️ **EXEMPLOS DE PIPELINES**

### **🏪 MONITORAMENTO DE LOJA**

```
📹 VideoInput (Câmera da loja)
    ↓
🎯 ObjectDetection (YOLOv8s, DeepSORT ativo)
    ↓
🏢 PolygonFilter (Zona "Caixa")
    ↓
⏰ LoiteringDetection (60s limite)
    ↓
🔔 Notification (Email para gerente)
```

**Configurações Recomendadas:**
- **VideoInput**: Webcam, 1280x720, 30fps
- **ObjectDetection**: YOLOv8s, confiança 0.4, DeepSORT ativo
- **PolygonFilter**: Zona ao redor do caixa, eventos de entrada/saída
- **LoiteringDetection**: 60s limite, nível médio
- **Notification**: Email para gerente@loja.com

### **🚗 CONTROLE DE TRÁFEGO**

```
📹 VideoInput (Câmera da rua)
    ↓
🎯 ObjectDetection (Carros, motos, pessoas)
    ↓
🧭 DirectionFilter (Direção correta da via)
    ↓
🤖 Telegram (Alertas de infração)
```

**Configurações Recomendadas:**
- **VideoInput**: Stream RTSP, 1920x1080
- **ObjectDetection**: Classes vehicle, confiança 0.6
- **DirectionFilter**: Direção da via, tolerância 30°
- **Telegram**: Alertas com foto, parse markdown

### **🏛️ SEGURANÇA PERÍMETRO**

```
📹 VideoInput (Múltiplas câmeras)
    ↓
🎯 ObjectDetection (Apenas pessoas)
    ↓
🏢 PolygonFilter (Área restrita)
    ↓
📈 TrajectoryAnalysis (Comportamento suspeito)
    ↓
⏰ LoiteringDetection (10s limite)
    ↓
🔔 Notification + 🤖 Telegram (Alerta duplo)
```

### **📊 ANÁLISE DE FLUXO**

```
📹 VideoInput (Área pública)
    ↓
🎯 ObjectDetection (YOLOv8l, máxima precisão)
    ↓
🏢 PolygonFilter (Múltiplas zonas)
    ↓
📈 TrajectoryAnalysis (Padrões de movimento)
    ↓
🧭 DirectionFilter (Análise de fluxo)
    ↓
🔔 Notification (Relatórios por email)
```

---

## 🐛 **TROUBLESHOOTING**

### **❌ PROBLEMAS COMUNS**

#### **📹 VideoInput não funciona**
**Sintomas:** Tela preta, erro de conexão
```
✅ Soluções:
• Verificar se a câmera está conectada
• Testar com software externo (VLC, OBS)
• Verificar permissões de câmera
• Trocar URL RTSP se usando stream
• Reduzir resolução/FPS
```

#### **🎯 ObjectDetection lenta**
**Sintomas:** FPS baixo, travamentos
```
✅ Soluções:
• Usar modelo menor (YOLOv8n)
• Reduzir resolução do vídeo
• Diminuir confiança threshold
• Desabilitar DeepSORT temporariamente
• Verificar recursos do sistema
```

#### **🔗 Nós não se conectam**
**Sintomas:** Linha de conexão não aparece
```
✅ Soluções:
• Verificar compatibilidade dos nós
• Arrastar de saída para entrada
• Evitar loops circulares
• Recarregar a página
• Verificar console do navegador
```

#### **🔔 Notificações não chegam**
**Sintomas:** Eventos detectados mas sem notificação
```
✅ Soluções Email:
• Verificar configurações SMTP
• Usar app password (Gmail)
• Testar com servidor externo
• Verificar firewall

✅ Soluções Telegram:
• Verificar token do bot
• Confirmar chat_id correto
• Bot deve estar no chat/grupo
• Verificar rate limits do Telegram
```

### **⚙️ OTIMIZAÇÃO DE PERFORMANCE**

#### **🚀 Para Máxima Velocidade**
```
• VideoInput: Resolução baixa (640x480)
• ObjectDetection: YOLOv8n, confiança 0.3
• Limite classes detectadas
• Desabilitar análises desnecessárias
• Usar menos filtros
```

#### **🔬 Para Máxima Precisão**
```
• VideoInput: Alta resolução (1920x1080)
• ObjectDetection: YOLOv8x, confiança 0.6
• DeepSORT habilitado
• Todas as análises ativas
• Múltiplos filtros
```

#### **⚖️ Para Uso Balanceado**
```
• VideoInput: 1280x720, 30fps
• ObjectDetection: YOLOv8s, confiança 0.4
• DeepSORT habilitado
• Análises essenciais
• Filtros necessários
```

---

## 📊 **MONITORAMENTO E LOGS**

### **📈 MÉTRICAS DO SISTEMA**

#### **Indicadores de Performance**
- **FPS**: Frames processados por segundo
- **Detecções/min**: Objetos detectados por minuto
- **Uso de CPU/GPU**: Recursos utilizados
- **Latência**: Tempo de processamento

#### **Status dos Nós**
- **🟢 Verde**: Funcionando normalmente
- **🟡 Amarelo**: Funcionando com avisos
- **🔴 Vermelho**: Erro ou não funcionando
- **⚫ Cinza**: Desconectado

### **📝 LOGS E DEBUGGING**

#### **Acessando Logs**
```bash
# Logs do sistema completo
docker-compose logs

# Logs específicos
docker-compose logs frontend
docker-compose logs frame-processing
```

#### **Níveis de Log**
- **DEBUG**: Informações detalhadas
- **INFO**: Operações normais
- **WARNING**: Avisos não críticos
- **ERROR**: Erros que impedem funcionamento

---

## 🚀 **PRÓXIMOS PASSOS**

### **📚 Recursos Adicionais**
- Documentação técnica em `/docs/`
- Exemplos de configuração
- Templates de pipeline
- Guias de integração

### **🔧 Customizações Avançadas**
- Criação de nós personalizados
- Integração com APIs externas
- Modelos de ML customizados
- Dashboards personalizados

### **🎯 Casos de Uso Específicos**
- Varejo e comércio
- Segurança corporativa
- Análise de tráfego
- Monitoramento industrial

---

**🎉 Parabéns!** Você agora domina todos os nós do sistema Jarvis Vision. Use este manual como referência para criar pipelines poderosos e personalizados para suas necessidades específicas.

**📞 Suporte:** Para dúvidas ou problemas, consulte os logs do sistema ou entre em contato com a equipe de desenvolvimento.
