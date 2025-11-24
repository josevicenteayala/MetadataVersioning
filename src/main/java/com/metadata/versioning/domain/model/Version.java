package com.metadata.versioning.domain.model;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.Objects;

/**
 * Version value object representing an immutable snapshot of metadata content.
 * Once created, a version cannot be modified (FR-004).
 * 
 * Attributes:
 * - versionNumber: Sequential integer starting at 1
 * - content: JSON metadata content
 * - author: User identifier who created this version
 * - createdAt: Timestamp of version creation
 * - changeSummary: Human-readable description of changes
 * - isActive: Whether this version is currently active for consumption
 */
public record Version(
        Integer versionNumber,
        JsonNode content,
        String author,
        Instant createdAt,
        String changeSummary,
        boolean isActive
) {
    /**
     * Create a new version. Enforces immutability through record semantics.
     */
    public Version {
        Objects.requireNonNull(versionNumber, "Version number cannot be null");
        Objects.requireNonNull(content, "Content cannot be null");
        Objects.requireNonNull(author, "Author cannot be null");
        Objects.requireNonNull(createdAt, "Created timestamp cannot be null");
        
        if (versionNumber < 1) {
            throw new IllegalArgumentException("Version number must be >= 1");
        }
        
        if (author.isBlank()) {
            throw new IllegalArgumentException("Author cannot be blank");
        }
    }

    /**
     * Create the first version (v1) of a metadata document.
     */
    public static Version createFirst(JsonNode content, String author, String changeSummary) {
        return new Version(
                1,
                content,
                author,
                Instant.now(),
                changeSummary != null ? changeSummary : "Initial version",
                false // Not active by default
        );
    }

    /**
     * Create a new version based on previous version number.
     */
    public static Version createNext(Integer previousVersionNumber, JsonNode content, 
                                      String author, String changeSummary) {
        return new Version(
                previousVersionNumber + 1,
                content,
                author,
                Instant.now(),
                changeSummary,
                false // Not active by default
        );
    }

    /**
     * Create a copy of this version with active status changed.
     * Returns new immutable instance (records are immutable).
     */
    public Version withActiveStatus(boolean active) {
        return new Version(
                versionNumber,
                content,
                author,
                createdAt,
                changeSummary,
                active
        );
    }

    /**
     * Check if this version is newer than another version.
     */
    public boolean isNewerThan(Version other) {
        return this.versionNumber > other.versionNumber;
    }

    /**
     * Check if this version is the first version (v1).
     */
    public boolean isFirstVersion() {
        return versionNumber == 1;
    }
}
