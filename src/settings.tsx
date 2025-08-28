// ===== FILE: src/settings.tsx =====
import React, { useEffect, useMemo, useState } from "react";

type Post = {
  id: string;
  title: string;
  kind: "steam" | "epic" | "app" | "browser";
};
type CustomApp = { id: string; title: string; isGame: boolean; exePath: string; cover?: string };
type Cfg = {
  steamApiKey?: string; steamId64?: string; fullscreen?: boolean;
  classify?: Record<string, "game" | "app">;
  customApps?: CustomApp[];
};

export default function SettingsModal({
  open, onClose, cfg, setCfg, localPosts, onRefresh, epicAuth, setEpicAuth
}: {
  open: boolean; onClose(): void; cfg: Cfg; setCfg(next: Cfg): void; localPosts: Post[];
  onRefresh(): Promise<void>;
  epicAuth: { loggedIn: boolean; user?: string } | null;
  setEpicAuth(v: { loggedIn: boolean; user?: string } | null): void;
}) {
  const W: any = window as any;
  const [searchLocal, setSearchLocal] = useState("");
  const [customApps, setCustomApps] = useState<CustomApp[]>(cfg.customApps || []);
  useEffect(() => setCustomApps(cfg.customApps || []), [cfg.customApps]);

  const rows = useMemo(() => {
    const q = searchLocal.trim().toLowerCase();
    const src = (localPosts || []).map((p) => ({
      id: p.id, title: p.title || "(uden navn)",
      auto: p.kind === "app" || p.kind === "browser" ? "App" : "Spil"
    }));
    return src.filter(r => r.title.toLowerCase().includes(q)).sort((a, b) => a.title.localeCompare(b.title));
  }, [localPosts, searchLocal]);

  function writeCfg(next: Partial<Cfg>) {
    const merged = { ...cfg, ...next }; setCfg(merged);
    return W.lawid?.config?.set?.(merged);
  }

  async function addEmptyCustom() {
    const id = "custom-" + Math.random().toString(36).slice(2, 9);
    const next = [...customApps, { id, title: "", isGame: true, exePath: "", cover: "" }];
    setCustomApps(next); await writeCfg({ customApps: next });
  }
  async function updateCustom(idx: number, patch: Partial<CustomApp>) {
    const next = [...customApps]; next[idx] = { ...next[idx], ...patch }; setCustomApps(next);
    await writeCfg({ customApps: next });
  }
  async function deleteCustom(idx: number) {
    const next = [...customApps]; next.splice(idx, 1); setCustomApps(next);
    await writeCfg({ customApps: next });
  }
  async function pickCoverFor(idx: number) {
    const f = await W.lawid?.cover?.pick?.(); if (!f) return; await updateCustom(idx, { cover: f });
  }

  if (!open) return null;

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 style={{ margin: 0, flex: 1 }}>Indstillinger</h2>
          <button style={S.btnTiny} onClick={onClose}>Luk</button>
        </div>

        {/* Forbindelser */}
        <section style={S.section}>
          <h3 style={S.h3}>Forbindelser</h3>
          <div style={S.grid2}>
            <label style={S.label}>
              Steam API key
              <input value={cfg.steamApiKey || ""} onChange={async (e) => writeCfg({ steamApiKey: e.target.value })} style={S.input} />
            </label>
            <label style={S.label}>
              SteamID64
              <input value={cfg.steamId64 || ""} onChange={async (e) => writeCfg({ steamId64: e.target.value })} style={S.input} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!epicAuth?.loggedIn ? (
              <button style={S.btn} onClick={async () => { await W.lawid?.epic?.login?.(); const s = await W.lawid?.epic?.status?.(); setEpicAuth(s); await onRefresh(); }}>
                Epic – Login
              </button>
            ) : (
              <button style={S.btn} onClick={async () => { await W.lawid?.epic?.logout?.(); const s = await W.lawid?.epic?.status?.(); setEpicAuth(s); await onRefresh(); }}>
                Epic – Logout
              </button>
            )}
            <button style={S.btn} onClick={onRefresh}>Opdatér alt</button>
          </div>
        </section>

        {/* Kategorier (lokale) */}
        <section style={S.section}>
          <h3 style={S.h3}>Kategorier (lokale apps)</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input placeholder="Søg lokale apps…" value={searchLocal} onChange={(e) => setSearchLocal(e.target.value)} style={{ ...S.input, maxWidth: 340 }} />
          </div>
          <div style={{ ...S.panel, maxHeight: 240, overflow: "auto" }}>
            {rows.map((r) => {
              const ov = (cfg.classify || {})[r.id];
              return (
                <div key={r.id} style={S.row}>
                  <div style={{ fontWeight: 700, flex: 1 }}>{r.title}</div>
                  <div style={{ width: 160, opacity: .85, fontSize: 12 }}>
                    {ov ? (ov === "game" ? "Spil (overstyring)" : "App (overstyring)") : `Auto: ${r.auto}`}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={S.btnTiny} onClick={async () => writeCfg({ classify: { ...(cfg.classify || {}), [r.id]: "game" } })}>Markér som Spil</button>
                    <button style={S.btnTiny} onClick={async () => writeCfg({ classify: { ...(cfg.classify || {}), [r.id]: "app" } })}>Markér som App</button>
                    {ov && <button style={S.btnTiny} onClick={async () => { const m = { ...(cfg.classify || {}) } as any; delete m[r.id]; await writeCfg({ classify: m }); }}>Ryd</button>}
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <div>Ingen lokale apps fundet.</div>}
          </div>
        </section>

        {/* Manuelle apps/spil */}
        <section style={S.section}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h3 style={{ ...S.h3, flex: 1 }}>Manuelt oprettede (lokale)</h3>
            <button style={S.btn} onClick={addEmptyCustom}>➕ Opret ny</button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {(customApps || []).map((c, idx) => (
              <div key={c.id} style={{ ...S.panel, padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8 }}>
                    <label style={S.label}>
                      Navn
                      <input value={c.title} onChange={(e) => updateCustom(idx, { title: e.target.value })} style={S.input} />
                    </label>
                    <label style={S.label}>
                      Type
                      <select value={c.isGame ? "game" : "app"} onChange={(e) => updateCustom(idx, { isGame: e.target.value === "game" })} style={{ ...S.input, padding: "0 8px", height: 36 }}>
                        <option value="game">Spil</option><option value="app">App</option>
                      </select>
                    </label>
                    <label style={{ ...S.label, gridColumn: "1 / span 2" }}>
                      EXE / genvej (lokal sti)
                      <input value={c.exePath} onChange={(e) => updateCustom(idx, { exePath: e.target.value })} style={S.input} placeholder="C:\Program Files\...\MyGame.exe" />
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={S.btnTiny} onClick={() => pickCoverFor(idx)}>Vælg cover…</button>
                      {c.cover && <span style={{ fontSize: 12, opacity: .8 }}>{c.cover}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button style={S.btn} onClick={() => deleteCustom(idx)}>Slet</button>
                  </div>
                </div>
              </div>
            ))}
            {customApps.length === 0 && <div style={{ opacity: .85 }}>Ingen manuelle endnu. Klik “Opret ny”.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: {
    width: 860, maxWidth: "96vw", maxHeight: "90vh", overflow: "auto", background: "#0b1220",
    border: "1px solid #1b2a48", borderRadius: 12, padding: 16, color: "#e8eefc", boxShadow: "0 12px 40px rgba(0,0,0,.45)"
  },
  section: { marginTop: 16 },
  h3: { margin: "0 0 8px 0", fontSize: 15, fontWeight: 800 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 },
  panel: { background: "#0f1830", border: "1px solid #1b2a48", borderRadius: 10, padding: 8 },
  row: { display: "grid", gridTemplateColumns: "1fr 160px auto", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.06)" },
  label: { display: "grid", gap: 4, fontSize: 12, opacity: .9 },
  input: { height: 36, background: "#0b1630", border: "1px solid #1b2a48", borderRadius: 10, color: "#e8eefc", padding: "0 12px", outline: "none" },
  btn: { height: 36, borderRadius: 12, padding: "0 12px", background: "linear-gradient(90deg,#1e3a8a,#1f2937)", border: "1px solid #1b2a48", color: "#e8eefc", fontWeight: 700, cursor: "pointer" },
  btnTiny: { height: 28, borderRadius: 10, padding: "0 10px", background: "#0f1830", border: "1px solid #1b2a48", color: "#e8eefc", fontWeight: 700, cursor: "pointer" },
};
