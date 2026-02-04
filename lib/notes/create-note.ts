import { toast } from "@/hooks/use-toast";
import { Note } from "@/lib/notes/types";

export async function createNote(
  sessionId: string | null,
  router: any,
  _addNewPinnedNote: (slug: string, silent?: boolean) => void, // unused, kept for API compatibility
  refreshSessionNotes: () => Promise<void>,
  setSelectedNoteSlug: (slug: string | null) => void,
  isMobile: boolean,
  useCallbackNavigation: boolean = false,
  onNoteCreated?: (note: Note) => void
) {
  try {
    // Call server-side API to create note (uses admin client)
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create note");
    }

    const note = result.note;
    const slug = note.slug;

    if (useCallbackNavigation) {
      // Use callbacks instead of router navigation
      await refreshSessionNotes();
      setSelectedNoteSlug(slug);
      if (onNoteCreated) {
        onNoteCreated(note as Note);
      }
    } else {
      // Use router navigation (standalone browser mode)
      refreshSessionNotes().then(() => {
        setSelectedNoteSlug(slug);
        router.push(`/notes/${slug}`);
        router.refresh();
      });
    }

    if (!isMobile) {
      toast({
        description: "Private note created",
      });
    }
  } catch (error: any) {
    console.error("Error creating note:", error?.message || error);
    toast({
      variant: "destructive",
      description: error?.message || "Failed to create note",
    });
  }
}
