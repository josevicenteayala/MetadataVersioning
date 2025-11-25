package com.metadata.versioning.domain.validator;

import com.fasterxml.jackson.databind.JsonNode;
import com.metadata.versioning.domain.exception.SchemaViolationException;
import com.metadata.versioning.domain.model.SchemaDefinition;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Domain service for validating JSON documents against JSON Schema definitions.
 * Uses networknt/json-schema-validator library.
 */
public class SchemaValidator {

    private final JsonSchemaFactory schemaFactory;

    public SchemaValidator() {
        this.schemaFactory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7);
    }

    /**
     * Validate a JSON document against a schema definition.
     * 
     * @param document The JSON document to validate
     * @param schemaDefinition The schema definition to validate against
     * @throws SchemaViolationException if validation fails in strict mode
     * @return List of validation warnings (empty if valid, or if non-strict mode)
     */
    public List<String> validate(JsonNode document, SchemaDefinition schemaDefinition) {
        JsonSchema schema = schemaFactory.getSchema(schemaDefinition.schema());
        Set<ValidationMessage> errors = schema.validate(document);

        if (errors.isEmpty()) {
            return List.of();
        }

        List<String> violations = errors.stream()
                .map(ValidationMessage::getMessage)
                .collect(Collectors.toList());

        if (schemaDefinition.strictMode()) {
            throw new SchemaViolationException(schemaDefinition.type(), violations);
        }

        return violations; // Return as warnings in non-strict mode
    }

    /**
     * Check if a document is valid without throwing exceptions.
     */
    public boolean isValid(JsonNode document, SchemaDefinition schemaDefinition) {
        try {
            JsonSchema schema = schemaFactory.getSchema(schemaDefinition.schema());
            Set<ValidationMessage> errors = schema.validate(document);
            return errors.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}
