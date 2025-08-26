import React, { useState, useRef, useEffect, memo } from 'react';
import { FiSettings, FiTrash2, FiMove, FiMaximize2 } from 'react-icons/fi';
import LineChart from './Charts/LineChart';
import BarChart from './Charts/BarChart';
import PieChart from './Charts/PieChart';
import DoughnutChart from './Charts/DoughnutChart';
import MetricCard from './Charts/MetricCard';
import TableWidget from './Charts/TableWidget';

const Widget = memo(({ 
  widget, 
  metricsData, 
  pipelines, 
  onUpdate, 
  onDelete, 
  onEdit, 
  onDragStart,
  isDragging 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const widgetRef = useRef(null);
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });

  useEffect(() => {
    setIsLoading(true);
    // Simular loading para cada widget
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [widget.config]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.widget-actions') || e.target.closest('.resize-handle')) return;
    onDragStart(e, widget);
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widget.size.width,
      startHeight: widget.size.height
    };

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      
      const newWidth = Math.max(200, resizeRef.current.startWidth + deltaX);
      const newHeight = Math.max(150, resizeRef.current.startHeight + deltaY);
      
      onUpdate(widget.id, {
        size: { width: newWidth, height: newHeight }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getWidgetData = () => {
    try {
      const { config } = widget;
      
      if (config.dataSource === 'all_pipelines') {
        return Object.values(metricsData).reduce((acc, pipelineMetrics) => {
          if (config.metric && pipelineMetrics[config.metric] !== undefined) {
            acc.push({
              label: `Pipeline ${acc.length + 1}`,
              value: pipelineMetrics[config.metric],
              data: pipelineMetrics
            });
          }
          return acc;
        }, []);
      } else if (config.dataSource === 'specific_pipeline' && config.pipelineId) {
        const pipelineMetrics = metricsData[config.pipelineId];
        if (!pipelineMetrics) return [];
        
        return [{
          label: pipelines.find(p => p.id === config.pipelineId)?.name || 'Pipeline',
          value: pipelineMetrics[config.metric],
          data: pipelineMetrics
        }];
      }
      
      return [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="widget-loading">
          <div className="loading-spinner">
            <FiMove style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <p>Carregando dados...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="widget-error">
          <p>Erro ao carregar dados</p>
          <small>{error}</small>
        </div>
      );
    }

    const data = getWidgetData();
    
    if (data.length === 0) {
      return (
        <div className="widget-error">
          <p>Nenhum dado disponível</p>
          <small>Verifique a configuração do widget</small>
        </div>
      );
    }

    const chartProps = {
      data,
      config: widget.config,
      width: widget.size.width - 40,
      height: widget.size.height - 120
    };

    switch (widget.type) {
      case 'line_chart':
        return <LineChart {...chartProps} />;
      case 'bar_chart':
        return <BarChart {...chartProps} />;
      case 'pie_chart':
        return <PieChart {...chartProps} />;
      case 'doughnut_chart':
        return <DoughnutChart {...chartProps} />;
      case 'metric_card':
        return <MetricCard {...chartProps} />;
      case 'table':
        return <TableWidget {...chartProps} />;
      default:
        return (
          <div className="widget-error">
            <p>Tipo de widget não suportado: {widget.type}</p>
          </div>
        );
    }
  };

  const widgetStyle = {
    left: widget.position.x,
    top: widget.position.y,
    width: widget.size.width,
    height: widget.size.height,
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div
      ref={widgetRef}
      className={`dashboard-widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={widgetStyle}
      onMouseDown={handleMouseDown}
      draggable={false}
    >
      {/* Widget Header */}
      <div className="widget-header">
        <div className="widget-title">
          {widget.title}
        </div>
        
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(widget);
            }}
            title="Configurar widget"
          >
            <FiSettings />
          </button>
          
          <button
            className="widget-action-btn"
            onClick={() => onUpdate(widget.id, {
              size: {
                width: widget.size.width === 400 ? 800 : 400,
                height: widget.size.height === 300 ? 600 : 300
              }
            })}
            title="Expandir/Recolher"
          >
            <FiMaximize2 />
          </button>
          
          <button
            className="widget-action-btn danger"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Tem certeza que deseja remover este widget?')) {
                onDelete(widget.id);
              }
            }}
            title="Remover widget"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="widget-content">
        {renderChart()}
      </div>

      {/* Resize Handle */}
      <div
        className="resize-handle se"
        onMouseDown={handleResizeStart}
        title="Redimensionar"
      />
    </div>
  );
});

Widget.displayName = 'Widget';

export default Widget;
