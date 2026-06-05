# ShopVPS — Quick Start Guide

Từ 0 đến chạy được trong 10 phút.

---

## 1️⃣ Prerequisites

```bash
# Check versions
node --version          # v18+ required
npm --version           # v9+
psql --version          # PostgreSQL 14+
redis-cli --version     # Redis 6+
```

---

## 2️⃣ Clone & Setup

```bash
# Extract shopvps-no-emoji.zip
unzip shopvps-no-emoji.zip
cd shopvps

# Create environment file
cp .env.example .env

# Open .env and fill in (minimal):
# DATABASE_URL="postgresql://postgres:password@localhost/shopvps"
# NEXTAUTH_SECRET=$(openssl rand -base64 32)
# NEXTAUTH_URL="http://localhost:3000"
```

---

## 3️⃣ Install & Database

```bash
npm install

# Create database
createdb shopvps

# Sync schema
npm run db:push

# Seed initial data (admin user + test data)
npm run db:seed
```

---

## 4️⃣ Start Services

Open **3 terminals**:

```bash
# Terminal 1: Next.js app (http://localhost:3000)
npm run dev

# Terminal 2: BullMQ workers
npm run workers

# Terminal 3: Redis (if not running as service)
redis-server
```

---

## 5️⃣ First Login

**Go to http://localhost:3000**

Login:
- Email: `admin@shopvps.local`
- Password: `Admin@123456`

You'll see setup wizard for license (can skip for local dev).

---

## 📂 What You Get

| Path | What |
|------|------|
| `/` | Landing page + features + pricing |
| `/dashboard` | User dashboard (stats, balance, quick actions) |
| `/vps` | VPS list + buy new VPS |
| `/hosting` | Hosting list |
| `/wallet` | Balance, deposit, affiliate earnings |
| `/settings` | Profile, password, 2FA setup |
| `/team` | Team members + permissions |
| `/tickets` | Support system |
| `/invoices` | Invoice history + PDF export |
| `/affiliate` | Affiliate dashboard |
| `/admin` | Admin stats |
| `/admin/users` | Manage users |
| `/admin/vps-packages` | VPS packages CRUD |
| `/admin/hosting-packages` | Hosting packages CRUD |
| `/admin/servers` | WHM server management |
| `/admin/providers` | VPS provider API keys |
| `/admin/coupons` | Discount codes |
| `/admin/orders` | All orders |
| `/admin/transactions` | Payment history |
| `/admin/activity-log` | Audit trail |
| `/admin/api-keys` | Integration keys |
| `/admin/email-marketing` | Bulk email |
| `/status` | Public status page |
| `/login`, `/register` | Auth pages |

---

## 🔑 Key Features to Try

### 1. User Flow
1. Register new account (`/register`)
2. Login
3. Go to `/wallet` → deposit money (VietQR simulated)
4. Go to `/vps/new` → buy VPS
5. Watch `/vps` → VPS provisioning progress
6. View invoice at `/invoices`

### 2. Admin Flow
1. Login as admin
2. `/admin/vps-packages` → create VPS package
3. `/admin/providers` → add VPS provider (need real API key to test)
4. `/admin/servers` → add WHM server (need real credentials)
5. `/admin/users` → adjust user balance
6. `/admin/email-marketing` → send bulk email
7. `/admin/activity-log` → see all user actions

### 3. Features
- **2FA Setup**: `/settings` → Security tab → QR code → scan → enter code
- **Team Invite**: `/team` → invite member → set permissions
- **Affiliate**: `/affiliate` → copy link → referrals
- **Tickets**: `/tickets` → create support ticket

---

## 🐛 Common Issues

### Database Error
```bash
# Check PostgreSQL running
psql -U postgres -c "SELECT 1"

# Reset database
dropdb shopvps
createdb shopvps
npm run db:push
npm run db:seed
```

### Redis Error
```bash
# Start Redis
redis-server

# Or use Docker
docker run -p 6379:6379 redis:latest
```

### Port 3000 Already In Use
```bash
npm run dev -- -p 3001
```

### .env Not Found
```bash
cp .env.example .env
# Then edit .env with your config
```

---

## 📦 Make a Build

```bash
npm run build
npm start
```

Check http://localhost:3000 — should work same as dev.

---

## 🚀 Ready to Deploy?

### Vercel
```bash
git init
git add .
git commit -m "ShopVPS"
git remote add origin https://github.com/thanhtinz/shopvps.git
git push -u origin main
# Auto-deploys on git push
```

### Docker
```bash
# Create Dockerfile (see template below)
docker build -t shopvps .
docker run -p 3000:3000 shopvps
```

---

## 📚 Learn More

- **Database**: `prisma/schema.prisma`
- **Auth Config**: `src/lib/auth.ts`
- **API Routes**: `src/app/api/`
- **License System**: `src/lib/license/`
- **WHM Integration**: `src/lib/whm/`
- **Workers**: `src/lib/workers/`

---

## 💡 Pro Tips

1. **Check logs**: Workers output to console — watch both terminals
2. **Reset data**: `npm run db:seed` anytime to reset
3. **Test emails**: Set `SMTP_*` vars in `.env` or use Mailtrap
4. **Debug queries**: Add `?log=query` to Prisma calls
5. **Inspect Redis**: `redis-cli KEYS "*"` to see queued jobs

---

## 📞 Next Steps

- [ ] Setup real PostgreSQL (cloud: Supabase, PlanetScale, RDS)
- [ ] Setup real Redis (cloud: Redis Cloud, upstash)
- [ ] Get VPS provider API keys (Vultr, Hetzner, etc)
- [ ] Setup WHM server credentials
- [ ] Configure SePay payment webhook
- [ ] Deploy to production (Vercel, Railway, Fly.io, etc)
- [ ] Setup custom domain + SSL

---

Happy building! 🎉
