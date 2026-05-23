import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const notes = await prisma.note.findMany({
            where: { userId: session.user.id, notebookId: null, isDeleted: false },
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true },
        } as never);

        return NextResponse.json(notes);
    } catch (err) {
        console.error("GET /api/notes error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { title, notebookId } = await req.json();
        const note = await prisma.note.create({
            data: {
                title: title?.trim() || "Untitled",
                content: "",
                user: { connect: { id: session.user.id } },
                notebook: notebookId ? { connect: { id: notebookId } } : undefined,
            },
        });
        return NextResponse.json(note, { status: 201 });
    } catch (err) {
        console.error("POST /api/notes error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

