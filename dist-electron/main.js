// ===== FILE: electron/main.ts =====
import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import * as steam from "./steam";
import * as epic from "./epic";
import { scanAll } from "./scan";
const isDev = !!process.env.VITE_DEV_SERVER_URL;
const preloadFile = path.join(__dirname, "preload.cjs"); // kopieres til dist-electron af build script
function cfgPath() {
    return path.join(app.getPath("userData"), "config.json");
}
function readCfg() {
    try {
        const raw = fs.readFileSync(cfgPath(), "utf8");
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
function writeCfg(c) {
    fs.mkdirSync(path.dirname(cfgPath()), { recursive: true });
    fs.writeFileSync(cfgPath(), JSON.stringify(c, null, 2), "utf8");
}
let win = null;
async function createWindow() {
    win = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: "#0b1220",
        webPreferences: {
            preload: preloadFile,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (isDev) {
        await win.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        await win.loadFile(path.join(__dirname, "../dist/index.html"));
    }
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
/* ---------- IPC ---------- */
// config
ipcMain.handle("lawid:config:get", async () => readCfg());
ipcMain.handle("lawid:config:set", async (_e, next) => {
    writeCfg(next || {});
});
// lokale apps
ipcMain.handle("lawid:scan:all", async () => scanAll());
// steam
ipcMain.handle("lawid:steam:library", async (_e, p) => steam.buildSteamLibraryPosts(p?.apiKey || "", p?.steamId64 || ""));
ipcMain.handle("lawid:steam:friendsOnline", async (_e, p) => steam.getFriends(p || {}));
ipcMain.handle("lawid:steam:openChat", async (_e, steamId64) => steam.openChat(steamId64));
ipcMain.handle("lawid:steam:launch", async (_e, appid) => steam.launch(appid));
// epic
ipcMain.handle("lawid:epic:status", async () => epic.status());
ipcMain.handle("lawid:epic:listInstalled", async () => epic.listInstalled());
ipcMain.handle("lawid:epic:listLibrary", async () => epic.listLibrary());
ipcMain.handle("lawid:epic:launch", async (_e, p) => epic.launch(p));
ipcMain.handle("lawid:epic:install", async (_e, p) => epic.install(p));
ipcMain.handle("lawid:epic:uninstall", async (_e, p) => epic.uninstall(p));
// fælles launch/install som UI kalder
ipcMain.handle("lawid:open", async (_e, post) => {
    if (!post)
        return false;
    if (post.kind === "steam" && post.appid)
        return steam.launch(post.appid);
    if (post.kind === "epic" && post.appName)
        return epic.launch({ appName: post.appName });
    if (post.exePath)
        return shell.openPath(post.exePath);
    return false;
});
ipcMain.handle("lawid:install:game", async (_e, post) => {
    if (!post)
        return false;
    if (post.kind === "epic" && post.appName)
        return epic.install({ appName: post.appName });
    if (post.kind === "steam" && post.appid) {
        // åbner butiksside – senere kan vi lave “steamcmd” flow
        return shell.openExternal(`https://store.steampowered.com/app/${post.appid}/`);
    }
    return false;
});
