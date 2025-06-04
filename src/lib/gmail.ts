
// Core
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

// Typescript
import type { GmailEmail, GptAnalysisResponse } from '../types'
import type { gmail_v1 } from 'googleapis'

// Utility
import { stripHtml } from 'string-strip-html'
import { stripBodyAndRemoveTextNode } from './html'

// Misc
import { logItem, log } from './logging'
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN
} from '../env'


const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
)

// If you already have a refresh token, set it so the client can auto‐refresh.
oAuth2Client.setCredentials({
  refresh_token: GOOGLE_REFRESH_TOKEN
})

export const gmailApi = google.gmail({
  version: 'v1',
  auth: oAuth2Client
})

export async function listUnreadMessages(maxResults = 10): Promise<GmailEmail[]> {
  const results = await gmailApi.users.messages.list({
    userId: 'me',
    // This will grab all emails in the inbox that are not labeled with "emailgpt" label
    q: 'in:inbox -label:emailgpt',
    maxResults
  })

  // If no messages, return empty array
  if (!results.data.messages) {
    return []
  }

  const fullMessagePromises = results.data.messages.map((message) => getMessageBody(message)).filter(Boolean)

  return await Promise.all(fullMessagePromises)
}

export async function getMessageBody(message: gmail_v1.Schema$Message): Promise<null | GmailEmail> {
  // We’ll request the “metadata” with headers and the raw part of the body
  const result = await gmailApi.users.messages.get({
    userId: 'me',
    id: message.id,
    format: 'full'
  })

  const payload = result.data.payload
  if (!payload) {
    log(`No payload found for message ID: ${message.id}`)
    return null
  }

  // Extract subject from headers
  const headers = payload.headers || []
  const subjectHeader = headers.find(h => h.name === 'Subject')
  const fromHeader = headers.find(h => h.name === 'From')
  const from = fromHeader ? fromHeader.value || '' : ''
  let subject = subjectHeader ? subjectHeader.value || '' : ''

  // Traverse the payload to get the plaintext body
  let body = ''
  let htmlbody = ''

  function walkParts(part: any): void {
    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
      body += Buffer.from(part.body.data, 'base64').toString('utf-8')
    }
    else if (part.mimeType === 'text/html' && part.body && part.body.data) {
      htmlbody += Buffer.from(part.body.data, 'base64').toString('utf-8')
    }
    else if (part.parts) {
      part.parts.forEach((sub: any) => walkParts(sub))
    }
  }

  walkParts(payload)

  if (!body && htmlbody) {
    body = stripBodyAndRemoveTextNode(htmlbody)
  }
  body = stripHtml(body).result
  const rawBody = body + ''

  // Trim, remove all line endings & tabs, and limit body length
  body = body
    .replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g, '') // Remove URLs and trailing spaces
    .replace(/-{3,}/g, '') // Remove long dashes
    .replace(/\s{0,}(View in browser)\s{0,}/gi, '') // Remove "View in browser" text
    .replace(/\s{0,}(View email in browser)\s{0,}/gi, '') // Remove "View email in browser" text
    .replace(/\s{0,}(Web version)\s{0,}/gi, '') // Remove "View in browser" text
    .replace(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/g, '') // Remove phone numbers
    .replace(/tel:(\d|\s|\.)*\D/g, '') // Remove tel: links
    .replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '') // Remove emojis and special characters
    .replace(/\d{9}/g, '') // Remove 9-digit numbers (like SSNs)
    .replace(/\r/g, ' ') // Replace CRLF with space
    .replace(/\n/g, ' ') // Replace LF with space
    .replace(/\t/g, ' ') // Replace tabs with space
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
    .replace(/alex\s?navarro/gi, '') // Remove specific names
    .replace(/boise/gi, '') // Remove specific locations
    .replace(/alex@navarrocity.com/gi, '') // Remove specific email addresses

  body = body
    .substring(0, 1000) // Limit to 1000 characters
    .trim()

  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1
  const day = new Date().getDate()
  const synposis = `emails/${day}-${month}-${year}/` + message.id + '-' + subject
    .replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g, '') // Remove URLs and trailing spaces
    .replace(/-{3,}/g, '') // Remove long dashes
    .replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '') // Remove emojis and special characters
    .replace(/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/g, '') // Remove phone numbers
    .replace(/[^a-z\s]+/gi, '') // Remove non-alphabetic characters (file safety)
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
    .substring(0, 50)
    .trim()

  return {
    id: message.id,
    threadId: message.threadId,
    synposis,
    from,
    subject,
    body,
    rawBody,
  }
}


