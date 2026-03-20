import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import NoteLayout from "./components/note-layout";

export default async function NotePage () {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) redirect("/login");

    return <NoteLayout userName={session.user.name} />;
}