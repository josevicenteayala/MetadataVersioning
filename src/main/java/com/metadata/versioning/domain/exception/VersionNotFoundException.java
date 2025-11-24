package com.metadata.versioning.domain.exception;

/**
 * Thrown when attempting to access a version that does not exist.
 */
public class VersionNotFoundException extends DomainException {

    private final String type;
    private final String name;
    private final Integer versionNumber;

    public VersionNotFoundException(String type, String name, Integer versionNumber) {
        super(String.format("Version not found: %s:%s version %d", type, name, versionNumber));
        this.type = type;
        this.name = name;
        this.versionNumber = versionNumber;
    }

    public VersionNotFoundException(String type, String name) {
        super(String.format("No versions found for metadata document: %s:%s", type, name));
        this.type = type;
        this.name = name;
        this.versionNumber = null;
    }

    @Override
    public String getErrorCode() {
        return "VERSION_NOT_FOUND";
    }

    public String getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }
}
