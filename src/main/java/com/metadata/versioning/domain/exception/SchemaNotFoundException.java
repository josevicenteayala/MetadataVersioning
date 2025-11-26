package com.metadata.versioning.domain.exception;

/**
 * Exception thrown when a schema definition is not found.
 */
public class SchemaNotFoundException extends DomainException {

    private final String type;

    public SchemaNotFoundException(String type) {
        super("Schema not found for type: " + type);
        this.type = type;
    }

    @Override
    public String getErrorCode() {
        return "SCHEMA_NOT_FOUND";
    }

    public String getType() {
        return type;
    }
}
