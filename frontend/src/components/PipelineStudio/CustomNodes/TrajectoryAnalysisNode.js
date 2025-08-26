import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2, FiTrendingUp, FiNavigation, FiActivity, FiTarget } from 'react-icons/fi';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;
    data.onConfigChange(id, { [name]: finalValue });
  };

  return (
    <div className="custom-node">
      <div className="node-header" style={{backgroundColor: '#e74c3c'}}>
        <div className="node-title">
          <FiTrendingUp style={{ marginRight: '8px' }} />
          Análise de Trajetória Avançada
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
            <label htmlFor={`min-length-${id}`}>Tamanho Mín. Trajetória</label>
            <input
              id={`min-length-${id}`}
              name="min_trajectory_length"
              type="number"
              min="3"
              max="50"
              className="nodrag"
              value={data.min_trajectory_length || 10}
              onChange={onUpdate}
            />
            <small>Mínimo de pontos para análise válida</small>
          </div>
          
          <div className="form-row">
            <label htmlFor={`max-length-${id}`}>Tamanho Máx. Histórico</label>
            <input
              id={`max-length-${id}`}
              name="max_trajectory_history"
              type="number"
              min="10"
              max="200"
              className="nodrag"
              value={data.max_trajectory_history || 50}
              onChange={onUpdate}
            />
            <small>Quantos pontos manter no histórico</small>
          </div>

          <div className="form-row">
            <label htmlFor={`smoothing-${id}`}>Suavização da Trajetória ({data.trajectory_smoothing || 0.3})</label>
            <input
              id={`smoothing-${id}`}
              name="trajectory_smoothing"
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              className="nodrag"
              value={data.trajectory_smoothing || 0.3}
              onChange={onUpdate}
            />
            <small>Filtro para reduzir ruído na trajetória</small>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <FiNavigation style={{ marginRight: '6px' }} />
            <span>Análise de Velocidade</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`enable-speed-${id}`}
              name="enable_speed_analysis"
              type="checkbox"
              className="nodrag"
              checked={data.enable_speed_analysis !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-speed-${id}`}>Análise de Velocidade</label>
          </div>

          <div className="form-row">
            <label htmlFor={`speed-threshold-${id}`}>Limite Velocidade Anormal</label>
            <input
              id={`speed-threshold-${id}`}
              name="abnormal_speed_threshold"
              type="number"
              min="10"
              max="200"
              step="5"
              className="nodrag"
              value={data.abnormal_speed_threshold || 50}
              onChange={onUpdate}
            />
            <small>pixels/segundo - acima disso é considerado anormal</small>
          </div>

          <div className="form-row">
            <label htmlFor={`speed-window-${id}`}>Janela de Cálculo de Velocidade</label>
            <input
              id={`speed-window-${id}`}
              name="speed_calculation_window"
              type="number"
              min="3"
              max="20"
              className="nodrag"
              value={data.speed_calculation_window || 5}
              onChange={onUpdate}
            />
            <small>Quantos pontos usar para calcular velocidade</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`detect-sudden-stops-${id}`}
              name="detect_sudden_stops"
              type="checkbox"
              className="nodrag"
              checked={data.detect_sudden_stops !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-sudden-stops-${id}`}>Detectar Paradas Súbitas</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`detect-acceleration-${id}`}
              name="detect_rapid_acceleration"
              type="checkbox"
              className="nodrag"
              checked={data.detect_rapid_acceleration !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-acceleration-${id}`}>Detectar Aceleração Rápida</label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <FiActivity style={{ marginRight: '6px' }} />
            <span>Análise de Direção e Padrões</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`enable-direction-${id}`}
              name="enable_direction_analysis"
              type="checkbox"
              className="nodrag"
              checked={data.enable_direction_analysis !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-direction-${id}`}>Análise de Direção</label>
          </div>

          <div className="form-row">
            <label htmlFor={`direction-change-${id}`}>Limite Mudança de Direção (graus)</label>
            <input
              id={`direction-change-${id}`}
              name="significant_direction_change"
              type="number"
              min="15"
              max="180"
              step="15"
              className="nodrag"
              value={data.significant_direction_change || 45}
              onChange={onUpdate}
            />
            <small>Ângulo mínimo para considerar mudança significativa</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`detect-zigzag-${id}`}
              name="detect_zigzag_pattern"
              type="checkbox"
              className="nodrag"
              checked={data.detect_zigzag_pattern !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-zigzag-${id}`}>Detectar Padrão Zigue-Zague</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`detect-circular-${id}`}
              name="detect_circular_movement"
              type="checkbox"
              className="nodrag"
              checked={data.detect_circular_movement !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-circular-${id}`}>Detectar Movimento Circular</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`detect-backtrack-${id}`}
              name="detect_backtracking"
              type="checkbox"
              className="nodrag"
              checked={data.detect_backtracking !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-backtrack-${id}`}>Detectar Retrocesso</label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <span>Análise Geométrica</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`calculate-sinuosity-${id}`}
              name="calculate_sinuosity"
              type="checkbox"
              className="nodrag"
              checked={data.calculate_sinuosity !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`calculate-sinuosity-${id}`}>Calcular Índice de Sinuosidade</label>
          </div>

          <div className="form-row">
            <label htmlFor={`sinuosity-threshold-${id}`}>Limite Sinuosidade Anormal ({data.abnormal_sinuosity_threshold || 2.0})</label>
            <input
              id={`sinuosity-threshold-${id}`}
              name="abnormal_sinuosity_threshold"
              type="range"
              min="1.2"
              max="5.0"
              step="0.1"
              className="nodrag"
              value={data.abnormal_sinuosity_threshold || 2.0}
              onChange={onUpdate}
            />
            <small>1.0 = linha reta, {'>'}2.0 = trajetória muito sinuosa</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`analyze-curvature-${id}`}
              name="analyze_trajectory_curvature"
              type="checkbox"
              className="nodrag"
              checked={data.analyze_trajectory_curvature !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`analyze-curvature-${id}`}>Análise de Curvatura</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`calculate-area-${id}`}
              name="calculate_covered_area"
              type="checkbox"
              className="nodrag"
              checked={data.calculate_covered_area !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`calculate-area-${id}`}>Calcular Área Coberta</label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <span>Alertas e Eventos</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`enable-alerts-${id}`}
              name="enable_trajectory_alerts"
              type="checkbox"
              className="nodrag"
              checked={data.enable_trajectory_alerts !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-alerts-${id}`}>Gerar Alertas de Trajetória Anormal</label>
          </div>

          <div className="form-row">
            <label htmlFor={`alert-confidence-${id}`}>Confiança Mínima para Alerta ({data.alert_confidence_threshold || 0.7})</label>
            <input
              id={`alert-confidence-${id}`}
              name="alert_confidence_threshold"
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              className="nodrag"
              value={data.alert_confidence_threshold || 0.7}
              onChange={onUpdate}
            />
          </div>

          <div className="form-row-checkbox">
            <input
              id={`export-trajectories-${id}`}
              name="export_trajectory_data"
              type="checkbox"
              className="nodrag"
              checked={data.export_trajectory_data !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`export-trajectories-${id}`}>Exportar Dados de Trajetória</label>
          </div>
        </div>

        <div className="node-info">
          <div className="info-item">
            <span className="info-label">Análise:</span>
            <span className={`status-badge ${data.enable_speed_analysis !== false || data.enable_direction_analysis !== false ? 'active' : 'inactive'}`}>
              {data.enable_speed_analysis !== false || data.enable_direction_analysis !== false ? 'Avançada' : 'Básica'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Trajetória Min:</span>
            <span className="info-value">{data.min_trajectory_length || 10} pontos</span>
          </div>
          <div className="info-item">
            <span className="info-label">Vel. Anormal:</span>
            <span className="info-value">{'>'}{data.abnormal_speed_threshold || 50} px/s</span>
          </div>
          <div className="info-item">
            <span className="info-label">Alertas:</span>
            <span className={`status-badge ${data.enable_trajectory_alerts !== false ? 'active' : 'inactive'}`}>
              {data.enable_trajectory_alerts !== false ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
