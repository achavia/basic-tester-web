FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

EXPOSE 8080

ENV PORT=8080
CMD ["node", "server.js"]
