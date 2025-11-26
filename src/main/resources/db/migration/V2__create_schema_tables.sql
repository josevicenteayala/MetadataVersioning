-- V2: Create schema_definitions table for JSON Schema storage

CREATE TABLE schema_definitions (
    type VARCHAR(255) PRIMARY KEY,
    schema_json JSONB NOT NULL,
    description TEXT,
    strict_mode BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying schemas
CREATE INDEX idx_schema_definitions_type ON schema_definitions(type);

-- Add comment for documentation
COMMENT ON TABLE schema_definitions IS 'JSON Schema definitions for validating metadata documents';
COMMENT ON COLUMN schema_definitions.type IS 'Metadata type (e.g., loyalty-program, campaign)';
COMMENT ON COLUMN schema_definitions.schema_json IS 'JSON Schema definition stored as JSONB';
COMMENT ON COLUMN schema_definitions.strict_mode IS 'If true, validation failures throw exceptions; if false, return warnings';
