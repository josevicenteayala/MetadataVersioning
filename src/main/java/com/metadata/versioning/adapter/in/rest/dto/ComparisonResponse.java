package com.metadata.versioning.adapter.in.rest.dto;

import com.metadata.versioning.domain.model.ChangeType;
import com.metadata.versioning.domain.model.VersionComparison;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST response for version comparison.
 */
public record ComparisonResponse(
        int fromVersion,
        int toVersion,
        boolean hasChanges,
        boolean hasBreakingChanges,
        int changeCount,
        List<ChangeDetail> changes,
        ChangeSummary summary
) {

    public static ComparisonResponse from(VersionComparison comparison) {
        var changes = comparison.changes().stream()
                .map(ChangeDetail::from)
                .collect(Collectors.toList());

        var summary = new ChangeSummary(
                comparison.getChangesByType(ChangeType.ADDED).size(),
                comparison.getChangesByType(ChangeType.MODIFIED).size(),
                comparison.getChangesByType(ChangeType.REMOVED).size()
        );

        return new ComparisonResponse(
                comparison.fromVersion().versionNumber(),
                comparison.toVersion().versionNumber(),
                comparison.hasChanges(),
                comparison.hasBreakingChanges(),
                comparison.changeCount(),
                changes,
                summary
        );
    }

    public record ChangeDetail(
            String type,
            String path,
            Object oldValue,
            Object newValue
    ) {
        public static ChangeDetail from(VersionComparison.ChangeDetail change) {
            String type = switch (change.type()) {
                case ChangeType.Added ignored -> "ADDED";
                case ChangeType.Modified ignored -> "MODIFIED";
                case ChangeType.Removed ignored -> "REMOVED";
            };

            return new ChangeDetail(
                    type,
                    change.path(),
                    change.oldValue(),
                    change.newValue()
            );
        }
    }

    public record ChangeSummary(
            int added,
            int modified,
            int removed
    ) {}
}
