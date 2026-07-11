import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { z } from "zod";

const sessionSchema = z.object({
    idToken: z.string().min(1),
});

// 5-day session — matches Firebase session cookie max lifetime
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
    try {
        const body: unknown = await request.json();
        const { idToken } = sessionSchema.parse(body);

        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_DURATION_MS,
        });

        const cookieStore = await cookies();
        cookieStore.set("__session", sessionCookie, {
            maxAge: SESSION_DURATION_MS / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "strict",
        });

        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Session creation failed:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("__session")?.value;

        if (session) {
            const decoded = await adminAuth.verifySessionCookie(session).catch(() => null);
            if (decoded) {
                // Revoke all refresh tokens so existing sessions become invalid
                await adminAuth.revokeRefreshTokens(decoded.sub);
            }
        }

        cookieStore.delete("__session");
        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("Sign-out error:", error);
        return NextResponse.json({ error: "Sign-out failed" }, { status: 500 });
    }
}
