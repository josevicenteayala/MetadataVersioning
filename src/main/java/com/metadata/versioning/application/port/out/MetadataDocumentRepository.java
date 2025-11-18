package com.metadata.versioning.application.port.out;

import com.metadata.versioning.domain.model.MetadataDocument;

import java.util.Optional;

/**
 * Outbound port for metadata document persistence.
 * Defines operations the domain layer needs from the infrastructure layer.
 */
public interface MetadataDocumentRepository {

    /**
     * Save a new metadata document (with its first version).
     * 
     * @param document Document to save
     * @return The saved document
     */
    MetadataDocument save(MetadataDocument document);

    /**
     * Find a metadata document by type and name.
     * 
     * @param type Document type
     * @param name Document name
     * @return Optional containing the document if found
     */
    Optional<MetadataDocument> findByTypeAndName(String type, String name);

    /**
     * Check if a document exists with the given type and name.
     * 
     * @param type Document type
     * @param name Document name
     * @return true if document exists
     */
    boolean existsByTypeAndName(String type, String name);

    /**
     * Update an existing metadata document.
     * Used when adding versions or changing active status.
     * 
     * @param document Document to update
     * @return The updated document
     */
    MetadataDocument update(MetadataDocument document);
}
