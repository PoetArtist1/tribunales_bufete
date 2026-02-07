# Emisor frontend
FROM node:24-alpine

WORKDIR /app/emisor/frontend

COPY emisor/frontend/package*.json ./
RUN npm install

COPY emisor/frontend/ ./
COPY app-global.css /app/app-global.css

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
