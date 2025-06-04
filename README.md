# GmailGPT
This is a project to filter through your gmail messages for you

## Installation
You will need to have Node and yarn installed.
```bash
git clone git@github.com:navarrotech/GmailGPT.git
```

You will need a `.env` file created at the root of the cloned project.
```env
# ChatGPT
OPENAI_API_TOKEN=

# Google API
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

There's more information below on acquiring the google oauth credentials

You will need to create a `src/constants.ts` file. Here's the template:
```typescript
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
```

## Running with docker compose
```yaml
services:
  emailgpt:
    build: ./emailgpt
    container_name: emailgpt
    restart: unless-stopped
    environment:
      NODE_ENV: production
      OPENAI_API_TOKEN: ${OPENAI_API_TOKEN}
      GOOGLE_OAUTH_CLIENT_ID: ${GOOGLE_OAUTH_CLIENT_ID}
      GOOGLE_OAUTH_CLIENT_SECRET: ${GOOGLE_OAUTH_CLIENT_SECRET}
      GOOGLE_REFRESH_TOKEN: ${GOOGLE_REFRESH_TOKEN}
    volumes:
      - ./emailgpt/logs:/app/logs
```

## Running locally
If you don't want to use docker compose, you can use:
```
yarn tsx src/index.tsx
```

## Google OAuth credentials
To setup credentials, first create a project in your organization and create an OAuth application for it.
You'll need the OAuth id and secret.

Place them into the .env file, then you can use the script:
```bash
yarn refresh-token
```

Which will log the `GOOGLE_REFRESH_TOKEN` env variable quick and easily for you.

## Helpers scripts
**Gmail Labels**
Once your env is setup, you can run:
```bash
yarn gmail-labels
```

Which will help to fetch & log all available gmail labels for you to use in your `constants.ts` file.

**Get models**
You can also use:
```bash
yarn get-models
```
To fetch all of the available chatgpt models.

## Development enviornment
In development change a couple of things in your docker compose.yml
```yaml
services:
  emailgpt:
    build: ./emailgpt
    container_name: emailgpt
    restart: unless-stopped
    command: yarn tsx watch /app/src/index.ts # <-- Add the src code here so hot reloading works
    environment:
      NODE_ENV: development # <-- Set this to development to disable CRON
      OPENAI_API_TOKEN: ${OPENAI_API_TOKEN}
      GOOGLE_OAUTH_CLIENT_ID: ${GOOGLE_OAUTH_CLIENT_ID}
      GOOGLE_OAUTH_CLIENT_SECRET: ${GOOGLE_OAUTH_CLIENT_SECRET}
      GOOGLE_REFRESH_TOKEN: ${GOOGLE_REFRESH_TOKEN}
    volumes:
      - ./emailgpt/logs:/app/logs
      - ./emailgpt/src/:/app/src # <-- Add the src code here so hot reloading works
```
