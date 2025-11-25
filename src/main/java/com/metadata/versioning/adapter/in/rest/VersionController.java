package com.metadata.versioning.adapter.in.rest;

import com.metadata.versioning.application.port.in.ActivateVersionUseCase;
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

    public VersionController(ActivateVersionUseCase activateVersionUseCase) {
        this.activateVersionUseCase = activateVersionUseCase;
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
}

