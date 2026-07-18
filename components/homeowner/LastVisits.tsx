"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import HistoryIcon from "@mui/icons-material/History";
import Link from "next/link";

type Visit = {
    id: string;
    qrLabel: string;
    visitorName?: string;
    message: string | null;
    timestamp: string;
};

export default function LastVisits() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            query(
                collection(db, "visits"),
                where("ownerId", "==", user.uid),
                orderBy("timestamp", "desc"),
                limit(5)
            ),
            (snapshot) => {
                const visitsData: Visit[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    visitsData.push({
                        id: doc.id,
                        qrLabel: data.qrLabel || "Unknown Location",
                        visitorName: data.visitorName,
                        message: data.message || null,
                        timestamp: data.timestamp?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
                    });
                });
                setVisits(visitsData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching last visits:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-6 animate-pulse">
                <p className="text-sm text-slate-500">Loading last visits...</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {visits.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
                    <p className="text-sm text-slate-500">No recent visits yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {visits.map((visit) => (
                        <div
                            key={visit.id}
                            className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm">
                                        {visit.qrLabel}
                                    </p>
                                    {visit.visitorName && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            Visitor: {visit.visitorName}
                                        </p>
                                    )}
                                    {visit.message && (
                                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                                            "{visit.message}"
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">
                                        {visit.timestamp}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {visits.length > 0 && (
                <Link
                    href="/visits"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 mt-2"
                >
                    View all visits
                    <HistoryIcon className="!text-sm" />
                </Link>
            )}
        </div>
    );
}
