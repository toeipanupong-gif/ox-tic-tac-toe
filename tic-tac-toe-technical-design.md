# Tic-Tac-Toe Web Application — Technical Design

## 1. Project Overview

Web Application สำหรับเกม OX (Tic-Tac-Toe) โดยมีผู้เล่น vs Bot และผู้เล่นต้อง Login ผ่าน Google ก่อนเริ่มเล่น

### Requirements

- Login ก่อนเริ่มเล่นเกม
- Authentication ผ่าน Google OAuth 2.0 / OpenID Connect (OIDC)
- ผู้เล่น vs Bot
- กติกา Tic-Tac-Toe มาตรฐาน
- ระบบคะแนน
- ชนะ Bot: +1 คะแนน
- แพ้ Bot: -1 คะแนน
- เสมอ: 0 คะแนน
- ชนะติดต่อกัน 3 ครั้ง: ได้ Bonus +1 คะแนน และ Reset Win Streak
- มี Game History
- มี Leaderboard
- มี Admin Dashboard สำหรับตรวจสอบข้อมูลผู้เล่นและคะแนน
- Admin กำหนดจาก Email ผ่าน `ADMIN_EMAIL` ใน `.env`
- ใช้ SQLite เป็น Database
- ใช้ Prisma เป็น ORM
- ใช้ JavaScript แทน TypeScript
- ไม่ทำ Test Login / Mock Login สำหรับ Production flow
- OAuth Credentials จัดการผ่าน `.env` และอธิบายใน README

---

# 2. Technology Stack

| ส่วน | Technology |
|---|---|
| Frontend | Next.js |
| Language | JavaScript |
| UI | React + Tailwind CSS |
| Authentication | Auth.js |
| Authentication Protocol | Google OAuth 2.0 + OpenID Connect |
| Database | SQLite |
| ORM | Prisma |
| Game Algorithm | Minimax |
| Validation | Zod |
| Unit Testing | Vitest |
| E2E Testing | Playwright |

---

# 3. High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                  Next.js                     │
│                  JavaScript                  │
│                                              │
│  ┌─────────────┐      ┌──────────────────┐  │
│  │ Auth.js     │      │ React UI         │  │
│  │             │      │                  │  │
│  │ Google      │      │ Game             │  │
│  │ OAuth/OIDC  │      │ Leaderboard      │  │
│  └──────┬──────┘      │ Profile          │  │
│         │              │ Admin            │  │
│         │              └────────┬─────────┘  │
│         └───────────┬───────────┘            │
│                     ▼                        │
│              Server/API Layer                │
│                     │                        │
│          ┌──────────┴──────────┐             │
│          ▼                     ▼             │
│     Game Engine           Score Engine       │
│     Minimax               Business Logic     │
│          │                     │              │
│          └──────────┬──────────┘              │
│                     ▼                        │
│                   Prisma                     │
│                     │                        │
│                     ▼                        │
│                  SQLite                      │
└──────────────────────────────────────────────┘
```

---

# 4. Authentication

## 4.1 Google OAuth

ระบบใช้ Google เป็น Authentication Provider เพียงตัวเดียวใน Version แรก

Flow:

```text
User
  ↓
Click "Continue with Google"
  ↓
Google OAuth
  ↓
Google Login / Consent
  ↓
Auth.js Callback
  ↓
ตรวจสอบ Identity
  ↓
Create / Find User
  ↓
Create Session
  ↓
Dashboard
```

ระบบไม่เก็บ Password ของผู้ใช้

## 4.2 User Information

ข้อมูลหลักที่ต้องใช้จาก Google:

```text
id
name
email
image
emailVerified
```

ควรใช้ Email ที่ได้รับจาก Provider และตรวจสอบสถานะ Email Verification ตามข้อมูลที่ Provider ส่งมา

---

# 5. Admin Authorization

Admin จะกำหนดจาก Email ใน `.env`

ตัวอย่าง:

```env
ADMIN_EMAIL=admin@example.com
```

เมื่อผู้ใช้ Login ผ่าน Google:

```text
Google Login
     ↓
ได้รับ Email
     ↓
ตรวจสอบ Email
     ↓
