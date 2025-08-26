import React, { useState, useEffect } from 'react';
import { getEvents } from '../../services/api';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket';
import EventCard from '../EventCard/EventCard';
import './Dashboard.css';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialEvents = async () => {
    try {
      const response = await getEvents(50);
      setEvents(response);
    } catch (err) {
      setError('Falha ao carregar eventos iniciais.');
      console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialEvents();

    const onNewEvent = (event) => {
        try {
            const newEventData = JSON.parse(event.data);
            setEvents(prevEvents => [newEventData, ...prevEvents].slice(0, 100));
        } catch(e) {
            console.error("Falha ao processar evento do websocket", e);
        }
    };

    connectWebSocket(onNewEvent);

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Painel de Eventos</h1>
        <p>Visualização em tempo real dos eventos detectados pelos pipelines.</p>
      </header>
      {error && <p className="error-message">{error}</p>}
      {isLoading && <p>Carregando eventos...</p>}
      {!isLoading && events.length === 0 && <p>Nenhum evento detectado ainda.</p>}
      <div className="event-list">
        {events.map((event) => (
          <EventCard key={`${event.id}-${event.timestamp}`} event={event} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;