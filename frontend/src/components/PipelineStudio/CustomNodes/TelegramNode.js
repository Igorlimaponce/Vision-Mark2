import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2, FiBell, FiSettings, FiZap, FiClock, FiShield } from 'react-icons/fi';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;
    data.onConfigChange(id, { [name]: finalValue });
  };

  const getStatusBadge = () => {
    if (data.bot_token && data.chat_id) {
      return <span className="status-badge status-active">✓ Configurado</span>;
    }
    return <span className="status-badge status-inactive">⚠ Configuração Incompleta</span>;
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
      <div className="node-header" style={{backgroundColor: '#c0392b'}}>
        <div className="node-title">
          <FiBell style={{ marginRight: '8px' }} />
          Notificação Telegram Avançada
          {getStatusBadge()}
        </div>
        <button onClick={() => data.onDeleteNode(id)}><FiTrash2 /></button>
      </div>
      <div className="node-content">
        {/* Configuração Principal */}
        <div className="form-section">
          <div className="section-header">
            <FiSettings /> Configuração Principal
          </div>
          <div className="form-row">
            <label htmlFor={`bot_token-${id}`}>Token do Bot</label>
            <input
              id={`bot_token-${id}`}
              name="bot_token"
              type="password"
              className="nodrag"
              placeholder="Seu token do BotFather"
              value={data.bot_token || ''}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row">
            <label htmlFor={`chat_id-${id}`}>Chat ID</label>
            <input
              id={`chat_id-${id}`}
              name="chat_id"
              type="text"
              className="nodrag"
              placeholder="ID do chat ou canal"
              value={data.chat_id || ''}
              onChange={onUpdate}
            />
          </div>
        </div>

        {/* Configurações de Alerta */}
        <div className="form-section">
          <div className="section-header">
            <FiZap /> Configurações de Alerta
          </div>
          <div className="form-row">
            <label htmlFor={`alert_priority-${id}`}>Prioridade do Alerta</label>
            <select
              id={`alert_priority-${id}`}
              name="alert_priority"
              className="nodrag"
              value={data.alert_priority || 'normal'}
              onChange={onUpdate}
              style={{ borderLeft: `4px solid ${getPriorityColor(data.alert_priority)}` }}
            >
              <option value="baixa">🟢 Baixa</option>
              <option value="normal">🟡 Normal</option>
              <option value="alta">🔴 Alta</option>
              <option value="critica">🟣 Crítica</option>
            </select>
          </div>
          <div className="form-row">
            <label htmlFor={`alert_types-${id}`}>Tipos de Alerta</label>
            <select
              id={`alert_types-${id}`}
              name="alert_types"
              className="nodrag"
              value={data.alert_types || 'all'}
              onChange={onUpdate}
            >
              <option value="all">Todos os Alertas</option>
              <option value="detection">🎯 Apenas Detecções</option>
              <option value="tracking">📍 Apenas Tracking</option>
              <option value="loitering">⏰ Apenas Loitering</option>
              <option value="zones">🔹 Apenas Zonas</option>
              <option value="trajectory">📊 Apenas Trajetória</option>
              <option value="wrong_direction">🔄 Apenas Direção Errada</option>
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
              value={data.min_confidence || 70}
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
            <label htmlFor={`cooldown_seconds-${id}`}>Cooldown entre Alertas (s)</label>
            <input
              id={`cooldown_seconds-${id}`}
              name="cooldown_seconds"
              type="number"
              min="0"
              max="3600"
              className="nodrag"
              value={data.cooldown_seconds || 60}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row">
            <label htmlFor={`max_alerts_per_hour-${id}`}>Máx. Alertas/Hora</label>
            <input
              id={`max_alerts_per_hour-${id}`}
              name="max_alerts_per_hour"
              type="number"
              min="1"
              max="100"
              className="nodrag"
              value={data.max_alerts_per_hour || 10}
              onChange={onUpdate}
            />
          </div>
          <div className="form-row-checkbox">
            <input
              id={`batch_alerts-${id}`}
              name="batch_alerts"
              type="checkbox"
              className="nodrag"
              checked={data.batch_alerts || false}
              onChange={onUpdate}
            />
            <label htmlFor={`batch_alerts-${id}`}>Agrupar Alertas Similares</label>
          </div>
        </div>

        {/* Formatação de Mensagem */}
        <div className="form-section">
          <div className="section-header">
            <FiShield /> Formatação de Mensagem
          </div>
          <div className="form-row">
            <label htmlFor={`message_template-${id}`}>Template da Mensagem</label>
            <textarea
              id={`message_template-${id}`}
              name="message_template"
              rows="4"
              className="nodrag"
              value={data.message_template || `🚨 ALERTA {priority}
📍 Câmera: {camera}
🎯 Tipo: {alert_type}
📊 Detalhes: {details}
⏰ Horário: {timestamp}
🔍 Confiança: {confidence}%`}
              onChange={onUpdate}
            />
            <small>
              Variáveis: {'{priority}'}, {'{camera}'}, {'{alert_type}'}, {'{details}'}, {'{timestamp}'}, {'{confidence}'}, {'{count}'}, {'{track_id}'}
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
            <label htmlFor={`include_image-${id}`}>Incluir Imagem do Alerta</label>
          </div>
          <div className="form-row-checkbox">
            <input
              id={`markdown_format-${id}`}
              name="markdown_format"
              type="checkbox"
              className="nodrag"
              checked={data.markdown_format || true}
              onChange={onUpdate}
            />
            <label htmlFor={`markdown_format-${id}`}>Usar Formatação Markdown</label>
          </div>
        </div>

        {/* Métricas em Tempo Real */}
        <div className="node-metrics">
          <div className="metric">
            <span className="metric-label">Alertas Enviados:</span>
            <span className="metric-value">{data.alerts_sent || 0}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Taxa de Sucesso:</span>
            <span className="metric-value">{data.success_rate || 100}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Último Alerta:</span>
            <span className="metric-value">{data.last_alert || 'Nunca'}</span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});