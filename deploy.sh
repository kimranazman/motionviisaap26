#!/bin/bash
# Deployment script for SAAP2026v2
# Run this script on the NAS to deploy

set -e

echo "========================================"
echo "  SAAP2026v2 Deployment"
echo "========================================"
echo ""

# Navigate to app directory
cd /volume1/Motionvii/saap2026v2/app

# Step 1: Build containers
echo "Step 1: Building containers..."
sudo /usr/local/bin/docker-compose -f docker-compose.nas.yml build
echo "✓ Containers built"
echo ""

# Step 2: Start containers
echo "Step 2: Starting containers..."
sudo /usr/local/bin/docker-compose -f docker-compose.nas.yml up -d
echo "✓ Containers started"
echo ""

# Step 3: Wait for database
echo "Step 3: Waiting for database to be ready..."
sleep 15
echo "✓ Database ready"
echo ""

# Step 4: Run Prisma migrations
echo "Step 4: Running Prisma migrations..."
sudo /usr/local/bin/docker exec saap2026-app npx prisma db push
echo "✓ Migrations completed"
echo ""

# Step 5: Check status
echo "Step 5: Checking container status..."
sudo /usr/local/bin/docker ps | grep saap2026
echo ""

echo "========================================"
echo "  Deployment completed successfully!"
echo "========================================"
echo ""
echo "App available at:"
echo "  - Local: http://192.168.1.20:3002"
echo "  - Public: https://saap.motionvii.com (after Cloudflare tunnel setup)"
echo ""
