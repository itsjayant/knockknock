import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import RingForm from "@/components/visitor/RingForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ring Doorbell — KnockKnock",
};

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const code = typeof params.code === "string" ? params.code : null;

    if (!code) {
        return (
            <main className="flex h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
                <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-lg text-center">
                    <h1 className="text-2xl font-bold text-zinc-900">Invalid QR Code</h1>
                    <p className="mt-2 text-sm text-zinc-600">
                        Please scan a valid QR code to ring the doorbell.
                    </p>
                </div>
            </main>
        );
    }

    // Validate the QR code on the server
    const qrCodeDoc = await adminDb.collection("qrCodes").doc(code).get();

    if (!qrCodeDoc.exists || !(qrCodeDoc.data() as { isActive: boolean }).isActive) {
        // Don't reveal whether the code exists or is just inactive
        return (
            <main className="flex h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
                <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-lg text-center">
                    <h1 className="text-2xl font-bold text-zinc-900">Invalid QR Code</h1>
                    <p className="mt-2 text-sm text-zinc-600">
                        This QR code is invalid or expired. Please contact the property owner.
                    </p>
                </div>
            </main>
        );
    }

    const qrData = qrCodeDoc.data() as { label: string };
    const qrLabel = qrData.label;

    return (
        <main className="flex h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4">
            <div className="w-full max-w-md">
                <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-lg">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-zinc-900">Doorbell</h1>
                        <p className="mt-2 text-sm text-zinc-600">{qrLabel}</p>
                    </div>

                    <RingForm code={code} />
                </div>

                <div className="mt-6 text-center text-xs text-zinc-500">
                    <p>Your message will be sent to the property owner.</p>
                </div>
            </div>
        </main>
    );
}
