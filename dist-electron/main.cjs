var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron3 = require("electron");
var import_node_path3 = __toESM(require("node:path"), 1);
var import_node_fs3 = __toESM(require("node:fs"), 1);

// electron/steam.ts
var import_node_https = __toESM(require("node:https"), 1);
var import_electron = require("electron");
function getJson(url) {
  return new Promise((resolve, reject) => {
    import_node_https.default.get(url, (res) => {
      let data = "";
      res.on("data", (d) => data += d);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data || "{}"));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}
var API = "https://api.steampowered.com";
var coverUrl = (appid) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`;
async function buildSteamLibraryPosts(apiKey, steamId64) {
  if (!apiKey || !steamId64) return [];
  const url = `${API}/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(
    steamId64
  )}&include_appinfo=1&include_played_free_games=1&format=json`;
  const data = await getJson(url).catch(() => null);
  const games = data?.response?.games || [];
  return games.map((g) => ({
    id: `steam-${g.appid}`,
    title: g.name || String(g.appid),
    kind: "steam",
    platform: "Steam",
    installed: false,
    // vi ved det ikke – kan udvides ved at læse steamapps\appmanifest_*.acf
    appid: g.appid,
    cover: coverUrl(g.appid)
  }));
}
async function getFriends(p) {
  const { apiKey, steamId64 } = p;
  if (!apiKey || !steamId64) return [];
  const listUrl = `${API}/ISteamUser/GetFriendList/v1/?key=${encodeURIComponent(
    apiKey
  )}&steamid=${encodeURIComponent(steamId64)}&relationship=friend`;
  const fl = await getJson(listUrl).catch(() => null);
  const ids = (fl?.friendslist?.friends || []).map((f) => f.steamid);
  if (ids.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 90) chunks.push(ids.slice(i, i + 90));
  const out = [];
  for (const ch of chunks) {
    const sumUrl = `${API}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(
      apiKey
    )}&steamids=${encodeURIComponent(ch.join(","))}`;
    const s = await getJson(sumUrl).catch(() => null);
    const players = s?.response?.players || [];
    for (const pl of players) {
      let status2 = "offline";
      if (pl.gameid) status2 = "in-game";
      else if (pl.personastate && Number(pl.personastate) > 0) status2 = "online";
      out.push({
        steamId64: String(pl.steamid),
        name: pl.personaname || "Friend",
        avatar: pl.avatarfull,
        status: status2,
        game: pl.gameextrainfo
      });
    }
  }
  return out;
}
function openChat(steamId64) {
  if (!steamId64) return;
  import_electron.shell.openExternal(`steam://friends/message/${steamId64}`);
}
function launch(appid) {
  const id = String(appid);
  import_electron.shell.openExternal(`steam://rungameid/${id}`);
}

