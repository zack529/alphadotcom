import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, pinned, sort_order } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const updates: Record<string, any> = {};
    if (pinned !== undefined) updates.pinned = pinned;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ note: data });
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update note" },
      { status: 500 }
    );
  }
}
