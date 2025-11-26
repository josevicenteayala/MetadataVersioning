package com.metadata.versioning.adapter.out.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * Configuration for Micrometer metrics and application monitoring.
 * Provides timing metrics for use case execution and performance tracking.
 */
@Configuration
@EnableAspectJAutoProxy
public class MetricsConfig {

    /**
     * Enable @Timed annotation support for method-level timing metrics.
     * Use @Timed on use case methods to automatically track execution time.
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    /**
     * Custom timers for critical operations.
     * These can be injected and used directly in services.
     */
    @Bean
    public Timer versionCreationTimer(MeterRegistry registry) {
        return Timer.builder("metadata.version.creation")
                .description("Time taken to create a new version")
                .tag("operation", "create")
                .register(registry);
    }

    @Bean
    public Timer activeVersionQueryTimer(MeterRegistry registry) {
        return Timer.builder("metadata.version.active.query")
                .description("Time taken to retrieve active version")
                .tag("operation", "query")
                .register(registry);
    }

    @Bean
    public Timer versionComparisonTimer(MeterRegistry registry) {
        return Timer.builder("metadata.version.comparison")
                .description("Time taken to compare two versions")
                .tag("operation", "compare")
                .register(registry);
    }

    @Bean
    public Timer schemaValidationTimer(MeterRegistry registry) {
        return Timer.builder("metadata.schema.validation")
                .description("Time taken for JSON schema validation")
                .tag("operation", "validate")
                .register(registry);
    }
}
