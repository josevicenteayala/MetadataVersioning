CREATE TABLE metadata_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    json JSONB NOT NULL,
    version INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_metadata_entry_type_name_version UNIQUE (type, name, version),
    CONSTRAINT chk_version_positive CHECK (version > 0)
);

CREATE INDEX idx_metadata_entry_type_name_active ON metadata_entry (type, name, is_active);
CREATE INDEX idx_metadata_entry_type ON metadata_entry (type);
CREATE INDEX idx_metadata_entry_name ON metadata_entry (name);
CREATE INDEX idx_metadata_entry_active ON metadata_entry (is_active) WHERE is_active = true;
CREATE INDEX idx_metadata_entry_json ON metadata_entry USING GIN (json);