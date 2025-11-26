/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMetadataRequest = {
  /**
   * Metadata type (kebab-case)
   */
  type: string
  /**
   * Unique name within type
   */
  name: string
  /**
   * JSON metadata content
   */
  content: Record<string, any>
}
