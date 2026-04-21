import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    // Protect the endpoint so only Vercel cron can call it
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const [deletedNotes, deletedNotebooks] = await Promise.all([
        prisma.note.deleteMany({
            where: { isDeleted: true, deletedAt: { lte: cutoff } },
        }),
        prisma.notebook.deleteMany({
            where: { isDeleted: true, deletedAt: { lte: cutoff } },
        }),
    ]);

    return NextResponse.json({
        deletedNotes: deletedNotes.count,
        deletedNotebooks: deletedNotebooks.count,
    });
}
