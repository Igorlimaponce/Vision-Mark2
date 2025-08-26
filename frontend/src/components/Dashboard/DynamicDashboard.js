import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, 
  FiSettings, 
  FiTrash2, 
  FiRefreshCw, 
  FiBarChart, 
  FiPieChart, 
  FiTrendingUp,
  FiActivity,
  FiGrid,
  FiSave,
  FiDownload,
  FiMaximize2,
  FiMinimize2
} from 'react-icons/fi';
import { getPipelines, getEvents } from '../../services/api';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket';
import Widget from './Widgets/Widget';
import WidgetBuilder from './WidgetBuilder/WidgetBuilder';
import './DynamicDashboard.css';

const DynamicDashboard = () => {
  const [widgets, setWidgets] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [metricsData, setMetricsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Layout states
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true);
        
        // Carregar pipelines
        const pipelinesData = await getPipelines();
        setPipelines(pipelinesData);

        // Carregar widgets salvos do localStorage
        const savedWidgets = localStorage.getItem('jarvis-dashboard-widgets');
        if (savedWidgets) {
          setWidgets(JSON.parse(savedWidgets));
        } else {
          // Criar widgets padrão na primeira vez
          setWidgets(getDefaultWidgets());
        }

        // Buscar dados de métricas iniciais
        await fetchMetricsData();
      } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Conectar WebSocket para atualizações em tempo real
  useEffect(() => {
    const handleMetricsUpdate = (event) => {
      try {
        const newData = JSON.parse(event.data);
        if (newData.type === 'metrics_update') {
          setMetricsData(prev => ({
            ...prev,
            [newData.pipeline_id]: {
              ...prev[newData.pipeline_id],
              ...newData.metrics
            }
          }));
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Erro ao processar atualização de métricas:', error);
      }
    };

    connectWebSocket(handleMetricsUpdate);
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(fetchMetricsData, 30000);

    return () => {
      disconnectWebSocket();
      clearInterval(interval);
    };
  }, []);

  // Salvar widgets no localStorage sempre que mudar
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem('jarvis-dashboard-widgets', JSON.stringify(widgets));
    }
  }, [widgets]);

  const fetchMetricsData = async () => {
    try {
      // Simular dados de métricas (idealmente viria de uma API específica)
      const mockMetrics = pipelines.reduce((acc, pipeline) => {
        acc[pipeline.id] = generateMockMetrics(pipeline);
        return acc;
      }, {});
      
      setMetricsData(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  const generateMockMetrics = (pipeline) => {
    const now = Date.now();
    const lastHour = Array.from({ length: 12 }, (_, i) => ({
      timestamp: now - (11 - i) * 5 * 60 * 1000, // 5 min intervals
      fps: Math.floor(Math.random() * 30) + 15,
      detections: Math.floor(Math.random() * 50) + 10,
      cpu_usage: Math.floor(Math.random() * 40) + 30,
      alerts: Math.floor(Math.random() * 5)
    }));

    return {
      current_fps: lastHour[lastHour.length - 1].fps,
      total_detections: lastHour.reduce((sum, point) => sum + point.detections, 0),
      avg_cpu: Math.round(lastHour.reduce((sum, point) => sum + point.cpu_usage, 0) / lastHour.length),
      total_alerts: lastHour.reduce((sum, point) => sum + point.alerts, 0),
      uptime: Math.floor(Math.random() * 24) + 1, // hours
      timeline: lastHour,
      // Métricas específicas por tipo de nó
      vehicles_detected: Math.floor(Math.random() * 200) + 50,
      people_detected: Math.floor(Math.random() * 100) + 20,
      loitering_events: Math.floor(Math.random() * 10),
      direction_violations: Math.floor(Math.random() * 15),
      trajectory_anomalies: Math.floor(Math.random() * 8),
      zone_entries: Math.floor(Math.random() * 80) + 20,
      zone_exits: Math.floor(Math.random() * 75) + 20
    };
  };

  const getDefaultWidgets = () => [
    {
      id: 'widget-1',
      title: 'FPS em Tempo Real',
      type: 'line_chart',
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      config: {
        metric: 'current_fps',
        dataSource: 'all_pipelines',
        timeRange: 'last_hour',
        refreshInterval: 5000
      }
    },
    {
      id: 'widget-2',
      title: 'Detecções por Pipeline',
      type: 'bar_chart',
      position: { x: 420, y: 0 },
      size: { width: 400, height: 300 },
      config: {
        metric: 'total_detections',
        dataSource: 'all_pipelines',
        timeRange: 'last_hour'
      }
    },
    {
      id: 'widget-3',
      title: 'Status dos Sistemas',
      type: 'pie_chart',
      position: { x: 0, y: 320 },
      size: { width: 400, height: 300 },
      config: {
        metric: 'uptime',
        dataSource: 'all_pipelines',
        showLegend: true
      }
    },
    {
      id: 'widget-4',
      title: 'Tipos de Objetos Detectados',
      type: 'doughnut_chart',
      position: { x: 420, y: 320 },
      size: { width: 400, height: 300 },
      config: {
        metrics: ['vehicles_detected', 'people_detected'],
        dataSource: 'all_pipelines',
        showLabels: true
      }
    }
  ];

  const handleAddWidget = useCallback((widgetConfig) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      ...widgetConfig,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 }
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setIsBuilderOpen(false);
  }, []);

  const handleUpdateWidget = useCallback((widgetId, updates) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ));
  }, []);

  const handleDeleteWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  }, []);

  const handleEditWidget = useCallback((widget) => {
    setEditingWidget(widget);
    setIsBuilderOpen(true);
  }, []);

  const handleDragStart = (e, widget) => {
    setIsDragging(true);
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedWidget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    handleUpdateWidget(draggedWidget.id, {
      position: { x: Math.max(0, x - 200), y: Math.max(0, y - 20) }
    });

    setIsDragging(false);
    setDraggedWidget(null);
  };

  const exportDashboard = () => {
    const exportData = {
      widgets,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `jarvis-dashboard-${new Date().getTime()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importDashboard = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target.result);
        if (importData.widgets) {
          setWidgets(importData.widgets);
        }
      } catch (error) {
        console.error('Erro ao importar dashboard:', error);
        alert('Erro ao importar arquivo de dashboard.');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <FiActivity className="loading-spinner" />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`dynamic-dashboard ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <FiBarChart />
            Dashboard Analítico
          </h1>
          <p>
            Última atualização: {lastUpdate.toLocaleTimeString()}
            <button onClick={fetchMetricsData} className="refresh-btn">
              <FiRefreshCw />
            </button>
          </p>
        </div>
        
        <div className="header-actions">
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="btn btn-primary"
          >
            <FiPlus />
            Adicionar Widget
          </button>
          
          <button onClick={exportDashboard} className="btn btn-secondary">
            <FiDownload />
            Exportar
          </button>
          
          <label className="btn btn-secondary file-input-label">
            <FiSave />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={importDashboard}
              style={{ display: 'none' }}
            />
          </label>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-secondary"
          >
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
      </div>

      {/* Widgets Container */}
      <div
        className="widgets-container"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {widgets.map((widget) => (
          <Widget
            key={widget.id}
            widget={widget}
            metricsData={metricsData}
            pipelines={pipelines}
            onUpdate={handleUpdateWidget}
            onDelete={handleDeleteWidget}
            onEdit={handleEditWidget}
            onDragStart={handleDragStart}
            isDragging={isDragging && draggedWidget?.id === widget.id}
          />
        ))}
        
        {widgets.length === 0 && (
          <div className="empty-dashboard">
            <FiGrid className="empty-icon" />
            <h2>Dashboard Vazio</h2>
            <p>Adicione seu primeiro widget para começar a monitorar seus pipelines</p>
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="btn btn-primary"
            >
              <FiPlus />
              Criar Widget
            </button>
          </div>
        )}
      </div>

      {/* Widget Builder Modal */}
      {isBuilderOpen && (
        <WidgetBuilder
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingWidget(null);
          }}
          onSave={editingWidget ? 
            (config) => handleUpdateWidget(editingWidget.id, config) :
            handleAddWidget
          }
          pipelines={pipelines}
          metricsData={metricsData}
          editingWidget={editingWidget}
        />
      )}
    </div>
  );
};

export default DynamicDashboard;
