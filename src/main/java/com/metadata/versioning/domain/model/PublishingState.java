package com.metadata.versioning.domain.model;

/**
 * Type-safe enumeration of version lifecycle states.
 * Implements state machine pattern with allowed transitions.
 * 
 * State Transitions:
 * - DRAFT → APPROVED
 * - APPROVED → PUBLISHED or DRAFT (rollback)
 * - PUBLISHED → ARCHIVED
 * - ARCHIVED → (terminal state, no transitions)
 */
public sealed interface PublishingState 
        permits PublishingState.Draft, PublishingState.Approved, 
                PublishingState.Published, PublishingState.Archived {
    
    /**
     * Get the state name for persistence and API responses.
     */
    String name();
    
    /**
     * Check if transition to target state is allowed.
     */
    boolean canTransitionTo(PublishingState target);
    
    /**
     * Draft state - initial state for new versions.
     * Can transition to: APPROVED
     */
    record Draft() implements PublishingState {
        @Override
        public String name() {
            return "DRAFT";
        }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return target instanceof Approved;
        }
    }
    
    /**
     * Approved state - version has been reviewed and approved.
     * Can transition to: PUBLISHED, DRAFT (rollback)
     */
    record Approved() implements PublishingState {
        @Override
        public String name() {
            return "APPROVED";
        }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return target instanceof Published || target instanceof Draft;
        }
    }
    
    /**
     * Published state - version is production-ready and can be activated.
     * Can transition to: ARCHIVED
     */
    record Published() implements PublishingState {
        @Override
        public String name() {
            return "PUBLISHED";
        }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return target instanceof Archived;
        }
    }
    
    /**
     * Archived state - version is obsolete and cannot be activated.
     * Terminal state - no further transitions allowed.
     */
    record Archived() implements PublishingState {
        @Override
        public String name() {
            return "ARCHIVED";
        }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return false; // Terminal state
        }
    }
    
    /**
     * Factory method to create state from string name.
     */
    static PublishingState fromString(String name) {
        return switch (name.toUpperCase()) {
            case "DRAFT" -> new Draft();
            case "APPROVED" -> new Approved();
            case "PUBLISHED" -> new Published();
            case "ARCHIVED" -> new Archived();
            default -> throw new IllegalArgumentException("Unknown publishing state: " + name);
        };
    }
}
