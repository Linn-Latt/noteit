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
        const notebook = await prisma.notebook.updateMany({
            where: { id, userId, isDeleted: true },
            data: { isDeleted: false, deletedAt: null },
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