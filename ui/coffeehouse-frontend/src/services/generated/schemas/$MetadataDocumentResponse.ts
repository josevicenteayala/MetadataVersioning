/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $MetadataDocumentResponse = {
  properties: {
    id: {
      type: 'number',
      format: 'int64',
    },
    type: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    versionCount: {
      type: 'number',
      description: `Total number of versions`,
    },
    activeVersion: {
      type: 'number',
      description: `Active version number (null if none)`,
      isNullable: true,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
} as const
