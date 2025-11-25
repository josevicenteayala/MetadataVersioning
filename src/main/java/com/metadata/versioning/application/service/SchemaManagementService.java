package com.metadata.versioning.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.metadata.versioning.application.port.in.ManageSchemaUseCase;
import com.metadata.versioning.application.port.out.SchemaDefinitionRepository;
import com.metadata.versioning.domain.exception.SchemaAlreadyExistsException;
import com.metadata.versioning.domain.exception.SchemaNotFoundException;
import com.metadata.versioning.domain.model.SchemaDefinition;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Application service for managing schema definitions.
 */
@Service
@Transactional
public class SchemaManagementService implements ManageSchemaUseCase {

    private final SchemaDefinitionRepository repository;

    public SchemaManagementService(SchemaDefinitionRepository repository) {
        this.repository = repository;
    }

    @Override
    public SchemaDefinition createSchema(String type, JsonNode schema, String description, boolean strictMode) {
        // Check if schema already exists
        if (repository.existsByType(type)) {
            throw new SchemaAlreadyExistsException(type);
        }

        SchemaDefinition schemaDefinition = new SchemaDefinition(type, schema, description, strictMode);
        return repository.save(schemaDefinition);
    }

    @Override
    public SchemaDefinition updateSchema(String type, JsonNode schema, String description, boolean strictMode) {
        SchemaDefinition existing = repository.findByType(type)
                .orElseThrow(() -> new SchemaNotFoundException(type));

        SchemaDefinition updated = existing.update(schema, description, strictMode);
        return repository.save(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SchemaDefinition> getSchema(String type) {
        return repository.findByType(type);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchemaDefinition> listSchemas() {
        return repository.findAll();
    }

    @Override
    public void deleteSchema(String type) {
        if (!repository.existsByType(type)) {
            throw new SchemaNotFoundException(type);
        }
        repository.deleteByType(type);
    }
}
