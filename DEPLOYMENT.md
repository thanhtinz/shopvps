# ShopVPS — Deployment Guide

Hướng dẫn deploy ShopVPS lên production.

---

## 🚀 Vercel (Recommended — 5 phút)

### 1. Push code to GitHub
```bash
git init
git add .
git commit -m "ShopVPS v1"
git remote add origin https://github.com/thanhtinz/shopvps.git
git push -u origin main
```

### 2. Create Vercel Project
- Go to https://vercel.com/new
- Select your GitHub repo
- Click "Import"
- Configure build settings (auto-detect)
- Click "Deploy"

### 3. Set Environment Variables
In Vercel dashboard:
- Go to Settings → Environment Variables
- Add all from `.env.example`:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
REDIS_URL=...
# ... etc
```

### 4. Setup Database (Supabase recommended)
```bash
# Go to https://supabase.com
# Create new project
# Copy DATABASE_URL to Vercel
# Run migrations:
npm run db:push
npm run db:seed
```

### 5. Setup Redis (Upstash recommended)
```bash
# Go to https://upstash.com
# Create Redis database
# Copy REDIS_URL to Vercel
```

### 6. Deploy Workers
Workers need to run as **separate service** (can't run on Vercel).

Options:
- **Railway** (easiest): Deploy workers on separate Railway service
- **Heroku**: `npm run workers`
- **EC2/VPS**: SSH + `npm run workers`
- **Digital Ocean App Platform**: Background worker

Example Railway:
```bash
# Create railway.json in project root
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run workers"
  }
}

# Push to GitHub, Railway auto-deploys
git push origin main
```

---

## 🐳 Docker (Self-hosted)

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Create docker-compose.yml
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/shopvps
      REDIS_URL: redis://redis:6379
      NEXTAUTH_URL: http://localhost:3000
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 10s
      timeout: 5s
      retries: 3

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: shopvps
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  workers:
    build: .
    command: npm run workers
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/shopvps
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
  redis_data:
```

### 3. Deploy
```bash
# Start all services
docker compose up -d

# Check logs
docker compose logs -f

# Stop
docker compose down
```

Access: http://localhost:3000

---

## 🚂 Railway (Easiest self-hosted)

### 1. Connect GitHub
- Go to https://railway.app
- Click "Create a new project"
- Select "Deploy from GitHub repo"
- Authorize & select shopvps repo

### 2. Add Services
Railway will auto-detect Next.js app. Add:
- **PostgreSQL**: Add from Railway Marketplace
- **Redis**: Add from Railway Marketplace
- **Workers**: Create separate service with `npm run workers`

### 3. Environment Variables
For each service, set vars in Railway dashboard.

For **Web**:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
NEXTAUTH_URL=https://yourdomain.com
# ... rest
```

For **Workers**:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
# ... rest
```

### 4. Deploy
- Push to `main` branch
- Railway auto-deploys
- Check logs in dashboard

---

## ☁️ AWS (Advanced)

### Architecture
```
CloudFront (CDN) → ALB → ECS (Next.js app)
                       → ECS (Workers)
                       → RDS (PostgreSQL)
                       → ElastiCache (Redis)
                       → S3 (Backups)
```

### Services
1. **RDS PostgreSQL** — Managed database
2. **ElastiCache Redis** — Managed cache
3. **ECS Fargate** — Serverless containers (Next.js + Workers)
4. **ALB** — Load balancer
5. **CloudFront** — CDN
6. **Route53** — DNS
7. **ACM** — SSL certificate

### Deployment (CloudFormation)
See AWS docs for IaC template.

---

## 📱 Fly.io

### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Create app.toml
```toml
app = "shopvps"
primary_region = "sin"  # Singapore

[build]
  image = "node:18-alpine"

[deploy]
  release_command = "npm run db:push && npm run db:seed"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [services.concurrency]
    hard_limit = 100
    soft_limit = 80
```

### 3. Deploy
```bash
fly launch
fly secrets set DATABASE_URL=...
fly secrets set REDIS_URL=...
fly deploy
```

---

## 🔒 Production Checklist

- [ ] **HTTPS/SSL** — Get certificate (free from Let's Encrypt)
- [ ] **Domain** — Point DNS to Vercel/Railway/Fly
- [ ] **Environment Variables** — All set securely
- [ ] **Database Backups** — Daily backups automated
- [ ] **Redis Persistence** — Enabled (`appendonly yes`)
- [ ] **Monitoring** — Setup error tracking (Sentry)
- [ ] **Logging** — Send logs to ELK/Datadog
- [ ] **Rate Limiting** — Configure in nginx/CDN
- [ ] **CORS** — Restrict origins
- [ ] **WAF** — CloudFlare or AWS WAF
- [ ] **Email** — Use SendGrid/SES for production SMTP
- [ ] **Webhooks** — Test SePay webhook integration
- [ ] **Workers** — Running in separate service
- [ ] **Database** — Connection pool configured
- [ ] **CDN** — Static assets cached
- [ ] **Health Checks** — `/api/health` endpoint
- [ ] **Load Testing** — k6 or Apache Bench
- [ ] **Scaling** — Auto-scaling configured
- [ ] **Failover** — High availability setup

---

## 🐛 Troubleshooting

### App crashes on deploy
```bash
# Check logs
npm run build          # Does it build locally?
npm start              # Does it start?
# If no, fix errors before deploying
```

### Database connection fails
```bash
# Check DATABASE_URL format
# postgresql://user:pass@host:port/dbname
# Test connection:
psql $DATABASE_URL -c "SELECT 1"
```

### Workers not running
```bash
# Check REDIS_URL
redis-cli -u $REDIS_URL ping
# Should return PONG

# Check worker logs
docker compose logs workers
# or Railway/Fly logs
```

### Payment webhook fails
```bash
# Check NEXTAUTH_URL is public
curl https://yourdomain.com/api/auth/callback/credentials
# Should not 404

# SePay must reach your domain
# Test webhook from SePay dashboard
```

### Email not sending
```bash
# Check SMTP vars
# Test SMTP connection:
node -e "require('nodemailer').createTransport('$SMTP_URL').verify(console.log)"

# Check spam folder
```

---

## 📊 Monitoring & Alerts

### Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
# Add SENTRY_AUTH_TOKEN to .env
# Errors auto-reported to Sentry dashboard
```

### Uptime Robot
- Monitor https://yourdomain.com/api/health
- Get alerts if down

### Database Monitoring
- PostgreSQL slow query logs
- Query planner analysis

### Redis Monitoring
- Memory usage
- Connected clients
- Operations/sec

---

## 🔄 CI/CD

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run type-check
      - run: npm run build
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: git push https://git.heroku.com/shopvps.git main
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

---

## 🎯 Next Steps After Deploy

1. **Create admin account** — go to `/setup`
2. **Add VPS providers** — add API keys in admin
3. **Configure WHM servers** — if using cPanel hosting
4. **Setup payment webhook** — SePay integration
5. **Send test email** — verify SMTP
6. **Monitor logs** — first week after launch
7. **Gradual rollout** — test with small user group first

---

**Happy deployments! 🚀**
