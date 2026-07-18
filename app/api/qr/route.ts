import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { createQrSchema } from "@/lib/schemas";
import { FieldValue } from "firebase-admin/firestore";

const serverTimestamp = (): FieldValue =>
    FieldValue.serverTimestamp();

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const idToken = authHeader.slice(7);
        let decoded;
        try {
            decoded = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body: unknown = await request.json();
        const { label } = createQrSchema.parse(body);

        // Generate a unique token (UUIDv4 has 128 bits of entropy)
        const token = crypto.randomUUID();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const createdAtISO = new Date().toISOString();

        // Create the QR code document in Firestore
        const qrCodeRef = adminDb.collection("qrCodes").doc(token);
        await qrCodeRef.set({
            ownerId: decoded.uid,
            label,
            isActive: true,
            createdAt: serverTimestamp(),
        });

        return NextResponse.json(
            {
                id: token,
                label,
                isActive: true,
                createdAt: createdAtISO,
                url: `${appUrl}/ring?code=${token}`,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("QR creation error:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: "Invalid JSON" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create QR code" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const idToken = authHeader.slice(7);
        let decoded;
        try {
            decoded = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const qrId = searchParams.get("id");
        if (!qrId) {
            return NextResponse.json(
                { error: "Missing id parameter" },
                { status: 400 }
            );
        }

        const qrCodeDoc = await adminDb.collection("qrCodes").doc(qrId).get();
        if (!qrCodeDoc.exists) {
            return NextResponse.json(
                { error: "QR code not found" },
                { status: 404 }
            );
        }

        const data = qrCodeDoc.data() as { ownerId: string };
        if (data.ownerId !== decoded.uid) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Soft delete — mark as inactive instead of deleting
        await qrCodeDoc.ref.update({ isActive: false });

        return NextResponse.json({ status: "success" });
    } catch (error) {
        console.error("QR deletion error:", error);
        return NextResponse.json(
            { error: "Failed to delete QR code" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const idToken = authHeader.slice(7);
        let decoded;
        try {
            decoded = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch all QR codes for the authenticated user
        const snapshot = await adminDb
            .collection("qrCodes")
            .where("ownerId", "==", decoded.uid)
            .orderBy("createdAt", "desc")
            .get();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const qrCodes = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                label: data.label,
                isActive: data.isActive,
                createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
                url: `${appUrl}/ring?code=${doc.id}`,
            };
        });

        return NextResponse.json({ qrCodes });
    } catch (error) {
        console.error("QR list error:", error);
        return NextResponse.json(
            { error: "Failed to fetch QR codes" },
            { status: 500 }
        );
    }
}
