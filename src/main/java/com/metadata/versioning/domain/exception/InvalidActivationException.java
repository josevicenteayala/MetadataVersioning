package com.metadata.versioning.domain.exception;

/**
 * Exception thrown when attempting to activate a version that cannot be activated.
 * 
 * Scenarios:
 * - Activating a non-published version (FR-023)
 * - Activating a version that doesn't exist
 * - Activating when another version is already active (business rule)
 */
public class InvalidActivationException extends DomainException {
    
    public InvalidActivationException(String message) {
        super(message);
    }
    
    public InvalidActivationException(String message, Throwable cause) {
        super(message, cause);
    }

    @Override
    public String getErrorCode() {
        return "INVALID_ACTIVATION";
    }
    
    /**
     * Create exception for attempting to activate non-published version.
     */
    public static InvalidActivationException nonPublishedVersion(String type, String name, Integer versionNumber) {
        return new InvalidActivationException(
                String.format("Cannot activate non-published version: %s/%s/v%d. Only published versions can be activated.",
                        type, name, versionNumber)
        );
    }
    
    /**
     * Create exception for version not found during activation.
     */
    public static InvalidActivationException versionNotFound(String type, String name, Integer versionNumber) {
        return new InvalidActivationException(
                String.format("Cannot activate version that does not exist: %s/%s/v%d",
                        type, name, versionNumber)
        );
    }
}
