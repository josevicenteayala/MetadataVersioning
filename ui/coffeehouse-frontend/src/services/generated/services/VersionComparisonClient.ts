/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComparisonResponse } from '../models/ComparisonResponse'
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class VersionComparisonClient {
  /**
   * Compare two versions
   * Generate detailed comparison showing structural and value differences.
   * Identifies breaking vs additive changes.
   *
   * @returns ComparisonResponse Comparison result
   * @throws ApiError
   */
  public static getMetadataCompare({
    type,
    name,
    from,
    to,
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
     * Source version number
     */
    from: number
    /**
     * Target version number
     */
    to: number
  }): CancelablePromise<ComparisonResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/metadata/{type}/{name}/compare',
      path: {
        type: type,
        name: name,
      },
      query: {
        from: from,
        to: to,
      },
      errors: {
        400: `Invalid version numbers`,
        404: `Resource not found`,
      },
    })
  }
}
