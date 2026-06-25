# Next.js web — multi-stage. Build context = thư mục gốc repo.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.mjs ./apps/web/
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
