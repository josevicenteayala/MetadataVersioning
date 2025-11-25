package com.metadata.versioning.application.port.in;

import com.metadata.versioning.domain.model.VersionComparison;

/**
 * Inbound port for comparing versions (FR-010).
 * Enables visualization of changes before version activation.
 */
public interface CompareVersionsUseCase {

    /**
     * Compare two versions of a metadata document.
     * 
     * @param type The metadata type
     * @param name The metadata name
     * @param fromVersionNumber The baseline version number
     * @param toVersionNumber The version to compare against
     * @return VersionComparison with detailed change analysis
     * @throws com.metadata.versioning.domain.exception.VersionNotFoundException if either version doesn't exist
     */
    VersionComparison compareVersions(String type, String name, int fromVersionNumber, int toVersionNumber);
}
