package com.metadata.versioning.adapter.in.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.support.TestPersistenceConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for version comparison endpoint.
 */
@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
                "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration," +
                "org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration," +
                "org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration," +
                "org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration," +
                "org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration," +
                "org.springframework.boot.actuate.autoconfigure.security.servlet.ManagementWebSecurityAutoConfiguration",
        "spring.testcontainers.enabled=false"
})
@AutoConfigureMockMvc(addFilters = false)
@Import(TestPersistenceConfig.class)
@ActiveProfiles("test")
class VersionComparisonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws Exception {
        // Create test metadata with multiple versions
        String baseUrl = "/api/v1/metadata/loyalty-program/platinum-tier";
        
        // Version 1: Basic structure
        String v1Request = """
                {
                    "type": "loyalty-program",
                    "name": "platinum-tier",
                    "content": {
                        "tier": "platinum",
                        "minSpend": 10000,
                        "benefits": {
                            "discount": 15,
                            "freeShipping": true
                        }
                    }
                }
                """;
        mockMvc.perform(post("/api/v1/metadata")
                .contentType(MediaType.APPLICATION_JSON)
                .content(v1Request));

        // Version 2: Add new field, modify existing
        String v2Request = """
                {
                    "content": {
                        "tier": "platinum",
                        "minSpend": 12000,
                        "benefits": {
                            "discount": 20,
                            "freeShipping": true,
                            "prioritySupport": true
                        },
                        "bonusMultiplier": 1.5
                    }
                }
                """;
        mockMvc.perform(post(baseUrl + "/versions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(v2Request));

        // Version 3: Remove field
        String v3Request = """
                {
                    "content": {
                        "tier": "platinum",
                        "minSpend": 12000,
                        "benefits": {
                            "discount": 20,
                            "prioritySupport": true
                        },
                        "bonusMultiplier": 1.5
                    }
                }
                """;
        mockMvc.perform(post(baseUrl + "/versions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(v3Request));
    }

    @Test
    void shouldCompareVersionsWithAddedFields() throws Exception {
        // Compare v1 to v2 (additions and modifications)
        mockMvc.perform(get("/api/metadata/loyalty-program/platinum-tier/versions/compare")
                        .param("from", "1")
                        .param("to", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromVersion").value(1))
                .andExpect(jsonPath("$.toVersion").value(2))
                .andExpect(jsonPath("$.hasChanges").value(true))
                .andExpect(jsonPath("$.changeCount").value(greaterThan(0)))
                .andExpect(jsonPath("$.summary.added").value(greaterThan(0)))
                .andExpect(jsonPath("$.summary.modified").value(greaterThan(0)));
    }

    @Test
    void shouldDetectRemovedFields() throws Exception {
        // Compare v2 to v3 (field removal)
        mockMvc.perform(get("/api/metadata/loyalty-program/platinum-tier/versions/compare")
                        .param("from", "2")
                        .param("to", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasChanges").value(true))
                .andExpect(jsonPath("$.summary.removed").value(greaterThan(0)))
                .andExpect(jsonPath("$.changes[?(@.type == 'REMOVED')]").exists());
    }

    @Test
    void shouldDetectBreakingChanges() throws Exception {
        // Compare v2 to v3 (removal is breaking)
        mockMvc.perform(get("/api/metadata/loyalty-program/platinum-tier/versions/compare")
                        .param("from", "2")
                        .param("to", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasBreakingChanges").value(true));
    }

    @Test
    void shouldHandleIdenticalVersions() throws Exception {
        // Compare v2 to v2 (no changes)
        mockMvc.perform(get("/api/metadata/loyalty-program/platinum-tier/versions/compare")
                        .param("from", "2")
                        .param("to", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasChanges").value(false))
                .andExpect(jsonPath("$.changeCount").value(0))
                .andExpect(jsonPath("$.summary.added").value(0))
                .andExpect(jsonPath("$.summary.modified").value(0))
                .andExpect(jsonPath("$.summary.removed").value(0));
    }

    @Test
    void shouldReturn404ForNonExistentVersion() throws Exception {
        // Try to compare with non-existent version
        mockMvc.perform(get("/api/metadata/loyalty-program/platinum-tier/versions/compare")
                        .param("from", "1")
                        .param("to", "99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldProvideDetailedChangePath() throws Exception {
        // Compare v1 to v2 and verify path details
        mockMvc.perform(get("/api/metadata/loyalty-program/platinum-tier/versions/compare")
                        .param("from", "1")
                        .param("to", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.changes[?(@.path =~ /.*benefits.*/)]").exists())
                .andExpect(jsonPath("$.changes[?(@.path =~ /.*minSpend.*/)]").exists());
    }
}
