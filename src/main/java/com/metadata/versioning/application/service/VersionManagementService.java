package com.metadata.versioning.application.service;

import com.metadata.versioning.application.port.in.ActivateVersionUseCase;
import com.metadata.versioning.application.port.in.CreateVersionUseCase;
import com.metadata.versioning.application.port.in.GetVersionHistoryUseCase;
import com.metadata.versioning.application.port.out.MetadataDocumentRepository;
import com.metadata.versioning.application.port.out.SchemaDefinitionRepository;
import com.metadata.versioning.domain.exception.DocumentAlreadyExistsException;
import com.metadata.versioning.domain.exception.VersionNotFoundException;
import com.metadata.versioning.domain.model.MetadataDocument;
import com.metadata.versioning.domain.model.Version;
import com.metadata.versioning.domain.validator.JsonStructureValidator;
import com.metadata.versioning.domain.validator.SchemaValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service implementing version management use cases.
 * Coordinates domain operations and repository interactions.
 */
@Service
@Transactional
public class VersionManagementService implements CreateVersionUseCase, GetVersionHistoryUseCase, ActivateVersionUseCase {

    private final MetadataDocumentRepository repository;
    private final SchemaDefinitionRepository schemaRepository;
    private final SchemaValidator schemaValidator;

    public VersionManagementService(MetadataDocumentRepository repository,
                                   SchemaDefinitionRepository schemaRepository) {
        this.repository = repository;
        this.schemaRepository = schemaRepository;
        this.schemaValidator = new SchemaValidator();
    }

    @Override
    public Version createFirstVersion(CreateFirstVersionCommand command) {
        // Validate JSON structure and size (FR-011, FR-025)
        JsonStructureValidator.validate(command.content());

        // Validate against schema if one exists
        validateAgainstSchema(command.type(), command.content());

        // Check if document already exists (FR-005)
        if (repository.existsByTypeAndName(command.type(), command.name())) {
            throw new DocumentAlreadyExistsException(command.type(), command.name());
        }

        // Create first version
        Version firstVersion = Version.createFirst(
                command.content(),
                command.author(),
                "Initial version"
        );

        // Create document with first version
        MetadataDocument document = new MetadataDocument(
                command.type(),
                command.name(),
                firstVersion
        );

        // Save to repository
        MetadataDocument savedDocument = repository.save(document);

        // Return the first version
        return savedDocument.getVersion(1)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve created version"));
    }

    @Override
    public Version createNewVersion(CreateNewVersionCommand command) {
        // Validate JSON structure and size (FR-011, FR-025)
        JsonStructureValidator.validate(command.content());

        // Validate against schema if one exists
        validateAgainstSchema(command.type(), command.content());

        // Find existing document
        MetadataDocument document = repository.findByTypeAndName(command.type(), command.name())
                .orElseThrow(() -> new VersionNotFoundException(command.type(), command.name()));

        // Add new version (FR-001)
        Version newVersion = document.addVersion(
                command.content(),
                command.author(),
                command.changeSummary()
        );

        // Update document in repository
        MetadataDocument updatedDocument = repository.update(document);

        // Return the newly created version
        return updatedDocument.getVersion(newVersion.versionNumber())
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve created version"));
    }

    /**
     * Validate content against schema if one exists for the type.
     * Throws SchemaViolationException if validation fails in strict mode.
     */
    private void validateAgainstSchema(String type, com.fasterxml.jackson.databind.JsonNode content) {
        schemaRepository.findByType(type).ifPresent(schema ->
                schemaValidator.validate(content, schema)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<Version> getVersionHistory(VersionHistoryQuery query) {
        // Find document
        MetadataDocument document = repository.findByTypeAndName(query.type(), query.name())
                .orElseThrow(() -> new VersionNotFoundException(query.type(), query.name()));

        // Return all versions ordered by version number (FR-009)
        return document.getAllVersions();
    }

    @Override
    @Transactional(readOnly = true)
    public Version getSpecificVersion(SpecificVersionQuery query) {
        // Find document
        MetadataDocument document = repository.findByTypeAndName(query.type(), query.name())
                .orElseThrow(() -> new VersionNotFoundException(query.type(), query.name()));

        // Get specific version (FR-008)
        return document.getVersion(query.versionNumber())
                .orElseThrow(() -> new VersionNotFoundException(
                        query.type(), query.name(), query.versionNumber()));
    }

    @Override
    public void activateVersion(String type, String name, Integer versionNumber) {
        // Find document
        MetadataDocument document = repository.findByTypeAndName(type, name)
                .orElseThrow(() -> new VersionNotFoundException(type, name));

        // Activate the version (FR-006)
        // This deactivates any currently active version and activates the specified one
        document.activateVersion(versionNumber);

        // Persist the changes
        repository.update(document);
    }
}
