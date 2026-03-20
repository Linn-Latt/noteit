import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const note = await prisma.note.findFirst({
        where: { id, userId: session.user.id, isDeleted: false },
        select: { id: true, title: true, content: true },
    });

    if (!note) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    return NextResponse.json(note);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content } = await req.json();

    const note = await prisma.note.updateMany({
        where: { id, userId: session.user.id, isDeleted: false },
        data: { content },
    });

    if (note.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const note = await prisma.note.updateMany({
        where: { id, userId: session.user.id, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
    });

    if (note.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
}
