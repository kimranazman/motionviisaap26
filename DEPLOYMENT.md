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

## Pre-Deployment Checklist

Before pushing to GitHub, verify build passes locally:

```bash
npm run build
```

This catches:
- **Lint errors** - Unused variables, missing imports, etc.
- **Type errors** - TypeScript compilation issues
- **Build-time failures** - Static page generation issues

**Important:** Pages that query Prisma directly need `export const dynamic = 'force-dynamic'` to prevent build-time prerendering failures (no DATABASE_URL during build).

## Deployment Commands

### Full Deploy (after each phase)

```bash
# 1. Build locally first to catch errors
npm run build

# 2. Push to GitHub
git push origin main

# 3. Pull and rebuild on NAS (handles docker-compose.yml secrets conflict)
ssh adminmotionvii@192.168.1.20 "cd /volume1/Motionvii/saap2026v2/app && git stash && git pull origin main && git stash pop"
ssh adminmotionvii@192.168.1.20 "cd /volume1/Motionvii/saap2026v2/app && sudo /usr/local/bin/docker compose down && sudo /usr/local/bin/docker compose build --no-cache && sudo /usr/local/bin/docker compose up -d"

# 4. Push schema changes if any new models
DATABASE_URL="mysql://saap_user:saap_password_2026@192.168.1.20:3307/saap2026" npx prisma db push

# 5. Verify app is running
curl -s -o /dev/null -w "%{http_code}" https://saap.motionvii.com
```

### Manual SSH Deploy

```bash
# SSH to NAS
ssh adminmotionvii@192.168.1.20

# Navigate to app
cd /volume1/Motionvii/saap2026v2/app

# Pull latest code (stash local docker-compose.yml secrets first)
git stash
git pull origin main
git stash pop

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

**Primary Admin**: `khairul@talenta.com.my` - This account should always have ADMIN role.

After a fresh database setup:

1. **First, let the user sign in with Google** - This creates the user with proper OAuth linking
2. **Then update their role to ADMIN**:
```bash
ssh adminmotionvii@192.168.1.20 "sudo /usr/local/bin/docker exec saap2026-db mysql -u saap_user -psaap_password_2026 saap2026 -e \"UPDATE users SET role = 'ADMIN' WHERE email = 'khairul@talenta.com.my';\""
```
3. **User must log out and log back in** to refresh their session with the new role

**Important**: Do NOT manually INSERT users - this causes "OAuthAccountNotLinked" errors. Always let users sign in first via Google, then update their role.

### Check current users and roles:
```bash
ssh adminmotionvii@192.168.1.20 "sudo /usr/local/bin/docker exec saap2026-db mysql -u saap_user -psaap_password_2026 saap2026 -e \"SELECT id, email, role FROM users;\""
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

### OAuthAccountNotLinked Error
- Caused by manually inserting a user without OAuth account link
- Fix: Delete the user and let them sign in fresh via Google
```bash
ssh adminmotionvii@192.168.1.20 "sudo /usr/local/bin/docker exec saap2026-db mysql -u saap_user -psaap_password_2026 saap2026 -e \"DELETE FROM users WHERE email = 'user@example.com';\""
```
- Then have them sign in again, and update role if needed

### Docker Build Fails with Lint Errors
- Always run `npm run build` locally before pushing
- Common issues: unused variables, missing imports
- Fix locally, commit, push again

### Docker Build Fails with "DATABASE_URL not found"
- Caused by Next.js trying to prerender pages that use Prisma
- Fix: Add `export const dynamic = 'force-dynamic'` to the page component
- Example pages that need this: `/pipeline`, `/potential-projects`, `/companies`

### Git Pull Conflict on docker-compose.yml
- NAS has local secrets in docker-compose.yml that aren't in git
- Use stash workflow: `git stash && git pull origin main && git stash pop`
- If merge conflict after stash pop, keep the stashed version (has secrets)
