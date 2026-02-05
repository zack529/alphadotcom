"use client";

import { useState, useEffect } from "react";
import { RecentsProvider } from "@/lib/recents-context";
import { NotesApp } from "@/components/apps/notes/notes-app";
import { SettingsApp } from "@/components/apps/settings/settings-app";

const DEFAULT_APP = "notes";

interface MobileShellProps {
  initialApp?: string;
  initialNoteSlug?: string;
}

export function MobileShell({ initialApp, initialNoteSlug }: MobileShellProps) {
  const [activeAppId, setActiveAppId] = useState<string>(initialApp || DEFAULT_APP);
  const [isHydrated, setIsHydrated] = useState(false);

  // Determine active app from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/settings")) {
      setActiveAppId("settings");
    } else if (path.startsWith("/notes")) {
      setActiveAppId("notes");
    } else if (initialApp) {
      setActiveAppId(initialApp);
    }
    setIsHydrated(true);
  }, [initialApp]);

  if (!isHydrated) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <RecentsProvider>
      <div className="h-dvh flex flex-col bg-background overflow-x-hidden">
        {activeAppId === "notes" && (
          <NotesApp isMobile={true} inShell={false} initialSlug={initialNoteSlug} />
        )}
        {activeAppId === "settings" && <SettingsApp isMobile={true} inShell={false} />}
      </div>
    </RecentsProvider>
  );
}
