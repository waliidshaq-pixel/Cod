// ===== FILE: electron/preload.cjs =====
const { contextBridge, ipcRenderer } = require("electron");

function h(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("lawid", {
  config: {
    get: () => h("lawid:config:get"),
    set: (cfg) => h("lawid:config:set", cfg),
  },
  // lokale apps/spil (stub – udvid som du vil)
  scan: {
    all: () => h("lawid:scan:all"),
  },
  steam: {
    library: (p) => h("lawid:steam:library", p),
    friendsOnline: (p) => h("lawid:steam:friendsOnline", p),
    openChat: (steamId64) => h("lawid:steam:openChat", steamId64),
    launch: (appid) => h("lawid:steam:launch", appid),
  },
  epic: {
    status: () => h("lawid:epic:status"),
    listInstalled: () => h("lawid:epic:listInstalled"),
    listLibrary: () => h("lawid:epic:listLibrary"),
    launch: (p) => h("lawid:epic:launch", p),          // { appName }
    install: (p) => h("lawid:epic:install", p),        // { appName }
    uninstall: (p) => h("lawid:epic:uninstall", p),    // { appName }
  },
  // fælles “launch” (UI kalder denne)
  launch: {
    open: (post) => h("lawid:open", post),
  },
  install: {
    game: (post) => h("lawid:install:game", post),
  },
  db: {
    hide: (_id) => Promise.resolve(), // no-op
    hideAll: () => Promise.resolve(), // no-op
  },
  cover: {
    pick: () => Promise.resolve(null),
    set: () => Promise.resolve(),
  },
  ui: {
    addCustomApp: () => Promise.resolve(false),
  },
});