email === ADMIN_EMAIL ?
     │
   ┌─┴─┐
  YES  NO
   │    │
 ADMIN USER
```

การตรวจสอบ Admin ต้องทำฝั่ง Server เท่านั้น

## 5.1 Admin Access

Admin สามารถเข้าถึง:

```text
/admin
```

ผู้ใช้ทั่วไปไม่สามารถเข้าถึง Admin Dashboard ได้

```text
USER
  ↓
/admin
  ↓
403 / Redirect


ADMIN
  ↓
/admin
  ↓
Admin Dashboard
```

## 5.2 Source of Truth

สำหรับ Project นี้:

> `ADMIN_EMAIL` ใน `.env` เป็นตัวกำหนดสิทธิ์ Admin

ไม่ควรให้ Client สามารถกำหนด Role เองได้

---

# 6. Database

ใช้:

> SQLite + Prisma

Architecture:

```text
Next.js
   ↓
Prisma
   ↓
SQLite
```

SQLite เหมาะสำหรับ Project ขนาดเล็กถึงกลางและ Development / Assignment

ไม่จำเป็นต้องติดตั้ง MySQL หรือ PostgreSQL Server

---

# 7. ORM และ Prisma

## ORM คืออะไร?

ORM (Object-Relational Mapping) เป็นตัวกลางระหว่าง Application กับ Database ทำให้สามารถจัดการ Database ผ่าน JavaScript Object / Function แทนการเขียน SQL โดยตรงทุกกรณี

## Prisma คืออะไร?

Prisma เป็น ORM สำหรับ Node.js / JavaScript / TypeScript

ตัวอย่าง:

```javascript
const users = await prisma.user.findMany({
  orderBy: {
    score: "desc"
  }
});
```

แทนการเขียน SQL เช่น:

```sql
SELECT *
FROM users
ORDER BY score DESC;
```

---

# 8. Database Schema

แนวคิดหลัก:

```text
User
│
├── id
├── name
├── email
├── image
├── role
│
├── score
├── wins
├── losses
├── draws
├── winStreak
│
├── createdAt
└── updatedAt
       │
       │
       ▼
      Game
       │
       ├── result
       ├── scoreChange
       ├── bonusScore
       ├── winStreak
       └── createdAt
```

Authentication ของ Auth.js + Prisma จะมี Model ที่เกี่ยวข้องกับ Authentication เพิ่ม เช่น Account และ Session ตาม Adapter ที่ใช้งาน

---

# 9. User Model

ข้อมูลที่ต้องการ:

```text
id
name
email
image
role

score
wins
losses
draws
winStreak

createdAt
updatedAt
```

Role:

```text
USER
ADMIN
```

ค่าเริ่มต้น:

```text
role = USER
score = 0
wins = 0
losses = 0
draws = 0
winStreak = 0
```

---

# 10. Game Model

เก็บประวัติการเล่นทุกเกม

ข้อมูลหลัก:

```text
id
userId
result
scoreChange
bonusScore
winStreak
createdAt
```

ตัวอย่าง:

```text
Game #001
Result: WIN
Score Change: +1
Bonus: 0
Win Streak: 1
```

เมื่อครบ 3 Win:

```text
Game #003
Result: WIN
Score Change: +1
Bonus: +1
Win Streak: 0
```

---

# 11. Game Rules

## Win

```text
WIN → +1 Score
```

และ:

```text
winStreak += 1
```

## Loss

```text
LOSS → -1 Score
```

และ:

```text
winStreak = 0
```

## Draw

```text
DRAW → 0 Score
```

และ:

```text
winStreak = 0
```

## 3 Consecutive Wins

ตัวอย่าง:

```text
WIN
WIN
WIN
```

จะได้:

```text
+1
+1
+1
+1 Bonus
```

รวม:

```text
+4
```

จากนั้น:

```text
winStreak = 0
```

ตัวอย่างต่อเนื่อง:

```text
WIN → streak 1
WIN → streak 2
WIN → streak 3 → Bonus +1 → reset
WIN → streak 1
```

---

# 12. Score Rules

| Result | Score | Win Streak |
|---|---:|---:|
| WIN | +1 | +1 |
| LOSS | -1 | Reset to 0 |
| DRAW | 0 | Reset to 0 |
| 3rd consecutive WIN | +1 + Bonus 1 | Reset to 0 |

หมายเหตุ:

- คะแนนสามารถติดลบได้ เพราะ Requirement ระบุว่าแพ้เสีย 1 คะแนน
- Bonus จะเกิดทุกครั้งที่ชนะครบ 3 ครั้งติดต่อกัน
- หลังได้รับ Bonus แล้ว Win Streak จะเริ่มนับใหม่

---

# 13. Game Engine

Game Logic ควรแยกออกจาก React UI

โครงสร้าง:

```text
src/lib/game/
├── game-engine.js
├── minimax.js
└── score.js
```

ตัวอย่าง Functions:

```text
checkWinner(board)
isDraw(board)
getAvailableMoves(board)
makeMove(board, position, player)
getBotMove(board)
calculateScore(result, score, streak)
```

ข้อดี:

- Unit Test ได้ง่าย
- ไม่ผูกกับ UI
- เปลี่ยน Bot Algorithm ได้ง่าย
- เปลี่ยน Score Rules ได้ง่าย

---

# 14. Bot

ใช้ Minimax Algorithm

ไม่จำเป็นต้องใช้ AI API หรือ LLM

Concept:

```text
Current Board
      ↓
