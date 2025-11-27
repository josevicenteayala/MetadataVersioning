/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExtensionRules } from './ExtensionRules'
export type CreateSchemaRequest = {
  /**
   * Metadata type this schema applies to
   */
  type: string
  /**
   * JSON Schema (Draft 2020-12)
   */
  schema: Record<string, any>
  /**
   * Whether custom properties are allowed
   */
  allowsExtensions?: boolean
  extensionRules?: ExtensionRules
}
