package com.starbucks.metadata.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Version list response")
public class VersionListResponseDto {

    @Schema(description = "Metadata type")
    private String type;

    @Schema(description = "Metadata name")
    private String name;

    @Schema(description = "Total number of versions")
    private Integer totalVersions;

    @Schema(description = "Currently active version number")
    private Integer activeVersion;

    @Schema(description = "List of all versions")
    private List<VersionDto> versions;
}