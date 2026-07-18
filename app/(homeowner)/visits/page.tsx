import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import VisitHistory from "@/components/homeowner/VisitHistory";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Visit History — KnockKnock",
};

export default async function VisitsPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    return (
        <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900">Visit History</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    All doorbell rings and visitor messages
                </p>
            </div>

            <div>
                <VisitHistory />
            </div>
        </main>
    );
}
