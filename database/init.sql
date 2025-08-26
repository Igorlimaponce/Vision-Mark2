-- Garante que a extensão TimescaleDB esteja disponível
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Garante que o banco de dados seja criado corretamente
SELECT 'CREATE DATABASE jarvis_vision' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'jarvis_vision')\gexec

-- Conecta ao banco correto
\c jarvis_vision;

-- Tabela para armazenar as configurações das câmaras
CREATE TABLE cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    rtsp_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE cameras IS 'Armazena as configurações das câmaras de vídeo geridas pela UI.';

-- Tabela para armazenar as definições dos pipelines
CREATE TABLE pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    graph_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE pipelines IS 'Armazena as definições de pipeline de visão computacional criadas pelo usuário.';

-- Função de Trigger para atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica o trigger a ambas as tabelas
CREATE TRIGGER set_timestamp_cameras
BEFORE UPDATE ON cameras
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_pipelines
BEFORE UPDATE ON pipelines
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Tabela principal para armazenar todos os eventos detectados
CREATE TABLE events (
    id BIGSERIAL NOT NULL,
    pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    camera_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    message TEXT,
    media_path VARCHAR(255),
    details JSONB,
    PRIMARY KEY (id, timestamp)
);

COMMENT ON TABLE events IS 'Tabela para registrar todos os eventos de visão computacional.';
COMMENT ON COLUMN events.pipeline_id IS 'Referência ao pipeline que originou este evento.';

-- Converte a tabela 'events' em uma hypertabela do TimescaleDB
SELECT create_hypertable('events', 'timestamp', if_not_exists => TRUE);

-- Habilita a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para armazenar informações sobre as identidades (pessoas)
CREATE TABLE identities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar os embeddings faciais associados a cada identidade
CREATE TABLE face_embeddings (
    id SERIAL PRIMARY KEY,
    identity_id INTEGER NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    embedding vector(512), -- Vetor de 512 dimensões para o embedding do ArcFace
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cria um índice IVFFlat para buscas vetoriais de similaridade de cosseno (ANN)
-- Este índice acelera drasticamente a busca por vetores similares.
CREATE INDEX ON face_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH
  (lists = 100);

-- Função para encontrar o rosto mais similar
-- Recebe um embedding e um limiar de similaridade, e retorna a identidade correspondente.
CREATE OR REPLACE FUNCTION match_face(
    query_embedding vector(512),
    match_threshold float
)
RETURNS TABLE (
    identity_id integer,
    name character varying,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.name,
        1 - (fe.embedding <=> query_embedding) AS cosine_similarity
    FROM
        face_embeddings fe
    JOIN
        identities i ON i.id = fe.identity_id
    WHERE 1 - (fe.embedding <=> query_embedding) > match_threshold
    ORDER BY
        cosine_similarity DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer'
);

-- Usuário administrador padrão (criado automaticamente)
-- Usuário: admin | Senha: JarvisAdmin2025!@#$ | Role: admin
-- Hash gerado com bcrypt para máxima segurança
INSERT INTO users (username, hashed_password, role) 
VALUES ('admin', '$2b$12$jdHKG/lSMQfJNonsifHk8.P.6cvzJSLI5ppXh5ANjPvdzmy6AFGsq', 'admin') 
ON CONFLICT (username) DO NOTHING;


-- Índices para otimizar as consultas mais comuns
CREATE INDEX IF NOT EXISTS idx_events_pipeline_id ON events (pipeline_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_camera_name ON events (camera_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gin_details ON events USING GIN (details);