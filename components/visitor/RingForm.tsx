"use client";

import { useState } from "react";

type Props = {
    code: string;
};

export default function RingForm({ code }: Props) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/ring", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    message: message.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                throw new Error(data.error || "Failed to ring doorbell");
            }

            setSubmitted(true);
            setMessage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }

    if (submitted) {
        return (
            <div className="text-center">
                <div className="mb-4 inline-block rounded-full bg-green-50 p-3">
                    <svg
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">Doorbell Rung!</h2>
                <p className="mt-2 text-sm text-zinc-600">
                    The property owner has been notified. They will respond shortly.
                </p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setMessage("");
                    }}
                    className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200"
                >
                    Ring Again
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-zinc-700">
                    Message (Optional)
                </label>
                <textarea
                    id="message"
                    maxLength={200}
                    placeholder="Leave a message for the owner..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 resize-none h-24"
                />
                <p className="text-xs text-zinc-500">
                    {message.length}/200 characters
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-zinc-900 px-6 py-3 text-lg font-semibold text-white transition hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Ringing..." : "Ring Doorbell"}
            </button>
        </form>
    );
}
