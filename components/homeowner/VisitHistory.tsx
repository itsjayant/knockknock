"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, Unsubscribe } from "firebase/firestore";

type Visit = {
    id: string;
    qrCodeId: string;
    qrLabel: string;
    message: string | null;
    timestamp: string;
};

type Props = {
    showLimit?: number;
};

export default function VisitHistory({ showLimit = 50 }: Props) {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);
    const [qrCodes, setQrCodes] = useState<string[]>([]);

    useEffect(() => {
        // Set a timeout to ensure auth is initialized
        const checkAuth = setTimeout(() => {
            const user = auth.currentUser;
            if (!user) {
                console.log("No user found, trying again...");
                return;
            }

            let unsubscribe: Unsubscribe;

            const setupListener = async () => {
                try {
                    const q = query(
                        collection(db, "visits"),
                        where("ownerId", "==", user.uid),
                        orderBy("timestamp", "desc"),
                        limit(showLimit)
                    );

                    unsubscribe = onSnapshot(
                        q,
                        (snapshot) => {
                            const visitsData: Visit[] = [];
                            const codeSet = new Set<string>();

                            snapshot.forEach((doc) => {
                                const data = doc.data();
                                visitsData.push({
                                    id: doc.id,
                                    qrCodeId: data.qrCodeId,
                                    qrLabel: data.qrLabel || "Unknown Location",
                                    message: data.message || null,
                                    timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                                });
                                codeSet.add(data.qrCodeId);
                            });

                            setVisits(visitsData);
                            setQrCodes(Array.from(codeSet));
                            setLoading(false);
                        },
                        (error) => {
                            console.error("Error fetching visits:", error);
                            setLoading(false);
                        }
                    );
                } catch (error) {
                    console.error("Error setting up visits listener:", error);
                    setLoading(false);
                }
            };

            setupListener();

            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        }, 100);

        return () => clearTimeout(checkAuth);
    }, [showLimit]);
});
codeSet.add(data.qrCodeId);
                        });

setVisits(visitsData);
setQrCodes(Array.from(codeSet));
setLoading(false);
                    },
(error) => {
    console.error("Error fetching visits:", error);
    setLoading(false);
}
                );
            } catch (error) {
    console.error("Error setting up visits listener:", error);
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

const filteredVisits = selectedQrCode
    ? visits.filter((v) => v.qrCodeId === selectedQrCode)
    : visits;

if (loading) {
    return (
        <div className="rounded-lg bg-zinc-100 border border-zinc-200 px-4 py-3 animate-pulse">
            <p className="text-sm text-zinc-600">Loading visit history...</p>
        </div>
    );
}

return (
    <div className="space-y-4">
        {/* Filter by QR Code */}
        {qrCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedQrCode(null)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${selectedQrCode === null
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                >
                    All Locations
                </button>
                {qrCodes.map((code) => {
                    const label = visits.find((v) => v.qrCodeId === code)?.qrLabel || code;
                    return (
                        <button
                            key={code}
                            onClick={() => setSelectedQrCode(code)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${selectedQrCode === code
                                ? "bg-zinc-900 text-white"
                                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        )}

        {/* Visits List */}
        <div className="space-y-2">
            {filteredVisits.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-600">
                        {selectedQrCode
                            ? "No visits for this location yet"
                            : "No visits yet. Share your QR code to get started!"}
                    </p>
                </div>
            ) : (
                filteredVisits.map((visit) => (
                    <div
                        key={visit.id}
                        className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-zinc-900">{visit.qrLabel}</h4>
                                <p className="text-xs text-zinc-500">
                                    {new Date(visit.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <svg
                                className="h-5 w-5 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {visit.message && (
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                                <p className="text-xs font-medium text-blue-900">Message:</p>
                                <p className="mt-1 text-sm text-blue-800 break-words">{visit.message}</p>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
);
}
