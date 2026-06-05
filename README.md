# ShopVPS — Full-Stack VPS & Hosting Management Platform

**Platform quản lý VPS, Hosting, và thanh toán tự động dành riêng cho thị trường Việt Nam.**

![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?logo=typescript)
![Next.js 14](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs)
![Prisma](https://img.shields.io/badge/Prisma-ORM-0C344B)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis)

---

## 🚀 Features

### Core
- ✓ **VPS Management** — Vultr, Hetzner, DigitalOcean, Linode, OVH, UpCloud từ một nơi
- ✓ **Hosting & cPanel** — Tích hợp WHM API, SSO, auto account creation
- ✓ **Automatic Provisioning** — BullMQ workers + webhook integration
- ✓ **Vietnamese Payment** — SePay/VietQR, auto deposit, invoice system
- ✓ **Team & Permissions** — 9 granular permission levels per resource
- ✓ **Affiliate System** — Auto commission tracking, withdraw to wallet
- ✓ **License Protection** — Hardware fingerprint, grace period, setup wizard

### Security
- ✓ NextAuth.js v5 (OAuth + 2FA TOTP)
- ✓ AES-256 encryption for sensitive data
- ✓ Bcrypt password hashing
- ✓ CSRF protection, rate limiting
- ✓ Activity logging for audit trail

### Admin Panel
- ✓ User management + balance adjustment
- ✓ VPS/Hosting packages CRUD
- ✓ WHM server management + test connection
- ✓ Coupon system (percentage/fixed, expiry, usage limit)
- ✓ Transaction & invoice tracking
- ✓ Email marketing (bulk send via BullMQ)
- ✓ API keys for integrations
- ✓ Activity log + status page

---

## 📊 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes, Node.js/Express (workers) |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Cache/Queue** | Redis 7, BullMQ (email, VPS provision, auto-renew) |
| **Auth** | NextAuth.js v5, JWT, TOTP 2FA |
| **Payment** | SePay (VietQR webhook), Stripe integration ready |
| **VPS APIs** | Vultr, Hetzner Cloud, DigitalOcean, Linode, OVH, UpCloud |
| **Hosting** | WHM/cPanel SSO integration |
| **Deployment** | Vercel-ready, Docker support |

---

## 📈 Project Stats

```
Pages:        31
API Routes:   62
Components:   5
Workers:      5
Lib Files:    26
Total Files:  139
TypeScript:   0 errors
```

---

## 🏃 Quick Start

### Prerequisites
```bash
Node.js 18+
PostgreSQL 14+
Redis 6+
```

### 1. Setup Environment
```bash
cd shopvps
cp .env.example .env
```

Fill in `.env`:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shopvps"

# Auth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"

# VPS Providers
VULTR_API_KEY="your_vultr_key"
HETZNER_API_KEY="your_hetzner_key"
# ... add others

# Payment
SEPAY_API_KEY="your_sepay_key"
SEPAY_WEBHOOK_SECRET="your_webhook_secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="your_app_password"

# Redis
REDIS_URL="redis://localhost:6379"
```

### 2. Initialize Database
```bash
npm install
npm run db:push      # Create schema
npm run db:seed      # Seed admin user + data
```

### 3. Start Services
```bash
# Terminal 1: Next.js app
npm run dev           # localhost:3000

# Terminal 2: BullMQ workers (separate process)
npm run workers

# Terminal 3: Monitor Redis (optional)
redis-cli monitor
```

### 4. First Login
- Email: `admin@shopvps.local`
- Password: `Admin@123456`
- Go to `/setup` for license setup wizard

---

## 📂 Project Structure

```
shopvps/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── (auth)/                   # Auth pages (login, register, forgot-password)
│   │   ├── (dashboard)/              # User dashboard (VPS, hosting, wallet, etc)
│   │   ├── (admin)/                  # Admin panel
│   │   ├── api/                      # API routes (62 routes)
│   │   │   ├── admin/                # Admin CRUD APIs
│   │   │   ├── vps/                  # VPS order, list, provision
│   │   │   ├── hosting/              # Hosting order, cPanel SSO
│   │   │   ├── wallet/               # Deposit, coupon, affiliate
│   │   │   ├── auth/                 # NextAuth handlers
│   │   │   ├── tickets/              # Support tickets
│   │   │   ├── team/                 # Team management
│   │   │   ├── notifications/        # User notifications
│   │   │   └── webhook/              # SePay payment webhooks
│   │   ├── page.tsx                  # Landing page
│   │   ├── status/                   # Public status page
│   │   ├── setup/                    # License setup wizard
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── layout/                   # Sidebar, Header, AdminSidebar
│   │   ├── ui/                       # Badge, StatCard, Icon system
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth v5 config
│   │   ├── prisma.ts                 # Prisma singleton
│   │   ├── encrypt.ts                # AES-256 encryption
│   │   ├── email.ts                  # SMTP client
│   │   ├── utils.ts                  # Helpers
│   │   ├── vps-providers/            # Vultr, Hetzner, DO, etc
│   │   ├── whm/                      # WHM/cPanel API integration
│   │   ├── license/                  # License verification system
│   │   └── workers/                  # BullMQ job definitions
│   ├── workers.ts                    # Worker entry point
│   ├── instrumentation.ts            # Server startup hooks
│   └── middleware.ts                 # License check middleware
├── prisma/
│   ├── schema.prisma                 # 30+ models
│   └── seed.ts                       # Initial data
├── public/                           # Static assets
├── .env.example                      # Environment template
├── next.config.ts                    # Next.js config
├── tsconfig.json                     # TypeScript config
└── package.json
```

---

## 🔑 API Endpoints Overview

### Auth
```
POST   /api/auth/[...nextauth]         NextAuth handlers
POST   /api/auth/register              User registration
POST   /api/auth/forgot-password       Reset password request
POST   /api/auth/reset-password        Reset password confirmation
POST   /api/auth/verify-email          Email verification
```

### User Dashboard
```
GET    /api/vps/list                   List user's VPS
POST   /api/vps/order                  Buy new VPS
GET    /api/vps/[id]/logs              VPS action logs
GET    /api/vps/[id]/password          Get root password
POST   /api/vps/[id]/action            Power/restart/rebuild
POST   /api/hosting/order              Buy hosting
GET    /api/hosting/[id]/cpanel-sso    Get cPanel SSO link
GET    /api/wallet/balance             Wallet balance
POST   /api/wallet/deposit-info        Get QRCODE for deposit
GET    /api/notifications              User notifications
POST   /api/notifications/[id]/read    Mark as read
GET    /api/team                       Team members
POST   /api/team/invite                Invite team member
GET    /api/tickets                    Support tickets
POST   /api/tickets/[id]/messages      Add ticket message
GET    /api/invoices                   User invoices
GET    /api/invoices/[id]              Invoice detail
GET    /api/invoices/pdf               Print invoice
POST   /api/user/profile               Update profile
POST   /api/user/password              Change password
POST   /api/user/2fa                   Setup 2FA TOTP
POST   /api/affiliate                  Affiliate dashboard
```

### Admin Panel
```
GET    /api/admin/stats                Dashboard stats
GET    /api/admin/users                List users (searchable)
PATCH  /api/admin/users/[id]           Update user balance/status
GET    /api/admin/orders               VPS/Hosting orders
GET    /api/admin/transactions         Payment transactions
GET    /api/admin/vps-packages         VPS package CRUD
POST   /api/admin/vps-packages
PATCH  /api/admin/vps-packages/[id]
DELETE /api/admin/vps-packages/[id]
GET    /api/admin/hosting-packages     Hosting package CRUD
POST   /api/admin/hosting-packages
GET    /api/admin/servers              WHM server CRUD
POST   /api/admin/servers
POST   /api/admin/servers/[id]         Test WHM connection
GET    /api/admin/providers            VPS provider CRUD
POST   /api/admin/providers
GET    /api/admin/coupons              Coupon CRUD
POST   /api/admin/coupons
GET    /api/admin/settings             App settings
POST   /api/admin/settings
GET    /api/admin/activity-log         Audit trail
POST   /api/admin/email-marketing      Bulk email
GET    /api/admin/api-keys             API key CRUD
POST   /api/admin/api-keys
DELETE /api/admin/api-keys/[id]
```

### Webhooks
```
POST   /api/webhook/sepay              SePay payment webhook
POST   /api/setup/verify-key           License verification
POST   /api/setup/complete             License setup completion
```

---

## 🔒 License System

ShopVPS includes a **hardware-fingerprint-based licensing system**:

1. **Fingerprint** = SHA-256(CPU model + MAC address + platform)
2. **Verification** = built-in check (1h cache + 24h grace)
3. **Setup Wizard** = `/setup` page for first-time license key entry
4. **Middleware** = Checks license status on every request

Cookie states: `NOT_SETUP`, `VALID`, `GRACE`, `INVALID`

See `src/lib/license/` for implementation details.

---

## 🎯 Deployment

### Vercel (Recommended)
```bash
git push origin main
# Auto-deploys on Vercel
```

### Self-hosted
```bash
# Docker
docker compose up

# Or manual
npm run build
npm start

# Run workers separately
npm run workers
```

### Environment Variables (Production)
Use secure vaults (Vercel Secrets, AWS Secrets Manager, etc.)

---

## 📝 Database Schema Highlights

30+ models including:
- `User` — authentication, balance, affiliates
- `VpsOrder`, `HostingOrder` — service orders
- `VpsPackage`, `HostingPackage` — pricing
- `VpsProvider`, `HostingServer` — infrastructure
- `Transaction` — payment history
- `Invoice`, `InvoiceItem` — billing
- `Ticket`, `TicketMessage` — support
- `Team`, `TeamMember`, `Permission` — collaboration
- `Coupon` — discount codes
- `Notification` — user alerts
- `ActivityLog` — audit trail
- `ApiKey` — integrations
- `AppSetup` — license storage
- And more...

Full schema: `prisma/schema.prisma`

---

## 🔧 Workers (BullMQ)

Background jobs run asynchronously:

### Email Worker
- Sends transactional + marketing emails
- Retry 3x with exponential backoff
- Concurrency: 5

### VPS Provisioning Worker
- Creates VPS via provider APIs
- Updates order status
- Sends notifications
- Creates activity log
- Retries on failure

### Auto-Renew Worker
- Deducts from wallet on renewal date
- Updates expiry
- Notifies user if insufficient balance
- Suspends if unpaid

---

## 🧪 Testing

```bash
# TypeScript check
npm run type-check

# Build check
npm run build

# (Add Jest/Vitest setup as needed)
```

---

## 📦 Dependencies (Key)

- **next**: 14.x - Framework
- **react**: 18.x - UI library
- **prisma**: 5.x - ORM
- **next-auth**: 5.x (beta) - Authentication
- **bullmq**: 5.x - Job queue
- **ioredis**: 5.x - Redis client
- **bcryptjs**: 2.x - Password hashing
- **crypto**: Node.js built-in - AES encryption
- **axios**: 1.x - HTTP client
- **nodemailer**: 6.x - Email

---

## 📧 Support

For setup help, contact the project maintainer.

---

## 📄 License

Proprietary — ShopVPS Platform

---

**Built with ❤️ for Vietnamese VPS market**

Happy hosting! 🚀
