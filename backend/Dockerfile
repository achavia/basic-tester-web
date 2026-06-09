FROM node:20-bullseye-slim

WORKDIR /app

ENV PORT=3001

COPY package.json package-lock.json ./
RUN npm ci
RUN npx playwright install --with-deps

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
