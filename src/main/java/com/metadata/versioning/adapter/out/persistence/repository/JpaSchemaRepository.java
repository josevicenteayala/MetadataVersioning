package com.metadata.versioning.adapter.out.persistence.repository;

import com.metadata.versioning.adapter.out.persistence.entity.SchemaDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for schema definitions.
 */
@Repository
public interface JpaSchemaRepository extends JpaRepository<SchemaDefinitionEntity, String> {

    /**
     * Find schema by type.
     */
    Optional<SchemaDefinitionEntity> findByType(String type);

    /**
     * Check if schema exists by type.
     */
    boolean existsByType(String type);

    /**
     * Delete schema by type.
     */
    void deleteByType(String type);
}
