"use client";

import { useNotificationSetup } from "@/lib/hooks/useNotificationSetup";

export default function NotificationSetup() {
    const { permission, loading, registered, requestNotificationPermission, mounted, isSafari, notificationsSupported } =
        useNotificationSetup();

    // Don't render until after hydration to avoid mismatch
    if (!mounted) {
        return (
            <div className="rounded-lg bg-zinc-100 border border-zinc-200 px-4 py-3 animate-pulse">
                <p className="text-sm text-zinc-600">Loading...</p>
            </div>
        );
    }

    // Show Safari-specific message
    if (isSafari && !notificationsSupported) {
        return (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <div className="flex items-start gap-3">
                    <svg
                        className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div className="text-sm">
                        <p className="font-semibold text-amber-900">Safari doesn't support web notifications</p>
                        <p className="text-amber-700 text-xs mt-2">
                            Safari on iOS and macOS doesn't support web push notifications yet. To get doorbell alerts on your iPhone, add this app to your Home Screen (tap Share → Add to Home Screen). 📱
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (permission === "granted" && registered) {
        return null; // Don't show anything when notifications are fully enabled
    }

    if (permission === "denied") {
        return (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <div className="flex items-start gap-3">
                    <svg
                        className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div className="text-sm">
                        <p className="font-semibold text-amber-900">Notifications blocked</p>
                        <p className="text-amber-700 text-xs mt-1">
                            Enable notifications in your browser settings to receive doorbell alerts.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="text-sm">
                    <p className="font-semibold text-blue-900">Notifications disabled</p>
                    <p className="text-blue-700 text-xs mt-1">
                        Enable notifications to get instant doorbell alerts on your phone.
                    </p>
                </div>
                <button
                    onClick={requestNotificationPermission}
                    disabled={loading}
                    className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                    {loading ? "Enabling..." : "Enable"}
                </button>
            </div>
        </div>
    );
}
