# OX Arena — Tic-Tac-Toe Web App

Next.js web application สำหรับเล่น Tic-Tac-Toe กับ Bot 3 ระดับ (Easy / Normal / Hard) พร้อม Google Login, Score แยกตามระดับ, Leaderboard และ Admin Dashboard

## Tech Stack

- Next.js (App Router) + JavaScript
- Tailwind CSS
- Auth.js (Google OAuth 2.0 / OIDC)
- Prisma + SQLite
- Vitest + Playwright

## Setup

### 1. ติดตั้ง dependencies

ใช้ **npm หรือ yarn ก็ได้** — แต่เลือกอย่างเดียวต่อเครื่อง (อย่ามีทั้ง `package-lock.json` และ `yarn.lock` พร้อมกัน)

**npm**
```bash
# ถ้าเคยใช้ yarn มาก่อน ให้ลบ yarn.lock ก่อน
rm yarn.lock   # Windows: del yarn.lock
npm install
```

**yarn**
```bash
# ถ้าเคยใช้ npm มาก่อน ให้ลบ package-lock.json ก่อน
rm package-lock.json   # Windows: del package-lock.json
yarn
```

> Scripts ใช้ `node scripts/run.mjs` ตั้ง `DATABASE_URL` ข้าม Windows/macOS/Linux — ใช้ได้ทั้ง `npm run …` และ `yarn …`

### 2. สร้างไฟล์ `.env`

คัดลอกจาก `.env.example`:

```bash
cp .env.example .env
```

### 3. ตั้งค่า Google OAuth

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ (หรือเลือกที่มีอยู่)
3. เปิดใช้งาน **Google Auth Platform / OAuth consent screen**
4. สร้าง **OAuth 2.0 Client ID** แบบ Web application
5. กำหนด Authorized JavaScript origins เช่น:
   - `http://localhost:3000`
6. กำหนด Authorized redirect URIs เช่น:
   - `http://localhost:3000/api/auth/callback/google`
7. นำ Client ID / Client Secret ใส่ใน `.env`:

```env
AUTH_GOOGLE_ID="your-client-id"
AUTH_GOOGLE_SECRET="your-client-secret"
```

8. สร้าง `AUTH_SECRET` (เลือกอย่างใดอย่างหนึ่ง):

**macOS / Linux**
```bash
openssl rand -base64 32
```

**Windows PowerShell** (ไม่มี openssl)
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Node.js** (ใช้ได้ทุก OS ถ้ามี Node อยู่แล้ว)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

นำค่าที่ได้ไปใส่ใน `.env`:
```env
AUTH_SECRET="ค่าที่ได้จากคำสั่ง"
```

9. กำหนด Admin email:

```env
ADMIN_EMAIL="your-admin@gmail.com"
```

ผู้ใช้ที่ Login ด้วย email ตรงกับ `ADMIN_EMAIL` จะได้ role `ADMIN` อัตโนมัติ

### 4. สร้าง Database

```bash
npm run db:migrate
# หรือ
yarn db:migrate
```

### 5. รันแอป

```bash
npm run dev
# หรือ
yarn dev
```

เปิด [http://localhost:3000](http://localhost:3000)

> หมายเหตุ: โปรเจกต์นี้ใช้ SQLite (`DATABASE_URL=file:./dev.db`)

## Scripts

| Command (npm / yarn) | Description |
| --- | --- |
| `npm run dev` / `yarn dev` | รัน development server |
| `npm run build` / `yarn build` | build production |
| `npm run start` / `yarn start` | รัน production server |
| `npm test` / `yarn test` | unit tests (Vitest) |
| `npm run playwright:install` / `yarn playwright:install` | ดาวน์โหลด Chromium สำหรับ e2e (รันครั้งแรกครั้งเดียว) |
| `npm run test:e2e` / `yarn test:e2e` | e2e tests (Playwright) |
| `npm run db:migrate` / `yarn db:migrate` | Prisma migrate |

> ก่อนรัน `test:e2e` ครั้งแรก ให้ติดตั้ง browser ก่อน:
> ```bash
> yarn playwright:install
> # หรือ
> yarn playwright install chromium
> ```

## Features

- Login ด้วย Google ก่อนเล่น
- ผู้เล่น vs Bot 3 ระดับ: Easy (สุ่ม) / Normal (Minimax) / Hard (มีโอกาสชนะจะชนะก่อน ไม่ป้องกัน)
- คะแนนแยกตามระดับ (UserStat): ชนะ +1 / แพ้ -1 / เสมอ 0
- ชนะติดกัน 3 ครั้ง: Bonus +1 แล้วรีเซ็ต Streak
- Game History, Leaderboard, Admin Dashboard (กรองตามระดับได้)
- Server เป็นคนตัดสินคะแนน (Client ส่งแค่ตำแหน่งเดิน)
- ไม่เก็บรูปโปรไฟล์จาก Google (แสดงชื่อเท่านั้น; Leaderboard mask ชื่อผู้เล่นอื่น)

## Pages

| Path | Description |
| --- | --- |
| `/` | Landing (OX Arena) |
| `/login` | Login ด้วย Google |
| `/dashboard` | Home — สถิติตามระดับ + เลือกระดับก่อนเริ่มเล่น |
| `/game` | เล่นเกม OX กับ Bot ตามระดับ |
| `/leaderboard` | อันดับตามระดับ |
| `/profile` | โปรไฟล์ + ประวัติตามระดับ |
| `/admin` | Admin — ดูสถิติ /ประวัติตามระดับ / Filter + Sort ข้อมูลได้ |

## Security Notes

- Admin ตรวจจาก `ADMIN_EMAIL` ฝั่ง server เท่านั้น
- Score คำนวณใน API `/api/game/move` ภายใน transaction ต่อระดับ
- Leaderboard แสดงชื่อเต็มเฉพาะผู้ใช้ปัจจุบัน ผู้เล่นอื่นถูก mask
