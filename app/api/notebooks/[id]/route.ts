import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const notebook = await prisma.notebook.updateMany({
        where: { id, userId: session.user.id, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
    });

    if (notebook.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Soft-delete all notes in the notebook so they appear in trash
    await prisma.note.updateMany({
        where: { notebookId: id, userId: session.user.id, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
}
