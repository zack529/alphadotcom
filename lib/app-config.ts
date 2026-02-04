import { AppConfig } from "@/types/apps";

export const APPS: AppConfig[] = [
  {
    id: "notes",
    name: "Notes",
    icon: "/notes.svg",
    description: "Personal notes and thoughts",
    accentColor: "#FFCC00",
    defaultPosition: { x: 100, y: 50 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 600, height: 400 },
    menuBarTitle: "Notes",
  },
  {
    id: "settings",
    name: "Settings",
    icon: "/settings.svg",
    description: "System preferences",
    accentColor: "#8E8E93",
    defaultPosition: { x: 200, y: 100 },
    defaultSize: { width: 900, height: 600 },
    minSize: { width: 700, height: 400 },
    menuBarTitle: "System Settings",
  },
];

export function getAppById(id: string): AppConfig | undefined {
  return APPS.find((app) => app.id === id);
}

export function getAppIds(): string[] {
  return APPS.map((app) => app.id);
}