Available Moves
      ↓
Minimax
      ↓
Evaluate Game States
      ↓
Select Best Move
```

สำหรับ Tic-Tac-Toe Minimax เหมาะสมเพราะจำนวน Game State มีขนาดเล็ก

---

# 15. Security: Server เป็นคนตัดสินคะแนน

Client ไม่ควรเป็นผู้กำหนด Score

ไม่ควรทำ:

```javascript
if (result === "WIN") {
  score += 1;
}
```

เพราะผู้ใช้สามารถแก้ JavaScript ผ่าน Browser DevTools ได้

ควรทำ:

```text
Browser
   ↓
Send Move
   ↓
Next.js Server
   ↓
Validate Move
   ↓
Calculate Result
   ↓
Calculate Score
   ↓
Update Database
```

Server ต้องเป็น Source of Truth

---

# 16. Game API Concept

ตัวอย่าง:

```text
POST /api/game/start
POST /api/game/move
```

## Start Game

```text
POST /api/game/start
```

หน้าที่:

- ตรวจสอบ Session
- สร้าง Game State
- กำหนด Player / Bot
- Return Board State

## Move

```text
POST /api/game/move
```

ตัวอย่าง Request:

```json
{
  "position": 4
}
```

Server:

```text
1. ตรวจสอบ Session
2. ตรวจสอบ Game
3. ตรวจสอบ Position
4. ตรวจสอบว่าเป็น Player Turn
5. วาง Player Move
6. ตรวจสอบ Win / Draw
7. ถ้ายังไม่จบ → Bot Move
8. ตรวจสอบ Bot Win / Draw
9. ถ้า Game จบ → Calculate Score
10. Update User
11. Create Game History
12. Return Game State
```

---

# 17. Database Transaction

เมื่อเกมจบ ควร Update ข้อมูลที่เกี่ยวข้องภายใน Transaction

ตัวอย่าง:

```text
Transaction
│
├── Update User Score
├── Update Win/Loss/Draw
├── Update Win Streak
└── Create Game History
```

ถ้ามี Error:

```text
Rollback
```

เพื่อป้องกันข้อมูลไม่ตรงกัน

---

# 18. Leaderboard

เพิ่มหน้า:

```text
/leaderboard
```

Leaderboard เรียงตาม Score จากมากไปน้อย

ตัวอย่าง:

```text
Rank | Player | Score | Wins | Losses | Win Rate
--------------------------------------------------
1    | John   | 25    | 30   | 5      | 85.7%
2    | Mike   | 21    | 26   | 5      | 83.9%
3    | Sarah  | 18    | 24   | 6      | 80.0%
```

Admin ไม่ควรถูกนำมาคิดใน Leaderboard ของผู้เล่น

Concept Query:

```javascript
const players = await prisma.user.findMany({
  where: {
    role: "USER"
  },
  orderBy: {
    score: "desc"
  },
  take: 100
});
```

ควรมีการกำหนด Tie-breaker เพิ่มเติมเมื่อผู้เล่นมีคะแนนเท่ากัน เช่น:

1. Score สูงกว่า
2. Win มากกว่า
3. Win Rate สูงกว่า
4. หากยังเท่ากัน ใช้วันที่/ลำดับที่กำหนด

รายละเอียด Tie-breaker สามารถกำหนดใน Implementation Phase

---

# 19. Pages

MVP แนะนำให้มี:

```text
/
├── Login / Landing
│
├── /dashboard
│
├── /game
│
├── /leaderboard
│
├── /profile
│
└── /admin
```

## Dashboard

แสดง:

- User Name
- Current Score
- Win Streak
- Wins
- Losses
- Draws
- Recent Games
- ปุ่ม Play Game
- Link Leaderboard

## Game

แสดง:

- Board 3x3
- Player Symbol
- Bot Symbol
- Current Turn
- Score
- Win Streak
- Game Result
- New Game

## Profile

แสดง:

- Profile จาก Google
- Score
- Wins
- Losses
- Draws
- Win Rate
- Current Win Streak
- Game History

## Leaderboard

แสดง:

- Rank
- Player
- Score
- Wins
- Losses
- Win Rate

## Admin

แสดง:

- จำนวนผู้เล่น
- จำนวนเกม
- รายชื่อผู้เล่น
- Score
- Wins
- Losses
- Draws
- Win Streak
- Game History

---

# 20. Folder Structure

แนะนำ:

```text
tic-tac-toe/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── page.js
│   │   │
│   │   ├── login/
│   │   │   └── page.js
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.js
│   │   │
│   │   ├── game/
│   │   │   └── page.js
│   │   │
│   │   ├── leaderboard/
│   │   │   └── page.js
│   │   │
│   │   ├── profile/
│   │   │   └── page.js
│   │   │
│   │   ├── admin/
│   │   │   └── page.js
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │
│   │       └── game/
│   │           ├── start/
│   │           └── move/
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── Board.js
│   │   │   ├── Cell.js
│   │   │   └── ScoreBoard.js
│   │   │
│   │   ├── auth/
│   │   ├── leaderboard/
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── auth.js
│   │   ├── prisma.js
│   │   │
│   │   └── game/
│   │       ├── game-engine.js
│   │       ├── minimax.js
│   │       └── score.js
│   │
│   └── middleware.js
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

