/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Error = {
  /**
   * Error code
   */
  error: string
  /**
   * Human-readable error message
   */
  message: string
  details?: Array<{
    field?: string
    constraint?: string
    value?: any
  }>
  /**
   * Request path
   */
  path?: string
  timestamp?: string
}
