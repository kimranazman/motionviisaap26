# SAAP 2026 - NAS Deployment Notes

## Server Details
- **Host**: 192.168.1.20 (Synology NAS)
- **SSH User**: adminmotionvii
- **App Directory**: `/volume1/Motionvii/saap2026v2/app`
- **Public URL**: https://saap.motionvii.com

## Cloudflare Tunnel
- Container: `cloudflared-mlbb` (shared tunnel)
- Routes `saap.motionvii.com` to `192.168.1.20:3002`
- App must expose port **3002** for the tunnel to work

## Required Environment Variables

The following environment variables must be set in `docker-compose.yml` on the NAS (not in git repo to avoid exposing secrets):

```yaml
environment:
  - DATABASE_URL=mysql://saap_user:saap_password_2026@db:3306/saap2026
  - NODE_ENV=production
  - AUTH_TRUST_HOST=true
  - AUTH_URL=https://saap.motionvii.com
  - AUTH_SECRET=<from .env file>
  - AUTH_GOOGLE_ID=<from .env file>
  - AUTH_GOOGLE_SECRET=<from .env file>
```

**Important**: Copy the actual values from `.env` file. These are not committed to git for security.

## Deployment Commands

```bash
# SSH to NAS
ssh adminmotionvii@192.168.1.20

# Navigate to app
cd /volume1/Motionvii/saap2026v2/app

# Pull latest code
git pull origin main

# Rebuild and restart (if code changes)
sudo /usr/local/bin/docker compose down
sudo /usr/local/bin/docker compose build --no-cache
sudo /usr/local/bin/docker compose up -d

# Quick restart (if only env changes)
sudo /usr/local/bin/docker compose up -d

# Check logs
sudo /usr/local/bin/docker logs saap2026-app --tail 50
sudo /usr/local/bin/docker logs saap2026-db --tail 50
```

## Database

- **Type**: MariaDB 10.11
- **Container**: saap2026-db
- **Port**: 3307 (external) -> 3306 (internal)
- **Credentials**: saap_user / saap_password_2026

### Run migrations from local machine:
```bash
DATABASE_URL="mysql://saap_user:saap_password_2026@192.168.1.20:3307/saap2026" npx prisma db push
```

### Seed data from local machine:
```bash
DATABASE_URL="mysql://saap_user:saap_password_2026@192.168.1.20:3307/saap2026" npx tsx prisma/seed.ts
```

### Direct database access:
```bash
ssh adminmotionvii@192.168.1.20 "sudo /usr/local/bin/docker exec saap2026-db mysql -u saap_user -psaap_password_2026 saap2026 -e 'YOUR SQL HERE'"
```

## Admin User Setup

After fresh database setup, seed the admin user:
```bash
ssh adminmotionvii@192.168.1.20 "sudo /usr/local/bin/docker exec saap2026-db mysql -u saap_user -psaap_password_2026 saap2026 -e \"INSERT INTO users (id, name, email, role, createdAt, updatedAt) VALUES ('admin-user-001', 'Khairul', 'khairul@talenta.com.my', 'ADMIN', NOW(), NOW());\""
```

## Common Issues

### 502 Bad Gateway
- Check if app is running on port 3002 (for Cloudflare tunnel)
- Verify: `curl http://192.168.1.20:3002`

### Authentication Failed
- Ensure AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET are set in docker-compose.yml on NAS
- Check logs: `sudo /usr/local/bin/docker logs saap2026-app --tail 50`

### UntrustedHost Error
- Ensure AUTH_TRUST_HOST=true and AUTH_URL=https://saap.motionvii.com are set

### Database Unhealthy
- Wait for initialization to complete, then restart: `sudo /usr/local/bin/docker restart saap2026-db`
- Then start app: `sudo /usr/local/bin/docker compose up -d`