หมายเหตุ: โครงสร้างสามารถปรับตาม Next.js App Router version ที่เลือกตอนเริ่ม Project

---

# 21. Environment Variables

สร้าง:

```text
.env.example
```

ตัวอย่าง:

```env
DATABASE_URL="file:./dev.db"

AUTH_SECRET=""

AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

ADMIN_EMAIL="admin@example.com"
```

ผู้ใช้งานต้องสร้าง `.env` จาก `.env.example`

ห้าม Commit:

```text
.env
```

และห้าม Commit OAuth Client Secret

---

# 22. Google OAuth Setup

README ต้องอธิบาย:

1. สร้าง Google Cloud Project
2. เปิดใช้งาน OAuth
3. สร้าง OAuth Client
4. กำหนด Authorized JavaScript origins
5. กำหนด Authorized redirect URI
6. นำ Client ID และ Client Secret มาใส่ `.env`
7. กำหนด `AUTH_SECRET`
8. กำหนด `ADMIN_EMAIL`
9. Run Application

ตัวอย่าง Callback URL ต้องใช้ให้ตรงกับ Auth.js configuration และ Environment ที่กำลังใช้งาน เช่น Local Development และ Production อาจใช้ URL ต่างกัน

---

# 23. Database Development

ใช้ Prisma Migration

ตัวอย่าง Flow:

```text
schema.prisma
      ↓
Prisma Migration
      ↓
SQLite
```

Developer สามารถสร้าง Database ใหม่ได้ด้วย Migration

ไม่ควร Commit Database File จริง เช่น:

```text
prisma/dev.db
```

เข้า Git

ควร Commit:

