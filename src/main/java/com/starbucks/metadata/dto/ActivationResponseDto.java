package com.starbucks.metadata.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Activation response")
public class ActivationResponseDto {

    @Schema(description = "Success message")
    private String message;

    @Schema(description = "Activated metadata summary")
    private MetadataSummary metadata;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "Metadata summary")
    public static class MetadataSummary {
        @Schema(description = "Unique identifier")
        private UUID id;

        @Schema(description = "Metadata type")
        private String type;

        @Schema(description = "Metadata name")
        private String name;

        @Schema(description = "Version number")
        private Integer version;

        @Schema(description = "Active flag")
        private Boolean isActive;
    }
}