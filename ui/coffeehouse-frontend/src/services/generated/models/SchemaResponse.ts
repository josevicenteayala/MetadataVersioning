/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExtensionRules } from './ExtensionRules'
export type SchemaResponse = {
  id?: number
  type?: string
  schema?: Record<string, any>
  /**
   * Schema version number
   */
  version?: number
  allowsExtensions?: boolean
  extensionRules?: ExtensionRules
  createdAt?: string
  createdBy?: string
}