```text
prisma/schema.prisma
prisma/migrations/
```

และใส่ Database File ใน `.gitignore`

---

# 24. Testing

## Unit Test

ใช้ Vitest

ควร Test:

```text
checkWinner()
isDraw()
getAvailableMoves()
makeMove()
minimax()
calculateScore()
```

โดยเฉพาะ Score Rules:

```text
WIN
WIN
WIN
```

ต้องตรวจสอบว่า:

```text
Score = +4
Bonus = +1
Win Streak = 0
```

และ:

```text
WIN
WIN
LOSS
```

ต้องตรวจสอบว่า:

```text
Win Streak = 0
Bonus = 0
```

## E2E Test

ใช้ Playwright

ตัวอย่าง Flow:

```text
Login
  ↓
Dashboard
  ↓
Play Game
  ↓
Play Moves
  ↓
Game Result
  ↓
Score Updated
  ↓
Leaderboard Updated
```

OAuth E2E สามารถออกแบบ Test Account / Authentication State ตามแนวทางของ Playwright โดยไม่ต้องมี Mock Login ใน Application จริง

---

# 25. Security Considerations

## Authentication

- ใช้ Auth.js จัดการ OAuth
- ไม่เก็บ Password
- ไม่เก็บ OAuth Client Secret ใน Git

## Authorization

- ตรวจสอบ Admin ฝั่ง Server
- ห้ามเชื่อ Role จาก Client
- ห้ามให้ Client กำหนด Email เพื่อขอ Admin

## Score

- Server เป็นผู้คำนวณ Score
- Client ส่งเฉพาะ Move ที่ต้องการเล่น
- Server ตรวจสอบ Game State
- ใช้ Database Transaction เมื่อ Update Score และ Game History

## Database

- Validate User Session ก่อน Query ข้อมูลส่วนตัว
- Admin API ต้องตรวจสอบสิทธิ์ทุกครั้ง
- ไม่ควรเปิด API สำหรับแก้ Score โดยตรงจาก Client

---

# 26. Recommended Development Order

ควรพัฒนาตามลำดับ:

```text
1. Create Next.js Project
        ↓
2. Setup Prisma
        ↓
3. Setup SQLite
        ↓
4. Design Database Schema
        ↓
5. Setup Google OAuth / Auth.js
        ↓
6. Implement User Creation
        ↓
7. Implement Admin Authorization
        ↓
8. Implement Game Engine
        ↓
9. Implement Minimax Bot
        ↓
10. Implement Score Engine
        ↓
11. Implement Game API
        ↓
12. Implement Game UI
        ↓
13. Implement Game History
        ↓
14. Implement Leaderboard
        ↓
15. Implement Admin Dashboard
        ↓
16. Add Unit Tests
        ↓
17. Add E2E Tests
        ↓
18. Write README
```

---

# 27. Final Technology Decision

```text
Frontend
──────────────
Next.js
React
JavaScript
Tailwind CSS

Authentication
──────────────
Auth.js
Google OAuth 2.0
OpenID Connect

Backend
──────────────
Next.js Server
Route Handlers / Server Actions

Database
──────────────
SQLite

ORM
──────────────
Prisma

Game
──────────────
Tic-Tac-Toe
Minimax

Testing
──────────────
Vitest
Playwright
```

---

# 28. Feature Summary

| Feature | Status / Approach |
|---|---|
| Google Login | Auth.js + Google OAuth |
| OAuth 2.0 | Yes |
| OpenID Connect | Yes, through Google Identity |
| User Management | Auth.js + Prisma |
| Tic-Tac-Toe | React |
| Bot | Minimax |
| Win Score | +1 |
| Loss Score | -1 |
| Draw Score | 0 |
| 3 Win Streak Bonus | +1 |
| Streak Reset | หลังครบ 3 Wins / Loss / Draw |
| Game History | Game table |
| Leaderboard | `/leaderboard` |
| Admin Dashboard | `/admin` |
| Admin Definition | `ADMIN_EMAIL` |
| Database | SQLite |
| ORM | Prisma |
| Language | JavaScript |
| Unit Test | Vitest |
| E2E Test | Playwright |
