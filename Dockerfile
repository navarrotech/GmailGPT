FROM node:24.1.0-alpine

WORKDIR /app

COPY src/ /app/src/
COPY package.json /app/
COPY yarn.lock /app/
COPY tsconfig.json /app/

RUN yarn install

CMD ["yarn", "tsx", "src/index.ts"]
