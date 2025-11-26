package com.metadata.versioning.domain.exception;

/**
 * Exception thrown when a schema definition is invalid.
 */
public class InvalidSchemaException extends DomainException {

    public InvalidSchemaException(String message) {
        super(message);
    }

    @Override
    public String getErrorCode() {
        return "INVALID_SCHEMA";
    }
}
