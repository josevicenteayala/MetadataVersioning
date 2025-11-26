/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMetadataRequest } from '../models/CreateMetadataRequest'
import type { MetadataDocumentList } from '../models/MetadataDocumentList'
import type { MetadataDocumentResponse } from '../models/MetadataDocumentResponse'
import type { VersionResponse } from '../models/VersionResponse'
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class MetadataDocumentsClient {
  /**
   * List all metadata documents
   * Retrieve list of metadata documents grouped by active status.
   * Returns active documents first, then inactive ones.
   *
   * @returns MetadataDocumentList Successful response
   * @throws ApiError
   */
  public static getMetadata({
    type,
    limit = 50,
    cursor,
  }: {
    /**
     * Filter by metadata type
     */
    type?: string
    /**
     * Maximum number of results
     */
    limit?: number
    /**
     * Cursor for pagination
     */
    cursor?: string
  }): CancelablePromise<MetadataDocumentList> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/metadata',
      query: {
        type: type,
        limit: limit,
        cursor: cursor,
      },
    })
  }
  /**
   * Create new metadata document
   * Create first version (v1) of a new metadata document
   * @returns VersionResponse Metadata document created
   * @throws ApiError
   */
  public static postMetadata({
    requestBody,
  }: {
    requestBody: CreateMetadataRequest
  }): CancelablePromise<VersionResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/metadata',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid request`,
        401: `Authentication required`,
        409: `Resource already exists`,
      },
    })
  }
  /**
   * Get metadata document details
   * Retrieve document info without version content
   * @returns MetadataDocumentResponse Document details
   * @throws ApiError
   */
  public static getMetadata1({
    type,
    name,
  }: {
    /**
     * Metadata type (kebab-case)
     */
    type: string
    /**
     * Metadata name (kebab-case with numbers)
     */
    name: string
  }): CancelablePromise<MetadataDocumentResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/metadata/{type}/{name}',
      path: {
        type: type,
        name: name,
      },
      errors: {
        404: `Resource not found`,
      },
    })
  }
  /**
   * Get active version
   * Retrieve currently active version content for consumption
   * @returns VersionResponse Active version content
   * @throws ApiError
   */
  public static getMetadataActive({
    type,
    name,
  }: {
    /**
     * Metadata type (kebab-case)
     */
    type: string
    /**
     * Metadata name (kebab-case with numbers)
     */
    name: string
  }): CancelablePromise<VersionResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/metadata/{type}/{name}/active',
      path: {
        type: type,
        name: name,
      },
      errors: {
        404: `No active version exists`,
      },
    })
  }
}
