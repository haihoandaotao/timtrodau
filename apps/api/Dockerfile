# NestJS API — multi-stage. Build context = thư mục gốc repo.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci
COPY apps/api ./apps/api
COPY tests ./tests
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
