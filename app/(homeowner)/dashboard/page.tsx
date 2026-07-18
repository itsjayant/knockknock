import { getSessionUser } from "@/lib/auth";
import NotificationSetup from "@/components/homeowner/NotificationSetup";
import DashboardStats from "@/components/homeowner/DashboardStats";
import RecentRings from "@/components/homeowner/RecentRings";
import LastVisits from "@/components/homeowner/LastVisits";
import BarChartIcon from "@mui/icons-material/BarChart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HistoryIcon from "@mui/icons-material/History";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard — KnockKnock",
};

export default async function DashboardPage() {
    const user = await getSessionUser();

    return (
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            <RecentRings />

            {/* Header */}
            <div className="space-y-2 animate-slide-in">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                    Dashboard
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                    Welcome back, {user?.name ?? user?.email}
                </p>
            </div>

            {/* Activity Overview */}
            <section className="space-y-3 animate-slide-in">
                <div className="flex items-center gap-3">
                    <BarChartIcon className="!text-2xl text-blue-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Activity Overview</h2>
                </div>
                <DashboardStats />
            </section>

            {/* Notifications */}
            <section className="space-y-3 animate-slide-in">
                <div className="flex items-center gap-3">
                    <NotificationsIcon className="!text-2xl text-blue-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Notifications</h2>
                </div>
                <NotificationSetup />
            </section>

            {/* Last 5 Visits */}
            <section className="space-y-3 animate-slide-in">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="!text-2xl text-blue-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Visits</h2>
                </div>
                <LastVisits />
            </section>
        </main>
    );
}
