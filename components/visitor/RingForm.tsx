"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import NotificationsIcon from "@mui/icons-material/Notifications";

type Props = {
    code: string;
};

export default function RingForm({ code }: Props) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visitorUser, setVisitorUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setVisitorUser(user);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
                    visitorId: visitorUser?.uid || undefined,
                    visitorName: visitorUser?.displayName || undefined,
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

    if (authLoading) {
        return (
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-6 animate-pulse">
                <p className="text-sm text-slate-600">Loading...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="text-center space-y-4">
                <div className="inline-block rounded-full bg-green-50 p-4">
                    <NotificationsIcon className="!text-4xl text-green-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Doorbell Rung!</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        The property owner has been notified. They will respond shortly.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setMessage("");
                    }}
                    className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-900 transition-all"
                >
                    Ring Again
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Auth Info */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                {visitorUser ? (
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Identified as: <span className="text-black">{visitorUser.displayName || visitorUser.email}</span>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                            The homeowner will know who's ringing
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-700">
                            Want the homeowner to know who you are?
                        </p>
                        <div className="flex gap-2 flex-col sm:flex-row">
                            <Link
                                href="/visitor-signup"
                                className="flex-1 rounded-lg bg-black px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-900 transition-all"
                            >
                                Create Account
                            </Link>
                            <Link
                                href="/visitor-signin"
                                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-all"
                            >
                                Log In
                            </Link>
                        </div>
                        <p className="text-xs text-slate-600">
                            Or continue anonymously and ring below
                        </p>
                    </div>
                )}
            </div>

            {/* Message */}
            <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                    Message (Optional)
                </label>
                <textarea
                    id="message"
                    maxLength={200}
                    placeholder="Leave a message for the owner..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
                <p className="text-xs text-slate-500">
                    {message.length}/200 characters
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black px-6 py-3 text-lg font-semibold text-white hover:bg-gray-900 active:bg-black disabled:opacity-50 transition-all"
            >
                {loading ? "Ringing..." : "Ring Doorbell"}
            </button>
        </form>
    );
}
