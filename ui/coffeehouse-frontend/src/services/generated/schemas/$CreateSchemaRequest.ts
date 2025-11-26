/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateSchemaRequest = {
  properties: {
    type: {
      type: 'string',
      description: `Metadata type this schema applies to`,
      isRequired: true,
      pattern: '^[a-z]+(-[a-z]+)*$',
    },
    schema: {
      type: 'dictionary',
      contains: {
        properties: {},
      },
      isRequired: true,
    },
    allowsExtensions: {
      type: 'boolean',
      description: `Whether custom properties are allowed`,
    },
    extensionRules: {
      type: 'ExtensionRules',
    },
  },
} as const
