import { getSessionUser } from "@/lib/auth";
import NotificationSetup from "@/components/homeowner/NotificationSetup";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard — KnockKnock",
};

export default async function DashboardPage() {
    const user = await getSessionUser();

    return (
        <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Welcome back, {user?.name ?? user?.email}
                </p>
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-lg font-semibold text-zinc-900 mb-4">Notifications</h2>
                    <NotificationSetup />
                </section>
            </div>
        </main>
    );
}
