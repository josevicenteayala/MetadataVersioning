package com.metadata.versioning.adapter.in.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for creating a new metadata document (first version).
 */
public record CreateMetadataRequest(
        @NotBlank(message = "Type cannot be blank")
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", 
                 message = "Type must be kebab-case (lowercase letters, numbers, hyphens)")
        String type,

        @NotBlank(message = "Name cannot be blank")
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
                 message = "Name must be kebab-case (lowercase letters, numbers, hyphens)")
        String name,

        @NotNull(message = "Content cannot be null")
        JsonNode content
) {
}
