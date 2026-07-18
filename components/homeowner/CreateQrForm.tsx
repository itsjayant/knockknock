"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useIdToken } from "@/lib/hooks/useIdToken";

type CreateQrResponse = {
    id: string;
    label: string;
    isActive: boolean;
    createdAt: string;
    url: string;
};

type Props = {
    onSuccess?: () => void;
};

export default function CreateQrForm({ onSuccess }: Props) {
    const { idToken, loading: tokenLoading } = useIdToken();
    const router = useRouter();
    const [label, setLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!idToken || tokenLoading) return;
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const res = await fetch("/api/qr", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ label }),
            });

            if (!res.ok) throw new Error("Failed to create QR code");

            const data = (await res.json()) as CreateQrResponse;

            // Add the new QR code to the list immediately
            const newQrCode = {
                id: data.id,
                label: data.label,
                isActive: data.isActive ?? true,
                createdAt: data.createdAt,
                url: data.url,
            };

            if ((window as any).__addQrCode) {
                (window as any).__addQrCode(newQrCode);
            }

            setLabel("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000); // Show success for 3s
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Creation failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">Create New QR Code</h3>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="label" className="text-sm font-medium text-zinc-700">
                    Location Name
                </label>
                <input
                    id="label"
                    type="text"
                    maxLength={80}
                    placeholder="e.g., Front Door, Back Gate"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                />
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                    ✓ QR code created successfully!
                </div>
            )}

            <button
                type="submit"
                disabled={loading || tokenLoading || !idToken}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50"
            >
                {tokenLoading ? "Loading…" : loading ? "Creating…" : "Create QR Code"}
            </button>
        </form>
    );
}
