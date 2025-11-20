package com.starbucks.metadata.exception;

public class VersionAlreadyActiveException extends RuntimeException {
    public VersionAlreadyActiveException(String message) {
        super(message);
    }
}