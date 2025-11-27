/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Change } from './Change'
export type ComparisonResponse = {
  fromVersion?: number
  toVersion?: number
  changes?: Array<Change>
  hasBreakingChanges?: boolean
  summary?: string
  comparedAt?: string
}
