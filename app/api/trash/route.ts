import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [notes, notebooks] = await Promise.all([
        prisma.note.findMany({
            where: { userId: session.user.id, isDeleted: true },
            select: { id: true, title: true, deletedAt: true },
            orderBy: { deletedAt: "desc" },
        }),

        prisma.notebook.findMany({
            where: { userId: session.user.id, isDeleted: true },
            select: { id: true, name: true, deletedAt: true },
            orderBy: { deletedAt: "desc" },
        })
    ]);

    return NextResponse.json({ notes, notebooks });
}
