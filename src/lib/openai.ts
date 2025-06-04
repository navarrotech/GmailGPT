// Copyright © 2025 Navarrotech

// Core
import OpenAI from 'openai'

// Prompts
// import { buildJsonPrompt } from '../prompts'
import { MAX_RETRY_ATTEMPTS } from '../constants'

// Lib
import { Timer } from './timer'
import { log, logItem } from './logging'

// Misc
import { OPENAI_API_KEY } from '../env'

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

export async function ask(
  question: string,
  systemContent: string,
  synposis?: string,
  ...loggables: any[]
): Promise<string> {
  if (synposis) {
    log(`Us -> OpenAI about ${synposis}`)
    logItem(synposis, 'Us -> OpenAI:', loggables, question)
  }

  const timer = new Timer(synposis)
  const result = await openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [
      {
        role: 'system',
        content: systemContent
      },
      {
        role: 'user',
        content: question
      }
    ]
  })

  let response = result.choices[0].message.content
  response = response
    .replace(/^"{0,}/, '') // Remove leading quotes
    .replace(/"{0,}$/, '') // Remove trailing quotes
    .replace(/^```/, '') // Remove leading ```
    .replace(/```$/, '') // Remove trailing ```
    .trim()

  timer.stop()

  if (synposis) {
    log(`Us <- OpenAI about ${synposis} said "${response}"`)
    logItem(synposis, 'Us <- OpenAI:', response)
    logItem(synposis, result)
    logItem(synposis, 'Response time:', timer.getElapsedTime() / 1000, 'seconds')
  }

  logItem('tokens', `Tokens used for ${synposis || 'Untracked prompt'} -> ${result.usage?.total_tokens || 0}`)

  return response
}

export async function askForJson<Type = any>(
  question: string,
  systemContent: string,
  depth: number = 0,
  synposis: string,
  ...loggables: any[]
): Promise<Type> {
  if (depth) {
    log(`Asking -> OpenAI for JSON response, recursion depth: ${depth}`)
    if (depth > MAX_RETRY_ATTEMPTS) {
      throw new Error('Maximum recursion depth reached while trying to parse JSON response.')
    }
  }

  // const modifiedQuestion = buildJsonPrompt(question)
  const response = await ask(question, systemContent, synposis, ...loggables)

  // Remove any leading/trailing whitespace, backticks, or newlines, especially ``` or ```json
  const cleanedResponse = response
    .trim()
    .replace(/^json/, '') // Remove leading ``` or ```json
    .trim()

  try {
    return JSON.parse(response)
  }
  catch (error) {
    log('Failed to parse JSON response:', { depth, cleanedResponse, response }, error)
    // If parsing fails, we can try to extract the JSON a bit more aggressively
    try {
      const firstIndexOfBrace = cleanedResponse.indexOf('{')
      const lastIndexOfBrace = cleanedResponse.lastIndexOf('}')
      const jsonString = cleanedResponse.substring(firstIndexOfBrace, lastIndexOfBrace + 1)
      return JSON.parse(jsonString)
    }
    // If parsing fails AGAIN, we can try again with the cleaned response
    catch (errorB) {
      log('Failed to aggressively parse JSON response:', { depth, cleanedResponse, response }, errorB)
      return await askForJson<Type>(question, systemContent, depth + 1, synposis, ...loggables)
    }
  }
}
