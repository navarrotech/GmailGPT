
import { google } from 'googleapis'
import express from 'express'

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../src/env'

// Usage:
// yarn tsx scripts/getRefreshToken.ts
// Follow the instructions to get your Google OAuth refresh token

async function main(): Promise<void> {
  console.log('This script will help you set up your Google OAuth credentials for EmailGPT.')

  const GOOGLE_REDIRECT_URI = 'http://localhost:8471/oauth2callback'

  console.log('\nStarting an express server to handle OAuth2 callback...')
  const deferredPromise = startServerForResult()

  console.log('\nSetting up OAuth2 client...')
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )

  const authUrl = await oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify']
  })

  console.log('Authorize this app by visiting this URL:\n', authUrl)
  // const code = await ask('\nEnter the authorization code from that page: ')
  const code = await deferredPromise

  if (!code) {
    console.error('Authorization code is required. Please try again.')
    process.exit(1)
  }

  const { tokens } = await oAuth2Client.getToken(code)

  if (tokens.refresh_token) {
    console.log('REFRESH_TOKEN:', tokens.refresh_token)
  }
  else {
    console.error('No refresh token received. Make sure you used access_type: offline')
  }

  process.exit(0)
}

async function startServerForResult(): Promise<string> {
  return new Promise((resolve, reject) => {
    const app = express()
    const port = 8471

    app.get('/oauth2callback', (req, res) => {
      const code = req.query.code as string
      if (!code) {
        res.status(400).send('No code provided')
        reject(new Error('No code provided'))
      }
      else {
        res.send('Authorization successful! You can close this window.')
        resolve(code)
      }
    })

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`)
    })
  })
}

main().catch(console.error)
