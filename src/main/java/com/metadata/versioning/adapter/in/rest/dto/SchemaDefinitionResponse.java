package com.metadata.versioning.adapter.in.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.metadata.versioning.domain.model.SchemaDefinition;

import java.time.Instant;

/**
 * REST response for schema definition.
 */
public record SchemaDefinitionResponse(
        String type,
        JsonNode schema,
        String description,
        boolean strictMode,
        Instant createdAt,
        Instant updatedAt
) {
    public static SchemaDefinitionResponse from(SchemaDefinition schemaDefinition) {
        return new SchemaDefinitionResponse(
                schemaDefinition.type(),
                schemaDefinition.schema(),
                schemaDefinition.description(),
                schemaDefinition.strictMode(),
                schemaDefinition.createdAt(),
                schemaDefinition.updatedAt()
        );
    }
}
