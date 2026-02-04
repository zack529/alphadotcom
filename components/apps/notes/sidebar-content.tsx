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

type DateCategory = "pinned" | "today" | "yesterday" | "previous7" | "previous30" | "older";

interface CategorizedNotes {
  pinned: Note[];
  today: Note[];
  yesterday: Note[];
  previous7: Note[];
  previous30: Note[];
  older: Note[];
}

const categoryLabels: Record<DateCategory, string> = {
  pinned: "Pinned",
  today: "Today",
  yesterday: "Yesterday",
  previous7: "Previous 7 Days",
  previous30: "Previous 30 Days",
  older: "Older",
};

function getDateCategory(dateStr: string): Exclude<DateCategory, "pinned"> {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (date >= today) return "today";
  if (date >= yesterday) return "yesterday";
  if (date >= sevenDaysAgo) return "previous7";
  if (date >= thirtyDaysAgo) return "previous30";
  return "older";
}

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
  isAdmin?: boolean;
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
  isAdmin = false,
}: SidebarContentProps) {
  const router = useRouter();

  // Only enable drag sensors for admin users
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isAdmin ? 8 : 99999, // Effectively disable for non-admin
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
      // Only allow reordering if admin
      if (!isAdmin) return;

      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = notes.findIndex((note) => note.slug === active.id);
        const newIndex = notes.findIndex((note) => note.slug === over.id);
        const newNotes = arrayMove(notes, oldIndex, newIndex);
        onReorder(newNotes);
      }
    },
    [notes, onReorder, isAdmin]
  );

  const noteIds = useMemo(() => notes.map((note) => note.slug), [notes]);

  // Group notes by date category
  const categorizedNotes = useMemo(() => {
    const categories: CategorizedNotes = {
      pinned: [],
      today: [],
      yesterday: [],
      previous7: [],
      previous30: [],
      older: [],
    };

    notes.forEach((note) => {
      if (pinnedNotes.has(note.slug)) {
        categories.pinned.push(note);
      } else {
        const category = getDateCategory(note.created_at);
        categories[category].push(note);
      }
    });

    return categories;
  }, [notes, pinnedNotes]);

  // Get ordered list of non-empty categories
  const activeCategories = useMemo(() => {
    const order: DateCategory[] = ["pinned", "today", "yesterday", "previous7", "previous30", "older"];
    return order.filter((cat) => categorizedNotes[cat].length > 0);
  }, [categorizedNotes]);

  return (
    <div className="py-2">
      {localSearchResults === null ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={noteIds} strategy={verticalListSortingStrategy}>
            {activeCategories.map((category, catIndex) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category]}
                </div>
                <ul>
                  {categorizedNotes[category].map((item: Note, index: number) => (
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
                      showDivider={index < categorizedNotes[category].length - 1}
                      useCallbackNavigation={useCallbackNavigation}
                      isMobile={isMobile}
                      isAdmin={isAdmin}
                    />
                  ))}
                </ul>
              </div>
            ))}
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
              isAdmin={isAdmin}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground px-2 mt-4">No results found</p>
      )}
    </div>
  );
}
