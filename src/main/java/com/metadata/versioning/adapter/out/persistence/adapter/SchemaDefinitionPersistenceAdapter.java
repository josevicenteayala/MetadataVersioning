package com.metadata.versioning.adapter.out.persistence.adapter;

import com.metadata.versioning.adapter.out.persistence.entity.SchemaDefinitionEntity;
import com.metadata.versioning.adapter.out.persistence.repository.JpaSchemaRepository;
import com.metadata.versioning.application.port.out.SchemaDefinitionRepository;
import com.metadata.versioning.domain.model.SchemaDefinition;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Adapter for schema definition persistence using JPA.
 */
@Component
@ConditionalOnProperty(name = "spring.autoconfigure.exclude", havingValue = "false", matchIfMissing = true)
@Transactional
public class SchemaDefinitionPersistenceAdapter implements SchemaDefinitionRepository {

    private final JpaSchemaRepository jpaRepository;

    public SchemaDefinitionPersistenceAdapter(JpaSchemaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public SchemaDefinition save(SchemaDefinition schemaDefinition) {
        SchemaDefinitionEntity entity = toEntity(schemaDefinition);
        SchemaDefinitionEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SchemaDefinition> findByType(String type) {
        return jpaRepository.findByType(type)
                .map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchemaDefinition> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByType(String type) {
        jpaRepository.deleteByType(type);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByType(String type) {
        return jpaRepository.existsByType(type);
    }

    /**
     * Convert domain model to JPA entity.
     */
    private SchemaDefinitionEntity toEntity(SchemaDefinition domain) {
        SchemaDefinitionEntity entity = new SchemaDefinitionEntity(
                domain.type(),
                domain.schema(),
                domain.description(),
                domain.strictMode()
        );
        entity.setCreatedAt(domain.createdAt());
        entity.setUpdatedAt(domain.updatedAt());
        return entity;
    }

    /**
     * Convert JPA entity to domain model.
     */
    private SchemaDefinition toDomain(SchemaDefinitionEntity entity) {
        return new SchemaDefinition(
                entity.getType(),
                entity.getSchemaJson(),
                entity.getDescription(),
                entity.isStrictMode(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
