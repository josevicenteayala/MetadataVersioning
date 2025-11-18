package com.metadata.versioning.domain.model;

import com.metadata.versioning.domain.exception.VersionNotFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * MetadataDocument aggregate root representing a named configuration with version history.
 * Identified by unique combination of type and name (FR-005).
 * 
 * Invariants:
 * - Type and name must be non-empty
 * - Type and name must use kebab-case format
 * - Can have exactly zero or one active version (FR-006)
 * - Versions are sequential starting from 1
 * - Version history is append-only (immutability - FR-004)
 */
public class MetadataDocument {

    private final String type;
    private final String name;
    private final List<Version> versions;
    private final Instant createdAt;
    private Instant updatedAt;

    /**
     * Create a new metadata document with its first version.
     */
    public MetadataDocument(String type, String name, Version firstVersion) {
        this.type = validateAndNormalizeIdentifier(type, "type");
        this.name = validateAndNormalizeIdentifier(name, "name");
        this.versions = new ArrayList<>();
        this.versions.add(firstVersion);
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Reconstruct metadata document from persistence (with existing versions).
     */
    public MetadataDocument(String type, String name, List<Version> versions, 
                           Instant createdAt, Instant updatedAt) {
        this.type = validateAndNormalizeIdentifier(type, "type");
        this.name = validateAndNormalizeIdentifier(name, "name");
        this.versions = new ArrayList<>(versions);
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        
        // Validate that versions are properly ordered
        for (int i = 0; i < versions.size(); i++) {
            if (versions.get(i).versionNumber() != i + 1) {
                throw new IllegalArgumentException(
                    "Version numbers must be sequential starting from 1");
            }
        }
        
        // Validate only one active version (FR-006)
        long activeCount = versions.stream().filter(Version::isActive).count();
        if (activeCount > 1) {
            throw new IllegalStateException(
                "Metadata document cannot have more than one active version");
        }
    }

    /**
     * Add a new version to this document (FR-001).
     * Returns the newly created version.
     */
    public Version addVersion(com.fasterxml.jackson.databind.JsonNode content, 
                             String author, String changeSummary) {
        int nextVersionNumber = versions.size() + 1;
        Version newVersion = Version.createNext(nextVersionNumber - 1, content, author, changeSummary);
        versions.add(newVersion);
        this.updatedAt = Instant.now();
        return newVersion;
    }

    /**
     * Activate a specific version by number (FR-006).
     * Deactivates any currently active version.
     * 
     * @throws VersionNotFoundException if version number doesn't exist
     */
    public void activateVersion(int versionNumber) {
        // Find the version to activate
        Version versionToActivate = getVersion(versionNumber)
                .orElseThrow(() -> new VersionNotFoundException(type, name, versionNumber));

        // Deactivate all versions and activate the specified one
        List<Version> updatedVersions = new ArrayList<>();
        for (Version v : versions) {
            if (v.versionNumber() == versionNumber) {
                updatedVersions.add(v.withActiveStatus(true));
            } else if (v.isActive()) {
                updatedVersions.add(v.withActiveStatus(false));
            } else {
                updatedVersions.add(v);
            }
        }
        
        versions.clear();
        versions.addAll(updatedVersions);
        this.updatedAt = Instant.now();
    }

    /**
     * Get a specific version by number (FR-008).
     */
    public Optional<Version> getVersion(int versionNumber) {
        if (versionNumber < 1 || versionNumber > versions.size()) {
            return Optional.empty();
        }
        return Optional.of(versions.get(versionNumber - 1));
    }

    /**
     * Get the currently active version (FR-007).
     */
    public Optional<Version> getActiveVersion() {
        return versions.stream()
                .filter(Version::isActive)
                .findFirst();
    }

    /**
     * Get all versions ordered by version number (FR-009).
     */
    public List<Version> getAllVersions() {
        return Collections.unmodifiableList(versions);
    }

    /**
     * Get the latest version (highest version number).
     */
    public Version getLatestVersion() {
        if (versions.isEmpty()) {
            throw new IllegalStateException("Metadata document has no versions");
        }
        return versions.get(versions.size() - 1);
    }

    /**
     * Check if this document has an active version.
     */
    public boolean hasActiveVersion() {
        return getActiveVersion().isPresent();
    }

    /**
     * Get total number of versions.
     */
    public int getVersionCount() {
        return versions.size();
    }

    // Getters
    public String getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Validate and normalize identifier (type or name).
     * Must be kebab-case: lowercase letters, numbers, and hyphens only.
     */
    private String validateAndNormalizeIdentifier(String identifier, String fieldName) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException(fieldName + " cannot be null or empty");
        }
        
        String normalized = identifier.trim().toLowerCase();
        
        if (!normalized.matches("^[a-z0-9]+(-[a-z0-9]+)*$")) {
            throw new IllegalArgumentException(
                fieldName + " must be kebab-case (lowercase letters, numbers, hyphens): " + identifier);
        }
        
        return normalized;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MetadataDocument that = (MetadataDocument) o;
        return Objects.equals(type, that.type) && Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, name);
    }

    @Override
    public String toString() {
        return String.format("MetadataDocument{type='%s', name='%s', versions=%d, hasActive=%b}",
                type, name, versions.size(), hasActiveVersion());
    }
}
