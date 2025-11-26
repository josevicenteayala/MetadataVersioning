/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Change = {
  operation?: 'add' | 'remove' | 'replace'
  /**
   * JSON path
   */
  path?: string
  oldValue?: any
  newValue?: any
  type?: 'BREAKING_REMOVE' | 'BREAKING_MODIFY' | 'ADDITIVE' | 'NON_BREAKING'
}
