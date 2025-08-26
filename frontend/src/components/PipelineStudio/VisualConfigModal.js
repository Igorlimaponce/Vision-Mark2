import React, { useState, useRef, useEffect } from 'react';
import { FiXCircle, FiTrash, FiSave, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { getCameraSnapshot } from '../../services/api'; // Importa a nova função
import './VisualConfigModal.css';

const VisualConfigModal = ({ configData, onSave, onClose }) => {
    const { targetNode, cameraNode } = configData;

    const [points, setPoints] = useState([]);
    const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'loaded', 'error'
    const [snapshotUrl, setSnapshotUrl] = useState('');
    const imageRef = useRef(null);

    useEffect(() => {
        // Inicializa os pontos com os dados existentes no nó
        if (targetNode?.data) {
            const key = targetNode.type === 'polygonFilter' ? 'polygon' : 'line';
            setPoints(targetNode.data[key] || []);
        }

        // Busca o snapshot usando o ID da câmera
        if (cameraNode?.data?.camera_id) {
            setImageStatus('loading');
            getCameraSnapshot(cameraNode.data.camera_id)
                .then(url => {
                    setSnapshotUrl(url);
                    // O status será atualizado para 'loaded' no onLoad da imagem
                })
                .catch(() => {
                    setImageStatus('error');
                });
        } else {
            setImageStatus('error');
        }

        // Limpa a URL do blob quando o componente é desmontado para evitar memory leaks
        return () => {
            if (snapshotUrl && snapshotUrl.startsWith('blob:')) {
                URL.revokeObjectURL(snapshotUrl);
            }
        };
    }, [targetNode, cameraNode]);

    const handleCanvasClick = (e) => {
        if (!imageRef.current || imageStatus !== 'loaded') return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const newPoint = [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000];
        if (targetNode.type === 'polygonFilter') {
            setPoints(prev => [...prev, newPoint]);
        } else if (targetNode.type === 'directionFilter' && points.length < 2) {
            setPoints(prev => [...prev, newPoint]);
        }
    };

    const handleSave = () => {
        const key = targetNode.type === 'polygonFilter' ? 'polygon' : 'line';
        onSave(targetNode.id, { [key]: points });
        onClose();
    };

    const renderDrawing = () => {
        return (
            <svg className="drawing-svg" viewBox="0 0 1 1" preserveAspectRatio="none">
                {targetNode.type === 'polygonFilter' && points.length > 1 && (
                    <polygon points={points.map(p => p.join(',')).join(' ')} className="drawn-polygon" />
                )}
                {targetNode.type === 'directionFilter' && points.length > 1 && (
                    <line x1={points[0][0]} y1={points[0][1]} x2={points[1][0]} y2={points[1][1]} className="drawn-line" />
                )}
                {points.map((p, i) => (
                    <circle key={i} cx={p[0]} cy={p[1]} r="0.01" className="drawn-point" />
                ))}
            </svg>
        );
    };

    if (!targetNode) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <header className="modal-header">
                    <h2>Configurar Área para: {targetNode.data.label}</h2>
                    <button onClick={onClose} className="close-button"><FiXCircle /></button>
                </header>
                <div className="modal-body">
                    <p>Fonte: {cameraNode.data.camera_name || 'Câmera não especificada'}</p>
                    <div className="visual-canvas-wrapper" ref={imageRef} onClick={handleCanvasClick}>
                        {imageStatus === 'loading' && (
                            <div className="status-overlay"><FiLoader className="spin-icon" /> Carregando Snapshot...</div>
                        )}
                        {imageStatus === 'error' && (
                             <div className="status-overlay"><FiAlertTriangle /> Falha ao carregar imagem da câmera.</div>
                        )}
                        <img 
                            src={snapshotUrl} 
                            alt="Camera Snapshot" 
                            className="preview-image"
                            onLoad={() => setImageStatus('loaded')}
                            onError={() => setImageStatus('error')}
                            style={{ display: imageStatus === 'loaded' ? 'block' : 'none' }}
                        />
                        {imageStatus === 'loaded' && renderDrawing()}
                    </div>
                </div>
                <footer className="modal-actions">
                    <button onClick={() => setPoints([])} className="btn btn-secondary"><FiTrash /> Limpar Pontos</button>
                    <button onClick={handleSave} className="btn btn-primary" disabled={imageStatus !== 'loaded'}><FiSave /> Salvar e Fechar</button>
                </footer>
            </div>
        </div>
    );
};

export default VisualConfigModal;
