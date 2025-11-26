/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $CreateVersionRequest = {
  properties: {
    content: {
      type: 'dictionary',
      contains: {
        properties: {},
      },
      isRequired: true,
    },
    changeSummary: {
      type: 'string',
      description: `Human-readable description of changes`,
      maxLength: 500,
    },
  },
} as const
