package com.starbucks.metadata.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.starbucks.metadata.dto.*;
import com.starbucks.metadata.exception.*;
import com.starbucks.metadata.service.MetadataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MetadataController.class)
@DisplayName("MetadataController Tests")
class MetadataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MetadataService metadataService;

    @Autowired
    private ObjectMapper objectMapper;

    private JsonNode sampleJsonContent;
    private UUID sampleId;
    private String validType;
    private String validName;
    private Instant now;

    @BeforeEach
    void setUp() throws Exception {
        sampleId = UUID.randomUUID();
        validType = "configuration";
        validName = "app-settings";
        now = Instant.now();
        
        sampleJsonContent = objectMapper.readTree("{\"key\":\"value\",\"number\":123}");
    }

    @Nested
    @DisplayName("Create Metadata Tests")
    class CreateMetadataTests {

        @Test
        @DisplayName("Should create metadata successfully")
        void shouldCreateMetadataSuccessfully() throws Exception {
            CreateMetadataRequestDto request = CreateMetadataRequestDto.builder()
                .type(validType)
                .name(validName)
                .json(sampleJsonContent)
                .build();

            MetadataResponseDto response = MetadataResponseDto.builder()
                .id(sampleId)
                .type(validType)
                .name(validName)
                .json(sampleJsonContent)
                .version(1)
                .isActive(true)
                .created(now)
                .updated(now)
                .build();

            when(metadataService.createMetadata(any(CreateMetadataRequestDto.class)))
                .thenReturn(response);

            mockMvc.perform(post("/metadata")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(sampleId.toString()))
                .andExpect(jsonPath("$.type").value(validType))
                .andExpect(jsonPath("$.name").value(validName))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.json.key").value("value"))
                .andExpect(jsonPath("$.json.number").value(123));

            verify(metadataService, times(1)).createMetadata(any(CreateMetadataRequestDto.class));
        }

        @Test
        @DisplayName("Should return 409 when metadata already exists")
        void shouldReturn409WhenMetadataAlreadyExists() throws Exception {
            CreateMetadataRequestDto request = CreateMetadataRequestDto.builder()
                .type(validType)
                .name(validName)
                .json(sampleJsonContent)
                .build();

            when(metadataService.createMetadata(any(CreateMetadataRequestDto.class)))
                .thenThrow(new MetadataAlreadyExistsException("Metadata already exists"));

            mockMvc.perform(post("/metadata")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Should return 400 for invalid request - blank type")
        void shouldReturn400ForBlankType() throws Exception {
            CreateMetadataRequestDto request = CreateMetadataRequestDto.builder()
                .type("")
                .name(validName)
                .json(sampleJsonContent)
                .build();

            mockMvc.perform(post("/metadata")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 for invalid request - blank name")
        void shouldReturn400ForBlankName() throws Exception {
            CreateMetadataRequestDto request = CreateMetadataRequestDto.builder()
                .type(validType)
                .name("")
                .json(sampleJsonContent)
                .build();

            mockMvc.perform(post("/metadata")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 for null JSON content")
        void shouldReturn400ForNullJsonContent() throws Exception {
            CreateMetadataRequestDto request = CreateMetadataRequestDto.builder()
                .type(validType)
                .name(validName)
                .json(null)
                .build();

            mockMvc.perform(post("/metadata")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 for type exceeding max length")
        void shouldReturn400ForTypeExceedingMaxLength() throws Exception {
            String longType = "a".repeat(101); // Exceeds 100 character limit
            CreateMetadataRequestDto request = CreateMetadataRequestDto.builder()
                .type(longType)
                .name(validName)
                .json(sampleJsonContent)
                .build();

            mockMvc.perform(post("/metadata")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Create New Version Tests")
    class CreateNewVersionTests {

        @Test
        @DisplayName("Should create new version successfully")
        void shouldCreateNewVersionSuccessfully() throws Exception {
            CreateVersionRequestDto request = CreateVersionRequestDto.builder()
                .json(sampleJsonContent)
                .build();

            MetadataResponseDto response = MetadataResponseDto.builder()
                .id(sampleId)
                .type(validType)
                .name(validName)
                .json(sampleJsonContent)
                .version(2)
                .isActive(false)
                .created(now)
                .updated(now)
                .build();

            when(metadataService.createNewVersion(eq(validType), eq(validName), any(CreateVersionRequestDto.class)))
                .thenReturn(response);

            mockMvc.perform(post("/metadata/{type}/{name}/versions", validType, validName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(validType))
                .andExpect(jsonPath("$.name").value(validName))
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.isActive").value(false));

            verify(metadataService, times(1)).createNewVersion(eq(validType), eq(validName), any(CreateVersionRequestDto.class));
        }

        @Test
        @DisplayName("Should return 404 when metadata not found")
        void shouldReturn404WhenMetadataNotFound() throws Exception {
            CreateVersionRequestDto request = CreateVersionRequestDto.builder()
                .json(sampleJsonContent)
                .build();

            when(metadataService.createNewVersion(eq(validType), eq(validName), any(CreateVersionRequestDto.class)))
                .thenThrow(new MetadataNotFoundException("Metadata not found"));

            mockMvc.perform(post("/metadata/{type}/{name}/versions", validType, validName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 400 for null JSON content")
        void shouldReturn400ForNullJsonContent() throws Exception {
            CreateVersionRequestDto request = CreateVersionRequestDto.builder()
                .json(null)
                .build();

            mockMvc.perform(post("/metadata/{type}/{name}/versions", validType, validName)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Activate Version Tests")
    class ActivateVersionTests {

        @Test
        @DisplayName("Should activate version successfully")
        void shouldActivateVersionSuccessfully() throws Exception {
            Integer version = 2;
            ActivationResponseDto response = ActivationResponseDto.builder()
                .message("Version 2 activated successfully")
                .metadata(ActivationResponseDto.MetadataSummary.builder()
                    .id(sampleId)
                    .type(validType)
                    .name(validName)
                    .version(version)
                    .isActive(true)
                    .build())
                .build();

            when(metadataService.activateVersion(validType, validName, version))
                .thenReturn(response);

            mockMvc.perform(post("/metadata/{type}/{name}/versions/{version}/activate", 
                    validType, validName, version))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Version 2 activated successfully"))
                .andExpect(jsonPath("$.metadata.type").value(validType))
                .andExpect(jsonPath("$.metadata.version").value(version))
                .andExpect(jsonPath("$.metadata.isActive").value(true));

            verify(metadataService, times(1)).activateVersion(validType, validName, version);
        }

        @Test
        @DisplayName("Should return 404 when version not found")
        void shouldReturn404WhenVersionNotFound() throws Exception {
            Integer version = 999;
            
            when(metadataService.activateVersion(validType, validName, version))
                .thenThrow(new VersionNotFoundException("Version not found"));

            mockMvc.perform(post("/metadata/{type}/{name}/versions/{version}/activate", 
                    validType, validName, version))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 409 when version already active")
        void shouldReturn409WhenVersionAlreadyActive() throws Exception {
            Integer version = 1;
            
            when(metadataService.activateVersion(validType, validName, version))
                .thenThrow(new VersionAlreadyActiveException("Version already active"));

            mockMvc.perform(post("/metadata/{type}/{name}/versions/{version}/activate", 
                    validType, validName, version))
                .andExpect(status().isConflict());
        }
    }

    @Nested
    @DisplayName("List Versions Tests")
    class ListVersionsTests {

        @Test
        @DisplayName("Should list versions successfully")
        void shouldListVersionsSuccessfully() throws Exception {
            VersionDto version1 = VersionDto.builder()
                .id(UUID.randomUUID())
                .version(1)
                .isActive(true)
                .json(sampleJsonContent)
                .created(now)
                .updated(now)
                .build();

            VersionDto version2 = VersionDto.builder()
                .id(UUID.randomUUID())
                .version(2)
                .isActive(false)
                .json(sampleJsonContent)
                .created(now)
                .updated(now)
                .build();

            VersionListResponseDto response = VersionListResponseDto.builder()
                .type(validType)
                .name(validName)
                .totalVersions(2)
                .activeVersion(1)
                .versions(List.of(version2, version1)) // Usually sorted by version desc
                .build();

            when(metadataService.listVersions(validType, validName))
                .thenReturn(response);

            mockMvc.perform(get("/metadata/{type}/{name}/versions", validType, validName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value(validType))
                .andExpect(jsonPath("$.name").value(validName))
                .andExpect(jsonPath("$.totalVersions").value(2))
                .andExpect(jsonPath("$.activeVersion").value(1))
                .andExpect(jsonPath("$.versions").isArray())
                .andExpect(jsonPath("$.versions.length()").value(2));

            verify(metadataService, times(1)).listVersions(validType, validName);
        }

        @Test
        @DisplayName("Should return 404 when no metadata found")
        void shouldReturn404WhenNoMetadataFound() throws Exception {
            when(metadataService.listVersions(validType, validName))
                .thenThrow(new MetadataNotFoundException("No metadata found"));

            mockMvc.perform(get("/metadata/{type}/{name}/versions", validType, validName))
                .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Get Metadata By ID Tests")
    class GetMetadataByIdTests {

        @Test
        @DisplayName("Should get metadata by ID successfully")
        void shouldGetMetadataByIdSuccessfully() throws Exception {
            MetadataResponseDto response = MetadataResponseDto.builder()
                .id(sampleId)
                .type(validType)
                .name(validName)
                .json(sampleJsonContent)
                .version(1)
                .isActive(true)
                .created(now)
                .updated(now)
                .build();

            when(metadataService.getMetadataById(sampleId))
                .thenReturn(response);

            mockMvc.perform(get("/metadata/{id}", sampleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sampleId.toString()))
                .andExpect(jsonPath("$.type").value(validType))
                .andExpect(jsonPath("$.name").value(validName))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isActive").value(true));

            verify(metadataService, times(1)).getMetadataById(sampleId);
        }

        @Test
        @DisplayName("Should return 404 when metadata not found by ID")
        void shouldReturn404WhenMetadataNotFoundById() throws Exception {
            when(metadataService.getMetadataById(sampleId))
                .thenThrow(new MetadataNotFoundException("Metadata not found"));

            mockMvc.perform(get("/metadata/{id}", sampleId))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 500 for invalid UUID format (Spring conversion error)")
        void shouldReturn500ForInvalidUuidFormat() throws Exception {
            mockMvc.perform(get("/metadata/{id}", "invalid-uuid"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"));
        }
    }

    @Nested
    @DisplayName("Get Metadata By Type Tests")
    class GetMetadataByTypeTests {

        @Test
        @DisplayName("Should get metadata by type successfully")
        void shouldGetMetadataByTypeSuccessfully() throws Exception {
            MetadataResponseDto metadata1 = MetadataResponseDto.builder()
                .id(UUID.randomUUID())
                .type(validType)
                .name("config1")
                .json(sampleJsonContent)
                .version(1)
                .isActive(true)
                .created(now)
                .updated(now)
                .build();

            MetadataResponseDto metadata2 = MetadataResponseDto.builder()
                .id(UUID.randomUUID())
                .type(validType)
                .name("config2")
                .json(sampleJsonContent)
                .version(1)
                .isActive(true)
                .created(now)
                .updated(now)
                .build();

            Page<MetadataResponseDto> page = new PageImpl<>(
                List.of(metadata1, metadata2), 
                PageRequest.of(0, 20), 
                2
            );

            when(metadataService.getMetadataByType(eq(validType), eq(null), any(Pageable.class)))
                .thenReturn(page);

            mockMvc.perform(get("/metadata/type/{type}", validType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].type").value(validType))
                .andExpect(jsonPath("$.content[1].type").value(validType))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.number").value(0));

            verify(metadataService, times(1)).getMetadataByType(eq(validType), eq(null), any(Pageable.class));
        }

        @Test
        @DisplayName("Should get active only metadata by type")
        void shouldGetActiveOnlyMetadataByType() throws Exception {
            Page<MetadataResponseDto> page = new PageImpl<>(
                List.of(), 
                PageRequest.of(0, 20), 
                0
            );

            when(metadataService.getMetadataByType(eq(validType), eq(true), any(Pageable.class)))
                .thenReturn(page);

            mockMvc.perform(get("/metadata/type/{type}?activeOnly=true", validType))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(0));

            verify(metadataService, times(1)).getMetadataByType(eq(validType), eq(true), any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("List Metadata With Filters Tests")
    class ListMetadataWithFiltersTests {

        @Test
        @DisplayName("Should list metadata without filters")
        void shouldListMetadataWithoutFilters() throws Exception {
            MetadataResponseDto metadata = MetadataResponseDto.builder()
                .id(sampleId)
                .type(validType)
                .name(validName)
                .json(sampleJsonContent)
                .version(1)
                .isActive(true)
                .created(now)
                .updated(now)
                .build();

            Page<MetadataResponseDto> page = new PageImpl<>(
                List.of(metadata), 
                PageRequest.of(0, 20), 
                1
            );

            when(metadataService.listMetadata(isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(page);

            mockMvc.perform(get("/metadata"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1));

            verify(metadataService, times(1)).listMetadata(isNull(), isNull(), isNull(), any(Pageable.class));
        }

        @Test
        @DisplayName("Should list metadata with all filters")
        void shouldListMetadataWithAllFilters() throws Exception {
            Page<MetadataResponseDto> page = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);

            when(metadataService.listMetadata(eq(validType), eq(validName), eq(true), any(Pageable.class)))
                .thenReturn(page);

            mockMvc.perform(get("/metadata")
                    .param("type", validType)
                    .param("name", validName)
                    .param("activeOnly", "true")
                    .param("size", "10")
                    .param("page", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0));

            verify(metadataService, times(1)).listMetadata(eq(validType), eq(validName), eq(true), any(Pageable.class));
        }

        @Test
        @DisplayName("Should list metadata with partial name filter")
        void shouldListMetadataWithPartialNameFilter() throws Exception {
            String partialName = "app";
            Page<MetadataResponseDto> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);

            when(metadataService.listMetadata(isNull(), eq(partialName), isNull(), any(Pageable.class)))
                .thenReturn(page);

            mockMvc.perform(get("/metadata")
                    .param("name", partialName))
                .andExpect(status().isOk());

            verify(metadataService, times(1)).listMetadata(isNull(), eq(partialName), isNull(), any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("Delete Version Tests")
    class DeleteVersionTests {

        @Test
        @DisplayName("Should delete version successfully")
        void shouldDeleteVersionSuccessfully() throws Exception {
            doNothing().when(metadataService).deleteVersion(sampleId);

            mockMvc.perform(delete("/metadata/{id}", sampleId))
                .andExpect(status().isNoContent());

            verify(metadataService, times(1)).deleteVersion(sampleId);
        }

        @Test
        @DisplayName("Should return 404 when version not found for deletion")
        void shouldReturn404WhenVersionNotFoundForDeletion() throws Exception {
            doThrow(new MetadataNotFoundException("Metadata not found"))
                .when(metadataService).deleteVersion(sampleId);

            mockMvc.perform(delete("/metadata/{id}", sampleId))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 409 when trying to delete active version")
        void shouldReturn409WhenTryingToDeleteActiveVersion() throws Exception {
            doThrow(new CannotDeleteActiveVersionException("Cannot delete active version"))
                .when(metadataService).deleteVersion(sampleId);

            mockMvc.perform(delete("/metadata/{id}", sampleId))
                .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Should return 500 for invalid UUID format in delete (Spring conversion error)")
        void shouldReturn500ForInvalidUuidFormatInDelete() throws Exception {
            mockMvc.perform(delete("/metadata/{id}", "invalid-uuid"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"));
        }
    }
}