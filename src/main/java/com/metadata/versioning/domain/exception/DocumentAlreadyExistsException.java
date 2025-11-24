package com.metadata.versioning.domain.exception;

/**
 * Thrown when attempting to create a metadata document that already exists.
 * Violates uniqueness constraint on (type, name) combination.
 */
public class DocumentAlreadyExistsException extends DomainException {

    private final String type;
    private final String name;

    public DocumentAlreadyExistsException(String type, String name) {
        super(String.format("Metadata document already exists: %s:%s", type, name));
        this.type = type;
        this.name = name;
    }

    @Override
    public String getErrorCode() {
        return "DOCUMENT_ALREADY_EXISTS";
    }

    public String getType() {
        return type;
    }

    public String getName() {
        return name;
    }
}
