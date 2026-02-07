# Receptor
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4001
ENV PORT_BACK=4001
ENV PORT_FRONT=4000
CMD ["node", "server.cjs"]
