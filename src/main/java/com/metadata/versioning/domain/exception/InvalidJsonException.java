package com.metadata.versioning.domain.exception;

/**
 * Thrown when JSON content validation fails.
 * Indicates malformed JSON structure or content that exceeds size limits.
 */
public class InvalidJsonException extends DomainException {

    public InvalidJsonException(String message) {
        super(message);
    }

    public InvalidJsonException(String message, Throwable cause) {
        super(message, cause);
    }

    @Override
    public String getErrorCode() {
        return "INVALID_JSON";
    }
}
