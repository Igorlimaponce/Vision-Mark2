import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';

// Este é um nó customizado que permite ao usuário desenhar um polígono
const PolygonNode = ({ data, id, isConnectable }) => {
    const [points, setPoints] = useState(data.polygon || []);
    const [isDrawing, setIsDrawing] = useState(false);

    const onImageClick = (e) => {
        if (!isDrawing) return;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newPoints = [...points, [x, y]];
        setPoints(newPoints);
        // Atualiza a configuração no nó pai (PipelineStudio)
        data.onConfigChange(id, { polygon: newPoints });
    };

    const toggleDrawing = () => {
        setIsDrawing(!isDrawing);
        if (isDrawing) {
            // Ao terminar de desenhar, garante que o último ponto foi salvo.
            data.onConfigChange(id, { polygon: points });
        }
    };
    
    const resetPolygon = () => {
        setPoints([]);
        data.onConfigChange(id, { polygon: [] });
    }

    return (
        <div className="polygon-node">
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
            <div>
                <strong>{data.label}</strong>
                <div className="polygon-controls">
                    <button onClick={toggleDrawing}>{isDrawing ? 'Concluir Desenho' : 'Desenhar Polígono'}</button>
                    <button onClick={resetPolygon}>Limpar</button>
                </div>
                <div className="polygon-canvas-wrapper">
                    {/* Em um cenário real, aqui seria exibida uma imagem de preview da câmera */}
                    <svg
                        className="polygon-canvas"
                        onClick={onImageClick}
                        style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
                    >
                        {points.length > 0 && (
                            <polygon points={points.map(p => p.join(',')).join(' ')} className="drawn-polygon" />
                        )}
                        {points.map((p, i) => (
                            <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="white" />
                        ))}
                    </svg>
                     <div className="placeholder-text">Preview da Câmera</div>
                </div>
            </div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    );
};

export default PolygonNode;