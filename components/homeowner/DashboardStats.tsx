"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from "firebase/firestore";

type Visit = {
    id: string;
    qrCodeId: string;
    qrLabel: string;
    message: string | null;
    timestamp: string;
};

type Stats = {
    totalRings: number;
    todayRings: number;
    thisWeekRings: number;
    topLocation: { label: string; count: number } | null;
};

export default function DashboardStats() {
    const [stats, setStats] = useState<Stats>({
        totalRings: 0,
        todayRings: 0,
        thisWeekRings: 0,
        topLocation: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        let unsubscribe: Unsubscribe;

        const setupListener = async () => {
            try {
                const q = query(
                    collection(db, "visits"),
                    where("ownerId", "==", user.uid),
                    orderBy("timestamp", "desc")
                );

                unsubscribe = onSnapshot(
                    q,
                    (snapshot) => {
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const sevenDaysAgo = new Date(today);
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                        let todayCount = 0;
                        let weekCount = 0;
                        const locationCounts = new Map<string, number>();

                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            const timestamp = data.timestamp?.toDate?.();

                            if (timestamp) {
                                if (timestamp >= today) todayCount++;
                                if (timestamp >= sevenDaysAgo) weekCount++;

                                const label = data.qrLabel || "Unknown";
                                locationCounts.set(label, (locationCounts.get(label) || 0) + 1);
                            }
                        });

                        // Find top location
                        let topLocation = null;
                        let maxCount = 0;
                        locationCounts.forEach((count, label) => {
                            if (count > maxCount) {
                                maxCount = count;
                                topLocation = { label, count };
                            }
                        });

                        setStats({
                            totalRings: snapshot.size,
                            todayRings: todayCount,
                            thisWeekRings: weekCount,
                            topLocation,
                        });
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Error fetching stats:", error);
                        setLoading(false);
                    }
                );
            } catch (error) {
                console.error("Error setting up stats listener:", error);
                setLoading(false);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-6 animate-pulse"
                    >
                        <p className="text-sm text-zinc-500">Loading...</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Rings */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-zinc-600">Total Rings</p>
                        <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.totalRings}</p>
                    </div>
                    <div className="text-3xl">🔔</div>
                </div>
            </div>

            {/* Today Rings */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-zinc-600">Today</p>
                        <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.todayRings}</p>
                    </div>
                    <div className="text-3xl">📅</div>
                </div>
            </div>

            {/* This Week */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-zinc-600">This Week</p>
                        <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.thisWeekRings}</p>
                    </div>
                    <div className="text-3xl">📊</div>
                </div>
            </div>

            {/* Top Location */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <div>
                    <p className="text-xs font-medium text-zinc-600">Top Location</p>
                    {stats.topLocation ? (
                        <>
                            <p className="mt-2 text-xl font-bold text-zinc-900">{stats.topLocation.label}</p>
                            <p className="text-xs text-zinc-500 mt-1">
                                {stats.topLocation.count} rings
                            </p>
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-zinc-500">No data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
