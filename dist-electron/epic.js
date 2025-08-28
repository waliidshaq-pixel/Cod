// ===== FILE: electron/epic.ts =====
import { shell } from "electron";
import fs from "node:fs";
import path from "node:path";
function tryReadJson(file) {
    try {
        const raw = fs.readFileSync(file, "utf8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function programData() {
    // C:\ProgramData
    const base = process.env.PROGRAMDATA || "C:\\ProgramData";
    return base;
}
function localAppData() {
    // C:\Users\<you>\AppData\Local
    const base = process.env.LOCALAPPDATA || "";
    return base;
}
/** Er Epic installeret? (grov check) */
export function status() {
    // Vi kan ikke læse login state uden auth – vi tjekker blot om launcheren findes.
    const launcher = path.join(programData(), "Epic", "UnrealEngineLauncher", "LauncherInstalled.dat");
    const ok = fs.existsSync(launcher);
    return { loggedIn: ok, user: ok ? "Epic Launcher" : undefined };
}
/** Læs *.item manifester – installerede spil. */
export function listInstalled() {
    const manifDir = path.join(programData(), "Epic", "EpicGamesLauncher", "Data", "Manifests");
    if (!fs.existsSync(manifDir))
        return [];
    const files = fs.readdirSync(manifDir).filter((f) => f.toLowerCase().endsWith(".item"));
    const out = [];
    for (const f of files) {
        const j = tryReadJson(path.join(manifDir, f));
        if (!j)
            continue;
        const title = j.DisplayName || j.AppName || f;
        const appName = j.AppName || j.MainGameAppName || title;
        const install = j.InstallLocation || j.InstallLocationFull || j.InstallLocation32 || j.InstallLocation64;
        out.push({
            title,
            appName,
            installed: true,
            installLocation: install,
        });
    }
    return out;
}
/** Bibliotek – foreløbig samme som installerede (kræver auth for “owned library”). */
export function listLibrary() {
    return listInstalled();
}
// URI helpers
function epicUri(appName, action) {
    // robust default
    return `com.epicgames.launcher://apps/${encodeURIComponent(appName)}?action=${action}`;
}
export function launch(p) {
    if (!p?.appName)
        return false;
    shell.openExternal(epicUri(p.appName, "launch"));
    return true;
}
export function install(p) {
    if (!p?.appName)
        return false;
    shell.openExternal(epicUri(p.appName, "install"));
    return true;
}
export function uninstall(p) {
    if (!p?.appName)
        return false;
    shell.openExternal(epicUri(p.appName, "uninstall"));
    return true;
}
