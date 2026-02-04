import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteOrders } = body;

    if (!noteOrders || !Array.isArray(noteOrders)) {
      return NextResponse.json(
        { error: "noteOrders array is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update each note's sort_order
    const updates = noteOrders.map(
      ({ slug, sort_order }: { slug: string; sort_order: number }) =>
        supabase
          .from("notes")
          .update({ sort_order })
          .eq("slug", slug)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering notes:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reorder notes" },
      { status: 500 }
    );
  }
}
