/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $MetadataDocumentList = {
  properties: {
    documents: {
      type: 'array',
      contains: {
        type: 'MetadataDocumentResponse',
      },
    },
    cursor: {
      type: 'string',
      description: `Cursor for next page`,
      isNullable: true,
    },
    hasMore: {
      type: 'boolean',
      description: `Whether more results exist`,
    },
  },
} as const
