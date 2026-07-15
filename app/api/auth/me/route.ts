import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Me session error:", error);
    return NextResponse.json(
      { error: "Failed to verify session." },
      { status: 500 }
    );
  }
}
