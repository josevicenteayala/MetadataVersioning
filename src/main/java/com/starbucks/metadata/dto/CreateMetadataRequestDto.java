package com.starbucks.metadata.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create new metadata")
public class CreateMetadataRequestDto {

    @NotBlank(message = "Type is required")
    @Size(max = 100, message = "Type must not exceed 100 characters")
    @Schema(description = "Metadata type/category", example = "configuration", required = true)
    private String type;

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    @Schema(description = "Metadata name", example = "app-settings", required = true)
    private String name;

    @NotNull(message = "JSON content is required")
    @Schema(description = "Metadata content in JSON format", required = true)
    private JsonNode json;
}