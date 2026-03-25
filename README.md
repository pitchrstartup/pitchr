# Pitchr

Pitchr is a startup idea discovery platform inspired by the swipe mechanic of dating apps.

Founders publish pitch cards. Users swipe right (interested) or left (pass). Founders instantly see crowd-sourced interest data.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Animations**: Framer Motion
- **Auth**: Cookie-based session (demo)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL connection string (Neon, Supabase, local, etc.).

### 3. Set up the database

```bash
npm run db:migrate
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

The seed script creates three demo accounts (no password required):

| Role    | Email                  | Access                          |
|---------|------------------------|---------------------------------|
| Founder | founder@pitchr.dev     | Create pitches, view analytics  |
| User    | user@pitchr.dev        | Discover and swipe on ideas     |
| Admin   | admin@pitchr.dev       | Platform-wide stats             |

## Pages

| Route                        | Description                        |
|------------------------------|------------------------------------|
| `/`                          | Landing page                       |
| `/login`                     | Demo account selector              |
| `/discover`                  | Swipe feed for users               |
| `/pitch/[id]`                | Public pitch detail view           |
| `/founder/pitches`           | Founder's pitch list + overview    |
| `/founder/pitches/new`       | Create a new pitch                 |
| `/founder/pitches/[id]`      | Pitch analytics detail             |
| `/admin`                     | Admin dashboard (admin only)       |

## Features (V1)

- Founders publish pitch cards with name, tagline, problem, solution, category, and stage
- Users browse a swipeable feed of active pitches
- Swipe right = interested, swipe left = pass
- Drag-to-swipe card with LIKE/PASS badges and button fallback
- Founders see total swipes, right/left counts, and interest percentage
- Admin sees platform-wide user and pitch statistics
- Cookie-based session with role-based access control

## Project Structure

```
pitchr/
├── app/                    # Next.js App Router pages
│   ├── admin/
│   ├── discover/
│   ├── founder/pitches/
│   ├── login/
│   └── pitch/[id]/
├── actions/                # Server Actions
│   ├── auth.ts
│   ├── pitches.ts
│   └── swipes.ts
├── components/             # React components
│   ├── AnalyticsCard.tsx
│   ├── Navbar.tsx
│   ├── StatCard.tsx
│   └── SwipeDeck.tsx
├── lib/                    # Shared utilities
│   ├── auth.ts
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── types/
    └── index.ts
```
