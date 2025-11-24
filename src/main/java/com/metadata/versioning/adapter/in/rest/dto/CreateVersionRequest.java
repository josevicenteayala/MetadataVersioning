package com.metadata.versioning.adapter.in.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a new version of existing metadata.
 */
public record CreateVersionRequest(
        @NotNull(message = "Content cannot be null")
        JsonNode content,

        String changeSummary
) {
}
