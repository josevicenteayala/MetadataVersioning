package com.metadata.versioning.adapter.in.rest.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that adds correlation IDs to all requests for distributed tracing.
 * Correlation ID is propagated through:
 * - Response headers (X-Correlation-ID)
 * - MDC for logging
 * - Request attributes for downstream access
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(CorrelationIdFilter.class);
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Get or generate correlation ID
        String correlationId = httpRequest.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = generateCorrelationId();
        }

        // Add to MDC for logging
        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);

        // Add to request attributes for downstream access
        httpRequest.setAttribute(CORRELATION_ID_MDC_KEY, correlationId);

        // Add to response headers
        httpResponse.setHeader(CORRELATION_ID_HEADER, correlationId);

        try {
            logger.debug("Request started: {} {} [correlationId={}]",
                httpRequest.getMethod(), httpRequest.getRequestURI(), correlationId);

            chain.doFilter(request, response);

            logger.debug("Request completed: {} {} [status={}, correlationId={}]",
                httpRequest.getMethod(), httpRequest.getRequestURI(),
                httpResponse.getStatus(), correlationId);

        } finally {
            // Clean up MDC to prevent memory leaks in thread pools
            MDC.remove(CORRELATION_ID_MDC_KEY);
        }
    }

    private String generateCorrelationId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Get correlation ID from current request context.
     * Returns null if not in request context.
     */
    public static String getCurrentCorrelationId() {
        return MDC.get(CORRELATION_ID_MDC_KEY);
    }
}
