/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ExtensionRules = {
  properties: {
    maxDepth: {
      type: 'number',
      description: `Maximum nesting depth`,
    },
    allowedTypes: {
      type: 'array',
      contains: {
        type: 'string',
      },
    },
    namingPattern: {
      type: 'string',
      description: `Regex for property names`,
    },
    reservedWords: {
      type: 'array',
      contains: {
        type: 'string',
      },
    },
  },
} as const
