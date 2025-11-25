package com.metadata.versioning.adapter.out.persistence.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA entity for audit trail entries.
 * Tracks all mutations to metadata documents, versions, and schemas.
 */
@Entity
@Table(name = "audit_entries")
public class AuditEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(name = "operation", nullable = false, length = 50)
    private String operation;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "changes", columnDefinition = "jsonb")
    private String changes;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    // Constructors
    public AuditEntryEntity() {
        this.timestamp = Instant.now();
    }

    public AuditEntryEntity(String entityType, String entityId, String operation, 
                           String userId, String changes) {
        this();
        this.entityType = entityType;
        this.entityId = entityId;
        this.operation = operation;
        this.userId = userId;
        this.changes = changes;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getChanges() {
        return changes;
    }

    public void setChanges(String changes) {
        this.changes = changes;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
}
