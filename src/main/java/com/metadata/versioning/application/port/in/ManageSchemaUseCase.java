package com.metadata.versioning.application.port.in;

import com.fasterxml.jackson.databind.JsonNode;
import com.metadata.versioning.domain.model.SchemaDefinition;

import java.util.List;
import java.util.Optional;

/**
 * Inbound port for managing schema definitions.
 * Enables administrators to define and update JSON Schema definitions for metadata types.
 */
public interface ManageSchemaUseCase {

    /**
     * Create a new schema definition for a metadata type.
     * 
     * @param type The metadata type
     * @param schema The JSON Schema definition
     * @param description Human-readable description
     * @param strictMode If true, validation failures throw exceptions; if false, they return warnings
     * @return The created schema definition
     */
    SchemaDefinition createSchema(String type, JsonNode schema, String description, boolean strictMode);

    /**
     * Update an existing schema definition.
     * 
     * @param type The metadata type
     * @param schema The updated JSON Schema definition
     * @param description Updated description (optional)
     * @param strictMode Updated strict mode flag
     * @return The updated schema definition
     */
    SchemaDefinition updateSchema(String type, JsonNode schema, String description, boolean strictMode);

    /**
     * Get a schema definition by type.
     */
    Optional<SchemaDefinition> getSchema(String type);

    /**
     * List all schema definitions.
     */
    List<SchemaDefinition> listSchemas();

    /**
     * Delete a schema definition.
     */
    void deleteSchema(String type);
}
