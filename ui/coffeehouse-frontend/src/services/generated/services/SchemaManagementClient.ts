/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSchemaRequest } from '../models/CreateSchemaRequest'
import type { SchemaResponse } from '../models/SchemaResponse'
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class SchemaManagementClient {
  /**
   * List all schemas
   * Get all schema definitions
   * @returns SchemaResponse Schema list
   * @throws ApiError
   */
  public static getSchemas(): CancelablePromise<Array<SchemaResponse>> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/schemas',
    })
  }
  /**
   * Create schema definition
   * Define validation rules for a metadata type
   * @returns SchemaResponse Schema created
   * @throws ApiError
   */
  public static postSchemas({
    requestBody,
  }: {
    requestBody: CreateSchemaRequest
  }): CancelablePromise<SchemaResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/schemas',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid request`,
        401: `Authentication required`,
        409: `Schema already exists for type`,
      },
    })
  }
  /**
   * Get schema for type
   * Retrieve schema definition for metadata type
   * @returns SchemaResponse Schema details
   * @throws ApiError
   */
  public static getSchemas1({
    type,
  }: {
    /**
     * Metadata type
     */
    type: string
  }): CancelablePromise<SchemaResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/schemas/{type}',
      path: {
        type: type,
      },
      errors: {
        404: `Resource not found`,
      },
    })
  }
}
