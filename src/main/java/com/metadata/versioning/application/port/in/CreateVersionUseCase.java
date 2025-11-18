package com.metadata.versioning.application.port.in;

import com.fasterxml.jackson.databind.JsonNode;
import com.metadata.versioning.domain.model.Version;

/**
 * Use case port for creating new metadata versions.
 * Handles both initial document creation and subsequent version creation.
 */
public interface CreateVersionUseCase {

    /**
     * Create the first version (v1) of a new metadata document.
     * 
     * @param command Command containing metadata details
     * @return The created version
     * @throws com.metadata.versioning.domain.exception.DocumentAlreadyExistsException if document already exists
     * @throws com.metadata.versioning.domain.exception.InvalidJsonException if JSON validation fails
     */
    Version createFirstVersion(CreateFirstVersionCommand command);

    /**
     * Create a new version for an existing metadata document.
     * 
     * @param command Command containing version details
     * @return The created version
     * @throws com.metadata.versioning.domain.exception.VersionNotFoundException if document doesn't exist
     * @throws com.metadata.versioning.domain.exception.InvalidJsonException if JSON validation fails
     */
    Version createNewVersion(CreateNewVersionCommand command);

    /**
     * Command for creating the first version of a metadata document.
     */
    record CreateFirstVersionCommand(
            String type,
            String name,
            JsonNode content,
            String author
    ) {
        public CreateFirstVersionCommand {
            if (type == null || type.isBlank()) {
                throw new IllegalArgumentException("Type cannot be null or empty");
            }
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("Name cannot be null or empty");
            }
            if (content == null) {
                throw new IllegalArgumentException("Content cannot be null");
            }
            if (author == null || author.isBlank()) {
                throw new IllegalArgumentException("Author cannot be null or empty");
            }
        }
    }

    /**
     * Command for creating a new version of an existing document.
     */
    record CreateNewVersionCommand(
            String type,
            String name,
            JsonNode content,
            String author,
            String changeSummary
    ) {
        public CreateNewVersionCommand {
            if (type == null || type.isBlank()) {
                throw new IllegalArgumentException("Type cannot be null or empty");
            }
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("Name cannot be null or empty");
            }
            if (content == null) {
                throw new IllegalArgumentException("Content cannot be null");
            }
            if (author == null || author.isBlank()) {
                throw new IllegalArgumentException("Author cannot be null or empty");
            }
        }
    }
}
