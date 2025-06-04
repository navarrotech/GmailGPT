import 'dotenv/config'

export const OPENAI_API_KEY = process.env.OPENAI_API_TOKEN || ''
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || ''
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || ''
export const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || ''
export const NODE_ENV = process.env.NODE_ENV || 'development'

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set.')
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  throw new Error('Google OAuth environment variables are not set.');
}
