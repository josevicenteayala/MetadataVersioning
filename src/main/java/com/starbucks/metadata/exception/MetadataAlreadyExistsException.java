package com.starbucks.metadata.exception;

public class MetadataAlreadyExistsException extends RuntimeException {
    public MetadataAlreadyExistsException(String message) {
        super(message);
    }
}