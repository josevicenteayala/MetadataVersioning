package com.metadata.versioning.application.port.in;

/**
 * Use case for activating a specific version of metadata.
 * Implements FR-006: Activate Version functionality.
 * 
 * When a version is activated:
 * - Any previously active version is deactivated
 * - The specified version becomes the active version
 * - Downstream systems can retrieve it via active version endpoint
 * 
 * Note: FR-023 enforcement (only published versions) will be added in US5
 */
public interface ActivateVersionUseCase {
    
    /**
     * Activate a specific version by its version number.
     * 
     * @param type The metadata type (e.g., "loyalty-program")
     * @param name The metadata name (e.g., "gold-tier")
     * @param versionNumber The version number to activate (1-based)
     * @throws com.metadata.versioning.domain.exception.VersionNotFoundException if version doesn't exist
     * @throws com.metadata.versioning.domain.exception.InvalidActivationException if version cannot be activated
     */
    void activateVersion(String type, String name, Integer versionNumber);
}
