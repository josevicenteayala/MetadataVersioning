/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateVersionRequest } from '../models/CreateVersionRequest'
import type { PublishStateRequest } from '../models/PublishStateRequest'
import type { VersionList } from '../models/VersionList'
import type { VersionResponse } from '../models/VersionResponse'
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class VersionManagementClient {
  /**
   * List all versions
   * Get version history ordered by version number
   * @returns VersionList Version list
   * @throws ApiError
   */
  public static getMetadataVersions({
    type,
    name,
    state,
  }: {
    /**
     * Metadata type (kebab-case)
     */
    type: string
    /**
     * Metadata name (kebab-case with numbers)
     */
    name: string
    /**
     * Filter by publishing state
     */
    state?: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'
  }): CancelablePromise<VersionList> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/metadata/{type}/{name}/versions',
      path: {
        type: type,
        name: name,
      },
      query: {
        state: state,
      },
      errors: {
        404: `Resource not found`,
      },
    })
  }
  /**
   * Create new version
   * Create next version (increment version number)
   * @returns VersionResponse New version created
   * @throws ApiError
   */
  public static postMetadataVersions({
    type,
    name,
    requestBody,
  }: {
    /**
     * Metadata type (kebab-case)
     */
    type: string
    /**
     * Metadata name (kebab-case with numbers)
     */
    name: string
    requestBody: CreateVersionRequest
  }): CancelablePromise<VersionResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/metadata/{type}/{name}/versions',
      path: {
        type: type,
        name: name,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid request`,
        401: `Authentication required`,
        404: `Resource not found`,
      },
    })
  }
  /**
   * Get specific version
   * Retrieve specific version by number
   * @returns VersionResponse Version details
   * @throws ApiError
   */
  public static getMetadataVersions1({
    type,
    name,
    versionNumber,
  }: {
    /**
     * Metadata type (kebab-case)
     */
    type: string
    /**
     * Metadata name (kebab-case with numbers)
     */
    name: string
    /**
     * Version number (1-indexed)
     */
    versionNumber: number
  }): CancelablePromise<VersionResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/metadata/{type}/{name}/versions/{versionNumber}',
      path: {
        type: type,
        name: name,
        versionNumber: versionNumber,
      },
      errors: {
        404: `Resource not found`,
      },
    })
  }
  /**
   * Activate version
   * Set this version as active (deactivates current active version).
   * Only PUBLISHED versions can be activated.
   *
   * @returns VersionResponse Version activated
   * @throws ApiError
   */
  public static postMetadataVersionsActivate({
    type,
    name,
    versionNumber,
  }: {
    /**
     * Metadata type (kebab-case)
     */
    type: string
    /**
     * Metadata name (kebab-case with numbers)
     */
    name: string
    /**
     * Version number (1-indexed)
     */
    versionNumber: number
  }): CancelablePromise<VersionResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/metadata/{type}/{name}/versions/{versionNumber}/activate',
      path: {
        type: type,
        name: name,
        versionNumber: versionNumber,
      },
      errors: {
        400: `Version not in PUBLISHED state`,
        401: `Authentication required`,
        404: `Resource not found`,
      },
    })
  }
  /**
   * Transition publishing state
   * Transition version through publishing workflow:
   * - DRAFT → APPROVED
   * - APPROVED → PUBLISHED or APPROVED → DRAFT
   * - PUBLISHED → ARCHIVED
   *
   * @returns VersionResponse State transitioned
   * @throws ApiError
   */
  public static postMetadataVersionsPublish({
    type,
    name,
    versionNumber,
    requestBody,
  }: {
    /**
     * Metadata type (kebab-case)
     */
    type: string
    /**
     * Metadata name (kebab-case with numbers)
     */
    name: string
    /**
     * Version number (1-indexed)
     */
    versionNumber: number
    requestBody: PublishStateRequest
  }): CancelablePromise<VersionResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/metadata/{type}/{name}/versions/{versionNumber}/publish',
      path: {
        type: type,
        name: name,
        versionNumber: versionNumber,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid state transition`,
        401: `Authentication required`,
        404: `Resource not found`,
      },
    })
  }
}
