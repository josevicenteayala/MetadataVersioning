package com.metadata.versioning.domain.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.metadata.versioning.domain.exception.InvalidStateTransitionException;

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
 * - publishingState: Current lifecycle state (draft, approved, published, archived)
 * - isActive: Whether this version is currently active for consumption
 */
public record Version(
        Integer versionNumber,
        JsonNode content,
        String author,
        Instant createdAt,
        String changeSummary,
        PublishingState publishingState,
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
        Objects.requireNonNull(publishingState, "Publishing state cannot be null");
        
        if (versionNumber < 1) {
            throw new IllegalArgumentException("Version number must be >= 1");
        }
        
        if (author.isBlank()) {
            throw new IllegalArgumentException("Author cannot be blank");
        }
    }

    /**
     * Create the first version (v1) of a metadata document.
     * New versions start in PUBLISHED state by default for backward compatibility.
     * Use transitionTo() to change state after creation.
     */
    public static Version createFirst(JsonNode content, String author, String changeSummary) {
        return new Version(
                1,
                content,
                author,
                Instant.now(),
                changeSummary != null ? changeSummary : "Initial version",
                new PublishingState.Published(), // Default to PUBLISHED for backward compatibility
                false // Not active by default
        );
    }

    /**
     * Create a new version based on previous version number.
     * New versions start in PUBLISHED state by default for backward compatibility.
     * Use transitionTo() to change state after creation.
     */
    public static Version createNext(Integer previousVersionNumber, JsonNode content, 
                                      String author, String changeSummary) {
        return new Version(
                previousVersionNumber + 1,
                content,
                author,
                Instant.now(),
                changeSummary,
                new PublishingState.Published(), // Default to PUBLISHED for backward compatibility
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
                publishingState,
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

    /**
     * Activate this version for consumption.
     * Returns a new version instance with isActive=true.
     */
    public Version activate() {
        return withActiveStatus(true);
    }

    /**
     * Deactivate this version.
     * Returns a new version instance with isActive=false.
     */
    public Version deactivate() {
        return withActiveStatus(false);
    }

    /**
     * Transition this version to a new publishing state.
     * Validates that the transition is allowed.
     * 
     * @throws InvalidStateTransitionException if transition is not allowed
     */
    public Version transitionTo(PublishingState newState) {
        if (!publishingState.canTransitionTo(newState)) {
            throw new InvalidStateTransitionException(publishingState, newState);
        }
        
        return new Version(
                versionNumber,
                content,
                author,
                createdAt,
                changeSummary,
                newState,
                isActive
        );
    }

    /**
     * Check if this version can be activated.
     * Only published versions can be activated (FR-016).
     */
    public boolean canBeActivated() {
        return publishingState instanceof PublishingState.Published;
    }

    /**
     * Check if this version is in published state.
     */
    public boolean isPublished() {
        return publishingState instanceof PublishingState.Published;
    }

    /**
     * Check if this version is in draft state.
     */
    public boolean isDraft() {
        return publishingState instanceof PublishingState.Draft;
    }

    /**
     * Check if this version is in approved state.
     */
    public boolean isApproved() {
        return publishingState instanceof PublishingState.Approved;
    }

    /**
     * Check if this version is in archived state.
     */
    public boolean isArchived() {
        return publishingState instanceof PublishingState.Archived;
    }
}
