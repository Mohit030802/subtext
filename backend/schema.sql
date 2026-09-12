-- ============================================================
--  Subtext — AI Contract Intelligence Platform
--  Schema v1.0
--  Run this in pgAdmin on: subtext_db_local
--
--  Tables (8):
--    1. users
--    2. clients
--    3. projects
--    4. documents
--    5. clause_risks
--    6. obligations
--    7. chat_sessions
--    8. chat_messages
--
--  Note: document_chunks / vector embeddings are managed
--        automatically by langchain-postgres (PGVector).
--        Those tables (langchain_pg_collection,
--        langchain_pg_embedding) are created at runtime.
-- ============================================================


-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- pgvector: required for LangChain RAG pipeline (install separately on Windows).
-- Download from https://github.com/pgvector/pgvector/releases (pg17 windows zip)
-- Copy vector.dll → PostgreSQL\17\lib\
-- Copy vector.control + vector--*.sql → PostgreSQL\17\share\extension\
-- Then uncomment the line below and re-run:
-- CREATE EXTENSION IF NOT EXISTS "vector";


-- ============================================================
--  1. USERS
--  Stores Google OAuth profiles. One row per signed-in user.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255)  NOT NULL UNIQUE,
    name           VARCHAR(255),
    google_id      VARCHAR(255)  NOT NULL UNIQUE,
    avatar_url     VARCHAR(500),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users               IS 'Google OAuth user profiles';
COMMENT ON COLUMN users.google_id     IS 'Google sub claim — unique per Google account';
COMMENT ON COLUMN users.avatar_url    IS 'Google profile picture URL';

CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);


-- ============================================================
--  2. CLIENTS
--  Top-level entity. A client is a company or individual
--  whose contracts you manage.
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(255)  NOT NULL,
    industry       VARCHAR(100),
    contact_name   VARCHAR(255),
    contact_email  VARCHAR(255),
    notes          TEXT,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  clients          IS 'Top-level client organisations';
COMMENT ON COLUMN clients.industry IS 'e.g. Healthcare, Finance, Technology, Real Estate';

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);


-- ============================================================
--  3. PROJECTS
--  A named grouping of documents under a client.
--  e.g. "Q1 2025 Vendor Contracts"
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id      UUID          NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
    name           VARCHAR(255)  NOT NULL,
    description    TEXT,
    status         VARCHAR(50)   NOT NULL DEFAULT 'ACTIVE'
                                 CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  projects        IS 'Document groupings under a client';
COMMENT ON COLUMN projects.status IS 'ACTIVE | COMPLETED | ARCHIVED';

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status    ON projects (status);


-- ============================================================
--  4. DOCUMENTS
--  Central table. One row per uploaded contract/file.
--  AI analysis results are stored directly on this row
--  (risk_score, summary JSONB) once processing is complete.
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,

    -- File metadata
    title            VARCHAR(500)  NOT NULL,
    doc_type         VARCHAR(50)   NOT NULL DEFAULT 'OTHER'
                                   CHECK (doc_type IN ('NDA','MSA','SOW','SLA','HIRING','OTHER')),
    file_path        VARCHAR(1000),
    file_name        VARCHAR(500),
    file_size_bytes  BIGINT,
    mime_type        VARCHAR(100),
    page_count       INTEGER,

    -- Processing state
    status           VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
                                   CHECK (status IN ('PENDING','PROCESSING','ANALYZED','FAILED')),

    -- AI analysis results
    risk_score       VARCHAR(10)   CHECK (risk_score IN ('HIGH','MEDIUM','LOW')),
    summary          JSONB,
    -- summary shape:
    -- {
    --   "key_takeaways":    ["...", "..."],
    --   "core_obligations": ["...", "..."],
    --   "effective_date":   "2025-01-01",
    --   "expiry_date":      "2026-01-01",
    --   "parties":          ["Acme Corp", "Vendor Ltd"]
    -- }

    raw_text         TEXT,         -- Full extracted text (PDF/OCR output)

    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    analyzed_at      TIMESTAMPTZ               -- NULL until AI analysis completes
);

COMMENT ON TABLE  documents            IS 'Uploaded contracts and their AI analysis results';
COMMENT ON COLUMN documents.status     IS 'PENDING → PROCESSING → ANALYZED | FAILED';
COMMENT ON COLUMN documents.risk_score IS 'Overall AI risk verdict: HIGH | MEDIUM | LOW';
COMMENT ON COLUMN documents.summary    IS 'JSONB: key_takeaways, core_obligations, effective_date, parties';
COMMENT ON COLUMN documents.raw_text   IS 'Full text extracted via PyMuPDF / Tesseract OCR';

