# ShopVPS — Architecture & Technical Deep Dive

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Users                            │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────▼─────────┐
    │  Next.js Frontend │  (React 18, Tailwind CSS)
    │  (pages, api)     │
    └────────┬──────────┘
             │
    ┌────────▼──────────────────────────────┐
    │    Next.js API Routes (62 routes)      │
    │  ┌──────────────────────────────────┐  │
    │  │ • Auth (NextAuth v5 + 2FA TOTP)  │  │
    │  │ • VPS/Hosting CRUD               │  │
    │  │ • Wallet & Payment Processing    │  │
    │  │ • Team & Permissions             │  │
    │  │ • Admin Panel APIs               │  │
    │  │ • Webhook Handlers               │  │
    │  └──────────────────────────────────┘  │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼────────────────────┐
    │   PostgreSQL Database        │ (30+ models)
    │  ┌────────────────────────┐  │
    │  │ Users, Orders, Invoices│  │
    │  │ VPS, Hosting, Teams    │  │
    │  │ Transactions, Activity │  │
    │  │ License, Settings      │  │
    │  └────────────────────────┘  │
    └─────────────────────────────┘
             │
    ┌────────▼──────────────┐
    │  Redis Cache/Queue    │
    │  ┌────────────────┐   │
    │  │ BullMQ Queues  │   │
    │  │ • Email        │   │
    │  │ • VPS Provision│   │
    │  │ • Auto-Renew   │   │
    │  └────────────────┘   │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────────────────┐
    │   BullMQ Workers (separate svc)    │
    │  ┌────────────────────────────────│
    │  │ • Email Worker                  │
    │  │ • VPS Provisioning Worker       │
    │  │ • Auto-Renew Worker             │
    │  └────────────────────────────────┘
    └────────┬──────────────────────────┘
             │
    ┌────────▼────────────────────────────┐
    │    External Integrations             │
    │  ┌──────────────────────────────────│
    │  │ • VPS Providers (Vultr, Hetzner, │
    │  │   DO, Linode, OVH, UpCloud)     │
    │  │ • WHM/cPanel (Hosting)           │
    │  │ • SePay (VietQR Payments)        │
    │  │ • SMTP (Email Delivery)          │
    │  └──────────────────────────────────│
    └──────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
User Input (email + password)
          │
          ▼
    NextAuth Callback
          │
    ┌─────▼─────┐
    │ Credential │
    │ Provider   │
    └─────┬─────┘
          │
    ┌─────▼──────────────┐
    │ Bcrypt Password    │
    │ Verification       │
    └─────┬──────────────┘
          │
    ┌─────▼──────────┐
    │ 2FA TOTP Check │
    │ (if enabled)   │
    └─────┬──────────┘
          │
    ┌─────▼────────────┐
    │ Generate JWT     │
    │ Session Cookie   │
    └─────┬────────────┘
          │
          ▼
    Authenticated ✓
```

### Session Management
- **JWT in cookie** (httpOnly, secure, sameSite=strict)
- **Session expiry**: 30 days (configurable)
- **CSRF protection**: Auto via NextAuth
- **2FA**: TOTP via authenticator app

---

## 💾 Database Design

### Core Models

**User**
- id, email, passwordHash, name
- balance, affiliateBalance
- role (USER, ADMIN, SUPER_ADMIN)
- affiliateCode, status
- 2FA settings

**VpsOrder**
- id, userId, packageId, providerId
- hostname, os, status
- price, billingCycle, expiresAt
- autoRenew flag
- rootPassword (encrypted)
- providerVpsId, ipAddress

**HostingOrder**
- id, userId, packageId, serverId
- domain, cpanelUsername, cpanelPassword
- status, price, expiresAt
- autoRenew flag

**VpsProvider**
- id, name, slug
- apiKey (encrypted), apiEndpoint
- isActive

**HostingServer**
- id, name, hostname
- whmHost, whmPort, whmUser
- whmToken (encrypted)
- maxAccounts, activeAccounts

**Coupon**
- id, code, type (PERCENTAGE, FIXED)
- value, maxDiscount, minOrder
- expiresAt, usageLimit, usedCount

**Invoice**
- id, invoiceNumber, userId
- subtotal, discount, total
- status (DRAFT, PAID, PENDING, CANCELLED)
- paidAt, dueDate

**Transaction**
- id, userId, type (PURCHASE, DEPOSIT, COMMISSION, REFUND)
- amount, balanceBefore, balanceAfter
- description, reference
- status, createdAt

**Team**
- id, ownerId
- members: TeamMember[]
- permissions: Permission[] (9 levels)

**Notification**
- id, userId, type (VPS, HOSTING, PAYMENT, SUPPORT)
- title, content, isRead
- relatedResource, createdAt

**ActivityLog**
- id, userId, action, resource, resourceId
- metadata (JSON), ipAddress, timestamp

**AppSetup** (License)
- id (singleton), licenseKey, domain
- runtimeKey, hwFingerprint
- productId, version
- expiresAt, setupAt, lastVerifiedAt

---

## 🔄 Request/Response Cycle

### Authenticated Request
```
1. Browser sends request with session cookie
2. Middleware checks license status
3. NextAuth validates session
4. API route executes with auth context
5. Database transaction (if needed)
6. Response with data + cache headers
```

### Order Creation Flow
```
POST /api/vps/order
  ├─ Authenticate user
  ├─ Validate package exists
  ├─ Check user balance
  ├─ Begin transaction
  │   ├─ Deduct balance
  │   ├─ Create VpsOrder
  │   ├─ Create Invoice
  │   ├─ Create Transaction record
  │   ├─ Log activity
  │   └─ Commit
  ├─ Queue VPS provision job
  ├─ Schedule auto-renew job
  └─ Return order ID
