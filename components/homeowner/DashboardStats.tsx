"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from "firebase/firestore";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TodayIcon from "@mui/icons-material/Today";
import BarChartIcon from "@mui/icons-material/BarChart";
import LocationOnIcon from "@mui/icons-material/LocationOn";

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
        let unsubscribe: Unsubscribe | undefined;
        let unsubscribeAuth = () => { };

        unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

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
                        console.log("📊 Loaded stats:", snapshot.size, "total rings");
                    },
                    (error: any) => {
                        console.error("❌ Error fetching stats:", error?.code, error?.message);
                        if (error?.code === "permission-denied") {
                            console.error("📋 Check Firestore security rules and composite indexes");
                        }
                        if (error?.code === "failed-precondition") {
                            console.error("📋 Composite index required. Check Firebase Console");
                        }
                        setLoading(false);
                    }
                );
            } catch (error: any) {
                console.error("❌ Error setting up stats listener:", error?.message);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe?.();
            unsubscribeAuth();
        };
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-gray-200 bg-gray-100 px-4 py-6 animate-pulse"
                    >
                        <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Rings */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Total Rings</p>
                        <p className="mt-2 text-4xl font-bold text-slate-900">{stats.totalRings}</p>
                    </div>
                    <NotificationsIcon className="!text-3xl text-black" />
                </div>
            </div>

            {/* Today Rings */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Today</p>
                        <p className="mt-2 text-4xl font-bold text-slate-900">{stats.todayRings}</p>
                    </div>
                    <TodayIcon className="!text-3xl text-black" />
                </div>
            </div>

            {/* This Week */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">This Week</p>
                        <p className="mt-2 text-4xl font-bold text-slate-900">{stats.thisWeekRings}</p>
                    </div>
                    <BarChartIcon className="!text-3xl text-black" />
                </div>
            </div>

            {/* Top Location */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Top Location</p>
                        {stats.topLocation ? (
                            <>
                                <p className="mt-2 text-lg font-bold text-black line-clamp-2">
                                    {stats.topLocation.label}
                                </p>
                                <p className="text-xs text-gray-700 mt-2 font-medium">
                                    {stats.topLocation.count} rings
                                </p>
                            </>
                        ) : (
                            <p className="mt-2 text-sm text-gray-600">No data yet</p>
                        )}
                    </div>
                    <LocationOnIcon className="!text-3xl text-black flex-shrink-0" />
                </div>
            </div>
        </div>
    );
}
