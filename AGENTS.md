<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# KnockKnock — Agent Instructions

## Project Overview

A **smart doorbell system** built in two phases:

- **Phase 1 (current)**: Software-only — QR code scanning triggers a web-based doorbell notification to the homeowner (no hardware required)
- **Phase 2 (planned)**: Electronics integration — physical doorbell button, camera feed, Raspberry Pi / ESP32 hardware

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14+ (App Router)** with TypeScript |
| Styling | **Tailwind CSS** |
| Database | **Firebase Firestore** |
| Auth | **Firebase Auth** (Google + Email/Password) |
| Push Notifications | **Firebase Cloud Messaging (FCM)** |
| QR generation | **qrcode** npm package |
| Deployment | **Vercel** |

## Project Structure

```
.
├── app/
│   ├── (auth)/login/        # Homeowner sign-in page
│   ├── (homeowner)/         # Protected — dashboard, QR management
│   ├── (visitor)/ring/      # Public — visitor scan & ring page
│   └── api/
│       ├── ring/            # POST — log visit + send FCM notification
│       └── qr/              # POST/DELETE — manage QR codes
├── components/
│   ├── homeowner/           # Dashboard, visit history, QR card components
│   ├── visitor/             # Visitor ring form component
│   └── ui/                  # Shared primitives (buttons, inputs, etc.)
├── lib/
│   ├── firebase.ts          # Client SDK singleton (auth, db, messaging)
│   ├── firebase-admin.ts    # Admin SDK singleton (server-side only)
│   └── schemas/             # Zod validation schemas
├── public/
│   └── firebase-messaging-sw.js  # FCM background service worker
└── .env.example             # All required env vars (no values committed)
```

## Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `qrCodes` | QR tokens — fields: `ownerId`, `label`, `isActive`, `createdAt` |
| `visits` | Visit log — fields: `qrCodeId`, `ownerId`, `message`, `timestamp` |
| `fcmTokens` | Push tokens — fields: `userId`, `token`, `createdAt` |

## Key Conventions

- All code in **TypeScript** — no `.js` in `app/` or `lib/`
- **Client SDK** (`lib/firebase.ts`) for browser; **Admin SDK** (`lib/firebase-admin.ts`) for API routes only
- API routes validate input with **Zod** (schemas in `lib/schemas/`)
- Homeowner auth: verify Firebase ID token via `Authorization: Bearer <token>` header in API routes
- QR tokens: URL-safe, ≥128 bits entropy (`crypto.randomUUID()`)
- Mobile-first Tailwind — homeowner monitors from phone

## Common Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run lint       # ESLint
vercel deploy      # Deploy to Vercel
```

## Next.js 16 Breaking Changes

- **Proxy (not Middleware)**: `middleware.ts` is renamed to `proxy.ts`; export must be named `proxy` (not `middleware`)
- Read `node_modules/next/dist/docs/` before writing any feature — APIs differ from training data

## Core User Flow

1. Visitor scans QR at door → `GET /ring?code=<token>`
2. Visitor submits optional message → `POST /api/ring`
3. API logs visit to Firestore + sends FCM push to homeowner
4. Homeowner sees real-time notification → opens dashboard

## Phase 2 Notes

- Hardware code will live in `hardware/` (Python)
- Physical button/ESP32 will `POST /api/ring` — same endpoint as QR flow
- See `.github/instructions/hardware.instructions.md` (Phase 2)
