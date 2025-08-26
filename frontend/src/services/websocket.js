let socket = null;
let reconnectInterval = null;

const getWebSocketURL = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/events`;
};

const attemptReconnect = (onMessageCallback) => {
    if (reconnectInterval) return; // Já está a tentar reconectar
    console.log('Scheduling reconnect in 5 seconds...');
    reconnectInterval = setInterval(() => {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket(onMessageCallback);
    }, 5000);
};

export const connectWebSocket = (onMessageCallback) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket is already connected.');
    return;
  }
  
  const wsUrl = getWebSocketURL();
  console.log('Connecting WebSocket to:', wsUrl);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket Connected');
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }
  };

  socket.onmessage = (event) => {
    onMessageCallback(event);
  };

  socket.onclose = () => {
    console.log('WebSocket Disconnected');
    attemptReconnect(onMessageCallback);
  };

  socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
    socket.close(); // Garante que o onclose seja chamado
  };
};

export const disconnectWebSocket = () => {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
};