import React, { useRef, useEffect } from 'react';

const BarChart = ({ data, config, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawChart();
  }, [data, width, height, config]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data.map(d => d.value)) * 1.1;
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;

    // Define colors for bars
    const colors = [
      '#667eea',
      '#764ba2', 
      '#f093fb',
      '#f5576c',
      '#4facfe',
      '#00f2fe',
      '#43e97b',
      '#38f9d7'
    ];

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + (index * (barWidth + barSpacing));
      const y = padding + chartHeight - barHeight;

      // Create gradient for bar
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      const color = colors[index % colors.length];
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80');

      // Draw bar
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Add border to bar
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);

      // Draw label below bar
      ctx.fillStyle = '#666';
      ctx.font = '11px system-ui';
      ctx.textBaseline = 'top';
      
      // Rotate text if label is long
      const labelWidth = ctx.measureText(item.label).width;
      if (labelWidth > barWidth) {
        ctx.save();
        ctx.translate(x + barWidth / 2, padding + chartHeight + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.fillText(item.label, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(item.label, x + barWidth / 2, padding + chartHeight + 10);
      }
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (i * maxValue / 5);
      const y = padding + (i * chartHeight / 5);
      ctx.fillText(Math.round(value), padding - 10, y);
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

  const getTotalValue = () => {
    return data.reduce((sum, item) => sum + item.value, 0);
  };

  const getAverageValue = () => {
    return Math.round(getTotalValue() / data.length);
  };

  return (
    <div className="chart-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {/* Chart Stats */}
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{getTotalValue()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Média:</span>
          <span className="stat-value">{getAverageValue()}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Itens:</span>
          <span className="stat-value">{data.length}</span>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
