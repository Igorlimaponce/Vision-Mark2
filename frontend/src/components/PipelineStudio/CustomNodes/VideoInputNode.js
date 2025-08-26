import React, { memo, useState, useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { FiTrash2, FiRefreshCw, FiVideo, FiSettings, FiMonitor, FiWifi, FiClock } from 'react-icons/fi';
import { getCameras } from '../../../services/api';
import './CustomNode.css';

export default memo(({ data, id }) => {
  const [cameras, setCameras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar as câmeras da API
  const fetchCameras = useCallback(() => {
    setIsLoading(true);
    getCameras()
      .then(data => setCameras(data || []))
      .catch(err => console.error("Falha ao buscar câmeras para o nó", err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // Handler para atualizar os dados do nó, agora tratando todos os tipos de input
  const onUpdate = (evt) => {
    const { name, value, type, checked } = evt.target;
    const finalValue = type === 'checkbox' ? checked : value;

    let updateData = { [name]: finalValue };

    // Se o campo alterado for a seleção de câmera, também atualizamos o nome
    if (name === 'camera_id') {
      const selectedCamera = cameras.find(c => c.id === value);
      updateData.camera_name = selectedCamera ? selectedCamera.name : '';
    }

    data.onConfigChange(id, updateData);
  };

  const getStatusBadge = () => {
    if (data.camera_id) {
      return <span className="status-badge status-active">✓ Conectado</span>;
    }
    return <span className="status-badge status-inactive">⚠ Não Configurado</span>;
  };

  const getQualityColor = (quality) => {
    const colors = {
      'low': '#e74c3c',
      'medium': '#f39c12',
      'high': '#27ae60',
      'ultra': '#8e44ad'
    };
    return colors[quality] || '#95a5a6';
  };

  return (
    <div className="custom-node">
      <div className="node-header">
        <div>
          <div className="node-title">
            <FiVideo style={{ marginRight: '8px' }} />
            Feed de Vídeo Avançado
            {getStatusBadge()}
          </div>
          <div className="node-subtitle">{data.camera_name || 'Nenhuma câmera selecionada'}</div>
        </div>
        <div className="node-header-actions">
          <button onClick={fetchCameras} title="Recarregar lista de câmeras"><FiRefreshCw /></button>
          <button onClick={() => data.onDeleteNode(id)} title="Deletar nó"><FiTrash2 /></button>
        </div>
      </div>
      <div className="node-content">
        {/* Seleção de Câmera */}
        <div className="form-section">
          <div className="section-header">
            <FiVideo /> Seleção de Câmera
          </div>
          <div className="form-row">
            <label htmlFor={`camera_id-${id}`}>Câmera</label>
            <select 
              id={`camera_id-${id}`} 
              name="camera_id" 
              className="nodrag" 
              value={data.camera_id || ''}
              onChange={onUpdate}
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? 'Carregando...' : '-- Selecione --'}
              </option>
              {cameras.map(cam => (
                <option key={cam.id} value={cam.id}>
                  {cam.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configurações de Stream */}
        <div className="form-section">
          <div className="section-header">
            <FiSettings /> Configurações de Stream
          </div>
          <div className="form-row">
            <label htmlFor={`stream_quality-${id}`}>Qualidade do Stream</label>
            <select
              id={`stream_quality-${id}`}
              name="stream_quality"
              className="nodrag"
              value={data.stream_quality || 'medium'}
              onChange={onUpdate}
              style={{ borderLeft: `4px solid ${getQualityColor(data.stream_quality)}` }}
            >
              <option value="low">📱 Baixa (480p)</option>
              <option value="medium">💻 Média (720p)</option>
              <option value="high">🖥️ Alta (1080p)</option>
              <option value="ultra">📺 Ultra (4K)</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor={`fps-${id}`}>FPS (Frames por Segundo)</label>
            <input
              id={`fps-${id}`}
              name="fps"
              type="number"
              min="1"
              max="60"
              className="nodrag"
              value={data.fps || 15}
              onChange={onUpdate}
            />
          </div>

          <div className="form-row">
            <label htmlFor={`rtsp_format-${id}`}>Formato RTSP</label>
            <select 
              id={`rtsp_format-${id}`} 
              name="rtsp_format" 
              className="nodrag" 
              value={data.rtsp_format || 'h264'}
              onChange={onUpdate}
            >
              <option value="h264">H.264 (Padrão)</option>
              <option value="h265">H.265 (HEVC)</option>
              <option value="mjpeg">MJPEG</option>
              <option value="av1">AV1 (Experimental)</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor={`buffer_size-${id}`}>Tamanho do Buffer (frames)</label>
            <input
              id={`buffer_size-${id}`}
              name="buffer_size"
              type="number"
              min="1"
              max="100"
              className="nodrag"
              value={data.buffer_size || 5}
              onChange={onUpdate}
            />
          </div>
        </div>

        {/* Configurações de Conexão */}
        <div className="form-section">
          <div className="section-header">
            <FiWifi /> Configurações de Conexão
          </div>
          <div className="form-row">
            <label htmlFor={`connection_timeout-${id}`}>Timeout de Conexão (s)</label>
            <input
              id={`connection_timeout-${id}`}
              name="connection_timeout"
              type="number"
              min="5"
              max="60"
              className="nodrag"
              value={data.connection_timeout || 15}
              onChange={onUpdate}
            />
          </div>

          <div className="form-row">
            <label htmlFor={`retry_attempts-${id}`}>Tentativas de Reconexão</label>
            <input
              id={`retry_attempts-${id}`}
              name="retry_attempts"
              type="number"
              min="0"
              max="10"
              className="nodrag"
              value={data.retry_attempts || 3}
              onChange={onUpdate}
            />
          </div>

          <div className="form-row">
            <label htmlFor={`retry_delay-${id}`}>Delay entre Tentativas (s)</label>
            <input
              id={`retry_delay-${id}`}
              name="retry_delay"
              type="number"
              min="1"
              max="30"
              className="nodrag"
              value={data.retry_delay || 5}
              onChange={onUpdate}
            />
          </div>

          <div className="form-row-checkbox">
            <input
              id={`auto_reconnect-${id}`}
              name="auto_reconnect"
              type="checkbox"
              className="nodrag"
              checked={data.auto_reconnect || true}
              onChange={onUpdate}
            />
            <label htmlFor={`auto_reconnect-${id}`}>🔄 Reconexão Automática</label>
          </div>
        </div>

        {/* Processamento Avançado */}
        <div className="form-section">
          <div className="section-header">
            <FiMonitor /> Processamento Avançado
          </div>
          <div className="form-row-checkbox">
            <input
              id={`scene_detection-${id}`}
              name="scene_detection"
              type="checkbox"
              className="nodrag"
              checked={data.scene_detection || false}
              onChange={onUpdate}
            />
            <label htmlFor={`scene_detection-${id}`}>🎬 Detecção de Mudança de Cena</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`motion_detection-${id}`}
              name="motion_detection"
              type="checkbox"
              className="nodrag"
              checked={data.motion_detection || false}
              onChange={onUpdate}
            />
            <label htmlFor={`motion_detection-${id}`}>🏃 Detecção de Movimento</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`frame_interpolation-${id}`}
              name="frame_interpolation"
              type="checkbox"
              className="nodrag"
              checked={data.frame_interpolation || false}
              onChange={onUpdate}
            />
            <label htmlFor={`frame_interpolation-${id}`}>🎯 Interpolação de Frames</label>
          </div>

          <div className="form-row-checkbox">
            <input
              id={`noise_reduction-${id}`}
              name="noise_reduction"
              type="checkbox"
              className="nodrag"
              checked={data.noise_reduction || false}
              onChange={onUpdate}
            />
            <label htmlFor={`noise_reduction-${id}`}>🔇 Redução de Ruído</label>
          </div>

          <div className="form-row">
            <label htmlFor={`stabilization_level-${id}`}>Nível de Estabilização</label>
            <select
              id={`stabilization_level-${id}`}
              name="stabilization_level"
              className="nodrag"
              value={data.stabilization_level || 'none'}
              onChange={onUpdate}
            >
              <option value="none">Desabilitado</option>
              <option value="light">🟢 Leve</option>
              <option value="medium">🟡 Moderado</option>
              <option value="strong">🔴 Forte</option>
            </select>
          </div>
        </div>

        {/* Configurações de Gravação */}
        <div className="form-section">
          <div className="section-header">
            <FiClock /> Configurações de Gravação
          </div>
          <div className="form-row-checkbox">
            <input
              id={`enable_recording-${id}`}
              name="enable_recording"
              type="checkbox"
              className="nodrag"
              checked={data.enable_recording || false}
              onChange={onUpdate}
            />
            <label htmlFor={`enable_recording-${id}`}>📹 Habilitar Gravação</label>
          </div>

          {data.enable_recording && (
            <>
              <div className="form-row">
                <label htmlFor={`recording_quality-${id}`}>Qualidade da Gravação</label>
                <select
                  id={`recording_quality-${id}`}
                  name="recording_quality"
                  className="nodrag"
                  value={data.recording_quality || 'medium'}
                  onChange={onUpdate}
                >
                  <option value="low">Baixa (Economia)</option>
                  <option value="medium">Média (Balanceado)</option>
                  <option value="high">Alta (Qualidade)</option>
                </select>
              </div>

              <div className="form-row">
                <label htmlFor={`recording_duration-${id}`}>Duração dos Segmentos (min)</label>
                <input
                  id={`recording_duration-${id}`}
                  name="recording_duration"
                  type="number"
                  min="1"
                  max="60"
                  className="nodrag"
                  value={data.recording_duration || 10}
                  onChange={onUpdate}
                />
              </div>

              <div className="form-row">
                <label htmlFor={`retention_days-${id}`}>Retenção das Gravações (dias)</label>
                <input
                  id={`retention_days-${id}`}
                  name="retention_days"
                  type="number"
                  min="1"
                  max="365"
                  className="nodrag"
                  value={data.retention_days || 7}
                  onChange={onUpdate}
                />
              </div>
            </>
          )}
        </div>

        {/* Métricas em Tempo Real */}
        <div className="node-metrics">
          <div className="metric">
            <span className="metric-label">Status:</span>
            <span className="metric-value">{data.connection_status || 'Desconectado'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">FPS Atual:</span>
            <span className="metric-value">{data.current_fps || 0}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Latência:</span>
            <span className="metric-value">{data.latency || 'N/A'}ms</span>
          </div>
          <div className="metric">
            <span className="metric-label">Qualidade do Sinal:</span>
            <span className="metric-value">{data.signal_quality || 'N/A'}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Frames Perdidos:</span>
            <span className="metric-value">{data.dropped_frames || 0}</span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});