// electron/epic.ts
var import_electron2 = require("electron");
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
function tryReadJson(file) {
  try {
    const raw = import_node_fs.default.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function programData() {
  const base = process.env.PROGRAMDATA || "C:\\ProgramData";
  return base;
}
function status() {
  const launcher = import_node_path.default.join(programData(), "Epic", "UnrealEngineLauncher", "LauncherInstalled.dat");
  const ok = import_node_fs.default.existsSync(launcher);
  return { loggedIn: ok, user: ok ? "Epic Launcher" : void 0 };
}
function listInstalled() {
  const manifDir = import_node_path.default.join(programData(), "Epic", "EpicGamesLauncher", "Data", "Manifests");
  if (!import_node_fs.default.existsSync(manifDir)) return [];
  const files = import_node_fs.default.readdirSync(manifDir).filter((f) => f.toLowerCase().endsWith(".item"));
  const out = [];
  for (const f of files) {
    const j = tryReadJson(import_node_path.default.join(manifDir, f));
    if (!j) continue;
    const title = j.DisplayName || j.AppName || f;
    const appName = j.AppName || j.MainGameAppName || title;
    const install2 = j.InstallLocation || j.InstallLocationFull || j.InstallLocation32 || j.InstallLocation64;
    out.push({
      title,
      appName,
      installed: true,
      installLocation: install2
    });
  }
  return out;
}
function listLibrary() {
  return listInstalled();
}
function epicUri(appName, action) {
  return `com.epicgames.launcher://apps/${encodeURIComponent(appName)}?action=${action}`;
}
function launch2(p) {
  if (!p?.appName) return false;
  import_electron2.shell.openExternal(epicUri(p.appName, "launch"));
  return true;
}
function install(p) {
  if (!p?.appName) return false;
  import_electron2.shell.openExternal(epicUri(p.appName, "install"));
  return true;
}
function uninstall(p) {
  if (!p?.appName) return false;
  import_electron2.shell.openExternal(epicUri(p.appName, "uninstall"));
  return true;
}

// electron/scan.ts
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
function exists(p) {
  try {
    return import_node_fs2.default.existsSync(p);
  } catch {
    return false;
  }
}
async function scanAll() {
  const entries = [];
  const discord = import_node_path2.default.join(process.env.LOCALAPPDATA || "", "Discord", "Update.exe");
  if (exists(discord)) entries.push({ title: "Discord", exe: discord });
  const chrome = import_node_path2.default.join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe");
  if (exists(chrome)) entries.push({ title: "Google Chrome", exe: chrome });
  const steam = import_node_path2.default.join(process.env.PROGRAMFILES || "C:\\Program Files", "Steam", "steam.exe");
  if (exists(steam)) entries.push({ title: "Steam", exe: steam });
  const epic = import_node_path2.default.join(process.env.PROGRAMFILES || "C:\\Program Files", "Epic Games", "Launcher", "Portal", "Binaries", "Win64", "EpicGamesLauncher.exe");
  if (exists(epic)) entries.push({ title: "Epic Games Launcher", exe: epic });
  return entries.map((e, i) => ({
    id: `local-${i}-${e.title}`,
    title: e.title,
    kind: "app",
    platform: "Local",
    installed: true,
    exePath: e.exe
  }));
}

// electron/main.ts
var isDev = !!process.env.VITE_DEV_SERVER_URL;
var preloadFile = import_node_path3.default.join(__dirname, "preload.cjs");
function cfgPath() {
  return import_node_path3.default.join(import_electron3.app.getPath("userData"), "config.json");
}
function readCfg() {
  try {
    const raw = import_node_fs3.default.readFileSync(cfgPath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function writeCfg(c) {
  import_node_fs3.default.mkdirSync(import_node_path3.default.dirname(cfgPath()), { recursive: true });
  import_node_fs3.default.writeFileSync(cfgPath(), JSON.stringify(c, null, 2), "utf8");
}
var win = null;
async function createWindow() {
  win = new import_electron3.BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#0b1220",
    webPreferences: {
      preload: preloadFile,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await win.loadFile(import_node_path3.default.join(__dirname, "../dist/index.html"));
  }
}
import_electron3.app.whenReady().then(createWindow);
import_electron3.app.on("window-all-closed", () => import_electron3.app.quit());
import_electron3.ipcMain.handle("lawid:config:get", async () => readCfg());
import_electron3.ipcMain.handle("lawid:config:set", async (_e, next) => {
  writeCfg(next || {});
});
import_electron3.ipcMain.handle("lawid:scan:all", async () => scanAll());
import_electron3.ipcMain.handle(
  "lawid:steam:library",
  async (_e, p) => buildSteamLibraryPosts(p?.apiKey || "", p?.steamId64 || "")
);
import_electron3.ipcMain.handle(
  "lawid:steam:friendsOnline",
  async (_e, p) => getFriends(p || {})
);
import_electron3.ipcMain.handle("lawid:steam:openChat", async (_e, steamId64) => openChat(steamId64));
import_electron3.ipcMain.handle("lawid:steam:launch", async (_e, appid) => launch(appid));
import_electron3.ipcMain.handle("lawid:epic:status", async () => status());
import_electron3.ipcMain.handle("lawid:epic:listInstalled", async () => listInstalled());
import_electron3.ipcMain.handle("lawid:epic:listLibrary", async () => listLibrary());
import_electron3.ipcMain.handle("lawid:epic:launch", async (_e, p) => launch2(p));
import_electron3.ipcMain.handle("lawid:epic:install", async (_e, p) => install(p));
import_electron3.ipcMain.handle("lawid:epic:uninstall", async (_e, p) => uninstall(p));
import_electron3.ipcMain.handle("lawid:open", async (_e, post) => {
  if (!post) return false;
  if (post.kind === "steam" && post.appid) return launch(post.appid);
  if (post.kind === "epic" && post.appName) return launch2({ appName: post.appName });
  if (post.exePath) return import_electron3.shell.openPath(post.exePath);
  return false;
});
import_electron3.ipcMain.handle("lawid:install:game", async (_e, post) => {
  if (!post) return false;
  if (post.kind === "epic" && post.appName) return install({ appName: post.appName });
  if (post.kind === "steam" && post.appid) {
    return import_electron3.shell.openExternal(`https://store.steampowered.com/app/${post.appid}/`);
  }
  return false;
});
