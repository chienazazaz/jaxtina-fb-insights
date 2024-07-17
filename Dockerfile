FROM node:18-bullseye-slim as builder

ENV NODE_ENV build
RUN npm install -g pnpm

WORKDIR /app

COPY package*.json .
COPY pnpm-lock.yaml .

RUN pnpm i

COPY . .

RUN npx tsc --project tsconfig.build.json

RUN pnpm prune --prod

# ---

FROM node:18-bullseye-slim

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/dist/ ./dist/

EXPOSE 8080

CMD ["node", "dist/index.js"]
