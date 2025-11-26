/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $SchemaResponse = {
  properties: {
    id: {
      type: 'number',
      format: 'int64',
    },
    type: {
      type: 'string',
    },
    schema: {
      type: 'dictionary',
      contains: {
        properties: {},
      },
    },
    version: {
      type: 'number',
      description: `Schema version number`,
    },
    allowsExtensions: {
      type: 'boolean',
    },
    extensionRules: {
      type: 'ExtensionRules',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    createdBy: {
      type: 'string',
    },
  },
} as const
