package com.metadata.versioning.adapter.in.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;

/**
 * Response DTO for version information.
 * Used for all version-related API responses.
 */
public record VersionResponse(
        String type,
        String name,
        Integer versionNumber,
        JsonNode content,
        String author,
        Instant createdAt,
        String changeSummary,
        String publishingState,
        boolean isActive
) {
    public static VersionResponse fromDomain(com.metadata.versioning.domain.model.Version version,
                                             String type, String name) {
        return new VersionResponse(
                type,
                name,
                version.versionNumber(),
                version.content(),
                version.author(),
                version.createdAt(),
                version.changeSummary(),
                version.publishingState().name(),
                version.isActive()
        );
    }

    /**
     * Create response from Version domain model.
     * Requires type and name to be provided in the context.
     */
    public static VersionResponse from(com.metadata.versioning.domain.model.Version version) {
        return new VersionResponse(
                null,  // Type will be set by caller if needed
                null,  // Name will be set by caller if needed
                version.versionNumber(),
                version.content(),
                version.author(),
                version.createdAt(),
                version.changeSummary(),
                version.publishingState().name(),
                version.isActive()
        );
    }
}
