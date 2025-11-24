package com.metadata.versioning.adapter.out.persistence.repository;

import com.metadata.versioning.adapter.out.persistence.entity.MetadataDocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for MetadataDocument entities.
 */
@Repository
public interface JpaMetadataDocumentRepository extends JpaRepository<MetadataDocumentEntity, Long> {

    /**
     * Find document by type and name (unique combination).
     */
    Optional<MetadataDocumentEntity> findByTypeAndName(String type, String name);

    /**
     * Check if document exists by type and name.
     */
    boolean existsByTypeAndName(String type, String name);
}
