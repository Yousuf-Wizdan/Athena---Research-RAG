import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threads = await prisma.thread.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ threads });
  } catch (error: any) {
    console.error("Threads GET error:", error);
    return NextResponse.json(
      { error: "Failed to load chat history threads." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();
    const threadTitle = title && title.trim() !== "" ? title.trim() : "New Research Session";

    const thread = await prisma.thread.create({
      data: {
        title: threadTitle,
        userId: user.id,
      },
    });

    return NextResponse.json({ thread });
  } catch (error: any) {
    console.error("Thread POST error:", error);
    return NextResponse.json(
      { error: "Failed to create thread." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thread ID is required." }, { status: 400 });
    }

    // Verify ownership
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread || thread.userId !== user.id) {
      return NextResponse.json({ error: "Thread not found or forbidden." }, { status: 404 });
    }

    await prisma.thread.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Thread DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete thread." },
      { status: 500 }
    );
  }
}
