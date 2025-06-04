// Copyright © 2025 Navarrotech

import { openai } from '../src/lib/openai'
import fs from 'fs'

async function main() {
  // Get the list of OpenAI models
  const labels = await openai.models.list()
  const results = labels.data

  // console.log(results)

  fs.writeFileSync(
    'openai-models.json',
    JSON.stringify(results, null, 2)
  )

  console.log('OpenAI models saved to ./openai-models.json')

  process.exit(0)
}

main()
