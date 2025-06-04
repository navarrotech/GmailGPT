// Copyright © 2025 Navarrotech

// Core
import * as yup from 'yup'
import { logItem, log } from './logging'

// Typescript
import type { GptEmailAction, GptAction } from '../types'

// Misc
import { ALLOWED_LABELS, MAX_RETRY_ATTEMPTS } from '../constants'

export const GptEmailActionValidator = yup.object<GptEmailAction>({
  action: yup
    .string()
    .trim()
    .transform((value) => value?.toLowerCase())
    .oneOf([ 'spam', 'delete', 'archive', 'unsubscribe', 'mark-important', 'star', 'none' ] as GptAction[])
    .required('Action is required'),
  labels: yup
    .array()
    .optional()
    .nullable()
    .default([])
    .of(
      yup
        .string()
        .trim()
        .oneOf(ALLOWED_LABELS)
        .nullable()
        .default(null)
    ),
  message: yup
    .string()
    .optional()
    .trim()
    .nullable()
    .default(null)
})

export async function validateGptResponse<Type = Record<string, unknown>>(
  getResponse: () => Promise<Record<string, unknown>>,
  synposis: string,
  validator: yup.AnyObjectSchema
): Promise<Type> {
  let attempts = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempts++
    const response = await getResponse()

    if (attempts > MAX_RETRY_ATTEMPTS) {
      throw new Error(`Failed to validate response after ${MAX_RETRY_ATTEMPTS} attempts for: ${synposis}`)
    }

    if (typeof response !== 'object' || response === null) {
      logItem(synposis, 'Invalid response type:', typeof response)
      log('Invalid response type:', typeof response)
      continue
    }

    try {
      const validated = validator.validateSync(response, {
        abortEarly: false,
        stripUnknown: true,
        recursive: true,
        strict: true
      })
      return validated
    }
    catch (error) {
      log('Validation error:', error)
      logItem(synposis, 'Validation error:', error)
      continue
    }
  }
}
