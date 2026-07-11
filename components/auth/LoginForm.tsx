"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
} from "firebase/auth";

type Props = {
    redirectTo?: string;
};

export default function LoginForm({ redirectTo = "/dashboard" }: Props) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function createSession(idToken: string) {
        const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        });
        if (!res.ok) throw new Error("Failed to create session. Please try again.");
        router.push(redirectTo);
        router.refresh();
    }

    async function handleGoogle() {
        setError(null);
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            await createSession(idToken);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
            setLoading(false);
        }
    }

    async function handleEmailPassword(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();
            await createSession(idToken);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed");
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Google */}
            <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex items-center justify-center gap-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50"
            >
                <GoogleIcon />
                Continue with Google
            </button>

            <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-zinc-200" />
                <span className="text-xs text-zinc-400">or sign in with email</span>
                <div className="flex-1 border-t border-zinc-200" />
            </div>

            {/* Email / Password */}
            <form onSubmit={handleEmailPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>

            {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
                d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
            />
            <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
            />
            <path
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
            />
            <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
            />
        </svg>
    );
}
