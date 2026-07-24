-- ============================================
-- TicketDesk - Tablas para Supabase PostgreSQL
-- ============================================

-- 1. usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id       SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre   TEXT NOT NULL,
    rol      TEXT NOT NULL CHECK (rol IN ('tecnico','usuario')),
    area     TEXT
);

-- 2. tickets
CREATE TABLE IF NOT EXISTS tickets (
    id             SERIAL PRIMARY KEY,
    numero         TEXT UNIQUE NOT NULL,
    descripcion    TEXT NOT NULL,
    categoria      TEXT NOT NULL,
    area           TEXT NOT NULL,
    sistema        TEXT,
    prioridad      TEXT NOT NULL,
    estado         TEXT NOT NULL DEFAULT 'Pendiente',
    tecnico        TEXT,
    usuario        TEXT NOT NULL,
    diagnostico    TEXT,
    solucion       TEXT,
    fecha_creacion TIMESTAMP NOT NULL,
    fecha_cierre   TIMESTAMP,
    adjunto        TEXT
);

-- 3. historial
CREATE TABLE IF NOT EXISTS historial (
    id        SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    evento    TEXT NOT NULL,
    fecha     TIMESTAMP NOT NULL
);

-- 4. base_conocimiento
CREATE TABLE IF NOT EXISTS base_conocimiento (
    id          SERIAL PRIMARY KEY,
    categoria   TEXT NOT NULL,
    titulo      TEXT NOT NULL,
    descripcion TEXT,
    solucion    TEXT NOT NULL,
    usos        INTEGER DEFAULT 0
);