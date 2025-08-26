import axios from 'axios';

// Instância centralizada do Axios que utiliza o proxy do Nginx.
const apiClient = axios.create({
  baseURL: '/api', // Todas as requisições serão prefixadas com /api
  timeout: 10000, // Tempo limite de 10 segundos
});

// Add authentication token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- API DE EVENTOS ---
export const getEvents = async (limit = 50, offset = 0) => {
  try {
    const response = await apiClient.get('/events', { params: { limit, offset } });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// --- API DE PIPELINES ---
export const getPipelines = async () => {
    try {
        const response = await apiClient.get('/pipelines');
        return response.data;
    } catch (error) {
        console.error('Error fetching pipelines:', error);
        throw error;
    }
};

export const getPipelineById = async (id) => {
    try {
        const response = await apiClient.get(`/pipelines/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching pipeline ${id}:`, error);
        throw error;
    }
};

export const savePipeline = async (pipelineData) => {
    const { id, name, graph_data, is_active } = pipelineData;
    const payload = { name, graph_data, is_active };

    try {
        if (id) {
            const response = await apiClient.put(`/pipelines/${id}`, payload);
            return response.data;
        } else {
            const response = await apiClient.post('/pipelines', payload);
            return response.data;
        }
    } catch (error) {
        console.error('Error saving pipeline:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const deletePipeline = async (id) => {
    try {
        await apiClient.delete(`/pipelines/${id}`);
    } catch (error) {
        console.error(`Error deleting pipeline ${id}:`, error);
        throw error;
    }
};

// --- API DE CÂMARAS ---
export const getCameras = async () => {
  try {
    const response = await apiClient.get('/cameras');
    return response.data;
  } catch (error) {
    console.error('Error fetching cameras:', error);
    throw error;
  }
};

export const addCamera = async (cameraData) => {
    try {
        const response = await apiClient.post('/cameras', cameraData);
        return response.data;
    } catch (error) {
        console.error('Error creating camera:', error.response.data);
        throw error;
    }
};

export const updateCamera = async (id, cameraData) => {
    try {
        const response = await apiClient.put(`/cameras/${id}`, cameraData);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar câmera:", error);
        throw error;
    }
};

export const deleteCamera = async (id) => {
    try {
        await apiClient.delete(`/cameras/${id}`);
    } catch (error) {
        console.error("Erro ao deletar câmera:", error);
        throw error;
    }
};

export const getCameraSnapshot = async (id) => {
     try {
        const response = await apiClient.get(`/cameras/${id}/snapshot`, { responseType: 'blob' });
        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error("Erro ao buscar snapshot:", error);
        return `https://via.placeholder.com/800x600.png?text=Erro+ao+carregar+snapshot`;
    }
}

export const testCameraConnection = async (rtsp_url) => {
    try {
        await apiClient.post('/cameras/test', { rtsp_url });
        return { success: true };
    } catch (error) {
        console.error("Erro ao testar conexão da câmera:", error);
        return { success: false, message: error.response?.data?.detail || "Falha na comunicação com o servidor." };
    }
}

export const getIdentities = async () => {
  try {
    const response = await apiClient.get('/identities'); // Corrigido para apiClient
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar identidades:", error.response?.data || error.message);
    throw error;
  }
};

export const createIdentity = async (formData) => {
  try {
    const response = await apiClient.post('/identities', formData, { // Corrigido para apiClient
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar identidade:", error.response?.data?.detail || error.message);
    throw error.response?.data?.detail || "Erro desconhecido ao criar identidade.";
  }
};

export const deleteIdentity = async (id) => {
  try {
    await apiClient.delete(`/identities/${id}`); // Corrigido para apiClient
  } catch (error) {
    console.error(`Erro ao deletar identidade ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const matchIdentity = async (embedding) => {
    try {
        const response = await apiClient.post('/identities/match', { embedding }); // Corrigido para apiClient
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar correspondência de identidade:", error.response?.data || error.message);
        throw error;
    }
};