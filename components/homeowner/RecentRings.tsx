"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, Unsubscribe } from "firebase/firestore";

type RecentRing = {
    id: string;
    qrLabel: string;
    message: string | null;
    timestamp: string;
};

export default function RecentRings() {
    const [recentRings, setRecentRings] = useState<RecentRing[]>([]);
    const [fadeOut, setFadeOut] = useState<Set<string>>(new Set());

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        let unsubscribe: Unsubscribe;
        const dismissTimers = new Map<string, NodeJS.Timeout>();

        const setupListener = async () => {
            try {
                const q = query(
                    collection(db, "visits"),
                    where("ownerId", "==", user.uid),
                    orderBy("timestamp", "desc"),
                    limit(10)
                );

                unsubscribe = onSnapshot(
                    q,
                    (snapshot) => {
                        const rings: RecentRing[] = [];

                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            rings.push({
                                id: doc.id,
                                qrLabel: data.qrLabel || "Unknown Location",
                                message: data.message || null,
                                timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                            });
                        });

                        // Get the latest ring (first one due to descending order)
                        if (rings.length > 0 && rings[0]) {
                            const latestRing = rings[0];

                            // Check if this is a new ring by comparing timestamps
                            setRecentRings((prev) => {
                                // Add new ring if it's not already in the list
                                if (!prev.some((r) => r.id === latestRing.id)) {
                                    const updated = [latestRing, ...prev].slice(0, 5);

                                    // Auto-dismiss after 5 seconds
                                    if (dismissTimers.has(latestRing.id)) {
                                        clearTimeout(dismissTimers.get(latestRing.id));
                                    }

                                    const timer = setTimeout(() => {
                                        setFadeOut((prev) => new Set(prev).add(latestRing.id));
                                        setTimeout(() => {
                                            setRecentRings((prev) => prev.filter((r) => r.id !== latestRing.id));
                                            setFadeOut((prev) => {
                                                const updated = new Set(prev);
                                                updated.delete(latestRing.id);
                                                return updated;
                                            });
                                            dismissTimers.delete(latestRing.id);
                                        }, 300);
                                    }, 5000);

                                    dismissTimers.set(latestRing.id, timer);
                                    return updated;
                                }
                                return prev;
                            });
                        }
                    }
                );
            } catch (error) {
                console.error("Error setting up recent rings listener:", error);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            dismissTimers.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    return (
        <div className="fixed top-24 right-4 space-y-2 z-40 max-w-sm">
            {recentRings.map((ring) => (
                <div
                    key={ring.id}
                    className={`rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg transition-all duration-300 ${fadeOut.has(ring.id) ? "opacity-0 translate-x-96" : "opacity-100 translate-x-0"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-600 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-green-900">Doorbell! 🔔</p>
                            <p className="text-sm text-green-800">{ring.qrLabel}</p>
                            {ring.message && (
                                <p className="mt-1 text-xs text-green-700 italic line-clamp-2">"{ring.message}"</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
