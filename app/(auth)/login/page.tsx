import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign in — KnockKnock",
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string }>;
}) {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");

    const { from } = await searchParams;
    const redirectTo = from && from.startsWith("/") ? from : "/dashboard";

    return (
        <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
                <span className="text-4xl" role="img" aria-label="Doorbell">
                    🔔
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
                    KnockKnock
                </h1>
                <p className="mt-1.5 text-sm text-zinc-500">
                    Sign in to manage your doorbell
                </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm">
                <LoginForm redirectTo={redirectTo} />
            </div>
        </div>
    );
}