let cachedList: Record<string, gmail_v1.Schema$Label> = null
async function getLabelList(ignoreCache: boolean = false): Promise<Record<string, gmail_v1.Schema$Label>> {
  // Returns a list by label name
  if (cachedList && !ignoreCache) {
    return cachedList
  }

  const list = await gmailApi.users.labels.list({ userId: 'me' })
  const reshaped: Record<string, gmail_v1.Schema$Label> = list.data.labels.reduce((previous, label) => {
    previous[label.name] = label
    return previous
  }, {} as Record<string, gmail_v1.Schema$Label>)

  cachedList = reshaped
  return cachedList
}
getLabelList(true) // Prefetch for early bird caching


export async function processGptRecommendation(analysis: GptAnalysisResponse) {
  if (!analysis?.email) {
    log('No analysis provided for processing actions onto.', analysis)
    return
  }

  const labelListByName = await getLabelList()

  // TODO: optimize this so we just add remove labels in one request

  try {
    const { id, synposis } = analysis.email
    const { action, labels } = analysis.action

    logItem(synposis, 'Entering GPT analysis processing into actions...')

    switch (action) {
      case 'spam':
        logItem(synposis, `→ Moving message to spam & marking as read`)
        await gmailApi.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: ['SPAM'],
            removeLabelIds: ['UNREAD'] // Mark as read
          }
        })
        break

      case 'delete':
        logItem(synposis, `→ Deleting message`)
        await gmailApi.users.messages.trash({
          userId: 'me',
          id
        })
        break

      case 'archive':
        logItem(synposis, `→ Archiving message & marking as read`)
        await gmailApi.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            removeLabelIds: ['INBOX', 'UNREAD'],
          }
        })
        break

      case 'unsubscribe':
        logItem(synposis, `→ Labeling message as "Unsubscribe"`)
        // TODO: Add an attempt to fetch the unsubscribe link from the body
        await gmailApi.users.messages.trash({
          userId: 'me',
          id
        })
        break

      case 'mark-important':
        logItem(synposis, `→ Labeling message as "Important" & marking as read`)
        await gmailApi.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: ['IMPORTANT'],
            removeLabelIds: ['UNREAD'] // Mark as read
          }
        })
        break

      case 'star':
        logItem(synposis, `→ Starring message & marking as read`)
        await gmailApi.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: ['STARRED'],
            removeLabelIds: ['UNREAD'] // Mark as read
          }
        })
        break

      case 'none':
      default:
        logItem(synposis, `→ No action for message`)
        break
    }

    // If GPT returned a “label” (e.g. receipts|charity|american express), you can do:
    if (labels?.length) {
      for (const label of labels) {
        const customLabelId = labelListByName[label]?.id
        if (!customLabelId) {
          logItem(synposis, `→ Custom label "${label}" from ChatGPT was not found, skipping.`)
          continue
        }
        await gmailApi.users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: [customLabelId]
          }
        })
        logItem(synposis, `→ Applied custom label "${label}"`)
      }
    }

    await gmailApi.users.messages.modify({
      userId: 'me',
      id,
      requestBody: {
        // TODO: Add a check to ensure this label exists or is created on startup
        addLabelIds: [labelListByName['emailgpt']?.id]
      }
    })
    logItem(synposis, `→ Added "emailgpt" label from message`)
  }
  catch (error) {
    if (analysis?.email?.synposis) {
      logItem(analysis.email.synposis, 'Error processing GPT recommendation:', error)
    }
    else {
      log('Error processing GPT recommendation:', error)
    }
  }
}
