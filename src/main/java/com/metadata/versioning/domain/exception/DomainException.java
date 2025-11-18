package com.metadata.versioning.domain.exception;

/**
 * Base class for all domain-level exceptions.
 * Domain exceptions represent business rule violations and should be handled
 * by the application layer with appropriate error responses.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }

    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Get the error code for this exception type.
     * Used for consistent error reporting in API responses.
     */
    public abstract String getErrorCode();
}
