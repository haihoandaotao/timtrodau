#!/bin/sh
# Entrypoint API: chạy migration (idempotent) rồi khởi động server.
# Migration chạy trên data-source đã build (dist/config/data-source.js) bằng typeorm CLI.
set -e

echo "→ Đang chạy database migrations..."
npm run migration:run:prod

echo "→ Khởi động API..."
exec node dist/main.js
