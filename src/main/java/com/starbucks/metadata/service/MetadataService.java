package com.starbucks.metadata.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.starbucks.metadata.dto.*;
import com.starbucks.metadata.entity.MetadataEntry;
import com.starbucks.metadata.exception.*;
import com.starbucks.metadata.repository.MetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MetadataService {

    private final MetadataRepository metadataRepository;

    @Transactional
    public MetadataResponseDto createMetadata(CreateMetadataRequestDto request) {
        log.debug("Creating new metadata with type: {} and name: {}", request.getType(), request.getName());
        
        if (metadataRepository.existsByTypeAndName(request.getType(), request.getName())) {
            throw new MetadataAlreadyExistsException(
                String.format("Metadata with type '%s' and name '%s' already exists", 
                    request.getType(), request.getName())
            );
        }

        MetadataEntry entry = MetadataEntry.builder()
            .type(request.getType())
            .name(request.getName())
            .json(request.getJson())
            .version(1)
            .isActive(true)
            .build();

        MetadataEntry savedEntry = metadataRepository.save(entry);
        log.info("Created new metadata with ID: {}", savedEntry.getId());
        
        return toResponseDto(savedEntry);
    }

    @Transactional
    public MetadataResponseDto createNewVersion(String type, String name, CreateVersionRequestDto request) {
        log.debug("Creating new version for type: {} and name: {}", type, name);
        
        if (!metadataRepository.existsByTypeAndName(type, name)) {
            throw new MetadataNotFoundException(
                String.format("Metadata with type '%s' and name '%s' doesn't exist", type, name)
            );
        }

        Integer maxVersion = metadataRepository.findMaxVersionByTypeAndName(type, name);
        Integer newVersion = maxVersion + 1;

        MetadataEntry entry = MetadataEntry.builder()
            .type(type)
            .name(name)
            .json(request.getJson())
            .version(newVersion)
            .isActive(false)
            .build();

        MetadataEntry savedEntry = metadataRepository.save(entry);
        log.info("Created new version {} for type: {} and name: {}", newVersion, type, name);
        
        return toResponseDto(savedEntry);
    }

    @Transactional
    public ActivationResponseDto activateVersion(String type, String name, Integer version) {
        log.debug("Activating version {} for type: {} and name: {}", version, type, name);
        
        MetadataEntry entry = metadataRepository.findByTypeAndNameAndVersion(type, name, version)
            .orElseThrow(() -> new VersionNotFoundException(
                String.format("Version %d doesn't exist for type '%s' and name '%s'", 
                    version, type, name)
            ));

        if (entry.getIsActive()) {
            throw new VersionAlreadyActiveException(
                String.format("Version %d is already active", version)
            );
        }

        metadataRepository.deactivateAllVersions(type, name);
        
        entry.setIsActive(true);
        MetadataEntry savedEntry = metadataRepository.save(entry);
        
        log.info("Activated version {} for type: {} and name: {}", version, type, name);
        
        return ActivationResponseDto.builder()
            .message(String.format("Version %d activated successfully", version))
            .metadata(ActivationResponseDto.MetadataSummary.builder()
                .id(savedEntry.getId())
                .type(savedEntry.getType())
                .name(savedEntry.getName())
                .version(savedEntry.getVersion())
                .isActive(savedEntry.getIsActive())
                .build())
            .build();
    }

    public VersionListResponseDto listVersions(String type, String name) {
        log.debug("Listing versions for type: {} and name: {}", type, name);
        
        List<MetadataEntry> versions = metadataRepository.findByTypeAndNameOrderByVersionDesc(type, name);
        
        if (versions.isEmpty()) {
            throw new MetadataNotFoundException(
                String.format("No metadata found for type '%s' and name '%s'", type, name)
            );
        }

        Integer activeVersion = versions.stream()
            .filter(MetadataEntry::getIsActive)
            .map(MetadataEntry::getVersion)
            .findFirst()
            .orElse(null);

        List<VersionDto> versionDtos = versions.stream()
            .map(this::toVersionDto)
            .collect(Collectors.toList());

        return VersionListResponseDto.builder()
            .type(type)
            .name(name)
            .totalVersions(versions.size())
            .activeVersion(activeVersion)
            .versions(versionDtos)
            .build();
    }

    public MetadataResponseDto getMetadataById(UUID id) {
        log.debug("Getting metadata by ID: {}", id);
        
        MetadataEntry entry = metadataRepository.findById(id)
            .orElseThrow(() -> new MetadataNotFoundException(
                String.format("Metadata with ID %s doesn't exist", id)
            ));
        
        return toResponseDto(entry);
    }

    public Page<MetadataResponseDto> getMetadataByType(String type, Boolean activeOnly, Pageable pageable) {
        log.debug("Getting metadata by type: {}, activeOnly: {}", type, activeOnly);
        
        Page<MetadataEntry> entries = metadataRepository.findByType(
            type, activeOnly != null ? activeOnly : false, pageable
        );
        
        return entries.map(this::toResponseDto);
    }

    public Page<MetadataResponseDto> listMetadata(String type, String name, Boolean activeOnly, Pageable pageable) {
        log.debug("Listing metadata with filters - type: {}, name: {}, activeOnly: {}", 
            type, name, activeOnly);
        
        Page<MetadataEntry> entries = metadataRepository.findWithFilters(
            type, activeOnly != null ? activeOnly : false, pageable
        );
        
        return entries.map(this::toResponseDto);
    }

    @Transactional
    public void deleteVersion(UUID id) {
        log.debug("Deleting metadata version with ID: {}", id);
        
        MetadataEntry entry = metadataRepository.findById(id)
            .orElseThrow(() -> new MetadataNotFoundException(
                String.format("Metadata with ID %s doesn't exist", id)
            ));

        if (entry.getIsActive()) {
            throw new CannotDeleteActiveVersionException(
                "Cannot delete active version"
            );
        }

        metadataRepository.deleteById(id);
        log.info("Deleted metadata version with ID: {}", id);
    }

    private MetadataResponseDto toResponseDto(MetadataEntry entry) {
        return MetadataResponseDto.builder()
            .id(entry.getId())
            .type(entry.getType())
            .name(entry.getName())
            .json(entry.getJson())
            .version(entry.getVersion())
            .isActive(entry.getIsActive())
            .created(entry.getCreated())
            .updated(entry.getUpdated())
            .build();
    }

    private VersionDto toVersionDto(MetadataEntry entry) {
        return VersionDto.builder()
            .id(entry.getId())
            .version(entry.getVersion())
            .isActive(entry.getIsActive())
            .created(entry.getCreated())
            .updated(entry.getUpdated())
            .json(entry.getJson())
            .build();
    }
}