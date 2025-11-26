package com.metadata.versioning.domain.exception;

/**
 * Exception thrown when attempting to create a schema that already exists.
 */
public class SchemaAlreadyExistsException extends DomainException {

    private final String type;

    public SchemaAlreadyExistsException(String type) {
        super("Schema definition already exists for type: " + type);
        this.type = type;
    }

    @Override
    public String getErrorCode() {
        return "SCHEMA_ALREADY_EXISTS";
    }

    public String getType() {
        return type;
    }
}
