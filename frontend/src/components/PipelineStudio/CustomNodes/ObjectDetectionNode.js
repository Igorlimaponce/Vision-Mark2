import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2, FiEye, FiSettings } from 'react-icons/fi';
import { OBJECT_CLASSES } from '../../../constants';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;
    data.onConfigChange(id, { [name]: finalValue });
  };

  const onSelectClasses = (evt) => {
    const selectedOptions = Array.from(evt.target.selectedOptions, option => option.value);
    data.onConfigChange(id, { classes: selectedOptions });
  };

  return (
    <div className="custom-node">
      <div className="node-header" style={{backgroundColor: '#2980b9'}}>
        <div className="node-title">
          <FiEye style={{ marginRight: '8px' }} />
          Detecção de Objetos
        </div>
        <button onClick={() => data.onDeleteNode(id)}><FiTrash2 /></button>
      </div>
      <div className="node-content">
        <div className="form-row">
          <label htmlFor={`classes-${id}`}>Classes a detectar</label>
          <select
            id={`classes-${id}`}
            name="classes"
            multiple
            className="nodrag"
            value={data.classes || []}
            onChange={onSelectClasses}
            style={{ height: '100px' }}
          >
            {OBJECT_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        
        <div className="form-row">
          <label htmlFor={`confidence-${id}`}>Confiança Mínima ({data.confidence || 0.5})</label>
          <input
            id={`confidence-${id}`}
            name="confidence"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            className="nodrag"
            value={data.confidence || 0.5}
            onChange={onUpdate}
          />
        </div>

        <div className="form-row">
          <label htmlFor={`model-${id}`}>Modelo YOLO</label>
          <select
            id={`model-${id}`}
            name="model_filename"
            className="nodrag"
            value={data.model_filename || 'yolov8n.pt'}
            onChange={onUpdate}
          >
            <option value="yolov8n.pt">YOLOv8 Nano (Rápido)</option>
            <option value="yolov8s.pt">YOLOv8 Small (Balanceado)</option>
            <option value="yolov8m.pt">YOLOv8 Medium (Preciso)</option>
            <option value="yolov8l.pt">YOLOv8 Large (Muito Preciso)</option>
            <option value="yolov8x.pt">YOLOv8 XLarge (Máxima Precisão)</option>
          </select>
        </div>

        <div className="form-section">
          <div className="section-header">
            <FiSettings style={{ marginRight: '6px' }} />
            <span>Configurações Avançadas</span>
          </div>
          
          <div className="form-row-checkbox">
            <input
              id={`enable-tracking-${id}`}
              name="enable_tracking"
              type="checkbox"
              className="nodrag"
              checked={data.enable_tracking !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-tracking-${id}`}>Habilitar Rastreamento (DeepSORT)</label>
          </div>

          <div className="form-row">
            <label htmlFor={`min-track-${id}`}>Comprimento Mínimo da Trajetória</label>
            <input
              id={`min-track-${id}`}
              name="min_track_length"
              type="number"
              min="3"
              max="100"
              className="nodrag"
              value={data.min_track_length || 10}
              onChange={onUpdate}
            />
            <small>Mínimo de pontos para análise de trajetória</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`enable-reid-${id}`}
              name="enable_re_identification"
              type="checkbox"
              className="nodrag"
              checked={data.enable_re_identification !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable-reid-${id}`}>Re-identificação por Aparência</label>
          </div>

          <div className="form-row">
            <label htmlFor={`max-disappeared-${id}`}>Máximo Frames Desaparecido</label>
            <input
              id={`max-disappeared-${id}`}
              name="max_disappeared"
              type="number"
              min="10"
              max="100"
              className="nodrag"
              value={data.max_disappeared || 30}
              onChange={onUpdate}
            />
            <small>Quantos frames manter ID após desaparecer</small>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`trajectory-analysis-${id}`}
              name="enable_trajectory_analysis"
              type="checkbox"
              className="nodrag"
              checked={data.enable_trajectory_analysis !== false}
              onChange={onUpdate}
            />
            <label htmlFor={`trajectory-analysis-${id}`}>Análise de Trajetória Avançada</label>
          </div>
        </div>

        <div className="node-info">
          <div className="info-item">
            <span className="info-label">Tracking:</span>
            <span className={`status-badge ${data.enable_tracking !== false ? 'active' : 'inactive'}`}>
              {data.enable_tracking !== false ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Modelo:</span>
            <span className="info-value">{data.model_filename || 'yolov8n.pt'}</span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});