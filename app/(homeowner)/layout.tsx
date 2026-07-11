import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import HomeownerNav from "@/components/homeowner/Nav";

export default async function HomeownerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    return (
        <div className="min-h-screen flex flex-col bg-zinc-50">
            <HomeownerNav />
            {children}
        </div>
    );
}
