# Receptor frontend
FROM node:24-alpine

WORKDIR /app/receptor/frontend

COPY receptor/frontend/package*.json ./
RUN npm install

COPY receptor/frontend/ ./
COPY app-global.css /app/app-global.css

EXPOSE 4000
ENV PORT=4000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4000"]
