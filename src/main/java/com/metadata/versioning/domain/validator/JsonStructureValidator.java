package com.metadata.versioning.domain.validator;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metadata.versioning.domain.exception.InvalidJsonException;

import java.util.Iterator;
import java.util.Map;

/**
 * Validates JSON structure for metadata content.
 * Enforces rules for malformed JSON, size limits, and nesting depth.
 */
public class JsonStructureValidator {

    private static final int MAX_DOCUMENT_SIZE_BYTES = 1_048_576; // 1MB
    private static final int MAX_NESTING_DEPTH = 50;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Validates JSON string structure and size constraints.
     *
     * @param jsonContent JSON string to validate
     * @throws InvalidJsonException if validation fails
     */
    public static void validate(String jsonContent) {
        if (jsonContent == null || jsonContent.isBlank()) {
            throw new InvalidJsonException("JSON content cannot be null or empty");
        }

        // Check size limit (FR-025)
        byte[] contentBytes = jsonContent.getBytes();
        if (contentBytes.length > MAX_DOCUMENT_SIZE_BYTES) {
            throw new InvalidJsonException(
                    String.format("JSON document exceeds maximum size of %d bytes (actual: %d bytes)",
                            MAX_DOCUMENT_SIZE_BYTES, contentBytes.length));
        }

        // Parse and validate JSON structure (FR-011)
        JsonNode rootNode;
        try {
            rootNode = objectMapper.readTree(jsonContent);
        } catch (JsonProcessingException e) {
            throw new InvalidJsonException("Malformed JSON: " + e.getMessage(), e);
        }

        // Validate nesting depth to prevent circular references
        int depth = calculateDepth(rootNode);
        if (depth > MAX_NESTING_DEPTH) {
            throw new InvalidJsonException(
                    String.format("JSON nesting depth exceeds maximum of %d levels (actual: %d)",
                            MAX_NESTING_DEPTH, depth));
        }
    }

    /**
     * Validates JsonNode object structure.
     *
     * @param content JsonNode to validate
     * @throws InvalidJsonException if validation fails
     */
    public static void validate(JsonNode content) {
        if (content == null) {
            throw new InvalidJsonException("JSON content cannot be null");
        }

        // Convert to string to check size
        String jsonString;
        try {
            jsonString = objectMapper.writeValueAsString(content);
        } catch (JsonProcessingException e) {
            throw new InvalidJsonException("Failed to serialize JSON content", e);
        }

        validate(jsonString);
    }

    /**
     * Calculate the maximum nesting depth of a JSON structure.
     */
    private static int calculateDepth(JsonNode node) {
        if (node == null || node.isValueNode()) {
            return 0;
        }

        int maxChildDepth = 0;

        if (node.isArray()) {
            for (JsonNode element : node) {
                maxChildDepth = Math.max(maxChildDepth, calculateDepth(element));
            }
        } else if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                maxChildDepth = Math.max(maxChildDepth, calculateDepth(field.getValue()));
            }
        }

        return 1 + maxChildDepth;
    }

    /**
     * Get the maximum allowed document size in bytes.
     */
    public static int getMaxDocumentSizeBytes() {
        return MAX_DOCUMENT_SIZE_BYTES;
    }

    /**
     * Get the maximum allowed nesting depth.
     */
    public static int getMaxNestingDepth() {
        return MAX_NESTING_DEPTH;
    }
}
