import React, { useState, useEffect, useCallback } from 'react';
import { getCameras, addCamera, deleteCamera, testCameraConnection } from '../../services/api';
import { FiPlusCircle, FiTrash2, FiVideo, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './CameraManager.css';

const CameraManager = () => {
    const [cameras, setCameras] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [newCameraName, setNewCameraName] = useState('');
    const [newCameraUrl, setNewCameraUrl] = useState('');
    
    // NOVO: Estado para controlar o teste da câmera
    const [testStatus, setTestStatus] = useState({ status: 'idle', message: '' }); // idle, testing, success, error

    const fetchCameras = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getCameras();
            setCameras(data);
            setError('');
        } catch (err) {
            setError('Falha ao carregar a lista de câmeras.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCameras();
    }, [fetchCameras]);

    const handleAddCamera = async (e) => {
        e.preventDefault();
        if (!newCameraName || !newCameraUrl) {
            alert('Por favor, preencha o nome e a URL da câmera.');
            return;
        }
        try {
            await addCamera({ name: newCameraName, rtsp_url: newCameraUrl });
            setNewCameraName('');
            setNewCameraUrl('');
            setTestStatus({ status: 'idle', message: '' });
            fetchCameras();
        } catch (err) {
            alert('Falha ao adicionar a câmera.');
        }
    };

    const handleDeleteCamera = async (id) => {
        if (window.confirm('Tem certeza que deseja remover esta câmera?')) {
            try {
                await deleteCamera(id);
                fetchCameras();
            } catch (err) {
                alert('Falha ao remover a câmera.');
            }
        }
    };

    // NOVO: Função para testar a conexão da URL RTSP
    const handleTestConnection = async () => {
        if (!newCameraUrl) {
            alert("Por favor, insira uma URL RTSP para testar.");
            return;
        }
        setTestStatus({ status: 'testing', message: 'Testando...' });
        const result = await testCameraConnection(newCameraUrl);
        if (result.success) {
            setTestStatus({ status: 'success', message: 'Conexão bem-sucedida!' });
        } else {
            setTestStatus({ status: 'error', message: `Falha na conexão: ${result.message}` });
        }
    };

    // NOVO: Componente para renderizar o ícone de status do teste
    const TestStatusIcon = () => {
        switch (testStatus.status) {
            case 'testing':
                return <FiLoader className="status-icon spin-icon" title={testStatus.message} />;
            case 'success':
                return <FiCheckCircle className="status-icon success" title={testStatus.message} />;
            case 'error':
                return <FiAlertCircle className="status-icon error" title={testStatus.message} />;
            default:
                return null;
        }
    };

    return (
        <div className="camera-manager-container">
            <header className="manager-header">
                <h1>Gerenciador de Câmeras</h1>
                <p>Adicione, teste e configure suas fontes de vídeo aqui.</p>
            </header>

            <div className="manager-content">
                <div className="camera-list-section">
                    <h2>Câmeras Cadastradas</h2>
                    {isLoading && <p>Carregando...</p>}
                    {error && <p className="error-message">{error}</p>}
                    {!isLoading && cameras.length === 0 && (
                        <p className="empty-state">Nenhuma câmera cadastrada ainda.</p>
                    )}
                    <ul className="camera-list">
                        {cameras.map(cam => (
                            <li key={cam.id} className="camera-item">
                                <div className="camera-info">
                                    <FiVideo className="camera-icon" />
                                    <div>
                                        <span className="camera-name">{cam.name}</span>
                                        <span className="camera-url">{cam.rtsp_url}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteCamera(cam.id)} className="delete-button">
                                    <FiTrash2 />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="add-camera-section">
                    <h2>Adicionar Nova Câmera</h2>
                    <form onSubmit={handleAddCamera} className="add-camera-form">
                        <div className="form-group">
                            <label htmlFor="camera-name">Nome da Câmera</label>
                            <input
                                id="camera-name"
                                type="text"
                                value={newCameraName}
                                onChange={e => setNewCameraName(e.target.value)}
                                placeholder="Ex: Câmera da Entrada"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="camera-url">URL RTSP</label>
                            <div className="input-with-button">
                                <input
                                    id="camera-url"
                                    type="text"
                                    value={newCameraUrl}
                                    onChange={e => {
                                        setNewCameraUrl(e.target.value);
                                        setTestStatus({ status: 'idle', message: '' }); // Reseta o status ao digitar
                                    }}
                                    placeholder="rtsp://..."
                                />
                                <button type="button" onClick={handleTestConnection} className="test-button" disabled={testStatus.status === 'testing'}>
                                    Testar
                                </button>
                                <TestStatusIcon />
                            </div>
                            { (testStatus.status === 'success' || testStatus.status === 'error') && (
                                <p className={`status-message ${testStatus.status}`}>{testStatus.message}</p>
                            )}
                        </div>
                        <button type="submit" className="add-button">
                            <FiPlusCircle /> Adicionar Câmera
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CameraManager;
