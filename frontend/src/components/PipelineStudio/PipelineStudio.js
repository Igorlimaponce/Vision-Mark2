import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, { ReactFlowProvider, addEdge, useNodesState, useEdgesState, Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import NodeSidebar from './NodeSidebar';
import PropertiesPanel from './PropertiesPanel';
import VisualConfigModal from './VisualConfigModal';
import { getPipelines, getPipelineById, savePipeline, deletePipeline } from '../../services/api';

// Importe os nós customizados
import VideoInputNode from './CustomNodes/VideoInputNode';
import ObjectDetectionNode from './CustomNodes/ObjectDetectionNode';
import PolygonFilterNode from './CustomNodes/PolygonFilterNode';
import DirectionFilterNode from './CustomNodes/DirectionFilterNode';
import TrajectoryAnalysisNode from './CustomNodes/TrajectoryAnalysisNode';
import LoiteringDetectionNode from './CustomNodes/LoiteringDetectionNode';
import TelegramNode from './CustomNodes/TelegramNode'; // NOVO
import GenericNode from './CustomNodes/GenericNode';

import './PipelineStudio.css';

// --- Funções Helper ---
let nextNodeId = 0;
const getNextNodeId = () => `node_${Date.now()}_${nextNodeId++}`;

const getInitialNodeData = (type) => {
    switch(type) {
        case 'videoInput':
            return { label: 'Feed de Vídeo' };
        case 'objectDetection':
            return { classes: ['person'], confidence: 0.5, label: 'Detecção de Objetos' };
        case 'polygonFilter':
            return { polygon: [], label: 'Filtro de Área' };
        case 'directionFilter':
            return { 
                line: [], 
                direction_x: 1, 
                direction_y: 0, 
                tolerance: 30, 
                detect_wrong_way: true, 
                label: 'Filtro de Direção' 
            };
        case 'trajectoryAnalysis':
            return { 
                min_trajectory_length: 5, 
                abnormal_speed_threshold: 50.0, 
                prediction_frames: 10, 
                enable_crowd_analysis: true, 
                label: 'Análise de Trajetória' 
            };
        case 'loiteringDetection':
            return { 
                time_threshold: 10, 
                movement_threshold: 20, 
                alert_level: 'medium',
                enable_advanced_tracking: true,
                label: 'Detecção de Vadiagem' 
            };
        case 'faceDetector':
            return { confidence: 0.7, label: 'Detector de Faces' };
        case 'faceEmbedding':
            return { model: 'facenet', label: 'Extrator de Features' };
        case 'faceMatcher':
            return { threshold: 0.6, label: 'Comparador de Faces' };
        case 'telegram': // NOVO
            return { message: 'Alerta: {count} objetos detectados em {camera}!', label: 'Enviar Telegram' };
        case 'email': // NOVO (Placeholder)
            return { label: 'Enviar Email' };
        case 'whatsapp': // NOVO (Placeholder)
            return { label: 'Enviar WhatsApp' };
        case 'dataSink':
            return { event_type: 'CustomEvent', label: 'Salvar Evento' };
        default:
            return { label: `${type} Node` };
    }
};

const PipelineStudio = () => {
    const { id: pipelineIdFromUrl } = useParams();
    const navigate = useNavigate();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [pipelineName, setPipelineName] = useState('');
    const [isPipelineActive, setIsPipelineActive] = useState(true);
    const [pipelineList, setPipelineList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nodeForVisualConfig, setNodeForVisualConfig] = useState(null);

    const nodeTypes = useMemo(() => ({
        videoInput: VideoInputNode,
        objectDetection: ObjectDetectionNode,
        polygonFilter: PolygonFilterNode,
        directionFilter: DirectionFilterNode, // NOVO - Componente específico
        trajectoryAnalysis: TrajectoryAnalysisNode, // NOVO - Componente específico
        loiteringDetection: LoiteringDetectionNode, // NOVO - Componente específico
        telegram: TelegramNode, // NOVO
        // Nós de reconhecimento facial
        faceDetector: (props) => <GenericNode {...props} data={{ ...props.data, type: 'faceDetector' }} />,
        faceEmbedding: (props) => <GenericNode {...props} data={{ ...props.data, type: 'faceEmbedding' }} />,
        faceMatcher: (props) => <GenericNode {...props} data={{ ...props.data, type: 'faceMatcher' }} />,
        // Nós de ação
        dataSink: (props) => <GenericNode {...props} data={{ ...props.data, type: 'dataSink' }} />,
        email: (props) => <GenericNode {...props} data={{ ...props.data, type: 'email' }} />,
        whatsapp: (props) => <GenericNode {...props} data={{ ...props.data, type: 'whatsapp' }} />,
    }), []);

    const fetchPipelineList = useCallback(async () => {
        try {
            const data = await getPipelines();
            setPipelineList(data);
        } catch (error) {
            console.error("Failed to fetch pipeline list", error);
        }
    }, []);

    const handleNewPipeline = useCallback(() => {
        navigate('/pipelines');
    }, [navigate]);
    
    useEffect(() => {
        const loadPipeline = async (id) => {
            setIsLoading(true);
            try {
                const data = await getPipelineById(id);
                const flow = data.graph_data;
                if (flow && flow.nodes) {
                    setNodes(flow.nodes);
                    setEdges(flow.edges || []);
                    nextNodeId = Math.max(0, ...flow.nodes.map(n => parseInt(n.id.split('_')[1] || 0, 10))) + 1;
                } else {
                    setNodes([]);
                    setEdges([]);
                }
                setPipelineName(data.name);
                setIsPipelineActive(data.is_active);
            } catch (error) {
                console.error("Failed to load pipeline", error);
                navigate('/pipelines');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPipelineList();

        if (pipelineIdFromUrl) {
            loadPipeline(pipelineIdFromUrl);
        } else {
            setNodes([]);
            setEdges([]);
            setPipelineName('Novo Pipeline');
            setIsPipelineActive(true);
            setIsLoading(false);
        }
    }, [pipelineIdFromUrl, navigate, fetchPipelineList, setNodes, setEdges]);


    const updateNodeConfig = useCallback((nodeId, newConfig) => {
        setNodes((currentNodes) =>
            currentNodes.map((node) => (node.id === nodeId) ? { ...node, data: { ...node.data, ...newConfig } } : node)
        );
    }, [setNodes]);

    const deleteNode = useCallback((nodeId) => {
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
        setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    }, [setNodes, setEdges]);
    
    const findUpstreamCameraNode = useCallback((startNodeId, currentNodes, currentEdges) => {
        const visited = new Set();
        const queue = [startNodeId];
        while (queue.length > 0) {
            const currentNodeId = queue.shift();
            if (visited.has(currentNodeId)) continue;
            visited.add(currentNodeId);
            const node = currentNodes.find(n => n.id === currentNodeId);
            if (node && node.type === 'videoInput') return node;
            const incomingEdges = currentEdges.filter(edge => edge.target === currentNodeId);
            for (const edge of incomingEdges) {
                if (!visited.has(edge.source)) queue.push(edge.source);
            }
        }
        return null;
    }, []);

    const openVisualConfig = useCallback((nodeId) => {
        const nodeToConfig = nodes.find(n => n.id === nodeId);
        if (!nodeToConfig) return;
        const cameraNode = findUpstreamCameraNode(nodeId, nodes, edges);
        if (!cameraNode) {
            alert("Erro: Conecte este nó a um 'Feed de Vídeo' para configurar a área.");
            return;
        }
        setNodeForVisualConfig({ targetNode: nodeToConfig, cameraNode: cameraNode });
    }, [nodes, edges, findUpstreamCameraNode]);

    const closeVisualConfig = () => setNodeForVisualConfig(null);

    const nodesWithCallbacks = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onConfigChange: updateNodeConfig,
                onDeleteNode: deleteNode,
                onOpenVisualConfig: openVisualConfig
            }
        }));
    }, [nodes, updateNodeConfig, deleteNode, openVisualConfig]);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        if (!type || !reactFlowInstance) return;
        const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newNode = { id: getNextNodeId(), type, position, data: getInitialNodeData(type) };
        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, setNodes]);
    
    const handleSavePipeline = useCallback(async () => {
        if (!pipelineName) return alert('Por favor, dê um nome ao pipeline.');
        if (!reactFlowInstance) return;
        const graph_data = reactFlowInstance.toObject();
        const pipelineData = { id: pipelineIdFromUrl || null, name: pipelineName, is_active: isPipelineActive, graph_data };
        try {
            const saved = await savePipeline(pipelineData);
            alert(`Pipeline '${saved.name}' salvo com sucesso!`);
            await fetchPipelineList();
            if (!pipelineIdFromUrl) navigate(`/pipelines/${saved.id}`);
        } catch (error) {
            alert('Falha ao salvar o pipeline.');
            console.error(error);
        }
    }, [pipelineName, reactFlowInstance, pipelineIdFromUrl, isPipelineActive, fetchPipelineList, navigate]);
    
    const handleDeletePipeline = useCallback(async () => {
        if (!pipelineIdFromUrl) return;
        if (window.confirm(`Tem certeza que deseja deletar o pipeline '${pipelineName}'?`)) {
            try {
                await deletePipeline(pipelineIdFromUrl);
                alert('Pipeline deletado com sucesso.');
                navigate('/pipelines');
            } catch (error) {
                alert('Falha ao deletar o pipeline.');
            }
        }
    }, [pipelineIdFromUrl, pipelineName, navigate]);

    if (isLoading) {
        return <div className="loading-state">Carregando Estúdio de Pipeline...</div>
    }

    return (
        <div className="pipeline-studio-layout">
            <ReactFlowProvider>
                <NodeSidebar />
                <div className="reactflow-wrapper">
                    <ReactFlow
                        nodes={nodesWithCallbacks}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={(params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00aaff', strokeWidth: 2 } }, eds))}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={(e) => {e.preventDefault(); e.dataTransfer.dropEffect = 'move';}}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background color="#3d444e" gap={20}/>
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
                </div>
                <PropertiesPanel
                    pipelineName={pipelineName}
                    setPipelineName={setPipelineName}
                    isPipelineActive={isPipelineActive}
                    setIsPipelineActive={setIsPipelineActive}
                    onSave={handleSavePipeline}
                    onDelete={handleDeletePipeline}
                    onNew={handleNewPipeline}
                    pipelineList={pipelineList}
                    currentPipelineId={pipelineIdFromUrl}
                />
            </ReactFlowProvider>

            {nodeForVisualConfig && (
                <VisualConfigModal
                    configData={nodeForVisualConfig}
                    onSave={updateNodeConfig}
                    onClose={closeVisualConfig}
                />
            )}
        </div>
    );
};

export default PipelineStudio;