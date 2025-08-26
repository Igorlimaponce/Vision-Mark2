import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiSave, 
  FiBarChart, 
  FiPieChart, 
  FiTrendingUp, 
  FiActivity,
  FiGrid,
  FiDatabase,
  FiTarget,
  FiFilter,
  FiLayers,
  FiEye
} from 'react-icons/fi';
import './WidgetBuilder.css';

const WidgetBuilder = ({ 
  isOpen, 
  onClose, 
  onSave, 
  pipelines, 
  metricsData, 
  editingWidget 
}) => {
  const [widgetConfig, setWidgetConfig] = useState({
    title: '',
    type: 'metric_card',
    dataSource: 'all_pipelines',
    pipelineId: '',
    metric: 'current_fps',
    config: {
      refreshInterval: 5000,
      timeRange: 'last_hour',
      showLegend: true,
      theme: 'default',
      aggregation: 'sum'
    }
  });

  const [previewData, setPreviewData] = useState([]);
  const [selectedNodeTypes, setSelectedNodeTypes] = useState([]);

  useEffect(() => {
    if (editingWidget) {
      setWidgetConfig({
        title: editingWidget.title,
        type: editingWidget.type,
        dataSource: editingWidget.config.dataSource || 'all_pipelines',
        pipelineId: editingWidget.config.pipelineId || '',
        metric: editingWidget.config.metric || 'current_fps',
        config: {
          ...editingWidget.config,
          refreshInterval: editingWidget.config.refreshInterval || 5000,
          timeRange: editingWidget.config.timeRange || 'last_hour',
          showLegend: editingWidget.config.showLegend !== false,
          theme: editingWidget.config.theme || 'default',
          aggregation: editingWidget.config.aggregation || 'sum'
        }
      });
      setSelectedNodeTypes(editingWidget.config.nodeTypes || []);
    }
  }, [editingWidget]);

  useEffect(() => {
    generatePreviewData();
  }, [widgetConfig, metricsData, selectedNodeTypes]);

  const widgetTypes = [
    {
      id: 'metric_card',
      name: 'Cartão de Métrica',
      icon: <FiTarget />,
      description: 'Exibe uma única métrica com valor e tendência'
    },
    {
      id: 'line_chart',
      name: 'Gráfico de Linha',
      icon: <FiTrendingUp />,
      description: 'Mostra tendências ao longo do tempo'
    },
    {
      id: 'bar_chart',
      name: 'Gráfico de Barras',
      icon: <FiBarChart />,
      description: 'Compara valores entre diferentes categorias'
    },
    {
      id: 'pie_chart',
      name: 'Gráfico de Pizza',
      icon: <FiPieChart />,
      description: 'Mostra proporções de um total'
    },
    {
      id: 'doughnut_chart',
      name: 'Gráfico de Rosca',
      icon: <FiActivity />,
      description: 'Variação do gráfico de pizza com centro vazio'
    },
    {
      id: 'table',
      name: 'Tabela de Dados',
      icon: <FiGrid />,
      description: 'Lista detalhada com ordenação e filtros'
    }
  ];

  const metricsOptions = [
    { value: 'current_fps', label: 'FPS Atual', category: 'performance' },
    { value: 'total_detections', label: 'Total de Detecções', category: 'detections' },
    { value: 'avg_cpu', label: 'CPU Médio (%)', category: 'performance' },
    { value: 'total_alerts', label: 'Total de Alertas', category: 'alerts' },
    { value: 'uptime', label: 'Tempo Ativo (h)', category: 'status' },
    { value: 'vehicles_detected', label: 'Veículos Detectados', category: 'detections' },
    { value: 'people_detected', label: 'Pessoas Detectadas', category: 'detections' },
    { value: 'loitering_events', label: 'Eventos de Vadiagem', category: 'events' },
    { value: 'direction_violations', label: 'Violações de Direção', category: 'events' },
    { value: 'zone_entries', label: 'Entradas em Zona', category: 'zones' },
    { value: 'zone_exits', label: 'Saídas de Zona', category: 'zones' },
    { value: 'trajectory_anomalies', label: 'Anomalias de Trajetória', category: 'analysis' }
  ];

  const nodeTypes = [
    { id: 'videoInput', name: 'Entrada de Vídeo', icon: <FiEye />, metrics: ['current_fps', 'signal_quality', 'dropped_frames'] },
    { id: 'objectDetection', name: 'Detecção de Objetos', icon: <FiTarget />, metrics: ['total_detections', 'vehicles_detected', 'people_detected'] },
    { id: 'polygonFilter', name: 'Filtro de Polígono', icon: <FiFilter />, metrics: ['zone_entries', 'zone_exits'] },
    { id: 'directionFilter', name: 'Filtro de Direção', icon: <FiLayers />, metrics: ['direction_violations'] },
    { id: 'trajectoryAnalysis', name: 'Análise de Trajetória', icon: <FiActivity />, metrics: ['trajectory_anomalies'] },
    { id: 'loiteringDetection', name: 'Detecção de Vadiagem', icon: <FiDatabase />, metrics: ['loitering_events'] }
  ];

  const generatePreviewData = () => {
    try {
      if (widgetConfig.dataSource === 'all_pipelines') {
        const data = Object.values(metricsData).map((metrics, index) => ({
          label: `Pipeline ${index + 1}`,
          value: metrics[widgetConfig.metric] || 0,
          data: metrics
        }));
        setPreviewData(data);
      } else if (widgetConfig.dataSource === 'specific_pipeline' && widgetConfig.pipelineId) {
        const pipelineMetrics = metricsData[widgetConfig.pipelineId];
        if (pipelineMetrics) {
          setPreviewData([{
            label: pipelines.find(p => p.id === widgetConfig.pipelineId)?.name || 'Pipeline',
            value: pipelineMetrics[widgetConfig.metric] || 0,
            data: pipelineMetrics
          }]);
        }
      } else if (widgetConfig.dataSource === 'node_based') {
        // Gerar dados baseados nos tipos de nós selecionados
        const nodeData = selectedNodeTypes.map(nodeType => {
          const node = nodeTypes.find(n => n.id === nodeType);
          const relevantMetrics = node?.metrics.filter(m => 
            metricsOptions.find(opt => opt.value === m)
          ) || [];
          
          const value = relevantMetrics.reduce((sum, metric) => {
            return sum + (Object.values(metricsData).reduce((total, pipeline) => 
              total + (pipeline[metric] || 0), 0
            ));
          }, 0);

          return {
            label: node?.name || nodeType,
            value: value,
            data: { nodeType, metrics: relevantMetrics }
          };
        });
        setPreviewData(nodeData);
      }
    } catch (error) {
      console.error('Erro ao gerar dados de preview:', error);
      setPreviewData([]);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('config.')) {
      const configField = field.replace('config.', '');
      setWidgetConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configField]: value
        }
      }));
    } else {
      setWidgetConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNodeTypeToggle = (nodeTypeId) => {
    setSelectedNodeTypes(prev => {
      if (prev.includes(nodeTypeId)) {
        return prev.filter(id => id !== nodeTypeId);
      } else {
        return [...prev, nodeTypeId];
      }
    });
  };

  const handleSave = () => {
    const finalConfig = {
      ...widgetConfig,
      config: {
        ...widgetConfig.config,
        nodeTypes: selectedNodeTypes
      }
    };
    onSave(finalConfig);
  };

  const getMetricsByCategory = () => {
    const categories = {};
    metricsOptions.forEach(metric => {
      if (!categories[metric.category]) {
        categories[metric.category] = [];
      }
      categories[metric.category].push(metric);
    });
    return categories;
  };

  if (!isOpen) return null;

  return (
    <div className="widget-builder-overlay">
      <div className="widget-builder-modal">
        <div className="modal-header">
          <h2>
            <FiBarChart />
            {editingWidget ? 'Editar Widget' : 'Criar Novo Widget'}
          </h2>
          <button onClick={onClose} className="close-btn">
            <FiX />
          </button>
        </div>

        <div className="modal-content">
          <div className="builder-sections">
            {/* Configurações Básicas */}
            <div className="builder-section">
              <h3>Configurações Básicas</h3>
              
              <div className="form-group">
                <label>Título do Widget</label>
                <input
                  type="text"
                  value={widgetConfig.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: FPS em Tempo Real"
                />
              </div>

              <div className="form-group">
                <label>Tipo de Widget</label>
                <div className="widget-type-grid">
                  {widgetTypes.map(type => (
                    <div
                      key={type.id}
                      className={`widget-type-card ${
                        widgetConfig.type === type.id ? 'selected' : ''
                      }`}
                      onClick={() => handleInputChange('type', type.id)}
                    >
                      <div className="type-icon">{type.icon}</div>
                      <div className="type-name">{type.name}</div>
                      <div className="type-description">{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fonte de Dados */}
            <div className="builder-section">
              <h3>Fonte de Dados</h3>
              
              <div className="form-group">
                <label>Origem dos Dados</label>
                <select
                  value={widgetConfig.dataSource}
                  onChange={(e) => handleInputChange('dataSource', e.target.value)}
                >
                  <option value="all_pipelines">Todos os Pipelines</option>
                  <option value="specific_pipeline">Pipeline Específico</option>
                  <option value="node_based">Baseado em Tipos de Nós</option>
                </select>
              </div>

              {widgetConfig.dataSource === 'specific_pipeline' && (
                <div className="form-group">
                  <label>Selecionar Pipeline</label>
                  <select
                    value={widgetConfig.pipelineId}
                    onChange={(e) => handleInputChange('pipelineId', e.target.value)}
                  >
                    <option value="">Escolha um pipeline...</option>
                    {pipelines.map(pipeline => (
                      <option key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {widgetConfig.dataSource === 'node_based' && (
                <div className="form-group">
                  <label>Tipos de Nós</label>
                  <div className="node-types-grid">
                    {nodeTypes.map(nodeType => (
                      <div
                        key={nodeType.id}
                        className={`node-type-card ${
                          selectedNodeTypes.includes(nodeType.id) ? 'selected' : ''
                        }`}
                        onClick={() => handleNodeTypeToggle(nodeType.id)}
                      >
                        <div className="node-icon">{nodeType.icon}</div>
                        <div className="node-name">{nodeType.name}</div>
                        <div className="node-metrics">
                          {nodeType.metrics.slice(0, 2).map(metric => (
                            <span key={metric} className="metric-tag">
                              {metricsOptions.find(m => m.value === metric)?.label || metric}
                            </span>
                          ))}
                          {nodeType.metrics.length > 2 && (
                            <span className="metric-tag more">
                              +{nodeType.metrics.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Métricas */}
            <div className="builder-section">
              <h3>Métrica Principal</h3>
              
              <div className="form-group">
                <label>Selecionar Métrica</label>
                <div className="metrics-categories">
                  {Object.entries(getMetricsByCategory()).map(([category, metrics]) => (
                    <div key={category} className="metric-category">
                      <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                      <div className="metrics-grid">
                        {metrics.map(metric => (
                          <div
                            key={metric.value}
                            className={`metric-option ${
                              widgetConfig.metric === metric.value ? 'selected' : ''
                            }`}
                            onClick={() => handleInputChange('metric', metric.value)}
                          >
                            <span className="metric-label">{metric.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="builder-section">
              <h3>Configurações Avançadas</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Intervalo de Atualização</label>
                  <select
                    value={widgetConfig.config.refreshInterval}
                    onChange={(e) => handleInputChange('config.refreshInterval', parseInt(e.target.value))}
                  >
                    <option value={1000}>1 segundo</option>
                    <option value={5000}>5 segundos</option>
                    <option value={10000}>10 segundos</option>
                    <option value={30000}>30 segundos</option>
                    <option value={60000}>1 minuto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Período de Tempo</label>
                  <select
                    value={widgetConfig.config.timeRange}
                    onChange={(e) => handleInputChange('config.timeRange', e.target.value)}
                  >
                    <option value="last_hour">Última Hora</option>
                    <option value="last_6_hours">Últimas 6 Horas</option>
                    <option value="last_24_hours">Últimas 24 Horas</option>
                    <option value="last_week">Última Semana</option>
                  </select>
                </div>
              </div>

              {['pie_chart', 'doughnut_chart', 'table'].includes(widgetConfig.type) && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={widgetConfig.config.showLegend}
                      onChange={(e) => handleInputChange('config.showLegend', e.target.checked)}
                    />
                    Mostrar Legenda
                  </label>
                </div>
              )}

              {['bar_chart', 'line_chart'].includes(widgetConfig.type) && (
                <div className="form-group">
                  <label>Agregação de Dados</label>
                  <select
                    value={widgetConfig.config.aggregation}
                    onChange={(e) => handleInputChange('config.aggregation', e.target.value)}
                  >
                    <option value="sum">Soma</option>
                    <option value="average">Média</option>
                    <option value="max">Máximo</option>
                    <option value="min">Mínimo</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="builder-preview">
            <h3>Preview</h3>
            <div className="preview-container">
              <div className="preview-widget">
                <div className="preview-header">
                  <span className="preview-title">
                    {widgetConfig.title || 'Título do Widget'}
                  </span>
                  <span className="preview-type">
                    {widgetTypes.find(t => t.id === widgetConfig.type)?.name}
                  </span>
                </div>
                <div className="preview-content">
                  {previewData.length > 0 ? (
                    <div className="preview-data">
                      {previewData.slice(0, 3).map((item, index) => (
                        <div key={index} className="preview-item">
                          <span className="item-label">{item.label}</span>
                          <span className="item-value">{item.value}</span>
                        </div>
                      ))}
                      {previewData.length > 3 && (
                        <div className="preview-more">
                          +{previewData.length - 3} mais...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="preview-empty">
                      <p>Nenhum dado disponível para preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            className="btn btn-primary"
            disabled={!widgetConfig.title || !widgetConfig.metric}
          >
            <FiSave />
            {editingWidget ? 'Atualizar Widget' : 'Criar Widget'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetBuilder;
