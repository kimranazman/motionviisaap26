#!/bin/bash
set -e

echo "Running Prisma migrations..."
sudo /usr/local/bin/docker exec saap2026-app npx prisma db push

echo "✓ Migrations complete!"
