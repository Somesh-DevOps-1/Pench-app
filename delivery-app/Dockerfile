FROM node:20-alpine

WORKDIR /app

ENV CI=1
ENV EXPO_NO_TELEMETRY=1
ENV EXPO_PUBLIC_APP_VARIANT=delivery

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

EXPOSE 8084

CMD ["npx", "expo", "start", "--web", "--port", "8084"]
