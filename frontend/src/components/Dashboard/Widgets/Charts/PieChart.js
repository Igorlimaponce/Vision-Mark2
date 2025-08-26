import React, { useRef, useEffect } from 'react';

const PieChart = ({ data, config, width, height }) => {
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
    const radius = Math.min(width, height) / 2 - 40;

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
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80');

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw percentage label
      if (sliceAngle > 0.1) { // Only show label if slice is large enough
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        const percentage = Math.round((item.value / total) * 100);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add background circle for better readability
        const textWidth = ctx.measureText(`${percentage}%`).width;
        ctx.beginPath();
        ctx.arc(labelX, labelY, textWidth / 2 + 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }

      currentAngle += sliceAngle;
    });

    // Draw center circle for donut effect (optional)
    if (config.innerRadius) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * config.innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
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
      {config.showLegend !== false && (
        <div className="chart-legend pie-legend">
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
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">
                  {item.value} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PieChart;
