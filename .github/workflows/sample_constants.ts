export const MAX_RETRY_ATTEMPTS = 3 as const
export const MAX_EMAIL_LOGS_RETENTION_DAYS = 60 as const
export const MAX_MAIN_LOG_SIZE_KB = 10_000 as const
export const MAX_TOKENS_LOG_SIZE_KB = 500

export const LOGGING_DIR = 'logs' as const
export const EMAILS_TO_PULL_PER_BATCH = 10 as const

// The default labels for gmail are:
// 'CHAT', 'SENT', 'INBOX', 'IMPORTANT', 'TRASH', 'DRAFT', 'SPAM', 'CATEGORY_FORUMS',
// 'CATEGORY_UPDATES', 'CATEGORY_PERSONAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'STARRED', 'UNREAD',
// Don't include these in the allowed labels

// Only include custom labels that you created yourself, use `yarn gmail-labels` to gather your custom labels
export const ALLOWED_LABELS = [
  // IMPORTANT! Put your labels here
] as const

// Put custom instructions here, to pass along to ChatGPT!
// Tell it your preferences. What do YOU prefer goes into starred? Or unread? When should something be marked important vs starred?
// Are there certain emails you don't want to ever have archived?
export const USER_PREFERENCES_PROMPT = `

` as const