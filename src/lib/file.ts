// Copyright © 2025 Navarrotech

// Core
import path from 'path'
import fs from 'fs'

export function deleteDirectory(dirPath: string, removeSelf: boolean = true) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const filePath = path.join(dirPath, file)
      if (fs.statSync(filePath).isDirectory()) {
        deleteDirectory(filePath)
      }
      else {
        fs.unlinkSync(filePath)
      }
    })
    if (removeSelf) {
      fs.rmdirSync(dirPath)
    }
  }
}

/**
 * Parse a directory name formatted as "D-MM-YYYY" into a Date object.
 * Returns null if the format is invalid or the date parts don't form a valid date.
 * @param {string} dirName - Directory name in the format "D-MM-YYYY"
 * @return {Date | null} Parsed date or null if invalid
 */
export function parseDateFromDirName(dirName: string): Date | null {
  const parts = dirName.split('-')
  if (parts.length !== 3) {
    return null
  }

  const day = parseInt(parts[0], 10)
  const monthZeroBased = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)

  if (
    isNaN(day)
    || isNaN(monthZeroBased)
    || isNaN(year)
    || monthZeroBased < 0
    || monthZeroBased > 11
  ) {
    return null
  }

  const candidate = new Date(year, monthZeroBased, day)
  // Check that the constructed date matches exactly (e.g. no rollover)
  if (
    candidate.getFullYear() !== year
    || candidate.getMonth() !== monthZeroBased
    || candidate.getDate() !== day
  ) {
    return null
  }

  return candidate
}

/**
 * Ensure a given file does not exceed maxSizeKb by removing
 * the oldest bytes (the "top" of the file) and keeping only
 * the last maxSizeKb kilobytes.
 * @param {string} filePath - Path to the file to trim
 * @param {number} maxSizeKb - Maximum size in kilobytes
 * @return {void}
 */
export function trimFileToMaxSize(filePath: string, maxSizeKb: number): void {
  if (!fs.existsSync(filePath)) {
    return
  }

  const stats = fs.statSync(filePath)
  const maxBytes = maxSizeKb * 1024
  if (stats.size <= maxBytes) {
    return
  }

  // Read only the last maxBytes from the existing file
  const fd = fs.openSync(filePath, 'r')
  try {
    const buffer = Buffer.allocUnsafe(maxBytes)
    const startPos = stats.size - maxBytes
    fs.readSync(fd, buffer, 0, maxBytes, startPos)
    fs.writeFileSync(filePath, buffer)
  }
  finally {
    fs.closeSync(fd)
  }
}
