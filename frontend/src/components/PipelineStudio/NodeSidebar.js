import React from 'react';
import { 
  FiVideo, FiBox, FiUserCheck, FiEdit, FiChevronsRight, FiBell, FiSave, 
  FiWatch, FiMessageSquare, FiMail, FiTrendingUp, FiCpu, FiUserPlus,
  FiFilter, FiNavigation, FiClock, FiMapPin 
} from 'react-icons/fi';
import './NodeSidebar.css';

const nodes = [
  {
    category: 'Entrada',
    items: [
      { type: 'videoInput', label: 'Entrada de Vídeo', icon: <FiVideo />, color: 'input' }
    ]
  },
  {
    category: 'Detecção e Tracking',
    items: [
      { type: 'objectDetection', label: 'Detecção de Objetos', icon: <FiBox />, color: 'processing' },
    ]
  },
  {
    category: 'Filtros Espaciais',
    items: [
      { type: 'polygonFilter', label: 'Filtro de Área', icon: <FiMapPin />, color: 'filter' },
      { type: 'directionFilter', label: 'Filtro de Direção', icon: <FiNavigation />, color: 'filter' },
    ]
  },
  {
    category: 'Análise Comportamental',
    items: [
      { type: 'trajectoryAnalysis', label: 'Análise de Trajetória', icon: <FiTrendingUp />, color: 'analysis' },
      { type: 'loiteringDetection', label: 'Detecção de Vadiagem', icon: <FiClock />, color: 'analysis' },
    ]
  },
  {
    category: 'Reconhecimento Facial',
    items: [
      { type: 'faceDetector', label: 'Detector de Faces', icon: <FiCpu />, color: 'facial' },
      { type: 'faceEmbedding', label: 'Extrator de Features', icon: <FiUserPlus />, color: 'facial' },
      { type: 'faceMatcher', label: 'Comparador de Faces', icon: <FiUserCheck />, color: 'facial' },
    ]
  },
  {
    category: 'Ações',
    items: [
      { type: 'telegram', label: 'Enviar Telegram', icon: <FiBell />, color: 'action' },
      { type: 'email', label: 'Enviar Email', icon: <FiMail />, color: 'action' },
      { type: 'whatsapp', label: 'Enviar WhatsApp', icon: <FiMessageSquare />, color: 'action' },
      { type: 'dataSink', label: 'Salvar Evento', icon: <FiSave />, color: 'action' }
    ]
  }
];

const NodeSidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="node-sidebar">
      <h3>Nós do Pipeline</h3>
      <p className="description">Arraste os nós para a área de trabalho para construir seu pipeline de visão.</p>
      
      {nodes.map(category => (
        <div className="node-category" key={category.category}>
          <h4>{category.category}</h4>
          {category.items.map(node => (
            <div
              key={node.type}
              className={`node-item ${node.color}`}
              onDragStart={(event) => onDragStart(event, node.type)}
              draggable
            >
              {node.icon}
              <span>{node.label}</span>
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
};

export default NodeSidebar;