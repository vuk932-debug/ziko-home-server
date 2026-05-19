# Backend Production Dockerfile (v1.0.1)
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
RUN apt-get update && apt-get install -y openssl ca-certificates
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
EXPOSE 5000
CMD ["npm", "start"]
