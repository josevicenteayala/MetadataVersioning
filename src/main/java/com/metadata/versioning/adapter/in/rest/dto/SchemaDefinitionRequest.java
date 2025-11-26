package com.metadata.versioning.adapter.in.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * REST request for creating or updating a schema definition.
 */
public record SchemaDefinitionRequest(
        @NotBlank(message = "Type is required")
        @Pattern(regexp = "^[a-z][a-z0-9-]*$", message = "Type must start with lowercase letter and contain only lowercase letters, digits, and hyphens")
        String type,

        @NotNull(message = "Schema is required")
        JsonNode schema,

        String description,

        boolean strictMode
) {
}
