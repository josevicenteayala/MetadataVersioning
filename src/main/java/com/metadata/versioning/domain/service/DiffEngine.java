package com.metadata.versioning.domain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.metadata.versioning.domain.model.ChangeType;
import com.metadata.versioning.domain.model.VersionComparison;
import com.metadata.versioning.domain.model.VersionComparison.ChangeDetail;
import com.metadata.versioning.domain.model.Version;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Domain service for comparing JSON documents and detecting changes.
 * Implements deep comparison logic for version diff (FR-010).
 */
public class DiffEngine {

    private final ObjectMapper objectMapper;

    public DiffEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Compare two versions and return detailed change analysis.
     * 
     * @param fromVersion The baseline version
     * @param toVersion The version to compare against
     * @return VersionComparison with all detected changes
     */
    public VersionComparison compare(Version fromVersion, Version toVersion) {
        List<ChangeDetail> changes = new ArrayList<>();
        
        JsonNode fromContent = fromVersion.content();
        JsonNode toContent = toVersion.content();
        
        // Perform deep comparison
        compareNodes("", fromContent, toContent, changes);
        
        // Determine if any changes are breaking
        boolean hasBreaking = changes.stream()
                .anyMatch(ChangeDetail::isBreaking);
        
        return new VersionComparison(fromVersion, toVersion, changes, hasBreaking);
    }

    /**
     * Recursively compare JSON nodes and track changes.
     */
    private void compareNodes(String path, JsonNode fromNode, JsonNode toNode, List<ChangeDetail> changes) {
        if (fromNode == null && toNode == null) {
            return;
        }
        
        // Field was added
        if (fromNode == null) {
            changes.add(new ChangeDetail(ChangeType.ADDED, path, null, toNode));
            return;
        }
        
        // Field was removed
        if (toNode == null) {
            changes.add(new ChangeDetail(ChangeType.REMOVED, path, fromNode, null));
            return;
        }
        
        // Different node types
        if (fromNode.getNodeType() != toNode.getNodeType()) {
            changes.add(new ChangeDetail(ChangeType.MODIFIED, path, fromNode, toNode));
            return;
        }
        
        // Compare based on node type
        if (fromNode.isObject()) {
            compareObjects(path, (ObjectNode) fromNode, (ObjectNode) toNode, changes);
        } else if (fromNode.isArray()) {
            compareArrays(path, (ArrayNode) fromNode, (ArrayNode) toNode, changes);
        } else if (!fromNode.equals(toNode)) {
            // Primitive value changed
            changes.add(new ChangeDetail(ChangeType.MODIFIED, path, fromNode, toNode));
        }
    }

    /**
     * Compare JSON objects field by field.
     */
    private void compareObjects(String path, ObjectNode fromObj, ObjectNode toObj, List<ChangeDetail> changes) {
        // Check for removed and modified fields
        Iterator<Map.Entry<String, JsonNode>> fromFields = fromObj.fields();
        while (fromFields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fromFields.next();
            String fieldName = entry.getKey();
            String fieldPath = path.isEmpty() ? fieldName : path + "." + fieldName;
            
            JsonNode fromValue = entry.getValue();
            JsonNode toValue = toObj.get(fieldName);
            
            compareNodes(fieldPath, fromValue, toValue, changes);
        }
        
        // Check for added fields
        Iterator<Map.Entry<String, JsonNode>> toFields = toObj.fields();
        while (toFields.hasNext()) {
            Map.Entry<String, JsonNode> entry = toFields.next();
            String fieldName = entry.getKey();
            
            if (!fromObj.has(fieldName)) {
                String fieldPath = path.isEmpty() ? fieldName : path + "." + fieldName;
                compareNodes(fieldPath, null, entry.getValue(), changes);
            }
        }
    }

    /**
     * Compare JSON arrays element by element.
     */
    private void compareArrays(String path, ArrayNode fromArray, ArrayNode toArray, List<ChangeDetail> changes) {
        int fromSize = fromArray.size();
        int toSize = toArray.size();
        int minSize = Math.min(fromSize, toSize);
        
        // Compare common elements
        for (int i = 0; i < minSize; i++) {
            String indexPath = path + "[" + i + "]";
            compareNodes(indexPath, fromArray.get(i), toArray.get(i), changes);
        }
        
        // Handle size differences
        if (fromSize > toSize) {
            // Elements were removed
            for (int i = minSize; i < fromSize; i++) {
                String indexPath = path + "[" + i + "]";
                changes.add(new ChangeDetail(ChangeType.REMOVED, indexPath, fromArray.get(i), null));
            }
        } else if (toSize > fromSize) {
            // Elements were added
            for (int i = minSize; i < toSize; i++) {
                String indexPath = path + "[" + i + "]";
                changes.add(new ChangeDetail(ChangeType.ADDED, indexPath, null, toArray.get(i)));
            }
        }
    }
}
