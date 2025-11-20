package com.starbucks.metadata.exception;

public class CannotDeleteActiveVersionException extends RuntimeException {
    public CannotDeleteActiveVersionException(String message) {
        super(message);
    }
}