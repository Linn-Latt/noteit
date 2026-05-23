import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error } from "console";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const notebooks = await prisma.notebook.findMany({
            where: { userId: session.user.id, isDeleted: false },
            orderBy: { createdAt: "asc" },
            include: {
                notes: {
                    where: { isDeleted: false },
                    select: { id: true, title: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return NextResponse.json(notebooks);
    } catch (err) {
        console.error("GET /api/notebooks error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    try {
        const notebook = await prisma.notebook.create({
            data: { name: name.trim(), userId: session.user.id },
        });

        return NextResponse.json(notebook, { status: 201 });
    } catch (err) {
        console.error("POST /api/notebooks error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}