/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MetadataDocumentResponse } from './MetadataDocumentResponse'
export type MetadataDocumentList = {
  documents?: Array<MetadataDocumentResponse>
  /**
   * Cursor for next page
   */
  cursor?: string | null
  /**
   * Whether more results exist
   */
  hasMore?: boolean
}
