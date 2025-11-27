/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type VersionResponse = {
  id?: number
  documentId?: number
  type?: string
  name?: string
  versionNumber?: number
  content?: Record<string, any>
  /**
   * User who created this version
   */
  author?: string
  createdAt?: string
  changeSummary?: string
  publishingState?: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'
  isActive?: boolean
  /**
   * Whether version violates current schema
   */
  schemaWarning?: boolean
  schemaWarningTimestamp?: string | null
}
