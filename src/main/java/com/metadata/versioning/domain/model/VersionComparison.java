package com.metadata.versioning.domain.model;

import java.util.List;
import java.util.Objects;

/**
 * Value object representing a comparison between two versions.
 * Contains the list of changes detected during diff analysis (FR-010).
 * Immutable to ensure comparison results cannot be modified.
 */
public record VersionComparison(
        Version fromVersion,
        Version toVersion,
        List<ChangeDetail> changes,
        boolean hasBreakingChanges
) {
    /**
     * Compact constructor for validation.
     */
    public VersionComparison {
        Objects.requireNonNull(fromVersion, "From version cannot be null");
        Objects.requireNonNull(toVersion, "To version cannot be null");
        Objects.requireNonNull(changes, "Changes list cannot be null");
        changes = List.copyOf(changes); // Ensure immutability
    }

    /**
     * Check if there are any changes between versions.
     */
    public boolean hasChanges() {
        return !changes.isEmpty();
    }

    /**
     * Count total number of changes.
     */
    public int changeCount() {
        return changes.size();
    }

    /**
     * Get changes of a specific type.
     */
    public List<ChangeDetail> getChangesByType(ChangeType type) {
        return changes.stream()
                .filter(change -> change.type() == type)
                .toList();
    }

    /**
     * Represents a single change between versions.
     */
    public record ChangeDetail(
            ChangeType type,
            String path,
            Object oldValue,
            Object newValue
    ) {
        public ChangeDetail {
            Objects.requireNonNull(type, "Change type cannot be null");
            Objects.requireNonNull(path, "Path cannot be null");
        }

        /**
         * Check if this change is breaking.
         * - REMOVED: Always breaking (consumers may depend on the field)
         * - MODIFIED: NOT breaking (value changes are considered non-breaking for now)
         * - ADDED: Not breaking (new fields are additive)
         * 
         * Note: In a real system, you might use JSON Schema or other metadata
         * to determine if a modification is breaking (e.g., changing a required field type).
         */
        public boolean isBreaking() {
            return switch (type) {
                case ChangeType.Removed ignored -> true;
                case ChangeType.Modified ignored -> false;  // Treat modifications as non-breaking
                case ChangeType.Added ignored -> false;
            };
        }
    }
}
