import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2 } from 'react-icons/fi';
import './CustomNode.css';

export default memo(({ data, id }) => {
  // Um mapa de títulos para manter a consistência
  const titles = {
    faceRecognition: 'Reconhecimento Facial',
    directionFilter: 'Filtro de Direção',
    loiteringDetection: 'Detecção de Vadiagem',
    dataSink: 'Salvar Evento'
  };

  return (
    <div className="custom-node">
      <div className="node-header" style={{backgroundColor: '#7f8c8d'}}>
        <div className="node-title">{titles[data.type] || data.label}</div>
        <button onClick={() => data.onDeleteNode(id)}><FiTrash2 /></button>
      </div>
      <div className="node-content">
        <p style={{textAlign: 'center', color: 'var(--text-secondary)', margin: 0, fontSize: '0.9em'}}>
            Este nó será configurado no futuro.
        </p>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});