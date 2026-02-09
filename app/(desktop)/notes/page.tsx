import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { NotesDesktopPage } from "./[slug]/notes-desktop-page";

export const metadata: Metadata = {
  title: "Notes",
  description: `Browse notes from ${siteConfig.name} — film financing, production insights, and more.`,
  alternates: {
    canonical: `${siteConfig.url}/notes`,
  },
  openGraph: {
    title: "Notes",
    description: `Browse notes from ${siteConfig.name}.`,
    url: `${siteConfig.url}/notes`,
    images: [
      `/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`,
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Notes | ${siteConfig.name}`,
    description: `Browse notes from ${siteConfig.name}.`,
    images: [
      `/notes/api/og/?title=${encodeURIComponent("notes")}&emoji=${encodeURIComponent("✏️")}`,
    ],
  },
};

export default function NotesPage() {
  // On mobile: shows sidebar (no note selected)
  // On desktop: shows notes window with about-me selected
  return <NotesDesktopPage />;
}
