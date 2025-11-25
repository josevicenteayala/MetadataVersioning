package com.metadata.versioning.adapter.in.rest;

import com.metadata.versioning.adapter.in.rest.dto.ComparisonResponse;
import com.metadata.versioning.application.port.in.ActivateVersionUseCase;
import com.metadata.versioning.application.port.in.CompareVersionsUseCase;
import com.metadata.versioning.domain.exception.InvalidActivationException;
import com.metadata.versioning.domain.exception.VersionNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for version-specific operations.
 * Handles version activation and lifecycle management.
 */
@RestController
@RequestMapping("/api/metadata/{type}/{name}/versions")
@Tag(name = "Version Management", description = "Endpoints for managing version lifecycle")
public class VersionController {

    private final ActivateVersionUseCase activateVersionUseCase;
    private final CompareVersionsUseCase compareVersionsUseCase;

    public VersionController(ActivateVersionUseCase activateVersionUseCase,
                             CompareVersionsUseCase compareVersionsUseCase) {
        this.activateVersionUseCase = activateVersionUseCase;
        this.compareVersionsUseCase = compareVersionsUseCase;
    }

    /**
     * Activate a specific version (FR-006).
     * Deactivates any currently active version and makes the specified version active.
     * 
     * @param type Metadata type (e.g., "loyalty-program")
     * @param name Metadata name (e.g., "gold-tier")
     * @param versionNumber Version number to activate (1-based)
     * @return 204 No Content on success
     */
    @PostMapping("/{versionNumber}/activate")
    @Operation(
        summary = "Activate a version",
        description = "Makes the specified version active for consumption. Deactivates any currently active version. Only one version can be active at a time (FR-006)."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Version activated successfully"),
        @ApiResponse(responseCode = "404", description = "Version not found"),
        @ApiResponse(responseCode = "400", description = "Invalid activation (e.g., non-published version)")
    })
    public ResponseEntity<Void> activateVersion(
            @Parameter(description = "Metadata type", example = "loyalty-program")
            @PathVariable String type,
            
            @Parameter(description = "Metadata name", example = "gold-tier")
            @PathVariable String name,
            
            @Parameter(description = "Version number to activate", example = "3")
            @PathVariable Integer versionNumber) {
        
        // Exceptions handled by GlobalExceptionHandler
        activateVersionUseCase.activateVersion(type, name, versionNumber);
        return ResponseEntity.noContent().build();
    }

    /**
     * Compare two versions (FR-010).
     * Returns detailed change analysis including breaking changes.
     * 
     * @param type Metadata type
     * @param name Metadata name
     * @param from Baseline version number
     * @param to Version number to compare against
     * @return Detailed comparison with change summary
     */
    @GetMapping("/compare")
    @Operation(
        summary = "Compare two versions",
        description = "Analyzes differences between two versions with detailed change tracking (FR-010)."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Comparison completed successfully"),
        @ApiResponse(responseCode = "404", description = "One or both versions not found")
    })
    public ResponseEntity<ComparisonResponse> compareVersions(
            @Parameter(description = "Metadata type", example = "loyalty-program")
            @PathVariable String type,
            
            @Parameter(description = "Metadata name", example = "gold-tier")
            @PathVariable String name,
            
            @Parameter(description = "Baseline version number", example = "1")
            @RequestParam int from,
            
            @Parameter(description = "Version to compare", example = "2")
            @RequestParam int to) {
        
        var comparison = compareVersionsUseCase.compareVersions(type, name, from, to);
        return ResponseEntity.ok(ComparisonResponse.from(comparison));
    }
}

