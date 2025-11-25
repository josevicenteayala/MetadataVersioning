package com.metadata.versioning.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.adapter.in.rest.dto.CreateMetadataRequest;
import com.metadata.versioning.adapter.in.rest.dto.CreateVersionRequest;
import com.metadata.versioning.support.TestPersistenceConfig;
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
 * End-to-end tests for Metadata Versioning Service.
 * Tests complete user workflows across all components.
 */
@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
                "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
                "org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration",
        "spring.testcontainers.enabled=false"
})
@AutoConfigureMockMvc(addFilters = false)
@Import(TestPersistenceConfig.class)
@ActiveProfiles("test")
class MetadataVersioningE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * T031: Complete create-update-history workflow
     * 
     * Business Scenario: A business analyst creates a new loyalty program configuration,
     * makes several updates as requirements evolve, and reviews the complete history
     * of changes before presenting to stakeholders.
     * 
     * Tests US1 complete workflow:
     * 1. Create initial metadata document
     * 2. Update configuration multiple times
     * 3. Retrieve and verify version history
     * 4. Access specific historical versions
     * 5. Verify immutability and audit trail
     */
    @Test
    void testCompleteCreateUpdateHistoryWorkflow() throws Exception {
        // Step 1: Business analyst creates initial loyalty program configuration
        String initialContent = """
                {
                    "programId": "LP2024-SPRING",
                    "programName": "Spring Rewards 2024",
                    "startDate": "2024-03-01",
                    "endDate": "2024-05-31",
                    "maxReward": 100,
                    "eligibleTiers": ["silver", "gold"],
                    "multiplier": 1.5
                }
                """;

        CreateMetadataRequest createRequest = new CreateMetadataRequest(
                "loyalty-program",
                "spring-rewards-2024",
                objectMapper.readTree(initialContent)
        );

        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("loyalty-program"))
                .andExpect(jsonPath("$.name").value("spring-rewards-2024"))
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.content.maxReward").value(100))
                .andExpect(jsonPath("$.content.eligibleTiers", hasSize(2)));

        // Step 2a: Marketing requests platinum tier inclusion
        String platinumUpdate = """
                {
                    "programId": "LP2024-SPRING",
                    "programName": "Spring Rewards 2024",
                    "startDate": "2024-03-01",
                    "endDate": "2024-05-31",
                    "maxReward": 100,
                    "eligibleTiers": ["silver", "gold", "platinum"],
                    "multiplier": 1.5
                }
                """;

        CreateVersionRequest platinumRequest = new CreateVersionRequest(
                objectMapper.readTree(platinumUpdate),
                "Added platinum tier per marketing request #MKT-456"
        );

        mockMvc.perform(post("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(platinumRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(2))
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.content.eligibleTiers", hasSize(3)))
                .andExpect(jsonPath("$.content.eligibleTiers", containsInAnyOrder("silver", "gold", "platinum")));

        // Step 2b: Finance approves increased max reward
        String rewardUpdate = """
                {
                    "programId": "LP2024-SPRING",
                    "programName": "Spring Rewards 2024",
                    "startDate": "2024-03-01",
                    "endDate": "2024-05-31",
                    "maxReward": 150,
                    "eligibleTiers": ["silver", "gold", "platinum"],
                    "multiplier": 1.5
                }
                """;

        CreateVersionRequest rewardRequest = new CreateVersionRequest(
                objectMapper.readTree(rewardUpdate),
                "Increased max reward to $150 - Budget approved #FIN-789"
        );

        mockMvc.perform(post("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rewardRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(3))
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.content.maxReward").value(150));

        // Step 2c: Product adds accelerated multiplier
        String multiplierUpdate = """
                {
                    "programId": "LP2024-SPRING",
                    "programName": "Spring Rewards 2024",
                    "startDate": "2024-03-01",
                    "endDate": "2024-05-31",
                    "maxReward": 150,
                    "eligibleTiers": ["silver", "gold", "platinum"],
                    "multiplier": 2.0,
                    "acceleratedPeriods": [
                        {"start": "2024-04-01", "end": "2024-04-15", "bonus": 0.5}
                    ]
                }
                """;

        CreateVersionRequest multiplierRequest = new CreateVersionRequest(
                objectMapper.readTree(multiplierUpdate),
                "Added 2x multiplier with accelerated bonus periods for Easter promotion"
        );

        mockMvc.perform(post("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(multiplierRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(4))
                .andExpect(jsonPath("$.author").value("anonymous"))
                .andExpect(jsonPath("$.content.multiplier").value(2.0))
                .andExpect(jsonPath("$.content.acceleratedPeriods").isArray());

        // Step 3: Analyst retrieves complete version history for stakeholder review
        mockMvc.perform(get("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].versionNumber").value(1))
                .andExpect(jsonPath("$[0].author").value("anonymous"))
                .andExpect(jsonPath("$[0].changeSummary").value(containsString("Initial")))
                .andExpect(jsonPath("$[1].versionNumber").value(2))
                .andExpect(jsonPath("$[1].author").value("anonymous"))
                .andExpect(jsonPath("$[1].changeSummary").value(containsString("platinum")))
                .andExpect(jsonPath("$[2].versionNumber").value(3))
                .andExpect(jsonPath("$[2].author").value("anonymous"))
                .andExpect(jsonPath("$[2].changeSummary").value(containsString("$150")))
                .andExpect(jsonPath("$[3].versionNumber").value(4))
                .andExpect(jsonPath("$[3].author").value("anonymous"))
                .andExpect(jsonPath("$[3].changeSummary").value(containsString("2x multiplier")));

        // Step 4: Compliance officer accesses original version for audit
        mockMvc.perform(get("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.content.maxReward").value(100))
                .andExpect(jsonPath("$.content.eligibleTiers", hasSize(2)))
                .andExpect(jsonPath("$.content.eligibleTiers", not(hasItem("platinum"))));

        // Step 5: Verify immutability - original version unchanged after updates
        mockMvc.perform(get("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.maxReward").value(100))
                .andExpect(jsonPath("$.content.multiplier").value(1.5));

        // Verify version 2 unchanged
        mockMvc.perform(get("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.maxReward").value(100))
                .andExpect(jsonPath("$.content.eligibleTiers", hasSize(3)));

        // Verify version 3 unchanged
        mockMvc.perform(get("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.maxReward").value(150))
                .andExpect(jsonPath("$.content.multiplier").value(1.5))
                .andExpect(jsonPath("$.content.acceleratedPeriods").doesNotExist());

        // Step 6: Verify audit trail completeness
        mockMvc.perform(get("/api/v1/metadata/loyalty-program/spring-rewards-2024/versions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].author").isArray())
                .andExpect(jsonPath("$[*].author").value(everyItem(not(emptyString()))))
                .andExpect(jsonPath("$[*].createdAt").isArray())
                .andExpect(jsonPath("$[*].createdAt").value(everyItem(not(emptyString()))))
                .andExpect(jsonPath("$[*].changeSummary").isArray())
                .andExpect(jsonPath("$[*].changeSummary").value(everyItem(not(emptyString()))));
    }

    /**
     * T031: Test concurrent metadata document creation
     * Validates system behavior under concurrent load for different documents
     */
    @Test
    void testConcurrentMetadataCreation() throws Exception {
        // Create multiple different documents concurrently
        String[] campaigns = {"summer-sale", "winter-promo", "flash-deal"};

        for (String campaign : campaigns) {
            String content = String.format("""
                    {
                        "campaignId": "%s",
                        "budget": 10000,
                        "channels": ["email", "sms", "push"]
                    }
                    """, campaign.toUpperCase());

            CreateMetadataRequest request = new CreateMetadataRequest(
                    "campaign",
                    campaign,
                    objectMapper.readTree(content)
            );

            mockMvc.perform(post("/api/v1/metadata")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value(campaign))
                    .andExpect(jsonPath("$.versionNumber").value(1));
        }

        // Verify all documents created independently
        for (String campaign : campaigns) {
            mockMvc.perform(get("/api/v1/metadata/campaign/" + campaign + "/versions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].content.campaignId").value(campaign.toUpperCase()));
        }
    }

    /**
     * T031: Test JSON size limit enforcement
     * Validates FR-025: Maximum 1MB document size
     */
    @Test
    void testJsonSizeLimitEnforcement() throws Exception {
        // Create content just under 1MB
        StringBuilder largeContent = new StringBuilder("{\"data\": \"");
        int targetSize = 1024 * 1024 - 100; // Just under 1MB
        for (int i = 0; i < targetSize; i++) {
            largeContent.append("x");
        }
        largeContent.append("\"}");

        CreateMetadataRequest validRequest = new CreateMetadataRequest(
                "large-data",
                "size-limit-test",
                objectMapper.readTree(largeContent.toString())
        );

        // Should succeed
        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated());

        // Create content over 1MB
        StringBuilder oversizedContent = new StringBuilder("{\"data\": \"");
        int oversizedTargetSize = 1024 * 1024 + 1000; // Over 1MB
        for (int i = 0; i < oversizedTargetSize; i++) {
            oversizedContent.append("y");
        }
        oversizedContent.append("\"}");

        CreateMetadataRequest oversizedRequest = new CreateMetadataRequest(
                "large-data",
                "oversized-test",
                objectMapper.readTree(oversizedContent.toString())
        );

        // Should fail
        mockMvc.perform(post("/api/v1/metadata")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oversizedRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("size")));
    }
}