```

### Background Job Flow
```
VPS Provision Job
  ├─ Fetch order + provider config
  ├─ Decrypt API credentials
  ├─ Call provider API (Vultr, etc)
  ├─ Generate root password
  ├─ Update order status → ACTIVE
  ├─ Store encrypted password
  ├─ Create notification
  ├─ Log action
  └─ Retry 3x on failure
```

---

## 🔐 Security Layers

### Data Protection
- **Passwords**: bcrypt (cost 12)
- **API Keys**: AES-256-CBC encrypted at rest
- **Root Passwords**: AES-256-CBC encrypted
- **Sensitive tokens**: Encrypted + short-lived

### Network Security
- **HTTPS/TLS**: Enforced via next.config.ts
- **CORS**: Origin validation in API routes
- **CSRF**: NextAuth session tokens
- **XSS Prevention**: React auto-escapes, CSP headers
- **Rate Limiting**: Implement via middleware (todo)

### Input Validation
- **Zod schemas** (todo - add to API routes)
- **Email validation**: RFC 5322
- **Hostname validation**: Regex pattern check
- **Domain validation**: TLD check

### Authorization
- **Role-based**: ADMIN vs USER
- **Permission-level**: 9 granular permissions per service
- **Resource ownership**: Users can only access their own data
- **Admin isolation**: Separate routes for admin APIs

---

## 📦 Caching Strategy

### Query Cache
- **User balance**: In-memory cache 5 min
- **VPS list**: Redis cache 10 min
- **Coupon validation**: Redis cache 1 hour
- **License status**: Memory cache 1 hour + 24h grace

### Invalidation
- On write operations (update, delete)
- Manual cache busts available
- TTL-based expiry

---

## 🎯 Performance Optimizations

### Frontend
- Image optimization via Next.js Image component
- Code splitting per route
- CSS-in-JS for critical styles (Tailwind)
- Minimal JSON payload (select specific fields)

### Backend
- Database indexes on frequently queried fields
- Connection pooling (Prisma)
- Pagination (20-50 items per page)
- Lazy loading of relations

### Infrastructure
- CDN for static assets
- Database read replicas (optional, RDS)
- Redis cluster for high availability
- Horizontal scaling via container orchestration

---

## 📊 Monitoring & Observability

### Logs
- **Application logs**: stdout/stderr
- **Database logs**: Slow query logs (> 100ms)
- **Redis logs**: Command profiling
- **Error tracking**: Sentry integration

### Metrics
- **API latency**: p50, p95, p99
- **Error rate**: 4xx, 5xx percentages
- **Database connections**: Pool utilization
- **Redis memory**: Used vs limit
- **Queue depth**: Pending jobs count
- **Worker health**: Job success/failure ratio

### Alerts
- Error rate > 5%
- API latency p95 > 1000ms
- Database CPU > 80%
- Redis memory > 90%
- Queue depth > 1000 jobs
- Worker failure rate > 10%

---

## 🔄 Deployment Architecture

### Development
```
localhost:3000 (Next.js dev)
+ localhost:6379 (Redis)
+ localhost:5432 (PostgreSQL)
```

### Staging
```
Vercel Preview Deployment
+ Cloud Database (Supabase)
+ Managed Redis (Upstash)
```

### Production
```
┌─ Vercel Edge Functions (Next.js Frontend)
├─ Railway/Fly Workers Service (BullMQ)
├─ Managed PostgreSQL (Supabase, RDS, etc)
├─ Managed Redis (Upstash, ElastiCache)
└─ CDN + WAF (Cloudflare)
```

---

## 🚀 Scalability

### Horizontal Scaling
- **Web**: Vercel auto-scales, or K8s replicas
- **Workers**: Multiple worker instances
- **Database**: Read replicas + connection pooling
- **Cache**: Redis cluster

### Bottlenecks to Watch
1. Database connections
2. Redis memory
3. API rate limits from VPS providers
4. Email SMTP rate limits

### Solutions
- Database connection pooling (PgBouncer)
- Redis cluster mode
- Implement local request caching
- Batch email sending

---

## 🛠️ Tech Decisions

### Why Next.js?
- Full-stack framework (frontend + API)
- Fast, built-in optimization
- Easy deployment to Vercel
- TypeScript first-class support

### Why Prisma?
- Type-safe ORM
- Migration management
- Prisma Studio for data inspection
- Excellent TypeScript integration

### Why BullMQ + Redis?
- Fast, reliable job queue
- Persistence + retry logic
- Built for high concurrency
- Minimal operational overhead

### Why NextAuth v5?
- Modern auth library
- JWT + session strategies
- Easy provider integration
- Active maintenance

---

## 📖 Further Reading

- Prisma Docs: https://www.prisma.io/docs/
- NextAuth.js: https://next-auth.js.org/
- BullMQ: https://docs.bullmq.io/
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs/

