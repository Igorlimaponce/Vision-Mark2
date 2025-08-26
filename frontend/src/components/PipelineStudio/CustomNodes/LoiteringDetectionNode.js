import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2, FiClock, FiUsers, FiTarget } from 'react-icons/fi';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;
    data.onConfigChange(id, { [name]: finalValue });
  };

  return (
    <div className="custom-node">
      <div className="node-header analysis">
        <div className="node-title">
          <FiClock style={{ marginRight: '8px' }} />
          Detecção de Vadiagem Avançada
        </div>
        <button onClick={() => data.onDeleteNode(id)}><FiTrash2 /></button>
      </div>
      <div className="node-content">
        <div className="form-section">
          <div className="section-header">
            <FiTarget style={{ marginRight: '6px' }} />
            <span>Configurações Básicas</span>
          </div>
          
          <div className="form-row">
            <label htmlFor={`time-threshold-${id}`}>Tempo Limite (segundos)</label>
            <input
              id={`time-threshold-${id}`}
              name="time_threshold"
              type="number"
              min="5"
              max="300"
              className="nodrag"
              value={data.time_threshold || 10}
              onChange={onUpdate}
            />
            <small>Tempo que objeto deve permanecer parado</small>
          </div>
          
          <div className="form-row">
            <label htmlFor={`movement-threshold-${id}`}>Limite de Movimento (pixels)</label>
            <input
              id={`movement-threshold-${id}`}
              name="movement_threshold"
              type="number"
              min="5"
              max="100"
              className="nodrag"
              value={data.movement_threshold || 25}
              onChange={onUpdate}
            />
            <small>Distância máxima para considerar "parado"</small>
          </div>
          
          <div className="form-row">
            <label htmlFor={`alert-level-${id}`}>Nível de Alerta</label>
            <select
              id={`alert-level-${id}`}
              name="alert_level"
              className="nodrag"
              value={data.alert_level || 'medium'}
              onChange={onUpdate}
            >
              <option value="low">Baixo</option>
              <option value="medium">Médio</option>
              <option value="high">Alto</option>
              <option value="critical">Crítico</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <FiUsers style={{ marginRight: '6px' }} />
            <span>DeepSORT & Re-identificação</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`enable-tracking-${id}`}
              name="enable_advanced_tracking"
              type="checkbox"
              className="nodrag"
              checked={data.enable_advanced_tracking !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-tracking-${id}`}>Usar DeepSORT (ReID Avançada)</label>
          </div>

          <div className="form-row">
            <label htmlFor={`min-hits-${id}`}>Mínimo de Detecções para Confirmar</label>
            <input
              id={`min-hits-${id}`}
              name="min_hits"
              type="number"
              min="1"
              max="10"
              className="nodrag"
              value={data.min_hits || 3}
              onChange={onUpdate}
            />
            <small>Quantas detecções antes de confirmar track</small>
          </div>

          <div className="form-row">
            <label htmlFor={`max-age-${id}`}>Máximo de Frames sem Detecção</label>
            <input
              id={`max-age-${id}`}
              name="max_age"
              type="number"
              min="10"
              max="200"
              className="nodrag"
              value={data.max_age || 50}
              onChange={onUpdate}
            />
            <small>Quantos frames manter track vivo</small>
          </div>

          <div className="form-row">
            <label htmlFor={`iou-threshold-${id}`}>Threshold IoU ({data.iou_threshold || 0.3})</label>
            <input
              id={`iou-threshold-${id}`}
              name="iou_threshold"
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              className="nodrag"
              value={data.iou_threshold || 0.3}
              onChange={onUpdate}
            />
            <small>Sobreposição mínima para matching</small>
          </div>

          <div className="form-row">
            <label htmlFor={`feature-threshold-${id}`}>Threshold Features ({data.feature_threshold || 0.6})</label>
            <input
              id={`feature-threshold-${id}`}
              name="feature_threshold"
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              className="nodrag"
              value={data.feature_threshold || 0.6}
              onChange={onUpdate}
            />
            <small>Similaridade mínima de aparência</small>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <span>Análise de Movimento</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`analyze-patterns-${id}`}
              name="analyze_movement_patterns"
              type="checkbox"
              className="nodrag"
              checked={data.analyze_movement_patterns !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`analyze-patterns-${id}`}>Analisar Padrões de Movimento</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`speed-estimation-${id}`}
              name="enable_speed_estimation"
              type="checkbox"
              className="nodrag"
              checked={data.enable_speed_estimation !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`speed-estimation-${id}`}>Estimativa de Velocidade</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`direction-tracking-${id}`}
              name="enable_direction_tracking"
              type="checkbox"
              className="nodrag"
              checked={data.enable_direction_tracking !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`direction-tracking-${id}`}>Rastreamento de Direção</label>
          </div>

          <div className="form-row">
            <label htmlFor={`trajectory-length-${id}`}>Histórico de Trajetória</label>
            <input
              id={`trajectory-length-${id}`}
              name="trajectory_history_length"
              type="number"
              min="10"
              max="100"
              className="nodrag"
              value={data.trajectory_history_length || 30}
              onChange={onUpdate}
            />
            <small>Quantos pontos manter no histórico</small>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <span>Configurações de Alerta</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`detailed-alerts-${id}`}
              name="enable_detailed_alerts"
              type="checkbox"
              className="nodrag"
              checked={data.enable_detailed_alerts !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detailed-alerts-${id}`}>Alertas Detalhados com Métricas</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`confidence-scoring-${id}`}
              name="enable_confidence_scoring"
              type="checkbox"
              className="nodrag"
              checked={data.enable_confidence_scoring !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`confidence-scoring-${id}`}>Pontuação de Confiança do Loitering</label>
          </div>
        </div>

        <div className="node-info">
          <div className="info-item">
            <span className="info-label">Tracking Avançado:</span>
            <span className={`status-badge ${data.enable_advanced_tracking !== false ? 'active' : 'inactive'}`}>
              {data.enable_advanced_tracking !== false ? 'DeepSORT' : 'Básico'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Tempo Limite:</span>
            <span className="info-value">{data.time_threshold || 10}s</span>
          </div>
          <div className="info-item">
            <span className="info-label">Nível:</span>
            <span className={`alert-level ${data.alert_level || 'medium'}`}>
              {(data.alert_level || 'medium').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
