/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateMetadataRequest = {
  properties: {
    type: {
      type: 'string',
      description: `Metadata type (kebab-case)`,
      isRequired: true,
      pattern: '^[a-z]+(-[a-z]+)*$',
    },
    name: {
      type: 'string',
      description: `Unique name within type`,
      isRequired: true,
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
    },
    content: {
      type: 'dictionary',
      contains: {
        properties: {},
      },
      isRequired: true,
    },
  },
} as const
