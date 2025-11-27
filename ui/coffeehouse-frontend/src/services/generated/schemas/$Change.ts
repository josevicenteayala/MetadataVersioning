/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $Change = {
  properties: {
    operation: {
      type: 'Enum',
    },
    path: {
      type: 'string',
      description: `JSON path`,
    },
    oldValue: {
      properties: {},
      isNullable: true,
    },
    newValue: {
      properties: {},
      isNullable: true,
    },
    type: {
      type: 'Enum',
    },
  },
} as const
