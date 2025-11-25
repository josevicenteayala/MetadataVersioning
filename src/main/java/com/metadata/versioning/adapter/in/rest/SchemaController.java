package com.metadata.versioning.adapter.in.rest;

import com.metadata.versioning.adapter.in.rest.dto.SchemaDefinitionRequest;
import com.metadata.versioning.adapter.in.rest.dto.SchemaDefinitionResponse;
import com.metadata.versioning.application.port.in.ManageSchemaUseCase;
import com.metadata.versioning.domain.model.SchemaDefinition;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for schema management operations.
 */
@RestController
@RequestMapping("/api/schemas")
@Tag(name = "Schema Management", description = "Endpoints for managing JSON Schema definitions")
public class SchemaController {

    private final ManageSchemaUseCase manageSchemaUseCase;

    public SchemaController(ManageSchemaUseCase manageSchemaUseCase) {
        this.manageSchemaUseCase = manageSchemaUseCase;
    }

    /**
     * Create a new schema definition.
     */
    @PostMapping
    @Operation(
        summary = "Create schema definition",
        description = "Creates a new JSON Schema definition for a metadata type. Enables validation for all documents of this type."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Schema created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid schema definition"),
        @ApiResponse(responseCode = "409", description = "Schema already exists for this type")
    })
    public ResponseEntity<SchemaDefinitionResponse> createSchema(
            @Valid @RequestBody SchemaDefinitionRequest request) {
        
        SchemaDefinition created = manageSchemaUseCase.createSchema(
                request.type(),
                request.schema(),
                request.description(),
                request.strictMode()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(SchemaDefinitionResponse.from(created));
    }

    /**
     * Update an existing schema definition.
     */
    @PutMapping("/{type}")
    @Operation(
        summary = "Update schema definition",
        description = "Updates an existing JSON Schema definition for a metadata type."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Schema updated successfully"),
        @ApiResponse(responseCode = "404", description = "Schema not found"),
        @ApiResponse(responseCode = "400", description = "Invalid schema definition")
    })
    public ResponseEntity<SchemaDefinitionResponse> updateSchema(
            @Parameter(description = "Metadata type", example = "loyalty-program")
            @PathVariable String type,
            
            @Valid @RequestBody SchemaDefinitionRequest request) {
        
        SchemaDefinition updated = manageSchemaUseCase.updateSchema(
                type,
                request.schema(),
                request.description(),
                request.strictMode()
        );

        return ResponseEntity.ok(SchemaDefinitionResponse.from(updated));
    }

    /**
     * Get a schema definition by type.
     */
    @GetMapping("/{type}")
    @Operation(
        summary = "Get schema definition",
        description = "Retrieves the JSON Schema definition for a specific metadata type."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Schema found"),
        @ApiResponse(responseCode = "404", description = "Schema not found")
    })
    public ResponseEntity<SchemaDefinitionResponse> getSchema(
            @Parameter(description = "Metadata type", example = "loyalty-program")
            @PathVariable String type) {
        
        return manageSchemaUseCase.getSchema(type)
                .map(schema -> ResponseEntity.ok(SchemaDefinitionResponse.from(schema)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List all schema definitions.
     */
    @GetMapping
    @Operation(
        summary = "List all schemas",
        description = "Retrieves all JSON Schema definitions."
    )
    @ApiResponse(responseCode = "200", description = "Schemas retrieved successfully")
    public ResponseEntity<List<SchemaDefinitionResponse>> listSchemas() {
        List<SchemaDefinitionResponse> schemas = manageSchemaUseCase.listSchemas().stream()
                .map(SchemaDefinitionResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(schemas);
    }

    /**
     * Delete a schema definition.
     */
    @DeleteMapping("/{type}")
    @Operation(
        summary = "Delete schema definition",
        description = "Deletes the JSON Schema definition for a specific metadata type."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Schema deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Schema not found")
    })
    public ResponseEntity<Void> deleteSchema(
            @Parameter(description = "Metadata type", example = "loyalty-program")
            @PathVariable String type) {
        
        manageSchemaUseCase.deleteSchema(type);
        return ResponseEntity.noContent().build();
    }
}
