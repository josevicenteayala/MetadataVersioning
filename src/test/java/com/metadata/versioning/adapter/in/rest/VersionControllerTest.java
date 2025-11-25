package com.metadata.versioning.adapter.in.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.adapter.in.rest.dto.CreateMetadataRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for VersionController REST endpoints.
 * Tests US2 functionality: Activate and Consume Metadata
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VersionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws Exception {
        // Clean slate for each test - using TestContainers PostgreSQL
    }

    /**
     * T042: Test version activation functionality
     */
    @Test
    void testActivateVersion() throws Exception {
        // Arrange: Create a metadata document with multiple versions
        String type = "loyalty-program";
        String name = "silver-tier-" + System.currentTimeMillis();
        
        JsonNode content1 = objectMapper.createObjectNode()
                .put("tier", "silver")
                .put("discount", 10);
        
        CreateMetadataRequest request1 = new CreateMetadataRequest(type, name, content1);
        mockMvc.perform(post("/api/v1/metadata")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Create v2
        JsonNode content2 = objectMapper.createObjectNode()
                .put("tier", "silver")
                .put("discount", 15);
        
        com.metadata.versioning.adapter.in.rest.dto.CreateVersionRequest versionRequest =
                new com.metadata.versioning.adapter.in.rest.dto.CreateVersionRequest(
                        content2, "Increased discount");
        
        mockMvc.perform(post("/api/v1/metadata/" + type + "/" + name + "/versions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(versionRequest)))
                .andExpect(status().isCreated());

        // Act: Activate version 2
        mockMvc.perform(post("/api/metadata/" + type + "/" + name + "/versions/2/activate"))
                .andExpect(status().isNoContent());

        // Assert: Verify version 2 is now active
        mockMvc.perform(get("/api/v1/metadata/" + type + "/" + name + "/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.versionNumber").value(2))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.content.discount").value(15));

        // Activate version 1
        mockMvc.perform(post("/api/metadata/" + type + "/" + name + "/versions/1/activate"))
                .andExpect(status().isNoContent());

        // Verify version 1 is now active and version 2 is not
        mockMvc.perform(get("/api/v1/metadata/" + type + "/" + name + "/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.content.discount").value(10));
    }

    /**
     * T042: Test activation of non-existent version
     */
    @Test
    void testActivateNonExistentVersion() throws Exception {
        // Arrange: Create a document with only 1 version
        String type = "campaign";
        String name = "summer-sale-" + System.currentTimeMillis();
        
        JsonNode content = objectMapper.createObjectNode()
                .put("name", "Summer Sale")
                .put("discount", 20);
        
        CreateMetadataRequest request = new CreateMetadataRequest(type, name, content);
        mockMvc.perform(post("/api/v1/metadata")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Act & Assert: Try to activate non-existent version 5
        mockMvc.perform(post("/api/metadata/" + type + "/" + name + "/versions/5/activate"))
                .andExpect(status().isNotFound());
    }

    /**
     * T042a: Test FR-023 enforcement - reject non-published version activation
     * NOTE: This test is currently a placeholder as publishing states (US5) are not yet implemented
     */
    @Test
    void testActivateNonPublishedVersion_PlaceholderForUS5() throws Exception {
        // This test will be fully implemented when US5 (Publishing Lifecycle) is complete
        // For now, all versions can be activated since publishing state is not enforced yet
        
        // TODO: Implement after T072-T074 (PublishingState) are completed
        // Expected behavior: Activation of draft/approved versions should fail with 400 Bad Request
    }
}
