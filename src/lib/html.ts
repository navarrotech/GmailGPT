// Import JSDOM from the 'jsdom' package
import { JSDOM } from 'jsdom'

// Function to strip <body> and remove text, but in a Node environment
export function stripBodyAndRemoveTextNode(html: string): string {
  const dom = new JSDOM(html)
  return dom.window.document.body.innerHTML
}