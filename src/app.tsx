// ===== FILE: src/app.tsx =====
import React, { useEffect, useMemo, useRef, useState } from "react";

/** ------- Typer nederst i filen (Post, Friend) ------ */

export default function App() {
  const [cfg, setCfg] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [steamLib, setSteamLib] = useState<Post[]>([]);
  const [epicInstalled, setEpicInstalled] = useState<Post[]>([]);
  const [epicLib, setEpicLib] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsTab, setFriendsTab] = useState<"online" | "offline">("online");
  const [friendsSearch, setFriendsSearch] = useState("");

  type S = "loading" | "ok" | "error";
  const [steamState, setSteamState] = useState<S>("loading");
  const [epicState, setEpicState] = useState<S>("loading");

  // clock
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // refresh alt
  async function refreshAll() {
    setLoading(true);
    try {
      const c = await (window as any).lawid.config.get();
      setCfg(c || {});

      // lokale
      const loc = await (window as any).lawid.scan.all().catch(() => []);
      setLocalPosts((loc || []).map((x: any, i: number) => ({ ...x, id: x.id || `local-${i}`, platform: "Local", kind: "app", installed: true })));

      // steam
      setSteamState("loading");
      try {
        const lib = await (window as any).lawid.steam.library({
          apiKey: c?.steamApiKey || "",
          steamId64: c?.steamId64 || "",
        });
        setSteamLib(lib || []);
        setSteamState("ok");
      } catch {
        setSteamLib([]);
        setSteamState("error");
      }

      // epic
      setEpicState("loading");
      try {
        const inst = await (window as any).lawid.epic.listInstalled();
        const lib = await (window as any).lawid.epic.listLibrary();

        const toPost = (e: any): Post => ({
          id: `epic-${e.appName}`,
          title: e.title || e.appName,
          kind: "epic",
          platform: "Epic",
          appName: e.appName,
          installed: !!e.installed,
        });

        setEpicInstalled((inst || []).map(toPost));
        setEpicLib((lib || []).map(toPost));
        setEpicState("ok");
      } catch {
        setEpicInstalled([]);
        setEpicLib([]);
        setEpicState("error");
      }

      // steam venner
      try {
        const list = await (window as any).lawid.steam.friendsOnline({
          apiKey: c?.steamApiKey || "",
          steamId64: c?.steamId64 || "",
          mode: "all",
        });
        setFriends(list || []);
      } catch {
        setFriends([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  // samlinger
  const installedGames = useMemo(() => {
    // Steam kendes ikke installeret => vis kun Epic installerede + evt. tvang (lokale apps der er spil)
    return dedup([...epicInstalled]);
  }, [epicInstalled]);

  const notInstalledGames = useMemo(() => {
    // alt Epic “bibliotek” der ikke er installeret (Steam kan tilføjes senere)
    const map = new Map(epicInstalled.map((x) => [x.id, true]));
    return dedup(epicLib.filter((x) => !map.has(x.id)));
  }, [epicInstalled, epicLib]);

  // friends filter
  const friendsFiltered = useMemo(() => {
    const base =
      friendsTab === "online"
        ? friends.filter((f) => f.status === "online" || f.status === "in-game")
        : friends.filter((f) => !(f.status === "online" || f.status === "in-game"));
    const q = friendsSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((f) => (f.name || "").toLowerCase().includes(q));
  }, [friends, friendsTab, friendsSearch]);

  async function onLaunch(p: Post) {
    await (window as any).lawid.launch.open(p);
  }
  async function onInstall(p: Post) {
    await (window as any).lawid.install.game(p);
  }

  return (
    <div style={ST.page} className="no-scrollbar">
      {/* Top */}
      <header style={ST.top}>
        <div style={ST.brand}>
          <span style={ST.brandChip}>Laweed</span>
          <span style={{ fontWeight: 900, marginLeft: 6 }}>GameLauncher</span>
        </div>
        <div />
        <div style={{ display: "flex", gap: 10 }}>
          <button style={ST.btn} onClick={refreshAll}>🔄 Opdatér alt</button>
        </div>
      </header>

      {/* Midte */}
      <div style={ST.middle}>
        <main style={{ padding: "10px 14px 0", overflow: "hidden" }}>
          <Section title={`Installeret spil ${loading ? "· scanner…" : ""}`}>
            <Row>
              {installedGames.map((p) => (
                <Card key={p.id} p={p} onLaunch={onLaunch} onInstall={onInstall} />
              ))}
              {installedGames.length === 0 && <Empty />}
            </Row>
          </Section>

          <Section title="Apps">
            <Row>
              {localPosts.map((p) => (
                <Card key={p.id} p={p} onLaunch={onLaunch} onInstall={onInstall} />
              ))}
              {localPosts.length === 0 && <Empty />}
            </Row>
          </Section>

          <Section title="Ikke installerede spil">
            <Row>
              {notInstalledGames.map((p) => (
                <Card key={p.id} p={p} onLaunch={onLaunch} onInstall={onInstall} />
              ))}
              {notInstalledGames.length === 0 && <Empty />}
            </Row>
          </Section>
        </main>

        {/* Venner */}
        <aside style={ST.friends}>
          <h3 style={{ margin: "0 0 6px 0" }}>
            Venner <span style={{ fontWeight: 400 }}>({friends.filter(f=>f.status==="online"||f.status==="in-game").length} online / {friends.length} alt)</span>
          </h3>

          <input
            placeholder="Søg venner…"
            value={friendsSearch}
            onChange={(e) => setFriendsSearch(e.target.value)}
            style={ST.input}
          />

          <div style={ST.segment}>
            <button
              onClick={() => setFriendsTab("online")}
              style={{ ...ST.segBtn, ...(friendsTab === "online" ? ST.segOn : ST.segOff) }}
            >
              Online
            </button>
            <button
              onClick={() => setFriendsTab("offline")}
              style={{ ...ST.segBtn, ...(friendsTab === "offline" ? ST.segOn : ST.segOff) }}
            >
              Offline
            </button>
          </div>

          <div style={{ ...ST.panel, height: "calc(100% - 96px)", overflow: "auto" }} className="no-scrollbar">
            {friendsFiltered.map((f) => (
              <div key={f.steamId64} style={ST.friendRow}>
                <span style={{ ...ST.dot, background: f.status === "online" || f.status === "in-game" ? "#16a34a" : "#6b7280" }} />
                <img src={f.avatar} width={38} height={38} style={{ borderRadius: 8 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>
                    {f.status === "in-game" ? `Spiller ${f.game || ""}` : f.status || "offline"}
                  </div>
                </div>
                <button style={ST.btnTiny} onClick={() => (window as any).lawid.steam.openChat(f.steamId64)}>Chat</button>
              </div>
            ))}
            {friendsFiltered.length === 0 && <div style={{ opacity: 0.7 }}>Ingen at vise.</div>}
          </div>

          <div style={{ marginTop: 8 }}>
            <MiniStatus label="Steam" state={steamState} />
            <MiniStatus label="Epic" state={epicState} />
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer style={ST.footer}>
        <div />
        <div style={{ textAlign: "center", fontSize: 12 }}>
          <div style={{ opacity: 0.85 }}>Top 3 spil</div>
          <div style={{ opacity: 0.65 }}>Ingen data endnu</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontVariantNumeric: "tabular-nums" }}>{now.toLocaleTimeString()}</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>{now.toLocaleDateString()}</div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 12 }}>
      <h3 style={{ margin: "0 0 6px 0", fontSize: 14, fontWeight: 800 }}>{title}</h3>
      {children}
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={ST.row}>{children}</div>;
}
function Empty() {
  return <div style={{ opacity: 0.7 }}>— ingen elementer.</div>;
}

function Card({
  p,
  onLaunch,
  onInstall,
}: {
  key?: React.Key;
  p: Post;
  onLaunch: (p: Post) => void;
  onInstall: (p: Post) => void;
}) {
  const canStart = !!p.installed;
  return (
    <div style={ST.card}>
      <div style={{ position: "relative" }}>
        {p.cover ? (
          <img src={p.cover} style={{ width: "100%", borderRadius: 10, height: 140, objectFit: "cover" }} />
        ) : (
          <div style={ST.coverPh}>(intet cover)</div>
        )}
        <div style={ST.coverTitle}>{p.title}</div>
      </div>
      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>{p.platform || (p.kind === "app" ? "Local" : p.kind.toUpperCase())}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button style={{ ...ST.btnTiny, opacity: canStart ? 1 : 0.5 }} disabled={!canStart} onClick={() => canStart && onLaunch(p)}>
          {p.kind === "app" ? "Start app" : "Start spil"}
        </button>
        {!canStart && (
          <button style={{ ...ST.btnTiny, background: "#12451f", borderColor: "#195b2a" }} onClick={() => onInstall(p)}>
            Installér
          </button>
        )}
      </div>
    </div>
  );
}

function MiniStatus({ label, state }: { label: string; state: "loading" | "ok" | "error" }) {
  const c = state === "ok" ? "#16a34a" : state === "loading" ? "#fbbf24" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginBottom: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
      <span>{label}: {state}</span>
    </div>
  );
}

/* ---------- Styles ---------- */
const ST: Record<string, React.CSSProperties> = {
  page: { height: "100vh", background: "#0b1220", color: "#e8eefc", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" },
  top: {
    height: 70, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center",
    padding: "10px 14px", borderBottom: "1px solid #1b2a48", background: "rgba(11,18,32,.95)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
  },
  brand: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 18, fontWeight: 900 },
  brandChip: { padding: "2px 6px", borderRadius: 8, background: "linear-gradient(90deg,#1d4ed8,#9333ea)" },
  middle: { position: "absolute", top: 70, bottom: 64, left: 0, right: 0, display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 },
  friends: { padding: "8px 10px", overflow: "hidden" },
  panel: { background: "#0f1830", border: "1px solid #1b2a48", borderRadius: 10, padding: 8 },
  input: { width: "100%", height: 34, background: "#0f1830", border: "1px solid #1b2a48", borderRadius: 8, color: "#e8eefc", padding: "0 10px", outline: "none", marginBottom: 6 },
  segment: { display: "inline-flex", gap: 6, padding: 2, border: "1px solid #1b2a48", borderRadius: 10, background: "#0f1830", marginBottom: 6 },
  segBtn: { height: 26, padding: "0 10px", borderRadius: 8, border: "none", cursor: "pointer", color: "#e8eefc" },
  segOn: { background: "#1e3a8a" },
  segOff: { background: "#0f1830" },
  row: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  card: { background: "#0f1830", border: "1px solid #1b2a48", borderRadius: 12, padding: 10 },
  coverPh: { height: 140, borderRadius: 10, border: "1px dashed #1b2a48", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, opacity: 0.8 },
  coverTitle: { position: "absolute", left: 8, right: 8, bottom: 6, fontSize: 12, fontWeight: 800, background: "linear-gradient(180deg,transparent,rgba(0,0,0,.65))", padding: "2px 6px", borderRadius: 6 },
  btn: { height: 36, borderRadius: 12, padding: "0 12px", background: "linear-gradient(90deg,#1e3a8a,#1f2937)", border: "1px solid #1b2a48", color: "#e8eefc", fontWeight: 700, cursor: "pointer" },
  btnTiny: { height: 28, borderRadius: 10, padding: "0 10px", background: "#0f1830", border: "1px solid #1b2a48", color: "#e8eefc", fontWeight: 700, cursor: "pointer" },
  friendRow: { display: "grid", gridTemplateColumns: "10px 38px 1fr auto", gap: 8, alignItems: "center", padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,.06)" },
  dot: { width: 8, height: 8, borderRadius: 99, display: "inline-block" },
  footer: { height: 64, borderTop: "1px solid #1b2a48", background: "rgba(11,18,32,.95)", position: "fixed", left: 0, right: 0, bottom: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", padding: "8px 12px" },
};

/* ---------- Typer + util ---------- */
type Post = {
  id: string;
  title: string;
  kind: "steam" | "epic" | "app" | "browser";
  cover?: string;
  installed?: boolean;
  platform?: "Steam" | "Epic" | "Local";
  appid?: number;
  appName?: string;
  exePath?: string;
};
type Friend = {
  steamId64: string;
  name: string;
  avatar?: string;
  status?: "online" | "offline" | "in-game";
  game?: string;
};
function dedup<T extends { id: string }>(arr: T[]): T[] {
  const m = new Map<string, T>();
  for (const x of arr) if (!m.has(x.id)) m.set(x.id, x);
  return [...m.values()];
}
