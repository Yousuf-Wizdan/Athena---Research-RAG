import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: threadId } = await params;

    // Verify ownership
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.userId !== user.id) {
      return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Messages GET error:", error);
    return NextResponse.json(
      { error: "Failed to load messages." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: threadId } = await params;
    const { role, content, sources } = await req.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required." },
        { status: 400 }
      );
    }

    // Verify ownership
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.userId !== user.id) {
      return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        threadId,
        role,
        content,
        sources: sources || null,
      },
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Message POST error:", error);
    return NextResponse.json(
      { error: "Failed to save message." },
      { status: 500 }
    );
  }
}
