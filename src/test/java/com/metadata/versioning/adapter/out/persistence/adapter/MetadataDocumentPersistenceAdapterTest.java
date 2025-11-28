package com.metadata.versioning.adapter.out.persistence.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.adapter.out.persistence.entity.MetadataDocumentEntity;
import com.metadata.versioning.adapter.out.persistence.entity.VersionEntity;
import com.metadata.versioning.adapter.out.persistence.repository.JpaMetadataDocumentRepository;
import com.metadata.versioning.domain.model.MetadataDocument;
import com.metadata.versioning.domain.model.PublishingState;
import com.metadata.versioning.domain.model.Version;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MetadataDocumentPersistenceAdapterTest {

    @Mock
    private JpaMetadataDocumentRepository jpaRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    private MetadataDocumentPersistenceAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new MetadataDocumentPersistenceAdapter(jpaRepository, objectMapper);
    }

    @Test
    void save_ShouldMapJsonNodeCorrectlyToEntity() throws Exception {
        // Arrange
        String jsonContent = "{\"key\": \"value\"}";
        JsonNode content = objectMapper.readTree(jsonContent);
        
        Version version = new Version(
                1,
                content,
                "author",
                Instant.now(),
                "summary",
                new PublishingState.Draft(),
                true
        );
        
        MetadataDocument document = new MetadataDocument(
                "type",
                "name",
                List.of(version),
                Instant.now(),
                Instant.now()
        );

        when(jpaRepository.save(any(MetadataDocumentEntity.class))).thenAnswer(invocation -> {
            MetadataDocumentEntity entity = invocation.getArgument(0);
            // Simulate ID generation
            return entity;
        });

        // Act
        adapter.save(document);

        // Assert
        ArgumentCaptor<MetadataDocumentEntity> captor = ArgumentCaptor.forClass(MetadataDocumentEntity.class);
        verify(jpaRepository).save(captor.capture());

        MetadataDocumentEntity savedEntity = captor.getValue();
        assertThat(savedEntity.getVersions()).hasSize(1);
        
        VersionEntity versionEntity = savedEntity.getVersions().get(0);
        assertThat(versionEntity.getContent()).isEqualTo(content);
        assertThat(versionEntity.getContent().get("key").asText()).isEqualTo("value");
    }
}
