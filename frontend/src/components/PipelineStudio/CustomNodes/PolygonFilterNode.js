import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiEdit, FiTrash2, FiMapPin, FiClock, FiActivity } from 'react-icons/fi';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;
    data.onConfigChange(id, { [name]: finalValue });
  };

  return (
    <div className="custom-node">
      <div className="node-header" style={{backgroundColor: '#f39c12'}}>
        <div className="node-title">
          <FiMapPin style={{ marginRight: '8px' }} />
          Filtro de Zona Avançado
        </div>
        <button onClick={() => data.onDeleteNode(id)}><FiTrash2 /></button>
      </div>
      <div className="node-content">
        <div className="form-section">
          <div className="section-header">
            <FiEdit style={{ marginRight: '6px' }} />
            <span>Definição da Zona</span>
          </div>
          
          <p style={{textAlign: 'center', color: 'var(--text-secondary)', margin: '0 0 10px 0'}}>
            {data.polygon && data.polygon.length > 0 ? `${data.polygon.length} pontos definidos` : 'Nenhuma área definida'}
          </p>
          <button className="node-config-button nodrag" onClick={() => data.onOpenVisualConfig(id)}>
            <FiEdit /> Configurar Área Visualmente
          </button>

          <div className="form-row">
            <label htmlFor={`zone-name-${id}`}>Nome da Zona</label>
            <input
              id={`zone-name-${id}`}
              name="zone_name"
              type="text"
              className="nodrag"
              value={data.zone_name || `Zona ${id.slice(-4)}`}
              onChange={onUpdate}
              placeholder="Ex: Entrada Principal"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <FiActivity style={{ marginRight: '6px' }} />
            <span>Detecção de Eventos</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`detect-entry-${id}`}
              name="detect_zone_entry"
              type="checkbox"
              className="nodrag"
              checked={data.detect_zone_entry !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-entry-${id}`}>Detectar Entrada na Zona</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`detect-exit-${id}`}
              name="detect_zone_exit"
              type="checkbox"
              className="nodrag"
              checked={data.detect_zone_exit !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-exit-${id}`}>Detectar Saída da Zona</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`detect-crossing-${id}`}
              name="detect_zone_crossing"
              type="checkbox"
              className="nodrag"
              checked={data.detect_zone_crossing !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`detect-crossing-${id}`}>Detectar Cruzamento da Zona</label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <FiClock style={{ marginRight: '6px' }} />
            <span>Análise de Permanência</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`enable-dwell-${id}`}
              name="enable_dwell_time_analysis"
              type="checkbox"
              className="nodrag"
              checked={data.enable_dwell_time_analysis !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-dwell-${id}`}>Análise de Tempo de Permanência</label>
          </div>

          <div className="form-row">
            <label htmlFor={`dwell-threshold-${id}`}>Limite de Permanência (segundos)</label>
            <input
              id={`dwell-threshold-${id}`}
              name="dwell_time_threshold"
              type="number"
              min="5"
              max="300"
              className="nodrag"
              value={data.dwell_time_threshold || 30}
              onChange={onUpdate}
            />
            <small>Tempo máximo permitido na zona</small>
          </div>

          <div className="form-row">
            <label htmlFor={`min-dwell-${id}`}>Permanência Mínima para Alerta (frames)</label>
            <input
              id={`min-dwell-${id}`}
              name="min_dwell_frames"
              type="number"
              min="5"
              max="100"
              className="nodrag"
              value={data.min_dwell_frames || 15}
              onChange={onUpdate}
            />
            <small>Mínimo de frames na zona para gerar evento</small>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <span>Configurações Avançadas</span>
          </div>
          
          <div className="form-row">
            <label htmlFor={`detection-point-${id}`}>Ponto de Referência</label>
            <select
              id={`detection-point-${id}`}
              name="detection_reference_point"
              className="nodrag"
              value={data.detection_reference_point || 'center_bottom'}
              onChange={onUpdate}
            >
              <option value="center">Centro</option>
              <option value="center_bottom">Centro da Base</option>
              <option value="bbox_center">Centro da Caixa</option>
              <option value="feet_position">Posição dos Pés</option>
            </select>
            <small>Que ponto da detecção usar para verificação</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`enable-density-${id}`}
              name="enable_zone_density_analysis"
              type="checkbox"
              className="nodrag"
              checked={data.enable_zone_density_analysis !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-density-${id}`}>Análise de Densidade da Zona</label>
          </div>

          <div className="form-row">
            <label htmlFor={`max-capacity-${id}`}>Capacidade Máxima da Zona</label>
            <input
              id={`max-capacity-${id}`}
              name="zone_max_capacity"
              type="number"
              min="1"
              max="100"
              className="nodrag"
              value={data.zone_max_capacity || 10}
              onChange={onUpdate}
            />
            <small>Número máximo de pessoas permitidas</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`enable-speed-${id}`}
              name="enable_speed_estimation_in_zone"
              type="checkbox"
              className="nodrag"
              checked={data.enable_speed_estimation_in_zone !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-speed-${id}`}>Estimativa de Velocidade na Zona</label>
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
            <label htmlFor={`enable-direction-${id}`}>Análise de Direção de Movimento</label>
          </div>
        </div>

        <div className="node-info">
          <div className="info-item">
            <span className="info-label">Zona:</span>
            <span className="info-value">{data.zone_name || `Zona ${id.slice(-4)}`}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Eventos:</span>
            <span className={`status-badge ${data.detect_zone_entry !== false || data.detect_zone_exit !== false ? 'active' : 'inactive'}`}>
              {data.detect_zone_entry !== false || data.detect_zone_exit !== false ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Permanência:</span>
            <span className="info-value">{data.dwell_time_threshold || 30}s</span>
          </div>
          <div className="info-item">
            <span className="info-label">Capacidade:</span>
            <span className="info-value">{data.zone_max_capacity || 10} pessoas</span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});