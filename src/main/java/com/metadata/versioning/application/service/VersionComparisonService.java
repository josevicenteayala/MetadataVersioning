package com.metadata.versioning.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.application.port.in.CompareVersionsUseCase;
import com.metadata.versioning.application.port.out.MetadataDocumentRepository;
import com.metadata.versioning.domain.exception.VersionNotFoundException;
import com.metadata.versioning.domain.model.MetadataDocument;
import com.metadata.versioning.domain.model.Version;
import com.metadata.versioning.domain.model.VersionComparison;
import com.metadata.versioning.domain.service.DiffEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for comparing versions.
 * Implements version comparison use case (FR-010).
 */
@Service
@Transactional(readOnly = true)
public class VersionComparisonService implements CompareVersionsUseCase {

    private final MetadataDocumentRepository repository;
    private final DiffEngine diffEngine;

    public VersionComparisonService(MetadataDocumentRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.diffEngine = new DiffEngine(objectMapper);
    }

    @Override
    public VersionComparison compareVersions(String type, String name, int fromVersionNumber, int toVersionNumber) {
        // Find the document
        MetadataDocument document = repository.findByTypeAndName(type, name)
                .orElseThrow(() -> new VersionNotFoundException(type, name));

        // Get both versions
        Version fromVersion = document.getVersion(fromVersionNumber)
                .orElseThrow(() -> new VersionNotFoundException(type, name, fromVersionNumber));
        
        Version toVersion = document.getVersion(toVersionNumber)
                .orElseThrow(() -> new VersionNotFoundException(type, name, toVersionNumber));

        // Perform comparison using domain service
        return diffEngine.compare(fromVersion, toVersion);
    }
}
