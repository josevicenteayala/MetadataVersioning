package com.metadata.versioning.application.port.out;

import com.metadata.versioning.domain.model.SchemaDefinition;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for schema definition persistence.
 */
public interface SchemaDefinitionRepository {

    /**
     * Save a schema definition (create or update).
     */
    SchemaDefinition save(SchemaDefinition schemaDefinition);

    /**
     * Find a schema definition by type.
     */
    Optional<SchemaDefinition> findByType(String type);

    /**
     * Find all schema definitions.
     */
    List<SchemaDefinition> findAll();

    /**
     * Delete a schema definition by type.
     */
    void deleteByType(String type);

    /**
     * Check if a schema exists for a type.
     */
    boolean existsByType(String type);
}
