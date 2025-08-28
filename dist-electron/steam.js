// ===== FILE: electron/steam.ts =====
import https from "node:https";
/* ---------------- Helpers ---------------- */
function getJson(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
            let data = "";
            res.on("data", (d) => (data += d));
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data || "{}");
                    resolve(parsed);
                }
                catch (e) {
                    reject(e);
                }
            });
        })
            .on("error", reject);
    });
}
const API = "https://api.steampowered.com";
const coverUrl = (appid) => 
// stabilt "library" cover (600x900)
`https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`;
/* ---------------- Library ---------------- */
/**
 * Henter hele ejerlisten for brugeren (med appinfo) og mapper til vores Post-model.
 * Steam API fortæller IKKE om et spil er installeret lokalt — så vi markerer installed=false
 * og lader UI vise dem under “Ikke installerede spil” (indtil vi laver lokal Steam-scan).
 */
export async function buildSteamLibraryPosts(apiKey, steamId64) {
    if (!apiKey || !steamId64)
        return [];
    const url = `${API}/IPlayerService/GetOwnedGames/v0001/` +
        `?key=${encodeURIComponent(apiKey)}` +
        `&steamid=${encodeURIComponent(steamId64)}` +
        `&include_appinfo=1&include_played_free_games=1&format=json`;
    const data = await getJson(url).catch(() => null);
    const games = data?.response?.games || [];
    // Map til Post
    const posts = games.map((g) => ({
        id: `steam-${g.appid}`,
        title: g.name || `Steam App ${g.appid}`,
        kind: "steam",
        platform: "Steam",
        appid: Number(g.appid),
        installed: false, // ukendt -> viser som “ikke installeret”
        cover: coverUrl(Number(g.appid)),
    }));
    return posts;
}
/* ---------------- Friends ---------------- */
export async function getFriends(apiKey, steamId64) {
    if (!apiKey || !steamId64)
        return [];
    // 1) Friend list
    const friendsUrl = `${API}/ISteamUser/GetFriendList/v0001/?key=${encodeURIComponent(apiKey)}` +
        `&steamid=${encodeURIComponent(steamId64)}&relationship=friend`;
    const friendsData = await getJson(friendsUrl).catch(() => null);
    const friendIds = friendsData?.friendslist?.friends?.map((f) => f.steamid) || [];
    if (friendIds.length === 0)
        return [];
    // 2) Summaries (navn + avatar)
    const chunks = [];
    for (let i = 0; i < friendIds.length; i += 100) {
        chunks.push(friendIds.slice(i, i + 100));
    }
    const summaries = {};
    for (const ch of chunks) {
        const url = `${API}/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(apiKey)}` +
            `&steamids=${encodeURIComponent(ch.join(","))}`;
        const data = await getJson(url).catch(() => null);
        for (const p of data?.response?.players || []) {
            summaries[p.steamid] = p;
        }
    }
    // 3) Player info (online/in-game)
    const result = friendIds.map((sid) => {
        const p = summaries[sid] || {};
        let status = "offline";
        if (p.gameextrainfo)
            status = "in-game";
        else if (p.personastate && p.personastate !== 0)
            status = "online";
        return {
            steamId64: sid,
            name: p.personaname || sid,
            avatar: p.avatarfull || p.avatarmedium || p.avatar,
            status,
            game: p.gameextrainfo || undefined,
        };
    });
    // Sortér: in-game -> online -> offline
    result.sort((a, b) => {
        const score = (s) => s === "in-game" ? 2 : s === "online" ? 1 : 0;
        return score(b.status) - score(a.status);
    });
    return result;
}
/* ---------------- Launch (Steam) ---------------- */
/** Start et Steam-spil via steam://run/<appid> */
export async function launch(appid) {
    const { shell } = await import("electron");
    try {
        await shell.openExternal(`steam://run/${appid}`);
        return true;
    }
    catch {
        return false;
    }
}
