import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import CreateQrForm from "@/components/homeowner/CreateQrForm";
import QrCodesList from "@/components/homeowner/QrCodesList";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "QR Codes — KnockKnock",
};

export default async function QrCodesPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    // Fetch the user's active QR codes from Firestore
    const snapshot = await adminDb
        .collection("qrCodes")
        .where("ownerId", "==", user.uid)
        .where("isActive", "==", true)
        .orderBy("createdAt", "desc")
        .get();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const qrCodes = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            label: data.label,
            isActive: data.isActive ?? true,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            url: `${appUrl}/ring?code=${doc.id}`,
        };
    });

    return (
        <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900">QR Codes</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Create and manage QR codes for your doorbell
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <CreateQrForm />
                </div>

                <div className="lg:col-span-2">
                    <QrCodesList initialQrCodes={qrCodes} />
                </div>
            </div>
        </main>
    );
}
