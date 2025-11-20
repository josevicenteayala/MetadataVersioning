package com.starbucks.metadata.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "metadata_entry",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_metadata_entry_type_name_version",
                columnNames = {"type", "name", "version"}
        ),
        indexes = {
                @Index(name = "idx_metadata_entry_type_name_active", columnList = "type,name,is_active"),
                @Index(name = "idx_metadata_entry_type", columnList = "type"),
                @Index(name = "idx_metadata_entry_name", columnList = "name"),
                @Index(name = "idx_metadata_entry_active", columnList = "is_active")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetadataEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "type", nullable = false, length = 100)
    private String type;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Type(JsonType.class)
    @Column(name = "json", nullable = false, columnDefinition = "jsonb")
    private JsonNode json;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = false;

    @CreationTimestamp
    @Column(name = "created", nullable = false, updatable = false)
    private Instant created;

    @UpdateTimestamp
    @Column(name = "updated", nullable = false)
    private Instant updated;
}