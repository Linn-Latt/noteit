import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, id } = await req.json();
    if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

    const userId = session.user.id;

    if (type === "notebook") {
        // Check if the notebook's parent is also deleted
        const notebookToRestore = await prisma.notebook.findFirst({
            where: { id, userId, isDeleted: true },
            select: { parentId: true },
        });

        if (!notebookToRestore) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // If it has a parent, check whether that parent is still deleted
        let detachFromParent = false;
        if (notebookToRestore.parentId) {
            const parent = await prisma.notebook.findFirst({
                where: { id: notebookToRestore.parentId, userId },
                select: { isDeleted: true },
            });
            // Parent is deleted or missing — restore as root so it's visible
            if (!parent || parent.isDeleted) {
                detachFromParent = true;
            }
        }

        const notebook = await prisma.notebook.updateMany({
            where: { id, userId, isDeleted: true },
            data: {
                isDeleted: false,
                deletedAt: null,
                ...(detachFromParent ? { parentId: null } : {}),
            },
        });

        if (notebook.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Restore all notes that belonged to this notebook
        await prisma.note.updateMany({
            where: { notebookId: id, userId, isDeleted: true },
            data: { isDeleted: false, deletedAt: null },
        });
    } else if (type === "note") {
        const note = await prisma.note.updateMany({
            where: { id, userId, isDeleted: true },
            data: { isDeleted: false, deletedAt: null },
        });

        if (note.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    } else {
         return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}