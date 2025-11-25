-- V3: Create audit trail tables for tracking all mutations
-- Author: Metadata Versioning Team
-- Date: 2025-11-25

CREATE TABLE IF NOT EXISTS audit_entries (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changes JSONB,
    correlation_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_entries (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_entries (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_entries (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit_entries (correlation_id);

-- Add comments for documentation
COMMENT ON TABLE audit_entries IS 'Audit trail for all mutations to metadata documents and versions';
COMMENT ON COLUMN audit_entries.entity_type IS 'Type of entity modified (MetadataDocument, Version, SchemaDefinition)';
COMMENT ON COLUMN audit_entries.entity_id IS 'Unique identifier of the modified entity';
COMMENT ON COLUMN audit_entries.operation IS 'Operation performed (CREATE, UPDATE, DELETE, ACTIVATE, PUBLISH)';
COMMENT ON COLUMN audit_entries.user_id IS 'User who performed the operation';
COMMENT ON COLUMN audit_entries.changes IS 'JSON representation of before/after values';
COMMENT ON COLUMN audit_entries.correlation_id IS 'Request correlation ID for distributed tracing';
