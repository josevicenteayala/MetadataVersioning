package com.metadata.versioning.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.application.port.out.MetadataDocumentRepository;
import com.metadata.versioning.domain.model.MetadataDocument;
import com.metadata.versioning.domain.model.Version;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Test configuration that replaces the database-backed repository
 * with an in-memory implementation so tests can run without Docker.
 */
@TestComponent
public class TestPersistenceConfig {

    @Bean
    @Primary
    public MetadataDocumentRepository inMemoryMetadataDocumentRepository(ObjectMapper objectMapper) {
        return new InMemoryMetadataDocumentRepository(objectMapper);
    }

    private static class InMemoryMetadataDocumentRepository implements MetadataDocumentRepository {
        private final Map<String, MetadataDocument> store = new ConcurrentHashMap<>();
        private final ObjectMapper objectMapper;

        InMemoryMetadataDocumentRepository(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }

        @Override
        public MetadataDocument save(MetadataDocument document) {
            String key = toKey(document.getType(), document.getName());
            store.put(key, deepCopy(document));
            return deepCopy(document);
        }

        @Override
        public MetadataDocument update(MetadataDocument document) {
            String key = toKey(document.getType(), document.getName());
            store.put(key, deepCopy(document));
            return deepCopy(document);
        }

        @Override
        public java.util.Optional<MetadataDocument> findByTypeAndName(String type, String name) {
            return java.util.Optional.ofNullable(store.get(toKey(type, name)))
                    .map(this::deepCopy);
        }

        @Override
        public boolean existsByTypeAndName(String type, String name) {
            return store.containsKey(toKey(type, name));
        }

        private String toKey(String type, String name) {
            return type + "::" + name;
        }

        private MetadataDocument deepCopy(MetadataDocument document) {
            List<Version> copiedVersions = new ArrayList<>();
            for (Version version : document.getAllVersions()) {
                copiedVersions.add(new Version(
                        version.versionNumber(),
                        deepCopy(version.content()),
                        version.author(),
                        version.createdAt(),
                        version.changeSummary(),
                        version.isActive()
                ));
            }

            return new MetadataDocument(
                    document.getType(),
                    document.getName(),
                    copiedVersions,
                    document.getCreatedAt(),
                    document.getUpdatedAt()
            );
        }

        private JsonNode deepCopy(JsonNode node) {
            try {
                return objectMapper.readTree(objectMapper.writeValueAsString(node));
            } catch (Exception e) {
                throw new IllegalStateException("Failed to copy JSON content", e);
            }
        }
    }
}
