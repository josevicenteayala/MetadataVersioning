package com.metadata.versioning.adapter.out.persistence.adapter;

import com.metadata.versioning.adapter.out.persistence.entity.AuditEntryEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapter for persisting audit trail entries asynchronously.
 * Uses separate transaction to avoid impacting main business transactions.
 */
@Component
public class AuditPersistenceAdapter {

    private static final Logger logger = LoggerFactory.getLogger(AuditPersistenceAdapter.class);

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Log audit entry asynchronously in a new transaction.
     * Failures in audit logging will not affect the main business operation.
     * 
     * @param entityType Type of entity (MetadataDocument, Version, SchemaDefinition)
     * @param entityId Unique identifier of the entity
     * @param operation Operation performed (CREATE, UPDATE, DELETE, ACTIVATE, PUBLISH)
     * @param userId User who performed the operation
     * @param changes JSON representation of changes
     * @param correlationId Request correlation ID
     * @param ipAddress Client IP address
     * @param userAgent Client user agent
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuditEntry(String entityType, String entityId, String operation,
                             String userId, String changes, String correlationId,
                             String ipAddress, String userAgent) {
        try {
            AuditEntryEntity auditEntry = new AuditEntryEntity(
                entityType, entityId, operation, userId, changes
            );
            auditEntry.setCorrelationId(correlationId);
            auditEntry.setIpAddress(ipAddress);
            auditEntry.setUserAgent(userAgent);

            entityManager.persist(auditEntry);
            entityManager.flush();

            logger.debug("Audit entry logged: {} {} by {} [correlationId={}]",
                operation, entityType, userId, correlationId);

        } catch (Exception e) {
            // Log error but don't propagate - audit failures shouldn't break business operations
            logger.error("Failed to log audit entry: {} {} by {} [correlationId={}]",
                operation, entityType, userId, correlationId, e);
        }
    }

    /**
     * Simplified audit logging without HTTP context.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuditEntry(String entityType, String entityId, String operation,
                             String userId, String changes) {
        logAuditEntry(entityType, entityId, operation, userId, changes, null, null, null);
    }
}
