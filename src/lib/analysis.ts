// Copyright © 2025 Navarrotech

// Core
import { askForJson } from './openai'

// Typescript
import type { GmailEmail, GptEmailAction, GptAnalysisResponse } from '../types'

// Misc
import { GptEmailActionValidator, validateGptResponse } from './validators'
import { buildSystemClassificationPrompt, buildClassificationUserPrompt } from '../prompts'
import { log, logItem } from './logging'

const staticClassifierPrompt = buildSystemClassificationPrompt()

export async function analyzeGmailMessage(message: GmailEmail): Promise<GptAnalysisResponse> {
  try {
    const { from, when, subject, body } = message
    const prompt = buildClassificationUserPrompt(from, when, subject, body)

    logItem(message.synposis, 'Analyzing gmail message:', message)

    const adjudicatedResponse = await validateGptResponse<GptEmailAction>(
      async () => {
        const json = await askForJson<GptEmailAction>(prompt, staticClassifierPrompt, 0, message.synposis)
        if (typeof json.labels === 'string') {
          try {
            json.labels = JSON.parse(json.labels)
          }
          catch (error) {
            logItem(message.synposis, 'Error parsing labels JSON:', error)
            return null
          }
        }
        return json
      },
      message.synposis,
      GptEmailActionValidator
    )

    return {
      action: adjudicatedResponse,
      email: message
    }
  }
  catch (error) {
    log('Error analyzing Gmail message:', error)
    logItem(message.synposis, 'error', error)
  }

  return null
}
