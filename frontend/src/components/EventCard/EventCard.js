import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCamera, FiTag } from 'react-icons/fi';
import './EventCard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const EventCard = ({ event }) => {
  const { timestamp, camera_name, event_type, message, media_path } = event;

  const eventDate = new Date(timestamp);
  const timeAgo = formatDistanceToNow(eventDate, { addSuffix: true, locale: ptBR });
  const fullDate = format(eventDate, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });

  const imageUrl = media_path ? `${API_BASE_URL}${media_path}` : 'https://via.placeholder.com/400x300.png?text=Sem+Imagem';

  return (
    <div className="event-card">
      <div className="event-image-wrapper">
        <img
          src={imageUrl}
          alt={event_type}
          className="event-image"
          onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/400x300.png?text=Erro+ao+Carregar' }}
        />
      </div>
      <div className="event-content">
        <div className="event-header">
          <span className="event-type">
            <FiTag /> {event_type}
          </span>
          <span className="event-camera">
            <FiCamera /> {camera_name}
          </span>
        </div>
        <p className="event-message">{message}</p>
        <div className="event-footer">
          <span className="event-timestamp" title={fullDate}>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;