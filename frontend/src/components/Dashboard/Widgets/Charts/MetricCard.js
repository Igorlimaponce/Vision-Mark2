import React from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiActivity, 
  FiUsers, 
  FiCpu, 
  FiZap,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import './Charts.css';

const MetricCard = ({ data, config, width, height }) => {
  if (!data.length) return null;

  const getIcon = () => {
    const iconMap = {
      current_fps: FiActivity,
      total_detections: FiUsers,
      avg_cpu: FiCpu,
      total_alerts: FiAlertTriangle,
      uptime: FiClock,
      vehicles_detected: FiActivity,
      people_detected: FiUsers,
      success_rate: FiCheckCircle
    };

    return iconMap[config.metric] || FiZap;
  };

  const getMetricValue = () => {
    if (config.aggregation === 'sum') {
      return data.reduce((sum, item) => sum + item.value, 0);
    } else if (config.aggregation === 'average') {
      return Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length);
    } else if (config.aggregation === 'max') {
      return Math.max(...data.map(item => item.value));
    } else if (config.aggregation === 'min') {
      return Math.min(...data.map(item => item.value));
    }
    
    return data[0]?.value || 0;
  };

  const getMetricChange = () => {
    if (data.length < 2 || !data[0].data?.timeline) return null;
    
    const timeline = data[0].data.timeline;
    if (timeline.length < 2) return null;
    
    const current = timeline[timeline.length - 1][config.metric];
    const previous = timeline[timeline.length - 2][config.metric];
    
    if (current === undefined || previous === undefined) return null;
    
    const change = current - previous;
    const percentage = previous !== 0 ? (change / previous) * 100 : 0;
    
    return {
      value: change,
      percentage: Math.round(percentage * 10) / 10,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const getStatusColor = () => {
    const value = getMetricValue();
    
    // Define thresholds for different metrics
    const thresholds = {
      current_fps: { good: 20, warning: 10 },
      avg_cpu: { good: 70, warning: 85 },
      success_rate: { good: 95, warning: 80 },
      uptime: { good: 20, warning: 12 }
    };
    
    const threshold = thresholds[config.metric];
    if (!threshold) return '#667eea';
    
    if (config.metric === 'avg_cpu') {
      // For CPU, lower is better
      if (value <= threshold.good) return '#43e97b';
      if (value <= threshold.warning) return '#f5576c';
      return '#e53e3e';
    } else {
      // For most metrics, higher is better
      if (value >= threshold.good) return '#43e97b';
      if (value >= threshold.warning) return '#f5576c';
      return '#e53e3e';
    }
  };

  const formatValue = (value) => {
    if (config.format === 'percentage') {
      return `${value}%`;
    } else if (config.format === 'currency') {
      return `R$ ${value.toLocaleString('pt-BR')}`;
    } else if (config.format === 'time' && config.metric === 'uptime') {
      return `${value}h`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    
    return value.toString();
  };

  const formatLabel = () => {
    const labels = {
      current_fps: 'FPS Atual',
      total_detections: 'Total de Detecções',
      avg_cpu: 'Uso CPU Médio',
      total_alerts: 'Total de Alertas',
      uptime: 'Tempo Ativo',
      vehicles_detected: 'Veículos Detectados',
      people_detected: 'Pessoas Detectadas',
      success_rate: 'Taxa de Sucesso'
    };
    
    return labels[config.metric] || config.metric.replace(/_/g, ' ');
  };

  const Icon = getIcon();
  const value = getMetricValue();
  const change = getMetricChange();
  const statusColor = getStatusColor();

  return (
    <div className="metric-card" style={{ width, height }}>
      <div className="metric-card-header">
        <div className="metric-icon" style={{ color: statusColor }}>
          <Icon />
        </div>
        <div className="metric-info">
          <div className="metric-label">{formatLabel()}</div>
          {config.subtitle && (
            <div className="metric-subtitle">{config.subtitle}</div>
          )}
        </div>
      </div>
      
      <div className="metric-value-section">
        <div className="metric-value" style={{ color: statusColor }}>
          {formatValue(value)}
        </div>
        
        {change && (
          <div className={`metric-change ${change.direction}`}>
            {change.direction === 'up' && <FiTrendingUp />}
            {change.direction === 'down' && <FiTrendingDown />}
            {change.direction === 'stable' && <FiActivity />}
            <span>
              {change.direction !== 'stable' && (
                <>
                  {Math.abs(change.percentage)}%
                  {change.direction === 'up' ? ' ↑' : ' ↓'}
                </>
              )}
              {change.direction === 'stable' && 'Estável'}
            </span>
          </div>
        )}
      </div>
      
      {/* Mini sparkline */}
      {data[0]?.data?.timeline && (
        <div className="metric-sparkline">
          <MiniSparkline 
            data={data[0].data.timeline} 
            metric={config.metric}
            color={statusColor}
          />
        </div>
      )}
      
      {/* Data source info */}
      <div className="metric-footer">
        <span className="data-source">
          {data.length === 1 ? 'Pipeline específico' : `${data.length} pipelines`}
        </span>
        <span className="last-update">
          Atualizado agora
        </span>
      </div>
    </div>
  );
};

// Mini sparkline component
const MiniSparkline = ({ data, metric, color }) => {
  if (!data || data.length < 2) return null;
  
  const values = data.map(point => point[metric] || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  const width = 100;
  const height = 20;
  
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="sparkline">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.7"
      />
    </svg>
  );
};

export default MetricCard;
