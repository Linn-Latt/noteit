import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    try {
        const notebook = await prisma.notebook.updateMany({
            where: { id, userId: session.user.id, isDeleted: false },
            data: { name: name.trim() },
        });

        if (notebook.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PATCH /api/notebooks/[id] error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;

    try {
        // Verify the target notebook exists and belongs to the user
        const notebook = await prisma.notebook.updateMany({
            where: { id, userId, isDeleted: false },
            data: { isDeleted: true, deletedAt: new Date() },
        });

        if (notebook.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Collect all descendant notebook IDs using breadth-first traversal
        const allDescendantIds: string[] = [];
        const queue: string[] = [id];

        while (queue.length > 0) {
            const parentIds = queue.splice(0, queue.length);

            const children = await prisma.notebook.findMany({
                where: { parentId: { in: parentIds }, userId, isDeleted: false },
                select: { id: true },
            });

            const childIds = children.map(c => c.id);
            if (childIds.length === 0) break;

            allDescendantIds.push(...childIds);
            queue.push(...childIds);
        }

        // Soft-delete all descendant notebooks
        if (allDescendantIds.length > 0) {
            await prisma.notebook.updateMany({
                where: { id: { in: allDescendantIds }, userId },
                data: { isDeleted: true, deletedAt: new Date() },
            });
        }

        // Soft-delete all notes in the deleted notebook and all its descendants
        const notebookIds = [id, ...allDescendantIds];
        await prisma.note.updateMany({
            where: { notebookId: { in: notebookIds }, userId, isDeleted: false },
            data: { isDeleted: true, deletedAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/notebooks/[id] error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
