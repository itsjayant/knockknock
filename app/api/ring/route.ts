import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { ringSchema } from "@/lib/schemas";
import { FieldValue } from "firebase-admin/firestore";

const serverTimestamp = (): FieldValue =>
    FieldValue.serverTimestamp();

// Simple in-memory rate limiter: Map<IP, { count: number; resetAt: number }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetAt) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
        return true; // Allowed
    }

    if (record.count >= maxRequests) {
        return false; // Rate limited
    }

    record.count++;
    return true; // Allowed
}

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);

        // Rate limiting: 5 requests per minute per IP
        if (!checkRateLimit(ip, 5, 60000)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        const body: unknown = await request.json();
        const { code, message } = ringSchema.parse(body);

        // Look up the QR code
        const qrCodeDoc = await adminDb.collection("qrCodes").doc(code).get();

        if (!qrCodeDoc.exists) {
            return NextResponse.json(
                { error: "Invalid QR code." },
                { status: 404 }
            );
        }

        const qrData = qrCodeDoc.data() as { ownerId: string; label: string; isActive: boolean };

        // Check if code is active
        if (!qrData.isActive) {
            return NextResponse.json(
                { error: "Invalid QR code." },
                { status: 404 }
            );
        }

        const ownerId = qrData.ownerId;
        const qrLabel = qrData.label;

        // Create a visit record
        const visitRef = adminDb.collection("visits").doc();
        const visitId = visitRef.id;
        const timestamp = new Date().toISOString();

        await visitRef.set({
            qrCodeId: code,
            ownerId,
            message: message || null,
            timestamp: serverTimestamp(),
            visitId,
        });

        // Get all FCM tokens for the homeowner
        const tokensSnapshot = await adminDb
            .collection("fcmTokens")
            .where("userId", "==", ownerId)
            .get();

        const tokens = tokensSnapshot.docs.map((doc) => (doc.data() as { token: string }).token);

        console.log(`📢 Found ${tokens.length} FCM token(s) for owner ${ownerId}`);

        // Send FCM notification to all tokens
        if (tokens.length > 0) {
            const notificationPayload = {
                visitId,
                timestamp,
                message: message || null,
                qrLabel,
            };

            for (const token of tokens) {
                try {
                    console.log(`📤 Sending notification to token: ${token.slice(0, 20)}...`);
                    await adminMessaging.send({
                        token,
                        notification: {
                            title: `Doorbell: ${qrLabel}`,
                            body: message || "Someone is at your door",
                        },
                        data: {
                            visitId,
                            qrLabel,
                            message: message || "",
                        },
                    });
                    console.log(`✅ Notification sent successfully`);
                } catch (err) {
                    // Log but don't fail the request if a single token fails
                    console.error(`❌ Failed to send FCM to token ${token.slice(0, 20)}...`, err);
                }
            }
        } else {
            console.warn(`⚠️  No FCM tokens found for owner ${ownerId}`);
        }

        return NextResponse.json(
            {
                status: "success",
                visitId,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Ring API error:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: "Invalid JSON" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
