import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2, FiBell, FiMail, FiSmartphone, FiSettings, FiZap, FiClock, FiFilter } from 'react-icons/fi';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;
    data.onConfigChange(id, { [name]: finalValue });
  };

  const getStatusBadge = () => {
    if (data.notification_type && (data.email || data.webhook_url || data.phone_number)) {
      return <span className="status-badge status-active">✓ Configurado</span>;
    }
    return <span className="status-badge status-inactive">⚠ Configuração Incompleta</span>;
  };

  const getNotificationIcon = () => {
    switch (data.notification_type) {
      case 'email': return <FiMail />;
      case 'webhook': return <FiZap />;
      case 'sms': return <FiSmartphone />;
      default: return <FiBell />;
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'baixa': '#27ae60',
      'normal': '#f39c12', 
      'alta': '#e74c3c',
      'critica': '#8e44ad'
    };
    return colors[priority] || '#95a5a6';
  };

  return (
    <div className="custom-node">
      <div className="node-header" style={{backgroundColor: '#e67e22'}}>
        <div className="node-title">
          {getNotificationIcon()}
          <span style={{ marginLeft: '8px' }}>Notificação Avançada</span>
          {getStatusBadge()}
        </div>
        <button onClick={() => data.onDeleteNode(id)}><FiTrash2 /></button>
      </div>
      <div className="node-content">
        {/* Tipo de Notificação */}
        <div className="form-section">
          <div className="section-header">
            <FiSettings /> Tipo de Notificação
          </div>
          <div className="form-row">
            <label htmlFor={`notification_type-${id}`}>Método de Notificação</label>
            <select
              id={`notification_type-${id}`}
              name="notification_type"
              className="nodrag"
              value={data.notification_type || 'email'}
              onChange={onUpdate}
            >
              <option value="email">📧 Email</option>
              <option value="webhook">🔗 Webhook</option>
              <option value="sms">📱 SMS</option>
              <option value="push">🔔 Push Notification</option>
              <option value="slack">💬 Slack</option>
              <option value="discord">🎮 Discord</option>
            </select>
          </div>
        </div>

        {/* Configuração Específica do Tipo */}
        <div className="form-section">
          <div className="section-header">
            <FiSettings /> Configuração de Destino
          </div>
          
          {data.notification_type === 'email' && (
            <>
              <div className="form-row">
                <label htmlFor={`email-${id}`}>Email de Destino</label>
                <input
                  id={`email-${id}`}
                  name="email"
                  type="email"
                  className="nodrag"
                  placeholder="usuario@exemplo.com"
                  value={data.email || ''}
                  onChange={onUpdate}
                />
              </div>
              <div className="form-row">
                <label htmlFor={`smtp_server-${id}`}>Servidor SMTP</label>
                <input
                  id={`smtp_server-${id}`}
                  name="smtp_server"
                  type="text"
                  className="nodrag"
                  placeholder="smtp.gmail.com"
                  value={data.smtp_server || ''}
                  onChange={onUpdate}
                />
              </div>
              <div className="form-row">
                <label htmlFor={`smtp_port-${id}`}>Porta SMTP</label>
                <input
                  id={`smtp_port-${id}`}
                  name="smtp_port"
                  type="number"
                  className="nodrag"
                  value={data.smtp_port || 587}
                  onChange={onUpdate}
                />
              </div>
            </>
          )}

          {data.notification_type === 'webhook' && (
            <>
              <div className="form-row">
                <label htmlFor={`webhook_url-${id}`}>URL do Webhook</label>
                <input
                  id={`webhook_url-${id}`}
                  name="webhook_url"
                  type="url"
                  className="nodrag"
                  placeholder="https://api.exemplo.com/webhook"
                  value={data.webhook_url || ''}
                  onChange={onUpdate}
                />
              </div>
              <div className="form-row">
                <label htmlFor={`webhook_method-${id}`}>Método HTTP</label>
                <select
                  id={`webhook_method-${id}`}
                  name="webhook_method"
                  className="nodrag"
                  value={data.webhook_method || 'POST'}
                  onChange={onUpdate}
                >
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor={`webhook_headers-${id}`}>Headers (JSON)</label>
                <textarea
                  id={`webhook_headers-${id}`}
                  name="webhook_headers"
                  rows="3"
                  className="nodrag"
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  value={data.webhook_headers || ''}
                  onChange={onUpdate}
                />
              </div>
            </>
          )}

          {data.notification_type === 'sms' && (
            <>
              <div className="form-row">
                <label htmlFor={`phone_number-${id}`}>Número de Telefone</label>
                <input
                  id={`phone_number-${id}`}
                  name="phone_number"
                  type="tel"
                  className="nodrag"
                  placeholder="+5511999999999"
                  value={data.phone_number || ''}
                  onChange={onUpdate}
                />
              </div>
              <div className="form-row">
                <label htmlFor={`sms_provider-${id}`}>Provedor SMS</label>
                <select
                  id={`sms_provider-${id}`}
                  name="sms_provider"
                  className="nodrag"
                  value={data.sms_provider || 'twilio'}
                  onChange={onUpdate}
                >
                  <option value="twilio">Twilio</option>
                  <option value="aws_sns">AWS SNS</option>
                  <option value="zenvia">Zenvia</option>
                </select>
              </div>
            </>
          )}

          {(data.notification_type === 'slack' || data.notification_type === 'discord') && (
            <div className="form-row">
              <label htmlFor={`webhook_url-${id}`}>URL do Webhook</label>
              <input
                id={`webhook_url-${id}`}
                name="webhook_url"
                type="url"
                className="nodrag"
                placeholder={data.notification_type === 'slack' ? 
                  'https://hooks.slack.com/services/...' : 
                  'https://discord.com/api/webhooks/...'}
                value={data.webhook_url || ''}
                onChange={onUpdate}
              />
            </div>
          )}
        </div>

        {/* Filtros de Alerta */}
        <div className="form-section">
          <div className="section-header">
            <FiFilter /> Filtros de Alerta
          </div>
          <div className="form-row">
            <label htmlFor={`alert_priority-${id}`}>Prioridade Mínima</label>
            <select
              id={`alert_priority-${id}`}
              name="alert_priority"
              className="nodrag"
              value={data.alert_priority || 'normal'}
              onChange={onUpdate}
              style={{ borderLeft: `4px solid ${getPriorityColor(data.alert_priority)}` }}
            >
              <option value="baixa">🟢 Baixa ou Superior</option>
              <option value="normal">🟡 Normal ou Superior</option>
              <option value="alta">🔴 Alta ou Superior</option>
              <option value="critica">🟣 Apenas Crítica</option>
            </select>
          </div>
          <div className="form-row">
            <label htmlFor={`alert_categories-${id}`}>Categorias de Alerta</label>
            <select
              id={`alert_categories-${id}`}
              name="alert_categories"
              className="nodrag"
              value={data.alert_categories || 'all'}
              onChange={onUpdate}
              multiple={data.multi_category_selection}
            >
              <option value="all">Todas as Categorias</option>
              <option value="detection">🎯 Detecções</option>
              <option value="tracking">📍 Tracking</option>
              <option value="loitering">⏰ Loitering</option>
              <option value="zones">🔹 Violação de Zonas</option>
              <option value="trajectory">📊 Trajetória Anômala</option>
              <option value="speed">🏃 Velocidade Anômala</option>
              <option value="direction">🔄 Direção Errada</option>
              <option value="crowd">👥 Aglomeração</option>
            </select>
          </div>
          <div className="form-row">
            <label htmlFor={`min_confidence-${id}`}>Confiança Mínima (%)</label>
            <input
              id={`min_confidence-${id}`}
              name="min_confidence"
              type="number"
              min="0"
              max="100"
              className="nodrag"
              value={data.min_confidence || 60}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row">
            <label htmlFor={`object_classes-${id}`}>Classes de Objeto</label>
            <input
              id={`object_classes-${id}`}
              name="object_classes"
              type="text"
              className="nodrag"
              placeholder="person,car,bike (separado por vírgula)"
              value={data.object_classes || ''}
              onChange={onUpdate}
            />
          </div>
        </div>

        {/* Controle de Frequência */}
        <div className="form-section">
          <div className="section-header">
            <FiClock /> Controle de Frequência
          </div>
          <div className="form-row">
            <label htmlFor={`cooldown_minutes-${id}`}>Cooldown entre Alertas (min)</label>
            <input
              id={`cooldown_minutes-${id}`}
              name="cooldown_minutes"
              type="number"
              min="0"
              max="60"
              className="nodrag"
              value={data.cooldown_minutes || 5}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row">
            <label htmlFor={`max_notifications_per_hour-${id}`}>Máx. Notificações/Hora</label>
            <input
              id={`max_notifications_per_hour-${id}`}
              name="max_notifications_per_hour"
              type="number"
              min="1"
              max="100"
              className="nodrag"
              value={data.max_notifications_per_hour || 20}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row">
            <label htmlFor={`quiet_hours_start-${id}`}>Início Horário Silencioso</label>
            <input
              id={`quiet_hours_start-${id}`}
              name="quiet_hours_start"
              type="time"
              className="nodrag"
              value={data.quiet_hours_start || ''}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row">
            <label htmlFor={`quiet_hours_end-${id}`}>Fim Horário Silencioso</label>
            <input
              id={`quiet_hours_end-${id}`}
              name="quiet_hours_end"
              type="time"
              className="nodrag"
              value={data.quiet_hours_end || ''}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row-checkbox">
            <input
              id={`batch_notifications-${id}`}
              name="batch_notifications"
              type="checkbox"
              className="nodrag"
              checked={data.batch_notifications || false}
              onChange={onUpdate}
            />
            <label htmlFor={`batch_notifications-${id}`}>Agrupar Notificações Similares</label>
          </div>
          <div className="form-row-checkbox">
            <input
              id={`escalation_enabled-${id}`}
              name="escalation_enabled"
              type="checkbox"
              className="nodrag"
              checked={data.escalation_enabled || false}
              onChange={onUpdate}
            />
            <label htmlFor={`escalation_enabled-${id}`}>Escalação Automática</label>
          </div>
        </div>

        {/* Template de Mensagem */}
        <div className="form-section">
          <div className="section-header">
            <FiBell /> Template de Mensagem
          </div>
          <div className="form-row">
            <label htmlFor={`message_template-${id}`}>Template da Mensagem</label>
            <textarea
              id={`message_template-${id}`}
              name="message_template"
              rows="4"
              className="nodrag"
              value={data.message_template || `🚨 ALERTA DE SEGURANÇA
📍 Local: {camera_name}
🎯 Tipo: {alert_type}
📊 Detalhes: {details}
⏰ Horário: {timestamp}
🔍 Confiança: {confidence}%
🆔 ID: {track_id}`}
              onChange={onUpdate}
            />
            <small>
              Variáveis: {'{camera_name}'}, {'{alert_type}'}, {'{details}'}, {'{timestamp}'}, {'{confidence}'}, {'{track_id}'}, {'{object_class}'}, {'{zone_name}'}
            </small>
          </div>
          <div className="form-row-checkbox">
            <input
              id={`include_image-${id}`}
              name="include_image"
              type="checkbox"
              className="nodrag"
              checked={data.include_image || true}
              onChange={onUpdate}
            />
            <label htmlFor={`include_image-${id}`}>Incluir Imagem/Snapshot</label>
          </div>
          <div className="form-row-checkbox">
            <input
              id={`include_video_clip-${id}`}
              name="include_video_clip"
              type="checkbox"
              className="nodrag"
              checked={data.include_video_clip || false}
              onChange={onUpdate}
            />
            <label htmlFor={`include_video_clip-${id}`}>Incluir Clipe de Vídeo (5s)</label>
          </div>
        </div>

        {/* Métricas em Tempo Real */}
        <div className="node-metrics">
          <div className="metric">
            <span className="metric-label">Notificações Enviadas:</span>
            <span className="metric-value">{data.notifications_sent || 0}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Taxa de Entrega:</span>
            <span className="metric-value">{data.delivery_rate || 100}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Última Notificação:</span>
            <span className="metric-value">{data.last_notification || 'Nunca'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Tempo Médio de Entrega:</span>
            <span className="metric-value">{data.avg_delivery_time || '< 1s'}</span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});