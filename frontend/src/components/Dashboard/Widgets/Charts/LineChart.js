import React, { useRef, useEffect } from 'react';

const LineChart = ({ data, config, width, height }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    drawChart();
  }, [data, width, height, config]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Prepare data
    let chartData = [];
    
    if (config.timeRange === 'last_hour' && data[0]?.data?.timeline) {
      // Use timeline data for time-based charts
      chartData = data[0].data.timeline.map((point, index) => ({
        x: index,
        y: point[config.metric] || point.fps || 0,
        label: new Date(point.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
    } else {
      // Use current values
      chartData = data.map((item, index) => ({
        x: index,
        y: item.value || 0,
        label: item.label
      }));
    }

    if (chartData.length === 0) return;

    const maxY = Math.max(...chartData.map(d => d.y)) * 1.1;
    const minY = Math.min(...chartData.map(d => d.y)) * 0.9;
    const range = maxY - minY || 1;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const step = Math.max(1, Math.floor(chartData.length / 6));
    for (let i = 0; i < chartData.length; i += step) {
      const x = padding + (i * chartWidth / (chartData.length - 1));
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Draw line
    if (chartData.length > 1) {
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
      gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');

      // Draw area under line
      ctx.fillStyle = gradient;
      ctx.beginPath();
      chartData.forEach((point, index) => {
        const x = padding + (index * chartWidth / (chartData.length - 1));
        const y = padding + chartHeight - ((point.y - minY) / range * chartHeight);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      // Close area path
      const lastX = padding + ((chartData.length - 1) * chartWidth / (chartData.length - 1));
      ctx.lineTo(lastX, padding + chartHeight);
      ctx.lineTo(padding, padding + chartHeight);
      ctx.closePath();
      ctx.fill();

      // Draw line
      ctx.beginPath();
      chartData.forEach((point, index) => {
        const x = padding + (index * chartWidth / (chartData.length - 1));
        const y = padding + chartHeight - ((point.y - minY) / range * chartHeight);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      ctx.fillStyle = '#667eea';
      chartData.forEach((point, index) => {
        const x = padding + (index * chartWidth / (chartData.length - 1));
        const y = padding + chartHeight - ((point.y - minY) / range * chartHeight);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add white border to points
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
      });
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const value = maxY - (i * range / 5);
      const y = padding + (i * chartHeight / 5);
      ctx.fillText(Math.round(value), padding - 10, y);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const labelStep = Math.max(1, Math.floor(chartData.length / 4));
    for (let i = 0; i < chartData.length; i += labelStep) {
      const x = padding + (i * chartWidth / (chartData.length - 1));
      const label = chartData[i].label;
      if (label) {
        ctx.fillText(label, x, padding + chartHeight + 10);
      }
    }

    // Draw axis lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
  };

  return (
    <div ref={containerRef} className="chart-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {/* Chart Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#667eea' }}></div>
          <span>{config.metric?.replace(/_/g, ' ') || 'Métrica'}</span>
        </div>
      </div>
    </div>
  );
};

export default LineChart;
