"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NoteItem } from "./note-item";
import { Note } from "@/lib/notes/types";
import { Dispatch, SetStateAction } from "react";

interface SortableNoteItemProps {
  item: Note;
  selectedNoteSlug: string | null;
  sessionId: string;
  onNoteSelect: (note: Note) => void;
  onNoteEdit: (slug: string) => void;
  handlePinToggle: (slug: string) => void;
  isPinned: boolean;
  isHighlighted: boolean;
  isSearching: boolean;
  handleNoteDelete: (note: Note) => Promise<void>;
  openSwipeItemSlug: string | null;
  setOpenSwipeItemSlug: Dispatch<SetStateAction<string | null>>;
  showDivider?: boolean;
  useCallbackNavigation?: boolean;
  isMobile?: boolean;
}

export function SortableNoteItem({
  item,
  isMobile = false,
  ...props
}: SortableNoteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  // On mobile, don't use drag (conflicts with swipe)
  if (isMobile) {
    return <NoteItem item={item} {...props} />;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <NoteItem item={item} {...props} />
    </div>
  );
}
