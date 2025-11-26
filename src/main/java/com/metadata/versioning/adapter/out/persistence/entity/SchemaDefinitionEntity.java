package com.metadata.versioning.adapter.out.persistence.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Objects;

/**
 * JPA entity for schema definitions.
 * Maps to schema_definitions table with JSONB support.
 */
@Entity
@Table(name = "schema_definitions")
public class SchemaDefinitionEntity {

    @Id
    @Column(name = "type", nullable = false, unique = true)
    private String type;

    @Type(JsonBinaryType.class)
    @Column(name = "schema_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode schemaJson;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "strict_mode", nullable = false)
    private boolean strictMode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SchemaDefinitionEntity() {
        // For JPA
    }

    public SchemaDefinitionEntity(String type, JsonNode schemaJson, String description, boolean strictMode) {
        this.type = type;
        this.schemaJson = schemaJson;
        this.description = description;
        this.strictMode = strictMode;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public JsonNode getSchemaJson() {
        return schemaJson;
    }

    public void setSchemaJson(JsonNode schemaJson) {
        this.schemaJson = schemaJson;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isStrictMode() {
        return strictMode;
    }

    public void setStrictMode(boolean strictMode) {
        this.strictMode = strictMode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SchemaDefinitionEntity that)) return false;
        return Objects.equals(type, that.type);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type);
    }
}
