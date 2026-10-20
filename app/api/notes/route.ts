import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const requestStart = performance.now();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const afterAuth = performance.now();
    console.log(
        "[notes] Authentication:",
        Math.round(afterAuth - requestStart),
        "ms"
    );

    const { searchParams } = new URL(req.url);
    const notebookIdParam = searchParams.get("notebookId");
    // "null" = quick notes, missing = quick notes, anything else = that notebook's notes
    const notebookId = (notebookIdParam === "null" || notebookIdParam == null) ? null : notebookIdParam;

    try {
        const queryStart = performance.now();

        const notes = await prisma.note.findMany({
            where: { userId: session.user.id, notebookId, isDeleted: false },
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true },
        } as never);

        const afterQuery = performance.now();

        console.log("[notes] Prisma query:", {
            durationMs: Math.round(afterQuery - queryStart),
            count: notes.length,
        });

        console.log(
            "[notes] Total before response:",
            Math.round(performance.now() - requestStart),
            "ms"
        );

        return NextResponse.json(notes);
    } catch (err) {
        console.error("GET /api/notes error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { title, notebookId } = await req.json();
        const note = await prisma.note.create({
            data: {
                title: title?.trim() || "Untitled",
                content: "",
                user: { connect: { id: session.user.id } },
                notebook: notebookId ? { connect: { id: notebookId } } : undefined,
            },
        });
        return NextResponse.json(note, { status: 201 });
    } catch (err) {
        console.error("POST /api/notes error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

