-- V5: Add performance indexes for JSONB queries
-- Author: Metadata Versioning Team
-- Date: 2025-11-25

-- GIN index for JSONB content searches in versions table
CREATE INDEX IF NOT EXISTS idx_versions_content_gin 
    ON versions USING GIN (content);

-- GIN index for JSONB schema searches in schema_definitions table
CREATE INDEX IF NOT EXISTS idx_schema_definitions_schema_gin 
    ON schema_definitions USING GIN (schema_json);

-- Index for version queries by publishing state
CREATE INDEX IF NOT EXISTS idx_versions_publishing_state 
    ON versions (publishing_state);

-- Partial index for active versions only (optimizes active version queries)
CREATE INDEX IF NOT EXISTS idx_versions_active_only 
    ON versions (document_id) 
    WHERE is_active = true;

-- Composite index for version history queries
CREATE INDEX IF NOT EXISTS idx_versions_history 
    ON versions (document_id, version_number DESC);

-- Add statistics collection for query planner optimization
ANALYZE metadata_documents;
ANALYZE versions;
ANALYZE schema_definitions;

-- Comments for documentation
COMMENT ON INDEX idx_versions_content_gin IS 'GIN index for fast JSONB content searches and comparisons';
COMMENT ON INDEX idx_schema_definitions_schema_gin IS 'GIN index for JSON Schema validation queries';
COMMENT ON INDEX idx_versions_active_only IS 'Partial index for active version lookups (most common query)';
