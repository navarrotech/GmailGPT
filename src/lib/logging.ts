// Copyright © 2025 Navarrotech

// Core
import fs from 'fs'
import path from 'path'

// Utility
import { deleteDirectory, parseDateFromDirName, trimFileToMaxSize } from './file'

// Misc
import {
  MAX_EMAIL_LOGS_RETENTION_DAYS,
  MAX_MAIN_LOG_SIZE_KB,
  MAX_TOKENS_LOG_SIZE_KB,
  LOGGING_DIR
} from '../constants'

const cwd = process.cwd()
const LOG_DIR = path.join(cwd, LOGGING_DIR)

export function startupLogging() {
  // On startup, clear the existing logs
  if (fs.existsSync(LOG_DIR)) {
    fs.rmSync(path.join(LOG_DIR, 'app.log'), { force: true })
    fs.rmSync(path.join(LOG_DIR, 'tokens.log'), { force: true })
  }
  else {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }

  fs.writeFileSync(
    path.join(LOG_DIR, 'app.log'),
    `Log started at ${new Date().toISOString()}\n`
  )
}

function getTimestamp() {
  const now = new Date()
  return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`
    + `${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')} `
    + `:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`
}

export function log(...messages: any[]) {
  try {
    const joinedMessages = messages.map(remapLogItem).filter(Boolean).join(' ')

    const logMessage = `${getTimestamp()} ${joinedMessages}`

    // console.log('LOG RAW: ', ...messages)
    console.log(joinedMessages)

    fs.appendFileSync(
      path.join(LOG_DIR, 'app.log'),
      `${logMessage}\n`
    )
  }
  catch (error) {
    console.error('Error in log function:', error)
  }
}

export function logItem(topic: string, ...messages: any[]) {
  try {
    // This will log to a logs/{topic}.log file
    const logFilePath = path.resolve(
      path.join(LOG_DIR, `${topic}.log`)
    ).replace(/\s/, '_')

    const joinedMessages = messages.map(remapLogItem).filter(Boolean).join(' ')

    // console.log('LOGITEM RAW: ', topic, ...messages)

    const logMessage = `${getTimestamp()} ${joinedMessages}`
    const logEntry = `${logMessage}\n`

    const directory = path.dirname(logFilePath)
    // Ensure the directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }

    fs.appendFileSync(logFilePath, logEntry)
  }
  catch (error) {
    console.error('Error in logItem:', error)
  }
}

export function remapLogItem(item: any) {
  if (typeof item === 'object') {
    return JSON.stringify(item, null, 2)
  }
  if (item instanceof Error) {
    return `${item.constructor.name} Error:\n${item.message}\nStack: ${item.stack}`
  }
  return item
}

export function pruneLogs() {
  // 1. We prune the logs/emails directory by max retention days
  // The logs/emails/ subdirectories are named D-MM-YYYY
  // 2. We prune the logs/app.log and logs/tokens.log by max size, always removing the top part of the file first
  // 3. We prune the logs/tokens.log by max size, always removing the top part of the file first

  // -----

  try {
    // 1. Prune logs/emails/* directories older than MAX_EMAIL_LOGS_RETENTION_DAYS
    const emailsDir = path.join(LOG_DIR, 'emails')
    if (fs.existsSync(emailsDir)) {
      const entries = fs.readdirSync(emailsDir)
      const now = Date.now()

      for (const entry of entries) {
        const entryPath = path.join(emailsDir, entry)
        if (!fs.statSync(entryPath).isDirectory()) {
          continue
        }

        const dirDate = parseDateFromDirName(entry)
        if (!dirDate) {
          continue
        }

        const ageMs = now - dirDate.getTime()
        const ageDays = ageMs / (1000 * 60 * 60 * 24)
        if (ageDays > MAX_EMAIL_LOGS_RETENTION_DAYS) {
          deleteDirectory(entryPath)
        }
      }
    }

    // 2. Prune logs/app.log to MAX_MAIN_LOG_SIZE_KB
    const mainLogPath = path.join(LOG_DIR, 'app.log')
    trimFileToMaxSize(mainLogPath, MAX_MAIN_LOG_SIZE_KB)

    // 3. Prune logs/tokens.log to MAX_TOKENS_LOG_SIZE_KB
    const tokensLogPath = path.join(LOG_DIR, 'tokens.log')
    trimFileToMaxSize(tokensLogPath, MAX_TOKENS_LOG_SIZE_KB)
  }
  catch (error) {
    log('Error during log pruning:', error)
  }
}

process.on('uncaughtException', (error) => {
  log('Uncaught Exception:', error)
})
