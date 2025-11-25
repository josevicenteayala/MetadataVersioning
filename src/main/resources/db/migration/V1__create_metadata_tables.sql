-- Metadata Versioning Service - Initial Schema
-- Creates tables for metadata documents, versions, and related entities

-- Metadata Documents table (aggregate root)
CREATE TABLE metadata_documents (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (type, name)
);

CREATE INDEX idx_metadata_documents_type ON metadata_documents(type);
CREATE INDEX idx_metadata_documents_name ON metadata_documents(name);

-- Versions table (immutable snapshots)
CREATE TABLE versions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES metadata_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_summary TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (document_id, version_number),
    CHECK (version_number > 0)
);

CREATE INDEX idx_versions_document_id ON versions(document_id);
CREATE INDEX idx_versions_version_number ON versions(document_id, version_number);
CREATE INDEX idx_versions_is_active ON versions(document_id, is_active) WHERE is_active = TRUE;
-- GIN index for JSONB content queries
CREATE INDEX idx_versions_content_gin ON versions USING GIN (content);

-- Comments
COMMENT ON TABLE metadata_documents IS 'Aggregate root for metadata documents with versioning';
COMMENT ON TABLE versions IS 'Immutable version snapshots with JSONB content storage';

COMMENT ON COLUMN versions.content IS 'JSON metadata content stored as JSONB for efficient queries';
COMMENT ON COLUMN versions.is_active IS 'Only one version per document can be active at a time';
