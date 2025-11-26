/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $VersionResponse = {
  properties: {
    id: {
      type: 'number',
      format: 'int64',
    },
    documentId: {
      type: 'number',
      format: 'int64',
    },
    type: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    versionNumber: {
      type: 'number',
    },
    content: {
      type: 'dictionary',
      contains: {
        properties: {},
      },
    },
    author: {
      type: 'string',
      description: `User who created this version`,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    changeSummary: {
      type: 'string',
    },
    publishingState: {
      type: 'Enum',
    },
    isActive: {
      type: 'boolean',
    },
    schemaWarning: {
      type: 'boolean',
      description: `Whether version violates current schema`,
    },
    schemaWarningTimestamp: {
      type: 'string',
      isNullable: true,
      format: 'date-time',
    },
  },
} as const
