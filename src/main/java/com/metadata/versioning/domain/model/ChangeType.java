package com.metadata.versioning.domain.model;

/**
 * Sealed class representing types of changes between versions.
 * Uses Java 21 sealed classes for exhaustive pattern matching (FR-010).
 */
public sealed interface ChangeType permits 
        ChangeType.Added, 
        ChangeType.Modified, 
        ChangeType.Removed {

    /**
     * Field was added in the new version.
     * Generally non-breaking for consumers.
     */
    record Added() implements ChangeType {
        public static final Added INSTANCE = new Added();
    }

    /**
     * Field value was modified between versions.
     * May be breaking if the field is critical.
     */
    record Modified() implements ChangeType {
        public static final Modified INSTANCE = new Modified();
    }

    /**
     * Field was removed in the new version.
     * Typically breaking for consumers expecting the field.
     */
    record Removed() implements ChangeType {
        public static final Removed INSTANCE = new Removed();
    }

    // Singleton constants for common use
    ChangeType ADDED = Added.INSTANCE;
    ChangeType MODIFIED = Modified.INSTANCE;
    ChangeType REMOVED = Removed.INSTANCE;
}
