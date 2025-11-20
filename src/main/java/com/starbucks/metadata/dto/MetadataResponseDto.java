package com.starbucks.metadata.dto;

import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Metadata response")
public class MetadataResponseDto {

    @Schema(description = "Unique identifier")
    private UUID id;

    @Schema(description = "Metadata type/category")
    private String type;

    @Schema(description = "Metadata name")
    private String name;

    @Schema(description = "Metadata content in JSON format")
    private JsonNode json;

    @Schema(description = "Version number")
    private Integer version;

    @Schema(description = "Active flag")
    private Boolean isActive;

    @Schema(description = "Creation timestamp")
    private Instant created;

    @Schema(description = "Last update timestamp")
    private Instant updated;
}