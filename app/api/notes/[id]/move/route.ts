import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { notebookId } = await req.json(); // string | null

    // verify target notebook belongs to user (skip if moving to Quick Notes)
    if (notebookId) {
        const notebook = await prisma.notebook.findFirst({
            where: { id: notebookId, userId: session.user.id, isDeleted: false },
        });
        if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    const note = await prisma.note.updateMany({
        where: { id, userId: session.user.id, isDeleted: false },
        data: { notebookId: notebookId ?? null },
    });

    if (note.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
}
