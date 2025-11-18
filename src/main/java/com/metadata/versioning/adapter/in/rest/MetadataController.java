package com.metadata.versioning.adapter.in.rest;

import com.metadata.versioning.adapter.in.rest.dto.CreateMetadataRequest;
import com.metadata.versioning.adapter.in.rest.dto.CreateVersionRequest;
import com.metadata.versioning.adapter.in.rest.dto.VersionResponse;
import com.metadata.versioning.application.port.in.CreateVersionUseCase;
import com.metadata.versioning.application.port.in.GetVersionHistoryUseCase;
import com.metadata.versioning.domain.model.Version;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for metadata document operations.
 * Handles creation of metadata documents and version management.
 */
@RestController
@RequestMapping("/api/v1/metadata")
@Tag(name = "Metadata Documents", description = "Operations on metadata documents and versions")
public class MetadataController {

    private final CreateVersionUseCase createVersionUseCase;
    private final GetVersionHistoryUseCase getVersionHistoryUseCase;

    public MetadataController(CreateVersionUseCase createVersionUseCase,
                             GetVersionHistoryUseCase getVersionHistoryUseCase) {
        this.createVersionUseCase = createVersionUseCase;
        this.getVersionHistoryUseCase = getVersionHistoryUseCase;
    }

    /**
     * Create new metadata document with first version (v1).
     * Requires authentication (FR-027).
     */
    @PostMapping
    @Operation(
        summary = "Create new metadata document",
        description = "Create first version (v1) of a new metadata document",
        security = @SecurityRequirement(name = "BasicAuth")
    )
    @ApiResponse(responseCode = "201", description = "Metadata document created")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "401", description = "Authentication required")
    @ApiResponse(responseCode = "409", description = "Document already exists")
    public ResponseEntity<VersionResponse> createMetadata(
            @Valid @RequestBody CreateMetadataRequest request,
            Authentication authentication) {

        String author = authentication != null ? authentication.getName() : "anonymous";

        CreateVersionUseCase.CreateFirstVersionCommand command =
                new CreateVersionUseCase.CreateFirstVersionCommand(
                        request.type(),
                        request.name(),
                        request.content(),
                        author
                );

        Version version = createVersionUseCase.createFirstVersion(command);
        VersionResponse response = VersionResponse.fromDomain(version, request.type(), request.name());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create new version for existing metadata document.
     * Requires authentication (FR-027).
     */
    @PostMapping("/{type}/{name}/versions")
    @Operation(
        summary = "Create new version",
        description = "Create next version (increment version number)",
        security = @SecurityRequirement(name = "BasicAuth")
    )
    @ApiResponse(responseCode = "201", description = "New version created")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "401", description = "Authentication required")
    @ApiResponse(responseCode = "404", description = "Document not found")
    public ResponseEntity<VersionResponse> createVersion(
            @PathVariable String type,
            @PathVariable String name,
            @Valid @RequestBody CreateVersionRequest request,
            Authentication authentication) {

        String author = authentication != null ? authentication.getName() : "anonymous";

        CreateVersionUseCase.CreateNewVersionCommand command =
                new CreateVersionUseCase.CreateNewVersionCommand(
                        type,
                        name,
                        request.content(),
                        author,
                        request.changeSummary()
                );

        Version version = createVersionUseCase.createNewVersion(command);
        VersionResponse response = VersionResponse.fromDomain(version, type, name);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all versions for a metadata document (FR-009).
     * Public access - no authentication required (FR-026).
     */
    @GetMapping("/{type}/{name}/versions")
    @Operation(
        summary = "List all versions",
        description = "Get version history ordered by version number"
    )
    @ApiResponse(responseCode = "200", description = "Version list")
    @ApiResponse(responseCode = "404", description = "Document not found")
    public ResponseEntity<List<VersionResponse>> getVersionHistory(
            @PathVariable String type,
            @PathVariable String name) {

        GetVersionHistoryUseCase.VersionHistoryQuery query =
                new GetVersionHistoryUseCase.VersionHistoryQuery(type, name);

        List<Version> versions = getVersionHistoryUseCase.getVersionHistory(query);

        List<VersionResponse> response = versions.stream()
                .map(v -> VersionResponse.fromDomain(v, type, name))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Get specific version by number (FR-008).
     * Public access - no authentication required (FR-026).
     */
    @GetMapping("/{type}/{name}/versions/{versionNumber}")
    @Operation(
        summary = "Get specific version",
        description = "Retrieve specific version by number"
    )
    @ApiResponse(responseCode = "200", description = "Version details")
    @ApiResponse(responseCode = "404", description = "Version not found")
    public ResponseEntity<VersionResponse> getSpecificVersion(
            @PathVariable String type,
            @PathVariable String name,
            @PathVariable Integer versionNumber) {

        GetVersionHistoryUseCase.SpecificVersionQuery query =
                new GetVersionHistoryUseCase.SpecificVersionQuery(type, name, versionNumber);

        Version version = getVersionHistoryUseCase.getSpecificVersion(query);
        VersionResponse response = VersionResponse.fromDomain(version, type, name);

        return ResponseEntity.ok(response);
    }
}
