---
applyTo: "app/(visitor)/**,lib/qr*,app/api/ring/**,app/api/qr/**"
description: >
  QR code and visitor flow conventions for the Door Bell project.
  Use when: working on QR code generation, the visitor scan page, or the ring/notify API.
---

# QR Code & Visitor Flow

## QR Code Design

- Each QR code encodes a URL: `https://<domain>/ring?code=<unique-token>`
- Tokens are **URL-safe random strings** (use `crypto.randomUUID()` or `nanoid`)
- Generate QR images server-side using the `qrcode` package; serve as PNG or SVG
- Store tokens in the `qrCodes` Firestore collection with fields: `isActive` (bool), `label` (string), `ownerId` (uid), `createdAt` (Timestamp)
- A homeowner can have multiple QR codes (e.g., front door, back door, gate)

## Visitor Page (`app/(visitor)/ring/page.tsx`)

- Must be **fully public** — no authentication required
- Validates `?code=` query param against the database on the server
- Shows an invalid/expired state if the code is not found or `isActive = false`
- Accepts an optional visitor message (short text, max 200 chars)
- On submit, calls `POST /api/ring` with the QR code token and optional message

## Ring API (`app/api/ring/route.ts`)

- `POST` only — rate-limited (max 5 requests per IP per minute using an in-memory or Redis limiter)
- Validates body with Zod: `{ code: string, message?: string }`
- Looks up the QR code in the `qrCodes` Firestore collection (Admin SDK), creates a document in `visits`
- Sends an FCM push notification to all tokens in `fcmTokens` collection for the homeowner (Admin SDK `messaging().send()`)
- Returns `200 OK` on success; `404` if code not found; `429` if rate-limited

## Notification Payload

```ts
{
  visitId: string,
  timestamp: string,        // ISO 8601
  message: string | null,
  qrLabel: string,          // e.g. "Front Door"
}
```

## Security Rules

- Never expose the homeowner's name, email, or internal IDs in visitor-facing responses
- QR code tokens must be unguessable (≥128 bits of entropy)
- Visitor page must not reveal whether a code exists vs. is inactive — return a generic "invalid" state for both cases
