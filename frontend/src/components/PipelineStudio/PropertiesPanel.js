import React from 'react';
import { FiFolderPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import './PropertiesPanel.css';

const PropertiesPanel = ({
  pipelineName,
  setPipelineName,
  isPipelineActive,
  setIsPipelineActive,
  onSave,
  onDelete,
  onNew,
  pipelineList,
  currentPipelineId,
}) => {
  return (
    <aside className="properties-panel">
      <h3>Configurações Gerais</h3>
      <div className="form-group">
        <label htmlFor="pipeline-name">Nome do Pipeline</label>
        <input
          type="text"
          id="pipeline-name"
          className="properties-input"
          value={pipelineName}
          onChange={(e) => setPipelineName(e.target.value)}
          placeholder="Ex: Monitoramento Garagem"
        />
      </div>
      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          id="pipeline-active"
          className="properties-checkbox"
          checked={isPipelineActive}
          onChange={(e) => setIsPipelineActive(e.target.checked)}
        />
        <label htmlFor="pipeline-active">Pipeline Ativo</label>
      </div>

      <div className="panel-actions">
        <button className="btn btn-primary" onClick={onSave}>
          <FiSave /> Salvar
        </button>
        <button className="btn btn-secondary" onClick={onNew}>
          <FiFolderPlus /> Novo
        </button>
        {currentPipelineId && (
          <button className="btn btn-danger" onClick={onDelete}>
            <FiTrash2 /> Deletar
          </button>
        )}
      </div>

      {pipelineList && pipelineList.length > 0 && (
        <div className="pipeline-list-section">
          <h4>Pipelines Salvos</h4>
          <ul className="pipeline-list">
            {pipelineList.map((p) => (
              <li key={p.id} className={p.id === currentPipelineId ? 'active' : ''}>
                <NavLink to={`/pipelines/${p.id}`}>{p.name}</NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default PropertiesPanel;