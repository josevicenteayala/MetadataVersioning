package com.metadata.versioning.application.service;

import com.metadata.versioning.application.port.in.GetActiveVersionUseCase;
import com.metadata.versioning.application.port.out.MetadataDocumentRepository;
import com.metadata.versioning.domain.model.MetadataDocument;
import com.metadata.versioning.domain.model.Version;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Application service for querying metadata documents.
 * Implements read-only operations for metadata retrieval.
 * Separated from VersionManagementService following CQRS pattern.
 */
@Service
@Transactional(readOnly = true)
public class MetadataQueryService implements GetActiveVersionUseCase {

    private final MetadataDocumentRepository repository;

    public MetadataQueryService(MetadataDocumentRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Version> getActiveVersion(String type, String name) {
        // Find document
        Optional<MetadataDocument> documentOpt = repository.findByTypeAndName(type, name);
        
        if (documentOpt.isEmpty()) {
            return Optional.empty();
        }

        // Return active version (FR-007)
        return documentOpt.get().getActiveVersion();
    }

    /**
     * List all metadata documents with pagination (FR-015).
     * Returns a page of document summaries for browsing.
     */
    public Page<MetadataDocument> listDocuments(Pageable pageable) {
        return repository.findAll(pageable);
    }

    /**
     * List metadata documents filtered by type with pagination.
     */
    public Page<MetadataDocument> listDocumentsByType(String type, Pageable pageable) {
        return repository.findAllByType(type, pageable);
    }

    /**
     * List metadata documents filtered by name (case insensitive) with pagination.
     */
    public Page<MetadataDocument> listDocumentsByName(String name, Pageable pageable) {
        return repository.findAllByNameContainingIgnoreCase(name, pageable);
    }

    /**
     * Get metadata document by type and name.
     */
    public Optional<MetadataDocument> getMetadataDocument(String type, String name) {
        return repository.findByTypeAndName(type, name);
    }
}
