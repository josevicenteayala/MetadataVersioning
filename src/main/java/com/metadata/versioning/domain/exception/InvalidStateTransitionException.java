package com.metadata.versioning.domain.exception;

import com.metadata.versioning.domain.model.PublishingState;

/**
 * Exception thrown when an invalid publishing state transition is attempted.
 */
public class InvalidStateTransitionException extends DomainException {

    private final PublishingState currentState;
    private final PublishingState targetState;

    public InvalidStateTransitionException(PublishingState currentState, PublishingState targetState) {
        super(String.format("Cannot transition from %s to %s", currentState.name(), targetState.name()));
        this.currentState = currentState;
        this.targetState = targetState;
    }

    @Override
    public String getErrorCode() {
        return "INVALID_STATE_TRANSITION";
    }

    public PublishingState getCurrentState() {
        return currentState;
    }

    public PublishingState getTargetState() {
        return targetState;
    }
}
