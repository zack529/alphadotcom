import { redirect } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function Home() {
  redirect("/notes/about-me");
}
