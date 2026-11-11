-- Preserve every uploaded revision as a row in documents.
-- Run this once against an existing Subtext database before deploying the API.
BEGIN;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_family_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_latest BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Existing documents become version 1 of their own family.
UPDATE documents
SET document_family_id = id
WHERE document_family_id IS NULL;

ALTER TABLE documents ALTER COLUMN document_family_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_family_id ON documents (document_family_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_latest ON documents (is_latest);
CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_family_version
    ON documents (document_family_id, version_number);

COMMIT;
