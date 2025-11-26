package com.metadata.versioning.domain.exception;

import java.util.List;

/**
 * Exception thrown when a JSON document violates its schema definition.
 */
public class SchemaViolationException extends DomainException {

    private final String type;
    private final List<String> violations;

    public SchemaViolationException(String type, List<String> violations) {
        super("Schema validation failed for type '" + type + "': " + String.join(", ", violations));
        this.type = type;
        this.violations = violations;
    }

    @Override
    public String getErrorCode() {
        return "SCHEMA_VIOLATION";
    }

    public String getType() {
        return type;
    }

    public List<String> getViolations() {
        return violations;
    }
}
