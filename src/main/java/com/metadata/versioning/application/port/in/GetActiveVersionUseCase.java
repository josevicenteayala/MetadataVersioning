package com.metadata.versioning.application.port.in;

import com.metadata.versioning.domain.model.Version;

import java.util.Optional;

/**
 * Use case for retrieving the currently active version of metadata.
 * Implements FR-007: Get Active Version functionality.
 * 
 * This is the primary endpoint for downstream systems that need to consume
 * the current operational version of metadata.
 */
public interface GetActiveVersionUseCase {
    
    /**
     * Get the currently active version for a metadata document.
     * 
     * @param type The metadata type (e.g., "loyalty-program")
     * @param name The metadata name (e.g., "gold-tier")
     * @return The active version, or empty if no version is currently active
     */
    Optional<Version> getActiveVersion(String type, String name);
}
