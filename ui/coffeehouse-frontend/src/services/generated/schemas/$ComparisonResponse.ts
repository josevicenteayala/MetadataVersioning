/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ComparisonResponse = {
  properties: {
    fromVersion: {
      type: 'number',
    },
    toVersion: {
      type: 'number',
    },
    changes: {
      type: 'array',
      contains: {
        type: 'Change',
      },
    },
    hasBreakingChanges: {
      type: 'boolean',
    },
    summary: {
      type: 'string',
    },
    comparedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
} as const
