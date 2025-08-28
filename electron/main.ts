// ===== FILE: electron/main.ts =====
import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "node:path";
import fs from "node:fs";

import * as steam from "./steam";
import * as epic from "./epic";
import { scanAll } from "./scan";

let win: BrowserWindow | null = null;

// ---------------- Config (AppData\lawid-launcher\config.json) ----------------
function appDataDir() {
  const base = app.getPath("appData");
  const dir = path.join(base, "lawid-launcher");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
const CONFIG_PATH = path.join(appDataDir(), "config.json");

type Cfg = {
  steamApiKey?: string;
  steamId64?: string;
  fullscreen?: boolean;
  customApps?: Array<{ id: string; title: string; isGame: boolean; exePath: string; cover?: string }>;
};

function readCfg(): Cfg {
  try {
    const t = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(t || "{}");
  } catch {
    return {};
  }
}
function writeCfg(next: Cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
  return true;
}

// ---------------- Create window ----------------
async function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0b1220",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Dev server url (vite) i dev, ellers load file i prod
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    await win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ---------------- IPC: CONFIG ----------------
ipcMain.handle("lawid:config:get", async () => readCfg());
ipcMain.handle("lawid:config:set", async (_e, cfg: Cfg) => writeCfg(cfg));

// ---------------- IPC: SCAN (lokale apps/spil) ----------------
ipcMain.handle("lawid:scan:all", async () => scanAll());

// ---------------- IPC: STEAM ----------------
// Library
ipcMain.handle("lawid:steam:library", async (_e, p: { apiKey: string; steamId64: string }) => {
  return steam.buildSteamLibraryPosts(p.apiKey, p.steamId64);
});

// Friends (online/offline)
ipcMain.handle("lawid:steam:friendsOnline", async (_e, p: { apiKey: string; steamId64: string; mode: "all" | "in-game" }) => {
  return steam.getFriends(p.apiKey, p.steamId64, p.mode);
});

// Open chat
ipcMain.handle("lawid:steam:openChat", async (_e, steamId64: string) => {
  return steam.openChat(steamId64);
});

// Launch Steam game
ipcMain.handle("lawid:steam:launch", async (_e, appid: string | number) => {
  const id = typeof appid === "string" ? parseInt(appid, 10) : appid;
  return steam.launch(id);
});

// ---------------- IPC: EPIC ----------------
ipcMain.handle("lawid:epic:status", async () => epic.status());
ipcMain.handle("lawid:epic:listInstalled", async () => epic.listInstalled());
ipcMain.handle("lawid:epic:listLibrary", async () => epic.listLibrary());

// login/logout (stubs i epic.ts – vi eksponerer dem, så UI kan kalde dem)
ipcMain.handle("lawid:epic:login", async () => epic.login());
ipcMain.handle("lawid:epic:logout", async () => epic.logout());

// launch/install/uninstall — vi sender {appName} fra renderer, men epic.ts tager en string
ipcMain.handle("lawid:epic:launch", async (_e, p: { appName: string }) => epic.launch(p.appName));
ipcMain.handle("lawid:epic:install", async (_e, p: { appName: string }) => epic.install(p.appName));
ipcMain.handle("lawid:epic:uninstall", async (_e, p: { appName: string }) => epic.uninstall(p.appName));

// Installer-bridge (UI kan kalde lawid:install:game med Post-objekt)
ipcMain.handle("lawid:install:game", async (_e, post: any) => {
  if (post?.kind === "epic" && post?.appName) return epic.install(post.appName);
  // Steam-install er typisk via Steam store, men hvis du vil: return steam.install(post.appid)
  return false;
});

// ---------------- IPC: COVER ----------------
ipcMain.handle("lawid:cover:pick", async () => {
  if (!win) return null;
  const res = await dialog.showOpenDialog(win, {
    title: "Vælg cover-billede",
    properties: ["openFile"],
    filters: [{ name: "Billeder", extensions: ["jpg", "jpeg", "png", "webp"] }],
  });
  if (res.canceled || !res.filePaths?.[0]) return null;
  return res.filePaths[0];
});

ipcMain.handle("lawid:cover:set", async (_e, p: { id: string; filePath: string }) => {
  // Du kan evt. kopiere filen til et assets-dir; her gemmer vi kun path’en i config.covers
  const cfg = readCfg();
  const covers = { ...(cfg as any).covers, [p.id]: p.filePath };
  writeCfg({ ...cfg, covers });
  return true;
});

// ---------------- UI helpers ----------------
ipcMain.handle("lawid:ui:addCustomApp", async () => {
  if (!win) return false;
  const res = await dialog.showOpenDialog(win, {
    title: "Vælg EXE/Genvej for app/spil",
    properties: ["openFile"],
    filters: [{ name: "Programmer", extensions: ["exe", "lnk", "url"] }],
  });
  if (res.canceled || !res.filePaths?.[0]) return false;

  const exePath = res.filePaths[0];
  const cfg = readCfg();
  const list = (cfg.customApps || []).slice();
  const id = "custom-" + Math.random().toString(36).slice(2, 9);
  list.push({ id, title: path.basename(exePath), isGame: true, exePath });
  writeCfg({ ...cfg, customApps: list });
  return true;
});

// (valgfrit) åbn links i ekstern browser
ipcMain.on("open-external", (_e, url) => shell.openExternal(url));
