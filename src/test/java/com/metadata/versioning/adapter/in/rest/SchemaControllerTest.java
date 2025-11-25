package com.metadata.versioning.adapter.in.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.adapter.in.rest.dto.SchemaDefinitionRequest;
import com.metadata.versioning.support.TestPersistenceConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for SchemaController (FR-012, FR-013).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestPersistenceConfig.class)
@TestPropertySource(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration",
        "spring.testcontainers.enabled=false"
})
@Transactional
class SchemaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private JsonNode validSchema;

    @BeforeEach
    void setUp() throws Exception {
        // Create a valid JSON Schema v7
        validSchema = objectMapper.readTree("""
                {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "minLength": 1
                        },
                        "price": {
                            "type": "number",
                            "minimum": 0
                        },
                        "quantity": {
                            "type": "integer",
                            "minimum": 1
                        }
                    },
                    "required": ["title", "price"]
                }
                """);
    }

    @Test
    @DisplayName("Should create schema definition successfully")
    void shouldCreateSchemaDefinition() throws Exception {
        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "product",
                validSchema,
                "Product schema for e-commerce",
                true
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.type").value("product"))
                .andExpect(jsonPath("$.schema").exists())
                .andExpect(jsonPath("$.strictMode").value(true))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    @DisplayName("Should reject invalid type format")
    void shouldRejectInvalidTypeFormat() throws Exception {
        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "Invalid_Type", // Contains uppercase and underscore
                validSchema,
                null,
                true
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("type"));
    }

    @Test
    @DisplayName("Should reject schema without type object")
    void shouldRejectSchemaWithoutTypeObject() throws Exception {
        JsonNode invalidSchema = objectMapper.readTree("""
                {
                    "type": "string"
                }
                """);

        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "product",
                invalidSchema,
                null,
                true
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_SCHEMA"))
                .andExpect(jsonPath("$.message").value(containsString("type: object")));
    }

    @Test
    @DisplayName("Should reject duplicate schema type")
    void shouldRejectDuplicateSchemaType() throws Exception {
        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "product",
                validSchema,
                null,
                true
        );

        // Create first schema
        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Attempt to create duplicate
        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("SCHEMA_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("Should update existing schema")
    void shouldUpdateExistingSchema() throws Exception {
        // Create initial schema
        SchemaDefinitionRequest createRequest = new SchemaDefinitionRequest(
                "product",
                validSchema,
                "Initial product schema",
                true
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated());

        // Update schema with additional required field
        JsonNode updatedSchema = objectMapper.readTree("""
                {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "minLength": 1
                        },
                        "price": {
                            "type": "number",
                            "minimum": 0
                        },
                        "quantity": {
                            "type": "integer",
                            "minimum": 1
                        },
                        "category": {
                            "type": "string"
                        }
                    },
                    "required": ["title", "price", "category"]
                }
                """);

        SchemaDefinitionRequest updateRequest = new SchemaDefinitionRequest(
                "product",
                updatedSchema,
                "Updated product schema with category",
                false // Changed to non-strict mode
        );

        mockMvc.perform(put("/api/schemas/product")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("product"))
                .andExpect(jsonPath("$.strictMode").value(false))
                .andExpect(jsonPath("$.schema.required").isArray())
                .andExpect(jsonPath("$.schema.required", hasSize(3)))
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    @DisplayName("Should return 404 when updating non-existent schema")
    void shouldReturn404WhenUpdatingNonExistentSchema() throws Exception {
        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "nonexistent",
                validSchema,
                null,
                true
        );

        mockMvc.perform(put("/api/schemas/nonexistent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("SCHEMA_NOT_FOUND"));
    }

    @Test
    @DisplayName("Should get schema by type")
    void shouldGetSchemaByType() throws Exception {
        // Create schema
        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "product",
                validSchema,
                "Product schema",
                true
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Get schema
        mockMvc.perform(get("/api/schemas/product"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("product"))
                .andExpect(jsonPath("$.schema.properties.title").exists())
                .andExpect(jsonPath("$.schema.properties.price").exists())
                .andExpect(jsonPath("$.strictMode").value(true));
    }

    @Test
    @DisplayName("Should return 404 when getting non-existent schema")
    void shouldReturn404WhenGettingNonExistentSchema() throws Exception {
        mockMvc.perform(get("/api/schemas/nonexistent"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("SCHEMA_NOT_FOUND"));
    }

    @Test
    @DisplayName("Should list all schemas")
    void shouldListAllSchemas() throws Exception {
        // Create multiple schemas
        SchemaDefinitionRequest request1 = new SchemaDefinitionRequest(
                "product",
                validSchema,
                "Product schema",
                true
        );

        JsonNode orderSchema = objectMapper.readTree("""
                {
                    "type": "object",
                    "properties": {
                        "orderId": {"type": "string"},
                        "totalAmount": {"type": "number"}
                    },
                    "required": ["orderId"]
                }
                """);

        SchemaDefinitionRequest request2 = new SchemaDefinitionRequest(
                "order",
                orderSchema,
                "Order schema",
                false
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isCreated());

        // List all schemas
        mockMvc.perform(get("/api/schemas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].type", containsInAnyOrder("product", "order")));
    }

    @Test
    @DisplayName("Should delete schema")
    void shouldDeleteSchema() throws Exception {
        // Create schema
        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "product",
                validSchema,
                null,
                true
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Delete schema
        mockMvc.perform(delete("/api/schemas/product"))
                .andExpect(status().isNoContent());

        // Verify schema is deleted
        mockMvc.perform(get("/api/schemas/product"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 404 when deleting non-existent schema")
    void shouldReturn404WhenDeletingNonExistentSchema() throws Exception {
        mockMvc.perform(delete("/api/schemas/nonexistent"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("SCHEMA_NOT_FOUND"));
    }

    @Test
    @DisplayName("Should enforce schema structure validation")
    void shouldEnforceSchemaStructureValidation() throws Exception {
        // Schema without properties
        JsonNode invalidSchema = objectMapper.readTree("""
                {
                    "type": "object"
                }
                """);

        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "product",
                invalidSchema,
                null,
                true
        );

        // Should still accept - only type: object is required
        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.schema.type").value("object"));
    }

    @Test
    @DisplayName("Should accept complex nested schema")
    void shouldAcceptComplexNestedSchema() throws Exception {
        JsonNode complexSchema = objectMapper.readTree("""
                {
                    "type": "object",
                    "properties": {
                        "product": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "variants": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "sku": {"type": "string"},
                                            "price": {"type": "number"}
                                        },
                                        "required": ["sku"]
                                    }
                                }
                            },
                            "required": ["name"]
                        }
                    },
                    "required": ["product"]
                }
                """);

        SchemaDefinitionRequest request = new SchemaDefinitionRequest(
                "complex-product",
                complexSchema,
                "Complex nested product schema",
                true
        );

        mockMvc.perform(post("/api/schemas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("complex-product"))
                .andExpect(jsonPath("$.schema.properties.product.properties.variants").exists());
    }
}
