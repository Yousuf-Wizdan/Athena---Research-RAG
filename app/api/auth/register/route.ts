import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed = name.trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    // Create user with hashed password
    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: emailTrimmed,
        password: hashedPassword,
        name: nameTrimmed,
      },
    });

    // Create session and set cookie
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: `Registration failed: ${error.message || error}` },
      { status: 500 }
    );
  }
}
