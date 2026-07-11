---
applyTo: "**/*.ts,**/*.tsx"
description: >
  TypeScript and Next.js coding conventions for the Door Bell project.
  Use when: writing React components, API routes, server actions, or any TypeScript code.
---

# TypeScript & Next.js Conventions

## Next.js App Router Rules

- Default to **Server Components** — add `"use client"` only for components that use hooks, browser APIs, or event handlers
- Layouts (`layout.tsx`) must not contain `"use client"` — wrap interactive children in a separate Client Component instead
- Use **Server Actions** (`"use server"`) for form submissions and mutations instead of client-side fetch calls
- API routes live in `app/api/[route]/route.ts` and export named functions: `GET`, `POST`, `PUT`, `DELETE`

## TypeScript Standards

- Strict mode is enabled — no `any`, use `unknown` and narrow with type guards
- Define request/response shapes with **Zod schemas** in `lib/schemas/`; infer TypeScript types from them (`z.infer<typeof schema>`)
- Use `type` for object shapes, `interface` only when extending is needed

## Firebase Firestore

- **Client-side**: import from `lib/firebase.ts` (singleton initialisation with `getApps()` guard)
- **Server-side / API routes**: import from `lib/firebase-admin.ts` (Admin SDK) — never use the client SDK in API routes
- Firestore collections: `qrCodes`, `visits`, `fcmTokens`
- Always use **security rules** to restrict direct client reads/writes — sensitive writes go through API routes only
- Batch unrelated writes with `writeBatch()` to keep Firestore operations atomic

## Firebase Auth

- Client-side sign-in uses the Firebase Auth client SDK (`signInWithPopup`, `signInWithEmailAndPassword`)
- Server-side route protection: verify the Firebase ID token from the `Authorization: Bearer <token>` header using Admin SDK `auth().verifyIdToken()`
- Homeowner-only pages live under `app/(homeowner)/` — all routes in this group verify the ID token
- Visitor pages (`app/(visitor)/`) are public and must never expose homeowner data
- Store the ID token in a `httpOnly` cookie (use `firebase-admin` to mint a session cookie for SSR)

## Firebase Cloud Messaging (FCM)

- Register the service worker (`public/firebase-messaging-sw.js`) for background push notifications
- Save FCM tokens to the `fcmTokens` Firestore collection (keyed by `userId + deviceId`)
- Send notifications server-side from API routes using Admin SDK `messaging().send()`
- Never expose the FCM server key or Admin credentials to the client

## Error Handling

- API routes return `NextResponse.json({ error: "message" }, { status: 4xx/5xx })`
- Use `try/catch` in Server Actions and return `{ error }` objects — do not throw to the client
- Log errors server-side with `console.error`; never expose stack traces to the client

## Styling

- Use **Tailwind CSS** classes only — no inline styles, no CSS modules unless absolutely necessary
- Mobile-first: base styles are for small screens, use `sm:`, `md:`, `lg:` prefixes for larger screens
