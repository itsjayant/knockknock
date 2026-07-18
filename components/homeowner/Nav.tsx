"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function HomeownerNav() {
    const pathname = usePathname();
    const router = useRouter();

    const links = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/qr-codes", label: "QR Codes" },
        { href: "/visits", label: "Visits" },
    ];

    async function handleSignOut() {
        try {
            // Sign out from Firebase
            await signOut(auth);
            // Clear the session cookie
            await fetch("/api/auth/session", { method: "DELETE" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Sign-out error:", error);
        }
    }

    return (
        <nav className="border-b border-zinc-200 bg-white">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-lg font-semibold text-zinc-900">🔔 KnockKnock</h1>
                    <div className="hidden sm:flex gap-6">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium transition ${pathname === link.href
                                    ? "text-zinc-900 border-b-2 border-zinc-900 pb-1"
                                    : "text-zinc-600 hover:text-zinc-900"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200"
                >
                    Sign Out
                </button>
            </div>
        </nav>
    );
}
