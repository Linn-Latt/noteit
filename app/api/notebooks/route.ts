import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, parentId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    try {
        const notebook = await prisma.notebook.create({
            data: { 
                name: name.trim(), 
                userId: session.user.id,
                ...(parentId ? { parentId } : {}), 
            },
        });

        return NextResponse.json(notebook, { status: 201 });
    } catch (err) {
        console.error("POST /api/notebooks error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}