CREATE INDEX IF NOT EXISTS idx_documents_project_id  ON documents (project_id);
CREATE INDEX IF NOT EXISTS idx_documents_status       ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_risk_score   ON documents (risk_score);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type     ON documents (doc_type);


-- ============================================================
--  5. CLAUSE_RISKS
--  AI-detected risky clauses within a document.
--  One row per identified risk clause.
-- ============================================================
CREATE TABLE IF NOT EXISTS clause_risks (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id      UUID          NOT NULL REFERENCES documents (id) ON DELETE CASCADE,

    clause_text      TEXT          NOT NULL,
    risk_level       VARCHAR(10)   NOT NULL
                                   CHECK (risk_level IN ('HIGH','MEDIUM','LOW')),
    explanation      TEXT          NOT NULL,   -- Why this clause is risky
    suggested_redline TEXT,                    -- AI-suggested replacement text (nullable)

    page_number      INTEGER,
    position_start   INTEGER,                  -- Char offset in raw_text (nullable)
    position_end     INTEGER,                  -- Char offset in raw_text (nullable)

    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  clause_risks                  IS 'AI-detected risk clauses per document';
COMMENT ON COLUMN clause_risks.suggested_redline IS 'AI-generated replacement clause for negotiation';
COMMENT ON COLUMN clause_risks.position_start    IS 'Character offset into documents.raw_text for highlighting';

CREATE INDEX IF NOT EXISTS idx_clause_risks_document_id ON clause_risks (document_id);
CREATE INDEX IF NOT EXISTS idx_clause_risks_risk_level  ON clause_risks (risk_level);


-- ============================================================
--  6. OBLIGATIONS
--  Deadlines, payments, renewals, and deliverables extracted
--  from documents. project_id is denormalized here so the
--  dashboard can query across all docs without extra joins.
-- ============================================================
CREATE TABLE IF NOT EXISTS obligations (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID          NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
    project_id          UUID          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,

    title               VARCHAR(500)  NOT NULL,
    description         TEXT,
    due_date            DATE,

    obligation_type     VARCHAR(50)   NOT NULL DEFAULT 'OTHER'
                                      CHECK (obligation_type IN (
                                          'RENEWAL_NOTICE','PAYMENT','DELIVERABLE',
                                          'EXPIRY','COMPLIANCE','OTHER'
                                      )),

    party_responsible   VARCHAR(50)   NOT NULL DEFAULT 'US'
                                      CHECK (party_responsible IN ('CLIENT','US','THIRD_PARTY')),

    status              VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                                      CHECK (status IN ('PENDING','COMPLETED','OVERDUE')),

    is_synced_calendar  BOOLEAN       NOT NULL DEFAULT FALSE,
    calendar_event_id   VARCHAR(255),          -- Google Calendar event ID (nullable)

    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  obligations                       IS 'Deadlines and obligations extracted from documents';
COMMENT ON COLUMN obligations.project_id            IS 'Denormalized from document→project for fast dashboard queries';
COMMENT ON COLUMN obligations.calendar_event_id     IS 'Set after syncing to Google Calendar';

CREATE INDEX IF NOT EXISTS idx_obligations_document_id ON obligations (document_id);
CREATE INDEX IF NOT EXISTS idx_obligations_project_id  ON obligations (project_id);
CREATE INDEX IF NOT EXISTS idx_obligations_due_date    ON obligations (due_date);
CREATE INDEX IF NOT EXISTS idx_obligations_status      ON obligations (status);


-- ============================================================
--  7. CHAT_SESSIONS
--  A Vault Chat conversation thread tied to a document.
--  One document can have multiple sessions over time.
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID          NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
    title        VARCHAR(500),                 -- Auto-set to document title on creation
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chat_sessions IS 'Vault Chat conversation threads per document';

CREATE INDEX IF NOT EXISTS idx_chat_sessions_document_id ON chat_sessions (document_id);


-- ============================================================
--  8. CHAT_MESSAGES
--  Individual messages in a chat session.
--  citations JSONB is populated for assistant messages by
--  LangChain's retriever (which chunks were used to answer).
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID          NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,

    role        VARCHAR(20)   NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT          NOT NULL,

    citations   JSONB,
    -- citations shape (assistant messages only):
    -- [
    --   { "chunk_id": "uuid", "page": 3, "text_snippet": "..." },
    --   ...
    -- ]

    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  chat_messages           IS 'Individual Vault Chat messages';
COMMENT ON COLUMN chat_messages.citations IS 'JSONB array of source chunks used by the AI to answer';

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role       ON chat_messages (role);


-- ============================================================
--  Done!
--  LangChain will auto-create at runtime:
--    - langchain_pg_collection
--    - langchain_pg_embedding  (with VECTOR(768) column)
--  using: PGVector.create_tables_if_not_exist()
-- ============================================================
