package com.metadata.versioning.adapter.out.persistence.adapter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.adapter.out.persistence.entity.MetadataDocumentEntity;
import com.metadata.versioning.adapter.out.persistence.entity.VersionEntity;
import com.metadata.versioning.adapter.out.persistence.repository.JpaMetadataDocumentRepository;
import com.metadata.versioning.application.port.out.MetadataDocumentRepository;
import com.metadata.versioning.domain.model.MetadataDocument;
import com.metadata.versioning.domain.model.Version;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Adapter implementing MetadataDocumentRepository port using JPA.
 * Translates between domain models and JPA entities.
 */
@Component
@Profile("!test")
public class MetadataDocumentPersistenceAdapter implements MetadataDocumentRepository {

    private final JpaMetadataDocumentRepository jpaRepository;
    private final ObjectMapper objectMapper;

    public MetadataDocumentPersistenceAdapter(JpaMetadataDocumentRepository jpaRepository,
                                             ObjectMapper objectMapper) {
        this.jpaRepository = jpaRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public MetadataDocument save(MetadataDocument document) {
        MetadataDocumentEntity entity = toEntity(document);
        MetadataDocumentEntity savedEntity = jpaRepository.save(entity);
        return toDomain(savedEntity);
    }

    @Override
    public Optional<MetadataDocument> findByTypeAndName(String type, String name) {
        return jpaRepository.findByTypeAndName(type, name)
                .map(this::toDomain);
    }

    @Override
    public boolean existsByTypeAndName(String type, String name) {
        return jpaRepository.existsByTypeAndName(type, name);
    }

    @Override
    public MetadataDocument update(MetadataDocument document) {
        // Find existing entity
        MetadataDocumentEntity entity = jpaRepository.findByTypeAndName(
                document.getType(), document.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "Cannot update non-existent document: " + document.getType() + ":" + document.getName()));

        // Update entity with domain changes
        updateEntity(entity, document);
        
        // Save and return
        MetadataDocumentEntity savedEntity = jpaRepository.save(entity);
        return toDomain(savedEntity);
    }

    @Override
    public Page<MetadataDocument> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable)
                .map(this::toDomain);
    }

    @Override
    public Page<MetadataDocument> findAllByType(String type, Pageable pageable) {
        return jpaRepository.findAllByType(type, pageable)
                .map(this::toDomain);
    }

    /**
     * Convert domain model to JPA entity.
     */
    private MetadataDocumentEntity toEntity(MetadataDocument document) {
        MetadataDocumentEntity entity = new MetadataDocumentEntity(
                document.getType(),
                document.getName()
        );
        entity.setCreatedAt(document.getCreatedAt());
        entity.setUpdatedAt(document.getUpdatedAt());

        // Convert versions
        for (Version version : document.getAllVersions()) {
            VersionEntity versionEntity = toVersionEntity(version);
            entity.addVersion(versionEntity);
        }

        return entity;
    }

    /**
     * Update existing entity with domain model changes.
     */
    private void updateEntity(MetadataDocumentEntity entity, MetadataDocument document) {
        entity.setUpdatedAt(document.getUpdatedAt());

        List<Version> allVersions = document.getAllVersions();
        
        // Update existing versions (for activation status changes)
        for (int i = 0; i < Math.min(entity.getVersions().size(), allVersions.size()); i++) {
            VersionEntity existingEntity = entity.getVersions().get(i);
            Version domainVersion = allVersions.get(i);
            existingEntity.setActive(domainVersion.isActive());
        }
        
        // Add new versions if any
        for (int i = entity.getVersions().size(); i < allVersions.size(); i++) {
            Version version = allVersions.get(i);
            VersionEntity versionEntity = toVersionEntity(version);
            entity.addVersion(versionEntity);
        }
    }

    /**
     * Convert Version domain model to JPA entity.
     */
    private VersionEntity toVersionEntity(Version version) {
        try {
            String contentJson = objectMapper.writeValueAsString(version.content());
            VersionEntity entity = new VersionEntity(
                    version.versionNumber(),
                    contentJson,
                    version.author(),
                    version.changeSummary()
            );
            entity.setCreatedAt(version.createdAt());
            entity.setActive(version.isActive());
            return entity;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize version content", e);
        }
    }

    /**
     * Convert JPA entity to domain model.
     */
    private MetadataDocument toDomain(MetadataDocumentEntity entity) {
        List<Version> versions = entity.getVersions().stream()
                .map(this::toVersionDomain)
                .collect(Collectors.toList());

        return new MetadataDocument(
                entity.getType(),
                entity.getName(),
                versions,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Convert VersionEntity to Version domain model.
     */
    private Version toVersionDomain(VersionEntity entity) {
        try {
            JsonNode content = objectMapper.readTree(entity.getContent());
            return new Version(
                    entity.getVersionNumber(),
                    content,
                    entity.getAuthor(),
                    entity.getCreatedAt(),
                    entity.getChangeSummary(),
                    entity.isActive()
            );
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize version content", e);
        }
    }
}
