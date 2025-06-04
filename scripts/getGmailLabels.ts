
import { gmailApi } from '../src/lib/gmail'
import fs from 'fs'

async function main() {
  const labels = await gmailApi.users.labels.list({
    userId: 'me'
  })

  console.log('Labels:', labels.data.labels)

  fs.writeFileSync(
    'gmail-labels.json',
    JSON.stringify(labels.data.labels, null, 2)
  )

  console.log('[ ', labels.data.labels?.map((label) => `'${label.name}'`).join(', '), ' ]')
  console.log('Labels saved to ./gmail-labels.json')

  process.exit(0)
}

main()
