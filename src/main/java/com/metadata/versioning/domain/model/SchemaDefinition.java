package com.metadata.versioning.domain.model;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.Objects;

/**
 * Domain entity representing a JSON Schema definition for a metadata type.
 * Enforces validation rules for all metadata documents of a specific type.
 */
public class SchemaDefinition {

    private final String type;
    private final JsonNode schema;
    private final String description;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final boolean strictMode;

    public SchemaDefinition(String type, JsonNode schema, String description, boolean strictMode) {
        this.type = validateType(type);
        this.schema = validateSchema(schema);
        this.description = description;
        this.strictMode = strictMode;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // For reconstruction from persistence
    public SchemaDefinition(String type, JsonNode schema, String description, 
                           boolean strictMode, Instant createdAt, Instant updatedAt) {
        this.type = validateType(type);
        this.schema = validateSchema(schema);
        this.description = description;
        this.strictMode = strictMode;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    private String validateType(String type) {
        Objects.requireNonNull(type, "Schema type cannot be null");
        if (type.isBlank()) {
            throw new IllegalArgumentException("Schema type cannot be blank");
        }
        if (!type.matches("^[a-z][a-z0-9-]*$")) {
            throw new IllegalArgumentException(
                "Schema type must start with lowercase letter and contain only lowercase letters, digits, and hyphens"
            );
        }
        return type;
    }

    private JsonNode validateSchema(JsonNode schema) {
        Objects.requireNonNull(schema, "Schema definition cannot be null");
        if (!schema.isObject()) {
            throw new IllegalArgumentException("Schema must be a JSON object");
        }
        if (!schema.has("type") || !"object".equals(schema.get("type").asText())) {
            throw new IllegalArgumentException("Schema must define type as 'object'");
        }
        return schema;
    }

    /**
     * Create an updated version of this schema.
     */
    public SchemaDefinition update(JsonNode newSchema, String newDescription, boolean newStrictMode) {
        return new SchemaDefinition(
                this.type,
                newSchema,
                newDescription != null ? newDescription : this.description,
                newStrictMode,
                this.createdAt,
                Instant.now()
        );
    }

    // Getters
    public String type() {
        return type;
    }

    public JsonNode schema() {
        return schema;
    }

    public String description() {
        return description;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public boolean strictMode() {
        return strictMode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SchemaDefinition that)) return false;
        return Objects.equals(type, that.type);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type);
    }

    @Override
    public String toString() {
        return "SchemaDefinition{" +
                "type='" + type + '\'' +
                ", strictMode=" + strictMode +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
