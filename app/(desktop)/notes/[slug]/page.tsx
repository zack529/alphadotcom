import { cache } from "react";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Note as NoteType } from "@/lib/notes/types";
import { siteConfig } from "@/config/site";
import { NotesDesktopPage } from "./notes-desktop-page";

// Enable ISR with a reasonable revalidation period for public notes
export const revalidate = 86400; // 24 hours

// Cached function to fetch a note by slug - eliminates duplicate fetches
const getNote = cache(async (slug: string) => {
  const supabase = await createServerClient();
  const { data: note } = (await supabase
    .rpc("select_note", {
      note_slug_arg: slug,
    })
    .single()) as { data: NoteType | null };
  return note;
});

// Dynamically determine if this is a user note
export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase
    .from("notes")
    .select("slug")
    .eq("public", true);

  return posts!.map(({ slug }) => ({
    slug,
  }));
}

// Use dynamic rendering for non-public notes
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Strip HTML tags and truncate to a target length for meta descriptions. */
function makeDescription(content: string | null | undefined, maxLen = 155): string {
  if (!content) return "";
  const plain = content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen - 1).trimEnd() + "\u2026";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.replace(/^notes\//, "");
  const note = await getNote(cleanSlug);

  if (!note) {
    return { title: "Note not found" };
  }

  const title = note.title || "Untitled Note";
  const emoji = note.emoji || "";
  const description = makeDescription(note.content) || siteConfig.description;
  const ogImage = `/notes/api/og/?title=${encodeURIComponent(title)}&emoji=${encodeURIComponent(emoji)}`;
  const pageUrl = `${siteConfig.url}/notes/${cleanSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${emoji ? emoji + " " : ""}${title}`,
      description,
      url: pageUrl,
      type: "article",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${emoji ? emoji + " " : ""}${title}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/^notes\//, "");
  const note = await getNote(cleanSlug);

  // Invalid slug - redirect to error page
  if (!note) {
    return redirect("/notes/error");
  }

  const noteTitle = note.title || "Untitled Note";
  const noteContent = note.content || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: noteTitle,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    datePublished: note.created_at,
    url: `${siteConfig.url}/notes/${cleanSlug}`,
  };

  return (
    <>
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Server-rendered content for SEO crawlability */}
      <article
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        <h1>{note.emoji ? `${note.emoji} ` : ""}{noteTitle}</h1>
        <div dangerouslySetInnerHTML={{ __html: noteContent }} />
      </article>

      {/* Visual desktop / mobile UI */}
      <NotesDesktopPage slug={cleanSlug} />
    </>
  );
}
