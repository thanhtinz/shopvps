# Deploy lên Railway với Neon Postgres

Hướng dẫn deploy ShopVPS lên [Railway](https://railway.app) dùng [Neon](https://neon.tech) làm cơ sở dữ liệu PostgreSQL.

## 1. Tạo database trên Neon
1. Tạo project tại [neon.tech](https://neon.tech) → một database `neondb`.
2. Vào **Connection Details**, lấy 2 chuỗi (bật `sslmode=require`):
   - **Pooled connection** (host có `-pooler`) → dùng cho `DATABASE_URL`.
   - **Direct connection** (không `-pooler`) → dùng cho `DIRECT_URL`.

Prisma dùng `DATABASE_URL` (pooled) lúc chạy app và `DIRECT_URL` (direct) khi
`prisma db push` — đã khai báo sẵn trong `prisma/schema.prisma`.

## 2. Tạo service trên Railway
1. **New Project → Deploy from GitHub repo**, chọn repo này.
2. Railway tự nhận `railway.json` + `nixpacks.toml`:
   - Build: `npm run build` (`prisma generate` chạy qua `postinstall`).
   - Pre-deploy: `prisma db push` (đồng bộ schema lên Neon).
   - Start: `node server.js` (custom server Next.js + Socket.IO).
   - Healthcheck: `/`.
3. Thêm **Redis** cho hàng đợi: trong project bấm **New → Database → Add Redis**
   (BullMQ cần Redis để cấp phát VPS/Hosting, email, billing).

## 3. Biến môi trường (Service → Variables)
Bắt buộc:

| Biến | Giá trị |
|------|---------|
| `DATABASE_URL` | chuỗi **pooled** của Neon (`...-pooler...?sslmode=require`) |
| `DIRECT_URL` | chuỗi **direct** của Neon (`...?sslmode=require`) |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` (tham chiếu service Redis của Railway) |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | cùng một giá trị `openssl rand -base64 32` |
| `NEXTAUTH_URL` / `AUTH_URL` | domain công khai của service (vd `https://xxx.up.railway.app`) |
| `NEXT_PUBLIC_APP_URL` | cùng domain công khai |
| `ENCRYPTION_KEY` | chuỗi 32 ký tự (mã hoá mật khẩu/credential trong DB) |

Tuỳ chọn: `GOOGLE_CLIENT_ID/SECRET`, `SMTP_*`, `SEPAY_*`, `RECAPTCHA_*`,
`acme_*` (cấu hình trong Admin → Settings sau khi deploy). Xem `.env.example`.

`PORT` do Railway tự cấp — `server.js` đã đọc `process.env.PORT`.

## 4. Worker (tuỳ chọn nhưng nên có)
Hàng đợi (cấp phát, email, gia hạn, billing) chạy ở tiến trình riêng. Tạo thêm
**một service nữa từ cùng repo** với:
- Start Command: `npm run workers`
- Dùng chung `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` và các biến liên quan.

Nếu không chạy worker, đơn VPS/Hosting sẽ nằm ở trạng thái chờ (không tự cấp phát).

## 5. Sau khi deploy
- Truy cập domain → trang `/setup` để khởi tạo (nếu license/cài đặt yêu cầu).
- Vào **Admin → Cài đặt** điền branding, cổng thanh toán, panel game, registrar…
- Tạo vài gói VPS/Hosting để trang chủ hiện bảng giá thật.

> Đổi schema sau này: chỉ cần push code mới — bước **pre-deploy** tự chạy
> `prisma db push` lên Neon. Muốn kiểm soát chặt hơn thì chuyển sang
> `prisma migrate` (tạo thư mục `prisma/migrations`).
