/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MetadataDocumentResponse = {
  id?: number
  type?: string
  name?: string
  /**
   * Total number of versions
   */
  versionCount?: number
  /**
   * Active version number (null if none)
   */
  activeVersion?: number | null
  createdAt?: string
  updatedAt?: string
}
