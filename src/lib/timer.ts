// Copyright © 2025 Navarrotech

// Core
import { log } from './logging'

export class Timer {
  private name: string
  private startTime: number
  private endTime: number

  constructor(name: string = 'Timer') {
    this.startTime = Date.now()
    this.name = name

    this.getElapsedTime = this.getElapsedTime.bind(this)
    this.stop = this.stop.bind(this)
    this.print = this.print.bind(this)
  }

  public stop(): void {
    this.endTime = Date.now()
    this.print()
  }

  public getElapsedTime(): number {
    if (this.endTime) {
      return this.endTime - this.startTime
    }
    return Date.now() - this.startTime
  }

  public format(): string {
    const elapsed = this.getElapsedTime()
    const asSeconds = elapsed / 1000
    return `${this.name} took ${asSeconds.toFixed(2)} seconds`
  }

  public print(): string {
    const formatted = this.format()
    log(formatted)
    return formatted
  }
}
