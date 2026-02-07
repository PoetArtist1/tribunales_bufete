# Emisor
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001
ENV PORT_BACK=3001
ENV PORT_FRONT=3000
CMD ["node", "server.cjs"]
