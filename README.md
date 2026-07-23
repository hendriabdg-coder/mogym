# CutTrack

PWA berbahasa Indonesia untuk membantu pemula menjalankan program cutting secara terstruktur. CutTrack mencakup autentikasi, rekomendasi program, workout logger, progressive overload, pemantauan berat, evaluasi mingguan, notifikasi Web Push, checklist makanan, dan foto progres.

## Stack

- Backend: NestJS, TypeScript, Prisma, PostgreSQL, BullMQ, Redis, JWT, Web Push
- Frontend: Next.js 15 App Router, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, Recharts
- Infrastruktur: Docker, Docker Compose, Nginx
- Port lokal: API `3030`, PWA `3031`

## Persyaratan

- Node.js 20+
- npm 10+
- Docker Desktop dengan Docker Compose

## Menjalankan secara lokal

Salin template environment:

```powershell
Copy-Item .env.backend.example .env.backend
Copy-Item .env.frontend.example .env.frontend
```

Ganti JWT secret dengan dua nilai acak minimal 32 karakter. Kemudian jalankan:

```powershell
docker compose up --build
```

Migrasi dan seed pada penggunaan pertama:

```powershell
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

Buka:

- PWA: `http://localhost:3031`
- API health check: `http://localhost:3030/health`

Alternatif tanpa container aplikasi:

```powershell
npm install
docker compose up -d postgres redis
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Untuk cara ini, ubah host `DATABASE_URL` dan `REDIS_URL` menjadi `localhost`.

## Environment

Backend memakai `.env.backend`:

- `DATABASE_URL`, `REDIS_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_ORIGIN`, `APP_URL`
- kredensial Google/Apple
- VAPID public/private key dan email
- konfigurasi SMTP
- `UPLOAD_PATH`

Frontend memakai `.env.frontend`:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`

Jangan commit file environment asli.

## Membuat VAPID key

```powershell
npx web-push generate-vapid-keys
```

Masukkan public key pada environment backend dan frontend. Private key hanya boleh berada di backend.

## Database

Schema berada di `apps/backend/prisma/schema.prisma`. Migrasi awal production sudah tersedia di `apps/backend/prisma/migrations`.

Perintah penting:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

Seed bersifat idempotent dan berisi 62 latihan.

## Build dan test

```powershell
npm run build
npm test
```

Build juga melakukan pemeriksaan tipe frontend. Test backend saat ini mencakup recommendation engine dan prioritas status evaluasi mingguan.

## Deployment production

1. Salin dan isi environment:

```powershell
Copy-Item .env.backend.example .env.backend
Copy-Item .env.production.example .env
```

2. Pastikan `FRONTEND_ORIGIN` dan `APP_URL` memakai domain HTTPS production.
3. Jalankan:

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

Backend otomatis menjalankan `prisma migrate deploy` sebelum API dimulai. PostgreSQL, Redis, dan upload memakai named volume agar data bertahan ketika container diganti.

Untuk HTTPS, tempatkan load balancer/CDN atau reverse proxy TLS di depan port 80 Nginx. Web Push dan instalasi PWA di domain publik membutuhkan HTTPS.

## Penyimpanan foto

Default production menggunakan volume lokal Docker. Endpoint membatasi JPEG, PNG, atau WebP maksimal 5 MB. Untuk deployment multi-server, ganti adapter storage dengan S3-compatible storage agar semua instance berbagi file yang sama.

## Keamanan operasional

- Gunakan secret acak yang kuat dan rotasi secara berkala.
- Batasi akses PostgreSQL dan Redis ke jaringan internal.
- Backup volume database dan upload.
- Jalankan `npm audit` dan review breaking changes sebelum upgrade.
- Konfigurasikan SMTP serta OAuth hanya melalui secret manager.
- Jangan memakai kredensial contoh untuk production.

## Struktur

```text
apps/
  backend/     NestJS API, Prisma, queue, uploads
  frontend/    Next.js PWA
packages/
  shared/      shared Zod schemas dan types
nginx/         reverse proxy
docker-compose.yml
docker-compose.prod.yml
docker-compose.vps.yml
```

`docker-compose.vps.yml` dipakai pada VPS bersama yang port 80/443-nya sudah
ditangani reverse proxy eksternal. Stack ini bergabung ke network Docker
`coffeeshophub_internal` dan tidak mempublikasikan PostgreSQL atau Redis.

## Catatan provider eksternal

Login email/JWT, reset password, dan verifikasi token telah tersedia. Google OAuth, Sign in with Apple, serta pengiriman email nyata memerlukan kredensial provider valid sebelum dapat diuji end-to-end. Web Push memerlukan VAPID key dan izin browser pengguna.
