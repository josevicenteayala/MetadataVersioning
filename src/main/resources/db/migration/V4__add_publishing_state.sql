-- Add publishing state column to versions table
ALTER TABLE versions
ADD COLUMN publishing_state VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- Add check constraint for valid states
ALTER TABLE versions
ADD CONSTRAINT chk_publishing_state CHECK (publishing_state IN ('DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED'));

-- Create index for querying by publishing state
CREATE INDEX idx_versions_publishing_state ON versions(publishing_state);
