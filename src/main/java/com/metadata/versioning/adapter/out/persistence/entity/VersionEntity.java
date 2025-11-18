package com.metadata.versioning.adapter.out.persistence.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Objects;

/**
 * JPA entity for Version value object.
 * Maps to versions table with JSONB content storage.
 */
@Entity
@Table(name = "versions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "version_number"}),
       indexes = {
           @Index(name = "idx_versions_document_id", columnList = "document_id"),
           @Index(name = "idx_versions_is_active", columnList = "is_active")
       })
public class VersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private MetadataDocumentEntity document;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Type(JsonBinaryType.class)
    @Column(name = "content", nullable = false, columnDefinition = "jsonb")
    private String content;

    @Column(nullable = false, length = 255)
    private String author;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "change_summary", length = 1000)
    private String changeSummary;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = false;

    // JPA requires default constructor
    protected VersionEntity() {
    }

    public VersionEntity(Integer versionNumber, String content, String author, String changeSummary) {
        this.versionNumber = versionNumber;
        this.content = content;
        this.author = author;
        this.changeSummary = changeSummary;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MetadataDocumentEntity getDocument() {
        return document;
    }

    public void setDocument(MetadataDocumentEntity document) {
        this.document = document;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getChangeSummary() {
        return changeSummary;
    }

    public void setChangeSummary(String changeSummary) {
        this.changeSummary = changeSummary;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VersionEntity that = (VersionEntity) o;
        return Objects.equals(document, that.document) && 
               Objects.equals(versionNumber, that.versionNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(document, versionNumber);
    }
}
