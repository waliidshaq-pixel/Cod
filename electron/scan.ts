// ===== FILE: electron/scan.ts =====
import type { Post } from "./steam";
import fs from "node:fs";
import path from "node:path";

function exists(p: string) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/** Minimal “lokal scan” – læg selv flere ind senere */
export async function scanAll(): Promise<Post[]> {
  const entries: { title: string; exe?: string }[] = [];

  // Discord
  const discord = path.join(process.env.LOCALAPPDATA || "", "Discord", "Update.exe");
  if (exists(discord)) entries.push({ title: "Discord", exe: discord });

  // Google Chrome
  const chrome = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe");
  if (exists(chrome)) entries.push({ title: "Google Chrome", exe: chrome });

  // Steam
  const steam = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Steam", "steam.exe");
  if (exists(steam)) entries.push({ title: "Steam", exe: steam });

  // Epic Games Launcher
  const epic = path.join(process.env.PROGRAMFILES || "C:\\Program Files", "Epic Games", "Launcher", "Portal", "Binaries", "Win64", "EpicGamesLauncher.exe");
  if (exists(epic)) entries.push({ title: "Epic Games Launcher", exe: epic });

  return entries.map((e, i) => ({
    id: `local-${i}-${e.title}`,
    title: e.title,
    kind: "app",
    platform: "Local",
    installed: true,
    exePath: e.exe,
  }));
}
