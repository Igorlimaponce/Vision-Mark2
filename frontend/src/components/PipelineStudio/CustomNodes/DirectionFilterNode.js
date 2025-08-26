import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2, FiNavigation, FiEdit, FiSettings, FiActivity, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;
    data.onConfigChange(id, { [name]: finalValue });
  };

  const getStatusBadge = () => {
    if (data.line && data.line.length > 0) {
      return <span className="status-badge status-active">✓ Linha Configurada</span>;
    }
    return <span className="status-badge status-inactive">⚠ Linha Não Definida</span>;
  };

  const getDirectionIcon = (angle) => {
    if (angle >= -22.5 && angle < 22.5) return '➡️'; // Direita
    if (angle >= 22.5 && angle < 67.5) return '↗️'; // Nordeste
    if (angle >= 67.5 && angle < 112.5) return '⬆️'; // Cima
    if (angle >= 112.5 && angle < 157.5) return '↖️'; // Noroeste
    if (angle >= 157.5 || angle < -157.5) return '⬅️'; // Esquerda
    if (angle >= -157.5 && angle < -112.5) return '↙️'; // Sudoeste
    if (angle >= -112.5 && angle < -67.5) return '⬇️'; // Baixo
    if (angle >= -67.5 && angle < -22.5) return '↘️'; // Sudeste
    return '🧭';
  };

  const calculateAngle = () => {
    if (data.direction_x !== undefined && data.direction_y !== undefined) {
      return Math.atan2(data.direction_y, data.direction_x) * (180 / Math.PI);
    }
    return 0;
  };

  const currentAngle = calculateAngle();

  return (
    <div className="custom-node">
      <div className="node-header filter">
        <div className="node-title">
          <FiNavigation style={{ marginRight: '8px' }} />
          Análise de Direção Avançada
          {getStatusBadge()}
        </div>
        <button onClick={() => data.onDeleteNode(id)}><FiTrash2 /></button>
      </div>
      <div className="node-content">
        {/* Configuração de Direção Alvo */}
        <div className="form-section">
          <div className="section-header">
            <FiNavigation /> Direção Alvo {getDirectionIcon(currentAngle)}
          </div>
          <div className="form-row">
            <label htmlFor={`direction-x-${id}`}>Componente X</label>
            <input
              id={`direction-x-${id}`}
              name="direction_x"
              type="number"
              min="-1"
              max="1"
              step="0.1"
              className="nodrag"
              value={data.direction_x || 1}
              onChange={onUpdate}
            />
          </div>
          
          <div className="form-row">
            <label htmlFor={`direction-y-${id}`}>Componente Y</label>
            <input
              id={`direction-y-${id}`}
              name="direction_y"
              type="number"
              min="-1"
              max="1"
              step="0.1"
              className="nodrag"
              value={data.direction_y || 0}
              onChange={onUpdate}
            />
          </div>
          
          <div className="form-row">
            <label htmlFor={`direction_angle-${id}`}>Ângulo Calculado</label>
            <input
              id={`direction_angle-${id}`}
              type="text"
              className="nodrag"
              value={`${currentAngle.toFixed(1)}° ${getDirectionIcon(currentAngle)}`}
              readOnly
              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            />
          </div>
          
          <div className="form-row">
            <label htmlFor={`tolerance-${id}`}>Tolerância Angular (°)</label>
            <input
              id={`tolerance-${id}`}
              name="tolerance"
              type="number"
              min="10"
              max="180"
              step="5"
              className="nodrag"
              value={data.tolerance || 45}
              onChange={onUpdate}
            />
            <small>Ângulo máximo de desvio da direção alvo</small>
          </div>
          
          <p style={{textAlign: 'center', color: 'var(--text-secondary)', margin: '10px 0'}}>
            {data.line && data.line.length > 0 ? 
              `Linha configurada com ${data.line.length} pontos` : 
              'Configure a linha visualmente'}
          </p>
          <button className="node-config-button nodrag" onClick={() => data.onOpenVisualConfig(id)}>
            <FiEdit /> Configurar Linha Visualmente
          </button>
        </div>

        {/* Detecção de Direção Incorreta */}
        <div className="form-section">
          <div className="section-header">
            <FiAlertTriangle style={{ marginRight: '6px' }} />
            <span>Detecção de Direção Incorreta</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`detect-wrong-direction-${id}`}
              name="detect_wrong_direction"
              type="checkbox"
              className="nodrag"
              checked={data.detect_wrong_direction !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-wrong-direction-${id}`}>Detectar Direção Incorreta</label>
          </div>

          <div className="form-row">
            <label htmlFor={`wrong-direction-threshold-${id}`}>Limite Direção Incorreta (°)</label>
            <input
              id={`wrong-direction-threshold-${id}`}
              name="wrong_direction_threshold"
              type="number"
              min="90"
              max="180"
              step="15"
              className="nodrag"
              value={data.wrong_direction_threshold || 120}
              onChange={onUpdate}
            />
            <small>Ângulo mínimo para considerar direção errada</small>
          </div>

          <div className="form-row">
            <label htmlFor={`min-speed-detection-${id}`}>Velocidade Mínima para Detecção</label>
            <input
              id={`min-speed-detection-${id}`}
              name="min_speed_for_detection"
              type="number"
              min="5"
              max="50"
              className="nodrag"
              value={data.min_speed_for_detection || 10}
              onChange={onUpdate}
            />
            <small>pixels/segundo - evita alertas para objetos parados</small>
          </div>

          <div className="form-row">
            <label htmlFor={`confidence-frames-${id}`}>Frames para Confirmação</label>
            <input
              id={`confidence-frames-${id}`}
              name="confirmation_frames"
              type="number"
              min="3"
              max="30"
              className="nodrag"
              value={data.confirmation_frames || 5}
              onChange={onUpdate}
            />
            <small>Quantos frames consecutivos confirmar direção</small>
          </div>
        </div>

        {/* Análise de Velocidade */}
        <div className="form-section">
          <div className="section-header">
            <FiTrendingUp style={{ marginRight: '6px' }} />
            <span>Análise de Velocidade</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`enable-speed-analysis-${id}`}
              name="enable_speed_analysis"
              type="checkbox"
              className="nodrag"
              checked={data.enable_speed_analysis !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-speed-analysis-${id}`}>Análise de Velocidade</label>
          </div>

          <div className="form-row">
            <label htmlFor={`max-allowed-speed-${id}`}>Velocidade Máxima Permitida</label>
            <input
              id={`max-allowed-speed-${id}`}
              name="max_allowed_speed"
              type="number"
              min="10"
              max="200"
              className="nodrag"
              value={data.max_allowed_speed || 80}
              onChange={onUpdate}
            />
            <small>pixels/segundo - gera alerta se exceder</small>
          </div>

          <div className="form-row">
            <label htmlFor={`speed-window-${id}`}>Janela de Cálculo</label>
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
        </div>

        {/* Configurações Avançadas */}
        <div className="form-section">
          <div className="section-header">
            <FiSettings style={{ marginRight: '6px' }} />
            <span>Configurações Avançadas</span>
          </div>
          
          <div className="form-row">
            <label htmlFor={`trajectory-smoothing-${id}`}>Suavização Trajetória ({data.trajectory_smoothing || 0.3})</label>
            <input
              id={`trajectory-smoothing-${id}`}
              name="trajectory_smoothing"
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              className="nodrag"
              value={data.trajectory_smoothing || 0.3}
              onChange={onUpdate}
            />
            <small>Filtro para reduzir ruído na direção</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`track-direction-changes-${id}`}
              name="track_direction_changes"
              type="checkbox"
              className="nodrag"
              checked={data.track_direction_changes !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`track-direction-changes-${id}`}>Rastrear Mudanças de Direção</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`generate-direction-stats-${id}`}
              name="generate_direction_statistics"
              type="checkbox"
              className="nodrag"
              checked={data.generate_direction_statistics !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`generate-direction-stats-${id}`}>Gerar Estatísticas de Direção</label>
          </div>

          <div className="form-row">
            <label htmlFor={`alert-cooldown-${id}`}>Cooldown de Alertas (segundos)</label>
            <input
              id={`alert-cooldown-${id}`}
              name="alert_cooldown_seconds"
              type="number"
              min="5"
              max="300"
              className="nodrag"
              value={data.alert_cooldown_seconds || 30}
              onChange={onUpdate}
            />
            <small>Tempo mínimo entre alertas do mesmo objeto</small>
          </div>
        </div>

        {/* Zonas de Aplicação */}
        <div className="form-section">
          <div className="section-header">
            <FiActivity style={{ marginRight: '6px' }} />
            <span>Zonas de Aplicação</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`apply-to-zones-only-${id}`}
              name="apply_to_specific_zones_only"
              type="checkbox"
              className="nodrag"
              checked={data.apply_to_specific_zones_only || false}
              onChange={onUpdate}
            />
            <label htmlFor={`apply-to-zones-only-${id}`}>Aplicar Apenas em Zonas Específicas</label>
          </div>

          <div className="form-row">
            <label htmlFor={`zone-names-${id}`}>Nomes das Zonas</label>
            <input
              id={`zone-names-${id}`}
              name="specific_zone_names"
              type="text"
              className="nodrag"
              placeholder="zona1,zona2,zona3"
              value={data.specific_zone_names || ''}
              onChange={onUpdate}
            />
            <small>Separado por vírgulas (deixe vazio para todas)</small>
          </div>
        </div>

        {/* Informações do Estado */}
        <div className="node-info">
          <div className="info-item">
            <span className="info-label">Direção Alvo:</span>
            <span className="info-value">{currentAngle.toFixed(1)}° {getDirectionIcon(currentAngle)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Tolerância:</span>
            <span className="info-value">±{data.tolerance || 45}°</span>
          </div>
          <div className="info-item">
            <span className="info-label">Detecção Incorreta:</span>
            <span className={`status-badge ${data.detect_wrong_direction !== false ? 'active' : 'inactive'}`}>
              {data.detect_wrong_direction !== false ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Velocidade Máx:</span>
            <span className="info-value">{data.max_allowed_speed || 80} px/s</span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
