import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "./components/sidebar";

export default async function NotePage () {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) redirect("/login");

    return (
        <div className="flex h-screen">
            <Sidebar userName={session.user.name} />
            Note
        </div>
    )
}