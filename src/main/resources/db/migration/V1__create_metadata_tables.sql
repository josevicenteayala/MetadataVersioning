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
    publishing_state VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    schema_warning BOOLEAN NOT NULL DEFAULT FALSE,
    schema_warning_timestamp TIMESTAMP,
    UNIQUE (document_id, version_number),
    CHECK (version_number > 0)
);

CREATE INDEX idx_versions_document_id ON versions(document_id);
CREATE INDEX idx_versions_version_number ON versions(document_id, version_number);
CREATE INDEX idx_versions_is_active ON versions(document_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_versions_publishing_state ON versions(publishing_state);
-- GIN index for JSONB content queries
CREATE INDEX idx_versions_content_gin ON versions USING GIN (content);

-- Schema Definitions table
CREATE TABLE schema_definitions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL UNIQUE,
    schema JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    allows_extensions BOOLEAN NOT NULL DEFAULT TRUE,
    extension_rules JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL
);

CREATE INDEX idx_schema_definitions_type ON schema_definitions(type);

-- Audit Entries table
CREATE TABLE audit_entries (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES metadata_documents(id) ON DELETE SET NULL,
    version_id BIGINT REFERENCES versions(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

CREATE INDEX idx_audit_entries_document_id ON audit_entries(document_id);
CREATE INDEX idx_audit_entries_timestamp ON audit_entries(timestamp DESC);
CREATE INDEX idx_audit_entries_actor ON audit_entries(actor);

-- Comments
COMMENT ON TABLE metadata_documents IS 'Aggregate root for metadata documents with versioning';
COMMENT ON TABLE versions IS 'Immutable version snapshots with JSONB content storage';
COMMENT ON TABLE schema_definitions IS 'Schema validation rules per metadata type';
COMMENT ON TABLE audit_entries IS 'Audit trail for compliance and tracking';

COMMENT ON COLUMN versions.content IS 'JSON metadata content stored as JSONB for efficient queries';
COMMENT ON COLUMN versions.is_active IS 'Only one version per document can be active at a time';
COMMENT ON COLUMN versions.schema_warning IS 'Flag indicating version violates current schema';
COMMENT ON COLUMN schema_definitions.extension_rules IS 'Rules for custom property validation';
