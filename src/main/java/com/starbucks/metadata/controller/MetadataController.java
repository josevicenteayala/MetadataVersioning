package com.starbucks.metadata.controller;

import com.starbucks.metadata.dto.*;
import com.starbucks.metadata.service.MetadataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/metadata")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Metadata", description = "Metadata versioning API")
public class MetadataController {

    private final MetadataService metadataService;

    @PostMapping
    @Operation(summary = "Create metadata", description = "Creates a new metadata entry with version 1 and sets it as active")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Metadata created successfully"),
            @ApiResponse(responseCode = "409", description = "Metadata with same (type, name) already exists"),
            @ApiResponse(responseCode = "400", description = "Invalid request body or JSON")
    })
    public ResponseEntity<MetadataResponseDto> createMetadata(
            @Valid @RequestBody CreateMetadataRequestDto request) {
        log.info("Creating metadata with type: {} and name: {}", request.getType(), request.getName());
        MetadataResponseDto response = metadataService.createMetadata(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/{type}/{name}/versions")
    @Operation(summary = "Create new version", description = "Creates a new version of existing metadata. The new version is created as inactive.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Version created successfully"),
            @ApiResponse(responseCode = "404", description = "Metadata (type, name) doesn't exist"),
            @ApiResponse(responseCode = "400", description = "Invalid JSON")
    })
    public ResponseEntity<MetadataResponseDto> createNewVersion(
            @Parameter(description = "Metadata type") @PathVariable String type,
            @Parameter(description = "Metadata name") @PathVariable String name,
            @Valid @RequestBody CreateVersionRequestDto request) {
        log.info("Creating new version for type: {} and name: {}", type, name);
        MetadataResponseDto response = metadataService.createNewVersion(type, name, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/{type}/{name}/versions/{version}/activate")
    @Operation(summary = "Activate version", description = "Activates a specific version and deactivates all other versions of the same (type, name)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Version activated successfully"),
            @ApiResponse(responseCode = "404", description = "Version doesn't exist"),
            @ApiResponse(responseCode = "409", description = "Version is already active")
    })
    public ResponseEntity<ActivationResponseDto> activateVersion(
            @Parameter(description = "Metadata type") @PathVariable String type,
            @Parameter(description = "Metadata name") @PathVariable String name,
            @Parameter(description = "Version number") @PathVariable Integer version) {
        log.info("Activating version {} for type: {} and name: {}", version, type, name);
        ActivationResponseDto response = metadataService.activateVersion(type, name, version);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{type}/{name}/versions")
    @Operation(summary = "List all versions", description = "Returns all versions of a specific metadata entry, sorted by version number")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Versions retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "No metadata found for (type, name)")
    })
    public ResponseEntity<VersionListResponseDto> listVersions(
            @Parameter(description = "Metadata type") @PathVariable String type,
            @Parameter(description = "Metadata name") @PathVariable String name) {
        log.info("Listing versions for type: {} and name: {}", type, name);
        VersionListResponseDto response = metadataService.listVersions(type, name);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get metadata by ID", description = "Retrieves a specific metadata entry by its unique ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metadata retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Metadata with ID doesn't exist"),
            @ApiResponse(responseCode = "400", description = "Invalid UUID format")
    })
    public ResponseEntity<MetadataResponseDto> getMetadataById(
            @Parameter(description = "Metadata ID") @PathVariable UUID id) {
        log.info("Getting metadata by ID: {}", id);
        MetadataResponseDto response = metadataService.getMetadataById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get metadata by type", description = "Returns paginated metadata entries for a specific type")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metadata list retrieved successfully")
    })
    public ResponseEntity<Page<MetadataResponseDto>> getMetadataByType(
            @Parameter(description = "Metadata type") @PathVariable String type,
            @Parameter(description = "Return only active versions") @RequestParam(required = false) Boolean activeOnly,
            @Parameter(hidden = true) @PageableDefault(size = 20, sort = "updated", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Getting metadata by type: {}, activeOnly: {}", type, activeOnly);
        Page<MetadataResponseDto> response = metadataService.getMetadataByType(type, activeOnly, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List metadata with filters", description = "Lists metadata entries with optional filters and pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metadata list retrieved successfully")
    })
    public ResponseEntity<Page<MetadataResponseDto>> listMetadata(
            @Parameter(description = "Filter by metadata type") @RequestParam(required = false) String type,
            @Parameter(description = "Filter by metadata name (partial match)") @RequestParam(required = false) String name,
            @Parameter(description = "Return only active versions") @RequestParam(required = false) Boolean activeOnly,
            @Parameter(hidden = true) @PageableDefault(size = 20, sort = "updated", direction = Sort.Direction.DESC) Pageable pageable) {
        log.info("Listing metadata with filters - type: {}, name: {}, activeOnly: {}", type, name, activeOnly);
        Page<MetadataResponseDto> response = metadataService.listMetadata(type, name, activeOnly, pageable);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete version", description = "Deletes a specific metadata version. Cannot delete active versions.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Version deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Metadata doesn't exist"),
            @ApiResponse(responseCode = "409", description = "Cannot delete active version"),
            @ApiResponse(responseCode = "400", description = "Invalid UUID")
    })
    public ResponseEntity<Void> deleteVersion(
            @Parameter(description = "Metadata ID") @PathVariable UUID id) {
        log.info("Deleting metadata version with ID: {}", id);
        metadataService.deleteVersion(id);
        return ResponseEntity.noContent().build();
    }
}