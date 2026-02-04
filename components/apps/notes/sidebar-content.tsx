import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { NoteItem } from "./note-item";
import { Note } from "@/lib/notes/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableNoteItem } from "./sortable-note-item";

interface SidebarContentProps {
  notes: Note[];
  selectedNoteSlug: string | null;
  onNoteSelect: (note: Note) => void;
  sessionId: string;
  handlePinToggle: (slug: string) => void;
  pinnedNotes: Set<string>;
  localSearchResults: Note[] | null;
  highlightedIndex: number;
  handleNoteDelete: (note: Note) => Promise<void>;
  openSwipeItemSlug: string | null;
  setOpenSwipeItemSlug: React.Dispatch<React.SetStateAction<string | null>>;
  clearSearch: () => void;
  setSelectedNoteSlug: (slug: string | null) => void;
  useCallbackNavigation?: boolean;
  isMobile?: boolean;
  onReorder: (notes: Note[]) => void;
}

export function SidebarContent({
  notes,
  selectedNoteSlug,
  onNoteSelect,
  sessionId,
  handlePinToggle,
  pinnedNotes,
  localSearchResults,
  highlightedIndex,
  handleNoteDelete,
  openSwipeItemSlug,
  setOpenSwipeItemSlug,
  clearSearch,
  setSelectedNoteSlug,
  useCallbackNavigation = false,
  isMobile = false,
  onReorder,
}: SidebarContentProps) {
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePinToggleWithClear = useCallback(
    (slug: string) => {
      clearSearch();
      handlePinToggle(slug);
    },
    [clearSearch, handlePinToggle]
  );

  const handleEdit = useCallback(
    (slug: string) => {
      clearSearch();
      if (isMobile) {
        const note = notes.find((n) => n.slug === slug);
        if (note) onNoteSelect(note);
      } else {
        router.push(`/notes/${slug}`);
        setSelectedNoteSlug(slug);
      }
    },
    [clearSearch, router, setSelectedNoteSlug, isMobile, notes, onNoteSelect]
  );

  const handleDelete = useCallback(
    async (note: Note) => {
      clearSearch();
      await handleNoteDelete(note);
    },
    [clearSearch, handleNoteDelete]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = notes.findIndex((note) => note.slug === active.id);
        const newIndex = notes.findIndex((note) => note.slug === over.id);
        const newNotes = arrayMove(notes, oldIndex, newIndex);
        onReorder(newNotes);
      }
    },
    [notes, onReorder]
  );

  const noteIds = useMemo(() => notes.map((note) => note.slug), [notes]);

  return (
    <div className="py-2">
      {localSearchResults === null ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
            <ul>
              {notes.map((item: Note, index: number) => (
                <SortableNoteItem
                  key={item.slug}
                  item={item}
                  selectedNoteSlug={selectedNoteSlug}
                  sessionId={sessionId}
                  onNoteSelect={onNoteSelect}
                  handlePinToggle={handlePinToggle}
                  isPinned={pinnedNotes.has(item.slug)}
                  isHighlighted={false}
                  isSearching={false}
                  handleNoteDelete={handleNoteDelete}
                  onNoteEdit={handleEdit}
                  openSwipeItemSlug={openSwipeItemSlug}
                  setOpenSwipeItemSlug={setOpenSwipeItemSlug}
                  showDivider={index < notes.length - 1}
                  useCallbackNavigation={useCallbackNavigation}
                  isMobile={isMobile}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : localSearchResults.length > 0 ? (
        <ul>
          {localSearchResults.map((item: Note, index: number) => (
            <NoteItem
              key={item.id}
              item={item}
              selectedNoteSlug={selectedNoteSlug}
              sessionId={sessionId}
              onNoteSelect={onNoteSelect}
              handlePinToggle={handlePinToggleWithClear}
              isPinned={pinnedNotes.has(item.slug)}
              isHighlighted={index === highlightedIndex}
              isSearching={true}
              handleNoteDelete={handleDelete}
              onNoteEdit={handleEdit}
              openSwipeItemSlug={openSwipeItemSlug}
              setOpenSwipeItemSlug={setOpenSwipeItemSlug}
              showDivider={index < localSearchResults.length - 1}
              useCallbackNavigation={useCallbackNavigation}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground px-2 mt-4">No results found</p>
      )}
    </div>
  );
}
