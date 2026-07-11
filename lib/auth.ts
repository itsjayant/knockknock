import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export type SessionUser = Pick<DecodedIdToken, "uid" | "email" | "name" | "picture">;

/**
 * Reads and verifies the __session cookie using Firebase Admin SDK.
 * Returns the decoded user or null if the cookie is missing / invalid / revoked.
 * Safe to call in Server Components and API route handlers.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get("__session")?.value;
    if (!session) return null;
    try {
        const decoded = await adminAuth.verifySessionCookie(session, true /* checkRevoked */);
        return {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
        };
    } catch {
        return null;
    }
}
