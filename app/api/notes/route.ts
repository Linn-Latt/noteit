import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notes = await prisma.note.findMany({
        where: { userId: session.user.id, notebookId: null, isDeleted: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true },
    } as never);

    return NextResponse.json(notes);
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log(req);
    const { title, notebookId } = await req.json();

    const note = await prisma.note.create({
        data: {
            title: title?.trim() || "Untitled",
            content: "",
            user: { connect: { id: session.user.id } },
            notebook: notebookId ? { connect: { id: notebookId } } : undefined,
        },
    });

    console.log(note);

    return NextResponse.json(note, { status: 201 });
}
