import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/sidebar-data?parentId=<id|null>&page=1&limit=20
// Returns notebooks + notes for a given parentId in one request.
export async function GET(req: Request) {
    const requestStart = performance.now();

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log("[sidebar-data] Auth:", Math.round(performance.now() - requestStart), "ms");

    const { searchParams } = new URL(req.url);
    const parentIdParam = searchParams.get("parentId");
    const parentId = (parentIdParam === "null" || parentIdParam == null) ? null : parentIdParam;

    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const skip  = (page - 1) * limit;

    const userId = session.user.id;

    try {
        const queryStart = performance.now();
        const [notebooks, total, notes] = await Promise.all([
            prisma.notebook.findMany({
                where: { userId, parentId, isDeleted: false },
                orderBy: { createdAt: "asc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    parentId: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { children: true } },
                },
            }),
            prisma.notebook.count({
                where: { userId, parentId, isDeleted: false },
            }),
            prisma.note.findMany({
                where: { userId, notebookId: parentId, isDeleted: false },
                orderBy: { createdAt: "asc" },
                select: { id: true, title: true },
            }),
        ]);

        console.log("[sidebar-data] DB queries:", Math.round(performance.now() - queryStart), "ms");
        console.log("[sidebar-data] Total:", Math.round(performance.now() - requestStart), "ms");

        return NextResponse.json({
            notebooks,
            pagination: { page, limit, total, hasMore: skip + notebooks.length < total },
            notes,
        });
    } catch (err) {
        console.error("GET /api/sidebar-data error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
