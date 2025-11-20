package com.starbucks.metadata.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create new version")
public class CreateVersionRequestDto {

    @NotNull(message = "JSON content is required")
    @Schema(description = "Metadata content in JSON format", required = true)
    private JsonNode json;
}