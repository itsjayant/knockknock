import { getSessionUser } from "@/lib/auth";
import SettingsForm from "@/components/homeowner/SettingsForm";
import SettingsIcon from "@mui/icons-material/Settings";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Settings — KnockKnock",
};

export default async function SettingsPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    return (
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Header */}
            <div className="space-y-2 animate-slide-in">
                <div className="flex items-center gap-3">
                    <SettingsIcon className="!text-3xl text-blue-600" />
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                        Settings
                    </h1>
                </div>
                <p className="text-sm sm:text-base text-slate-600">
                    Customize your KnockKnock experience
                </p>
            </div>

            {/* Settings */}
            <section className="space-y-4 animate-slide-in">
                <SettingsForm userId={user.uid} />
            </section>
        </main>
    );
}
