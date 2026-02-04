import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    const supabase = createAdminClient();
    const noteId = uuidv4();
    const slug = `new-note-${noteId}`;

    const note = {
      id: noteId,
      slug: slug,
      title: "",
      content: "",
      public: false,
      created_at: new Date().toISOString(),
      session_id: sessionId,
      category: "today",
      emoji: null,
    };

    const { data, error } = await supabase
      .from("notes")
      .insert(note)
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
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create note" },
      { status: 500 }
    );
  }
}
