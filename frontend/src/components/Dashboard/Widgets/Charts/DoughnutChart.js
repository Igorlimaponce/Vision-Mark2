import React, { useRef, useEffect } from 'react';

const DoughnutChart = ({ data, config, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawChart();
  }, [data, width, height, config]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 40;
    const innerRadius = outerRadius * 0.6; // Donut hole

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    // Define colors
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

    let currentAngle = -Math.PI / 2; // Start at top

    // Draw slices
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const color = colors[index % colors.length];

      // Create gradient for slice
      const gradient = ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, outerRadius
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '60');

      // Draw outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw value label on the ring
      if (sliceAngle > 0.2) { // Only show label if slice is large enough
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = (outerRadius + innerRadius) / 2;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(item.value.toString(), labelX, labelY);
        ctx.shadowBlur = 0;
      }

      currentAngle += sliceAngle;
    });

    // Draw center content
    const centerContent = getCenterContent();
    if (centerContent) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerContent.value, centerX, centerY - 5);
      
      ctx.fillStyle = '#666';
      ctx.font = '12px system-ui';
      ctx.fillText(centerContent.label, centerX, centerY + 15);
    }
  };

  const getCenterContent = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (config.centerContent === 'total') {
      return { value: total.toString(), label: 'Total' };
    } else if (config.centerContent === 'average') {
      const avg = Math.round(total / data.length);
      return { value: avg.toString(), label: 'Média' };
    } else if (config.centerContent === 'max') {
      const max = Math.max(...data.map(d => d.value));
      return { value: max.toString(), label: 'Máximo' };
    }
    
    return { value: total.toString(), label: 'Total' };
  };

  return (
    <div className="chart-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {/* Legend */}
      {config.showLabels !== false && (
        <div className="chart-legend doughnut-legend">
          {data.map((item, index) => {
            const colors = [
              '#667eea', '#764ba2', '#f093fb', '#f5576c',
              '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
            ];
            const total = data.reduce((sum, d) => sum + d.value, 0);
            const percentage = Math.round((item.value / total) * 100);
            
            return (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ background: colors[index % colors.length] }}
                ></div>
                <div className="legend-content">
                  <span className="legend-label">{item.label}</span>
                  <div className="legend-stats">
                    <span className="legend-value">{item.value}</span>
                    <span className="legend-percentage">({percentage}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoughnutChart;
