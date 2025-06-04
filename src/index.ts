
// Core
import cron from 'node-cron'

// Lib
import { listUnreadMessages, processGptRecommendation } from './lib/gmail'
import { analyzeGmailMessage } from './lib/analysis'
import { log, startupLogging, pruneLogs } from './lib/logging'

// Misc
import { NODE_ENV } from './env'
import { EMAILS_TO_PULL_PER_BATCH } from './constants'

let busy: boolean = false
async function main() {
    // ////////////////////////////
    // Setup

    if (busy) {
        log('Already processing emails, skipping this run.')
        return
    }
    busy = true
    log('Checking for unread emails...')

    // ////////////////////////////
    // Core logic!

    const messages = await listUnreadMessages(EMAILS_TO_PULL_PER_BATCH)
    if (!messages.length) {
        log('No unread emails found')
        busy = false
        return
    }
    log('Starting email processing...')

    const analysisPromises = messages.map((message) => analyzeGmailMessage(message))
    const analysis = await Promise.allSettled(analysisPromises)

    const gmailActionPromises = analysis
        .filter((result) => result.status === 'fulfilled')
        .map((result) => processGptRecommendation(result.value))

    await Promise.allSettled(gmailActionPromises)

    log('Email batch processing complete')

    // ////////////////////////////
    // Cleanup
    busy = false
}

startupLogging()
main().catch(log)

if (NODE_ENV === 'production') {
    log('Starting cron job for email processing...')
    cron.schedule('5 * * * *', () => main().catch(log))
    cron.schedule('0 0 * * *', () => pruneLogs())
}
