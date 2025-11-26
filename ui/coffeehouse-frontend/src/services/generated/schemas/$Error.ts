/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $Error = {
  properties: {
    error: {
      type: 'string',
      description: `Error code`,
      isRequired: true,
    },
    message: {
      type: 'string',
      description: `Human-readable error message`,
      isRequired: true,
    },
    details: {
      type: 'array',
      contains: {
        properties: {
          field: {
            type: 'string',
          },
          constraint: {
            type: 'string',
          },
          value: {
            properties: {},
            isNullable: true,
          },
        },
      },
    },
    path: {
      type: 'string',
      description: `Request path`,
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
    },
  },
} as const
