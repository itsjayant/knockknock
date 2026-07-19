"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import DashboardIcon from "@mui/icons-material/Dashboard";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";

export default function HomeownerNav() {
    const pathname = usePathname();
    const router = useRouter();

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
        { href: "/qr-codes", label: "QR Codes", icon: QrCode2Icon },
        { href: "/visits", label: "Visits", icon: HistoryIcon },
        { href: "/settings", label: "Settings", icon: SettingsIcon },
    ];

    async function handleSignOut() {
        try {
            await signOut(auth);
            await fetch("/api/auth/session", { method: "DELETE" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Sign-out error:", error);
        }
    }

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden sm:block sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <NotificationsIcon className="!text-2xl text-black" />
                        <h1 className="text-lg font-bold text-black">KnockKnock</h1>
                    </div>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-all ${pathname === link.href
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Icon className="!text-lg" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSignOut}
                            className="rounded-md bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium px-4 py-2 text-sm transition-all flex items-center gap-2"
                        >
                            <LogoutIcon className="!text-lg" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Bar */}
            <nav className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <NotificationsIcon className="!text-xl text-black" />
                        <h1 className="text-sm font-bold text-slate-900">KnockKnock</h1>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="rounded-md bg-slate-100 text-slate-900 px-3 py-1.5 text-xs font-medium"
                    >
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-xl">
                <div className="flex justify-around">
                    {links.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex flex-col items-center gap-1 flex-1 py-3 transition-all ${pathname === link.href
                                    ? "bg-gray-100 text-black border-t-2 border-black"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <Icon className="!text-xl" />
                                <span className="text-xs font-semibold">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Mobile top spacing */}
            <div className="sm:hidden h-12" />
            {/* Mobile bottom spacing */}
            <div className="sm:hidden h-20" />
        </>
    );
}
