package com.starbucks.metadata.repository;

import com.starbucks.metadata.entity.MetadataEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MetadataRepository extends JpaRepository<MetadataEntry, UUID> {

    boolean existsByTypeAndName(String type, String name);

    Optional<MetadataEntry> findByTypeAndNameAndVersion(String type, String name, Integer version);

    Optional<MetadataEntry> findByTypeAndNameAndIsActiveTrue(String type, String name);

    List<MetadataEntry> findByTypeAndNameOrderByVersionDesc(String type, String name);

    @Query("SELECT COALESCE(MAX(m.version), 0) FROM MetadataEntry m WHERE m.type = :type AND m.name = :name")
    Integer findMaxVersionByTypeAndName(@Param("type") String type, @Param("name") String name);

    @Modifying
    @Query("UPDATE MetadataEntry m SET m.isActive = false WHERE m.type = :type AND m.name = :name AND m.isActive = true")
    void deactivateAllVersions(@Param("type") String type, @Param("name") String name);

    @Query("SELECT m FROM MetadataEntry m WHERE " +
           "m.type = :type AND " +
           "(:activeOnly = false OR m.isActive = true)")
    Page<MetadataEntry> findByType(@Param("type") String type,
                                   @Param("activeOnly") boolean activeOnly,
                                   Pageable pageable);

    @Query("SELECT m FROM MetadataEntry m WHERE " +
           "(:type IS NULL OR m.type = :type) AND " +
           "(:activeOnly = false OR m.isActive = true)")
    Page<MetadataEntry> findWithFilters(@Param("type") String type,
                                        @Param("activeOnly") boolean activeOnly,
                                        Pageable pageable);

    @Query("SELECT COUNT(m) > 0 FROM MetadataEntry m WHERE m.id = :id AND m.isActive = true")
    boolean isVersionActive(@Param("id") UUID id);
}