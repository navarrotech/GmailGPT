// Copyright © 2025 Navarrotech

import type { ALLOWED_LABELS } from './constants'

export type GmailEmail = {
  id: string
  threadId: string
  synposis: string
  from: string
  subject: string
  body: string
  rawBody: string
}

export type GptAction = 'spam'
  | 'delete'
  | 'archive'
  | 'unsubscribe'
  | 'mark-important'
  | 'star'
  | 'none'

export type GptEmailAction = {
  action: GptAction
  labels?: typeof ALLOWED_LABELS[number][]
  message?: string
}

export type GptAnalysisResponse = {
  action: GptEmailAction
  email: GmailEmail
}
