package com.metadata.versioning.application.port.in;

import com.metadata.versioning.domain.model.Version;

import java.util.List;

/**
 * Use case port for retrieving version history.
 * Supports listing all versions and getting specific versions.
 */
public interface GetVersionHistoryUseCase {

    /**
     * Get all versions for a metadata document ordered by version number (FR-009).
     * 
     * @param query Query containing document identifiers
     * @return List of versions ordered from v1 to latest
     * @throws com.metadata.versioning.domain.exception.VersionNotFoundException if document doesn't exist
     */
    List<Version> getVersionHistory(VersionHistoryQuery query);

    /**
     * Get a specific version by number (FR-008).
     * 
     * @param query Query containing document identifiers and version number
     * @return The requested version
     * @throws com.metadata.versioning.domain.exception.VersionNotFoundException if version doesn't exist
     */
    Version getSpecificVersion(SpecificVersionQuery query);

    /**
     * Query for retrieving version history.
     */
    record VersionHistoryQuery(
            String type,
            String name
    ) {
        public VersionHistoryQuery {
            if (type == null || type.isBlank()) {
                throw new IllegalArgumentException("Type cannot be null or empty");
            }
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("Name cannot be null or empty");
            }
        }
    }

    /**
     * Query for retrieving a specific version.
     */
    record SpecificVersionQuery(
            String type,
            String name,
            Integer versionNumber
    ) {
        public SpecificVersionQuery {
            if (type == null || type.isBlank()) {
                throw new IllegalArgumentException("Type cannot be null or empty");
            }
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("Name cannot be null or empty");
            }
            if (versionNumber == null || versionNumber < 1) {
                throw new IllegalArgumentException("Version number must be >= 1");
            }
        }
    }
}
