"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useContext,
} from "react";
import { usePathname } from "next/navigation";
import SessionId from "./session-id";
import { useRouter } from "next/navigation";
import { SidebarContent } from "./sidebar-content";
import { SearchBar } from "./search";
import { createClient } from "@/utils/supabase/client";
import { Note } from "@/lib/notes/types";
import { toast } from "@/hooks/use-toast";
import { SessionNotesContext } from "@/app/(desktop)/notes/session-notes";
import { Nav } from "./nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";
import { useFileMenu } from "@/lib/file-menu-context";
import { createNote } from "@/lib/notes/create-note";

const NOTE_ORDER_KEY = "noteOrder";

export default function Sidebar({
  notes: publicNotes,
  onNoteSelect,
  isMobile,
  selectedSlug: externalSelectedSlug,
  useCallbackNavigation = false,
  onNoteCreated,
  dialogContainer,
}: {
  notes: any[];
  onNoteSelect: (note: any) => void;
  isMobile: boolean;
  selectedSlug?: string | null;
  useCallbackNavigation?: boolean;
  onNoteCreated?: (note: any) => void;
  dialogContainer?: HTMLElement | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedNoteSlug, setSelectedNoteSlug] = useState<string | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearchResults, setLocalSearchResults] = useState<any[] | null>(
    null
  );
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [openSwipeItemSlug, setOpenSwipeItemSlug] = useState<string | null>(
    null
  );
  const [highlightedNote, setHighlightedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteOrder, setNoteOrder] = useState<string[]>([]);

  const windowFocus = useWindowFocus();
  const fileMenu = useFileMenu();

  const selectedNoteRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const {
    notes: sessionNotes,
    sessionId,
    setSessionId,
    refreshSessionNotes,
  } = useContext(SessionNotesContext);

  // Combine public and session notes
  const allNotes = useMemo(
    () => [...publicNotes, ...sessionNotes],
    [publicNotes, sessionNotes]
  );

  // Filter to user-visible notes
  const visibleNotes = useMemo(
    () => allNotes.filter((note) => note.public || note.session_id === sessionId),
    [allNotes, sessionId]
  );

  // Load note order from localStorage
  useEffect(() => {
    const storedOrder = localStorage.getItem(NOTE_ORDER_KEY);
    if (storedOrder) {
      setNoteOrder(JSON.parse(storedOrder));
    }
  }, []);

  // Sort notes based on saved order, with pinned notes at top, then new notes, then ordered
  const orderedNotes = useMemo(() => {
    const orderMap = new Map(noteOrder.map((slug, index) => [slug, index]));

    // Separate notes into pinned, ordered, and new (unordered)
    const pinnedList: Note[] = [];
    const orderedList: Note[] = [];
    const newNotes: Note[] = [];

    visibleNotes.forEach((note) => {
      if (pinnedNotes.has(note.slug)) {
        pinnedList.push(note);
      } else if (orderMap.has(note.slug)) {
        orderedList.push(note);
      } else {
        newNotes.push(note);
      }
    });

    // Sort pinned notes by their saved position (or created_at if not in order)
    pinnedList.sort((a, b) => {
      const aIndex = orderMap.get(a.slug);
      const bIndex = orderMap.get(b.slug);
      if (aIndex !== undefined && bIndex !== undefined) {
        return aIndex - bIndex;
      }
      return b.created_at.localeCompare(a.created_at);
    });

    // Sort ordered notes by their saved position
    orderedList.sort((a, b) => {
      const aIndex = orderMap.get(a.slug) ?? 0;
      const bIndex = orderMap.get(b.slug) ?? 0;
      return aIndex - bIndex;
    });

    // New notes sorted by created_at (newest first)
    newNotes.sort((a, b) => b.created_at.localeCompare(a.created_at));

    // Pinned at top, then new notes, then ordered notes
    return [...pinnedList, ...newNotes, ...orderedList];
  }, [visibleNotes, noteOrder, pinnedNotes]);

  // Handle reordering
  const handleReorder = useCallback((reorderedNotes: Note[]) => {
    const newOrder = reorderedNotes.map((note) => note.slug);
    setNoteOrder(newOrder);
    localStorage.setItem(NOTE_ORDER_KEY, JSON.stringify(newOrder));
  }, []);

  useEffect(() => {
    if (selectedNoteSlug && scrollViewportRef.current) {
      const selectedElement = scrollViewportRef.current.querySelector(`[data-note-slug="${selectedNoteSlug}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedNoteSlug]);

  useEffect(() => {
    if (selectedNoteRef.current) {
      selectedNoteRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedNoteSlug, highlightedIndex]);

  useEffect(() => {
    // Use external selectedSlug prop if provided (for desktop environment)
    if (externalSelectedSlug !== undefined) {
      setSelectedNoteSlug(externalSelectedSlug);
    } else if (pathname) {
      const slug = pathname.split("/").pop();
      setSelectedNoteSlug(slug || null);
    }
  }, [pathname, externalSelectedSlug]);

  useEffect(() => {
    if (selectedNoteSlug) {
      const note = orderedNotes.find((note) => note.slug === selectedNoteSlug);
      setSelectedNote(note || null);
    } else {
      setSelectedNote(null);
    }
  }, [selectedNoteSlug, orderedNotes]);

  useEffect(() => {
    const storedPinnedNotes = localStorage.getItem("pinnedNotes");
    if (storedPinnedNotes) {
      setPinnedNotes(new Set(JSON.parse(storedPinnedNotes)));
    }
  }, []);

  useEffect(() => {
    if (localSearchResults && localSearchResults.length > 0) {
      setHighlightedNote(localSearchResults[highlightedIndex]);
    } else {
      setHighlightedNote(selectedNote);
    }
  }, [localSearchResults, highlightedIndex, selectedNote]);

  const clearSearch = useCallback(() => {
    setLocalSearchResults(null);
    setSearchQuery("");
    setHighlightedIndex(0);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }, [setLocalSearchResults, setHighlightedIndex]);

  const navigateNotes = useCallback(
    (direction: "up" | "down") => {
      if (!localSearchResults) {
        const currentIndex = orderedNotes.findIndex(
          (note) => note.slug === selectedNoteSlug
        );

        let nextIndex;
        if (direction === "up") {
          nextIndex =
            currentIndex > 0 ? currentIndex - 1 : orderedNotes.length - 1;
        } else {
          nextIndex =
            currentIndex < orderedNotes.length - 1 ? currentIndex + 1 : 0;
        }

        const nextNote = orderedNotes[nextIndex];

        if (nextNote) {
          if (useCallbackNavigation) {
            onNoteSelect(nextNote);
          } else {
            router.push(`/notes/${nextNote.slug}`);
          }
          setTimeout(() => {
            const selectedElement = document.querySelector(`[data-note-slug="${nextNote.slug}"]`);
            if (selectedElement) {
              selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 100);
        }
      }
    },
    [orderedNotes, selectedNoteSlug, router, localSearchResults, useCallbackNavigation, onNoteSelect]
  );

  const handlePinToggle = useCallback(
    (slug: string, silent: boolean = false) => {
      let isPinning = false;
      setPinnedNotes((prev) => {
        const newPinned = new Set(prev);
        isPinning = !newPinned.has(slug);
        if (isPinning) {
          newPinned.add(slug);
        } else {
          newPinned.delete(slug);
        }
        localStorage.setItem(
          "pinnedNotes",
          JSON.stringify(Array.from(newPinned))
        );
        return newPinned;
      });

      clearSearch();

      if (!isMobile && !useCallbackNavigation) {
        router.push(`/notes/${slug}`);
      } else if (useCallbackNavigation && !isMobile) {
        const note = orderedNotes.find((n) => n.slug === slug);
        if (note) onNoteSelect(note);
      }

      if (!silent && !isMobile) {
        toast({
          description: isPinning ? "Note pinned" : "Note unpinned",
        });
      }
    },
    [router, isMobile, useCallbackNavigation, clearSearch, orderedNotes, onNoteSelect]
  );

  const handleNoteDelete = useCallback(
    async (noteToDelete: Note) => {
      if (noteToDelete.public) {
        if (!isMobile) {
          toast({
            description: "Oops! You can't delete public notes",
          });
        }
        return;
      }

      try {
        if (noteToDelete.id && sessionId) {
          await supabase.rpc("delete_note", {
            uuid_arg: noteToDelete.id,
            session_arg: sessionId,
          });
        }

        // Remove from order
        setNoteOrder((prev) => {
          const newOrder = prev.filter((slug) => slug !== noteToDelete.slug);
          localStorage.setItem(NOTE_ORDER_KEY, JSON.stringify(newOrder));
          return newOrder;
        });

        const deletedNoteIndex = orderedNotes.findIndex(
          (note) => note.slug === noteToDelete.slug
        );

        let nextNote;
        if (deletedNoteIndex === 0) {
          nextNote = orderedNotes[1];
        } else {
          nextNote = orderedNotes[deletedNoteIndex - 1];
        }

        if (!isMobile && !useCallbackNavigation) {
          router.push(nextNote ? `/notes/${nextNote.slug}` : "/notes");
        } else if (useCallbackNavigation && !isMobile && nextNote) {
          onNoteSelect(nextNote);
        }

        clearSearch();
        refreshSessionNotes();
        if (!useCallbackNavigation) {
          router.refresh();
        }

        if (!isMobile) {
          toast({
            description: "Note deleted",
          });
        }
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    },
    [
      supabase,
      sessionId,
      orderedNotes,
      isMobile,
      useCallbackNavigation,
      clearSearch,
      refreshSessionNotes,
      router,
      onNoteSelect,
    ]
  );

  const goToHighlightedNote = useCallback(() => {
    if (localSearchResults && localSearchResults[highlightedIndex]) {
      const selectedNote = localSearchResults[highlightedIndex];
      if (useCallbackNavigation) {
        onNoteSelect(selectedNote);
      } else {
        router.push(`/notes/${selectedNote.slug}`);
      }
      setTimeout(() => {
        const selectedElement = document.querySelector(`[data-note-slug="${selectedNote.slug}"]`);
        selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
      clearSearch();
    }
  }, [localSearchResults, highlightedIndex, router, clearSearch, useCallbackNavigation, onNoteSelect]);

  // Register file menu actions for desktop menubar
  useEffect(() => {
    if (!fileMenu) return;

    fileMenu.registerNotesActions({
      onNewNote: () => {
        createNote(
          sessionId,
          router,
          handlePinToggle,
          refreshSessionNotes,
          setSelectedNoteSlug,
          isMobile,
          useCallbackNavigation,
          onNoteCreated
        );
      },
      onPinNote: () => {
        if (highlightedNote) {
          handlePinToggle(highlightedNote.slug);
        }
      },
      onDeleteNote: () => {
        if (highlightedNote) {
          handleNoteDelete(highlightedNote);
        }
      },
    });

    return () => {
      fileMenu.unregisterNotesActions();
    };
  }, [fileMenu, router, setSelectedNoteSlug, sessionId, handlePinToggle, refreshSessionNotes, isMobile, useCallbackNavigation, onNoteCreated, highlightedNote, handleNoteDelete]);

  // Update file menu state when highlighted note or pinned status changes
  useEffect(() => {
    if (!fileMenu) return;
    const isPinned = highlightedNote ? pinnedNotes.has(highlightedNote.slug) : false;
    fileMenu.updateNotesState({ noteIsPinned: isPinned });
  }, [fileMenu, highlightedNote, pinnedNotes]);

  useEffect(() => {
    const shortcuts = {
      j: () => navigateNotes("down"),
      ArrowDown: () => navigateNotes("down"),
      k: () => navigateNotes("up"),
      ArrowUp: () => navigateNotes("up"),
      p: () => highlightedNote && handlePinToggle(highlightedNote.slug),
      d: () => highlightedNote && handleNoteDelete(highlightedNote),
      "/": () => searchInputRef.current?.focus(),
      Escape: () => (document.activeElement as HTMLElement)?.blur(),
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (windowFocus) {
        if (!windowFocus.isFocused) return;
      } else {
        if (!target.closest('[data-app="notes"]')) return;
      }

      const isTyping =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      if (isTyping) {
        if (event.key === "Escape") {
          shortcuts["Escape"]();
        } else if (
          event.key === "Enter" &&
          localSearchResults &&
          localSearchResults.length > 0
        ) {
          event.preventDefault();
          goToHighlightedNote();
        }
        return;
      }

      const key = event.key as keyof typeof shortcuts;
      if (shortcuts[key] && !(event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();

        if (
          localSearchResults &&
          ["j", "ArrowDown", "k", "ArrowUp"].includes(key)
        ) {
          const direction = ["j", "ArrowDown"].includes(key) ? 1 : -1;
          setHighlightedIndex(
            (prevIndex) =>
              (prevIndex + direction + localSearchResults.length) %
              localSearchResults.length
          );
        } else {
          shortcuts[key]();
        }
      } else if (
        event.key === "Enter" &&
        localSearchResults &&
        localSearchResults.length > 0
      ) {
        event.preventDefault();
        goToHighlightedNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    navigateNotes,
    highlightedNote,
    handlePinToggle,
    localSearchResults,
    setHighlightedIndex,
    handleNoteDelete,
    goToHighlightedNote,
    windowFocus,
  ]);

  const handleNoteSelect = useCallback(
    (note: any) => {
      onNoteSelect(note);
      if (!isMobile && !useCallbackNavigation) {
        router.push(`/notes/${note.slug}`);
      }
      clearSearch();
    },
    [clearSearch, onNoteSelect, isMobile, useCallbackNavigation, router]
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        isMobile
          ? "w-full max-w-full bg-background"
          : "w-[320px] border-r border-muted-foreground/20 bg-muted"
      )}
    >
      <Nav
        addNewPinnedNote={handlePinToggle}
        clearSearch={clearSearch}
        setSelectedNoteSlug={setSelectedNoteSlug}
        isMobile={isMobile}
        isScrolled={isScrolled}
        useCallbackNavigation={useCallbackNavigation}
        onNoteCreated={onNoteCreated}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full"
        onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
          const viewport = e.currentTarget.querySelector(
            '[data-radix-scroll-area-viewport]'
          );
          if (viewport) {
            const scrolled = viewport.scrollTop > 0;
            setIsScrolled(scrolled);
          }
        }}
        isMobile={isMobile}
        bottomMargin="0px"
      >
        <div ref={scrollViewportRef} className="flex flex-col w-full">
          <SessionId setSessionId={setSessionId} />
          <div className={`${isMobile ? "w-full" : "w-[320px]"} px-2`}>
            <SearchBar
              notes={allNotes}
              onSearchResults={setLocalSearchResults}
              sessionId={sessionId}
              inputRef={searchInputRef}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setHighlightedIndex={setHighlightedIndex}
              clearSearch={clearSearch}
            />
            <SidebarContent
              notes={orderedNotes}
              selectedNoteSlug={selectedNoteSlug}
              onNoteSelect={handleNoteSelect}
              sessionId={sessionId}
              handlePinToggle={handlePinToggle}
              pinnedNotes={pinnedNotes}
              localSearchResults={localSearchResults}
              highlightedIndex={highlightedIndex}
              handleNoteDelete={handleNoteDelete}
              openSwipeItemSlug={openSwipeItemSlug}
              setOpenSwipeItemSlug={setOpenSwipeItemSlug}
              clearSearch={clearSearch}
              setSelectedNoteSlug={setSelectedNoteSlug}
              useCallbackNavigation={useCallbackNavigation}
              isMobile={isMobile}
              onReorder={handleReorder}
            />
          </div>
        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
