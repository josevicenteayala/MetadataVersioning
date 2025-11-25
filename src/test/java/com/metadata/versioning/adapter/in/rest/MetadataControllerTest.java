package com.metadata.versioning.adapter.in.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.adapter.in.rest.dto.CreateMetadataRequest;
import com.metadata.versioning.adapter.in.rest.dto.CreateVersionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for MetadataController REST endpoints.
 * Tests US1 functionality: Create and Version Metadata Document
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MetadataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String sampleJsonContent;

    @BeforeEach
    void setUp() {
        sampleJsonContent = """
                {
                    "programId": "LP001",
                    "name": "Spring Bonus Program",
                    "maxReward": 100,
                    "eligibleTiers": ["gold", "platinum"]
                }
                """;
    }

    /**
     * T028: Test create metadata document
     * US1 Acceptance Scenario 1: Given no existing metadata document, When business analyst submits new metadata,
     * Then system creates version v1 with provided JSON content and records creator information
     */
    @Test
    void testCreateMetadataDocument() throws Exception {
        CreateMetadataRequest request = new CreateMetadataRequest(
                "loyalty-program",
                "spring-bonus",
                objectMapper.readTree(sampleJsonContent)
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.type").value("loyalty-program"))
                .andExpect(jsonPath("$.name").value("spring-bonus"))
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.content.programId").value("LP001"))
                .andExpect(jsonPath("$.content.maxReward").value(100))
                .andExpect(jsonPath("$.isActive").value(false))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    /**
     * T028: Test duplicate document rejection
     * Validates FR-005 unique constraint enforcement
     */
    @Test
    void testCreateMetadataDocument_DuplicateRejected() throws Exception {
        CreateMetadataRequest request = new CreateMetadataRequest(
                "loyalty-program",
                "duplicate-test",
                objectMapper.readTree(sampleJsonContent)
        );

        // Create first document
        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Attempt to create duplicate
        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    /**
     * T028: Test invalid JSON rejection
     * Validates FR-011 JSON validation (maximum nesting depth)
     */
    @Test
    void testCreateMetadataDocument_InvalidJsonRejected() throws Exception {
        // Create deeply nested JSON (exceeds max depth of 50)
        StringBuilder deepJson = new StringBuilder("{");
        for (int i = 0; i < 60; i++) {
            deepJson.append("\"level").append(i).append("\":{");
        }
        deepJson.append("\"value\":1");
        for (int i = 0; i < 60; i++) {
            deepJson.append("}");
        }
        deepJson.append("}");

        CreateMetadataRequest request = new CreateMetadataRequest(
                "loyalty-program",
                "invalid-json-test",
                objectMapper.readTree(deepJson.toString())
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("nesting depth")));
    }

    /**
     * T028: Test kebab-case validation
     * Validates MetadataDocument invariant enforcement
     */
    @Test
    void testCreateMetadataDocument_InvalidNamingRejected() throws Exception {
        CreateMetadataRequest request = new CreateMetadataRequest(
                "InvalidType",  // Not kebab-case
                "spring-bonus",
                objectMapper.readTree(sampleJsonContent)
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request validation failed"));
    }

    /**
     * T029: Test create new version
     * US1 Acceptance Scenario 2: Given existing metadata document at v1, When analyst updates content,
     * Then system creates v2 preserving v1 unchanged and captures modification timestamp
     */
    @Test
    void testCreateNewVersion() throws Exception {
        // Create initial document
        CreateMetadataRequest initialRequest = new CreateMetadataRequest(
                "loyalty-program",
                "versioning-test",
                objectMapper.readTree(sampleJsonContent)
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialRequest)))
                .andExpect(status().isCreated());

        // Create new version with updated content
        String updatedContent = """
                {
                    "programId": "LP001",
                    "name": "Spring Bonus Program",
                    "maxReward": 200,
                    "eligibleTiers": ["gold", "platinum", "diamond"]
                }
                """;

        CreateVersionRequest versionRequest = new CreateVersionRequest(
                objectMapper.readTree(updatedContent),
                "Increased max reward to 200"
        );

        mockMvc.perform(post("/api/v1/metadata/loyalty-program/versioning-test/versions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(versionRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(2))
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.changeSummary").value("Increased max reward to 200"))
                .andExpect(jsonPath("$.content.maxReward").value(200))
                .andExpect(jsonPath("$.content.eligibleTiers").isArray())
                .andExpect(jsonPath("$.content.eligibleTiers", hasSize(3)));
    }

    /**
     * T029: Test version immutability
     * Validates FR-004: versions are immutable after creation
     */
    @Test
    void testVersionImmutability() throws Exception {
        // Create document
        CreateMetadataRequest request = new CreateMetadataRequest(
                "campaign",
                "immutable-test",
                objectMapper.readTree(sampleJsonContent)
        );
        mockMvc.perform(post("/api/v1/metadata")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        // Get version 1
        String v1Response = mockMvc.perform(get("/api/v1/metadata/campaign/immutable-test/versions/1"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Create version 2
        CreateVersionRequest v2Request = new CreateVersionRequest(
                objectMapper.readTree("""
                {"programId": "LP002", "name": "Updated"}
                """),
                "Version 2"
        );
        mockMvc.perform(post("/api/v1/metadata/campaign/immutable-test/versions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(v2Request)));

        // Verify version 1 unchanged
        mockMvc.perform(get("/api/v1/metadata/campaign/immutable-test/versions/1"))
                .andExpect(status().isOk())
                .andExpect(content().json(v1Response));
    }

    /**
     * T030: Test version history retrieval
     * US1 Acceptance Scenario 3: Given metadata document with multiple versions,
     * When analyst requests version history, Then system returns complete lineage
     */
    @Test
    void testGetVersionHistory() throws Exception {
        // Create initial document
        CreateMetadataRequest initialRequest = new CreateMetadataRequest(
                "offer",
                "history-test",
                objectMapper.readTree(sampleJsonContent)
        );
        mockMvc.perform(post("/api/v1/metadata")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(initialRequest)));

        // Create version 2
        CreateVersionRequest v2Request = new CreateVersionRequest(
                objectMapper.readTree("""
                {"offerId": "O001", "discount": 15}
                """),
                "Version 2"
        );
        mockMvc.perform(post("/api/v1/metadata/offer/history-test/versions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(v2Request)));

        // Create version 3
        CreateVersionRequest v3Request = new CreateVersionRequest(
                objectMapper.readTree("""
                {"offerId": "O001", "discount": 20}
                """),
                "Version 3"
        );
        mockMvc.perform(post("/api/v1/metadata/offer/history-test/versions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(v3Request)));

        // Retrieve complete history
        mockMvc.perform(get("/api/v1/metadata/offer/history-test/versions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].versionNumber").value(1))
                .andExpect(jsonPath("$[0].author").value("anonymous"))
                .andExpect(jsonPath("$[1].versionNumber").value(2))
                .andExpect(jsonPath("$[1].author").value("anonymous"))
                .andExpect(jsonPath("$[2].versionNumber").value(3))
                .andExpect(jsonPath("$[2].author").value("anonymous"));
    }

    /**
     * T030: Test specific version retrieval
     * US1 Acceptance Scenario 4: Given metadata document at v3,
     * When analyst retrieves specific version v1, Then system returns exact v1 content unchanged
     */
    @Test
    void testGetSpecificVersion() throws Exception {
        // Create document with 2 versions
        CreateMetadataRequest initialRequest = new CreateMetadataRequest(
                "campaign",
                "specific-version-test",
                objectMapper.readTree("""
                {"campaignId": "C001", "budget": 1000}
                """)
        );
        mockMvc.perform(post("/api/v1/metadata")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(initialRequest)));

        CreateVersionRequest v2Request = new CreateVersionRequest(
                objectMapper.readTree("""
                {"campaignId": "C001", "budget": 2000}
                """),
                "Version 2"
        );
        mockMvc.perform(post("/api/v1/metadata/campaign/specific-version-test/versions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(v2Request)));

        // Retrieve version 1 specifically
        mockMvc.perform(get("/api/v1/metadata/campaign/specific-version-test/versions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.content.budget").value(1000));

        // Retrieve non-existent version
        mockMvc.perform(get("/api/v1/metadata/campaign/specific-version-test/versions/99"))
                .andExpect(status().isNotFound());
    }

    /**
     * T030: Test audit trail completeness
     * Validates FR-003: complete audit information captured
     */
    @Test
    void testAuditTrailCompleteness() throws Exception {
        CreateMetadataRequest request = new CreateMetadataRequest(
                "loyalty-program",
                "audit-test",
                objectMapper.readTree(sampleJsonContent)
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    /**
     * T043: Test active version retrieval (FR-007)
     * Validates that the active version endpoint returns the correct version
     */
    @Test
    void testGetActiveVersion() throws Exception {
        // Arrange: Create document with 2 versions
        String type = "loyalty-program";
        String name = "active-test-" + System.currentTimeMillis();
        
        CreateMetadataRequest request1 = new CreateMetadataRequest(
                type,
                name,
                objectMapper.readTree(sampleJsonContent)
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Create v2
        CreateVersionRequest versionRequest = new CreateVersionRequest(
                objectMapper.readTree("{\"tier\": \"gold\", \"discount\": 25}"),
                "Updated tier");
        
        mockMvc.perform(post("/api/v1/metadata/" + type + "/" + name + "/versions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(versionRequest)))
                .andExpect(status().isCreated());

        // Activate version 2
        mockMvc.perform(post("/api/metadata/" + type + "/" + name + "/versions/2/activate"))
                .andExpect(status().isNoContent());

        // Act & Assert: Get active version
        mockMvc.perform(get("/api/v1/metadata/" + type + "/" + name + "/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.versionNumber").value(2))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.content.tier").value("gold"))
                .andExpect(jsonPath("$.content.discount").value(25));
    }

    /**
     * T043: Test active version when none is active
     * Should return 404 when no version is activated
     */
    @Test
    void testGetActiveVersion_NoneActive() throws Exception {
        // Arrange: Create document but don't activate any version
        String type = "campaign";
        String name = "no-active-" + System.currentTimeMillis();
        
        CreateMetadataRequest request = new CreateMetadataRequest(
                type,
                name,
                objectMapper.readTree("{\"name\": \"Test Campaign\"}")
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Act & Assert: Try to get active version
        mockMvc.perform(get("/api/v1/metadata/" + type + "/" + name + "/active"))
                .andExpect(status().isNotFound());
    }

    /**
     * T043a: Test listing metadata documents with pagination (FR-015)
     * Validates that documents can be listed and filtered by type
     */
    @Test
    void testListMetadataDocuments() throws Exception {
        // Arrange: Create multiple documents
        String timestamp = String.valueOf(System.currentTimeMillis());
        
        for (int i = 1; i <= 3; i++) {
            CreateMetadataRequest request = new CreateMetadataRequest(
                    "loyalty-program",
                    "list-test-" + timestamp + "-" + i,
                    objectMapper.readTree("{\"tier\": \"silver\", \"id\": " + i + "}")
            );
            mockMvc.perform(post("/api/v1/metadata")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        // Act & Assert: List all documents
        mockMvc.perform(get("/api/v1/metadata")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.content[0].type").exists())
                .andExpect(jsonPath("$.content[0].name").exists())
                .andExpect(jsonPath("$.content[0].versionCount").exists())
                .andExpect(jsonPath("$.content[0].hasActiveVersion").exists());

        // Filter by type
        mockMvc.perform(get("/api/v1/metadata")
                        .param("type", "loyalty-program")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[?(@.type != 'loyalty-program')]").doesNotExist());
    }
}
