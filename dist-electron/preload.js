import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("lawid", {
    readItems: () => ipcRenderer.invoke("items:read"),
    writeItems: (items) => ipcRenderer.invoke("items:write", items),
    config: {
        read: () => ipcRenderer.invoke("config:read"),
        write: (cfg) => ipcRenderer.invoke("config:write", cfg),
    },
    scan: () => ipcRenderer.invoke("scan:run"),
    steam: {
        owned: () => ipcRenderer.invoke("steam:owned"),
    },
    launch: {
        steam: (id) => ipcRenderer.invoke("launch:steam", id),
        epic: (n) => ipcRenderer.invoke("launch:epic", n),
        url: (u) => ipcRenderer.invoke("launch:url", u),
        exe: (p, a) => ipcRenderer.invoke("launch:exe", p, a),
    },
    install: {
        steam: (id) => ipcRenderer.invoke("install:steam", id),
        epic: (n) => ipcRenderer.invoke("install:epic", n),
    },
    pin: {
        set: (pin) => ipcRenderer.invoke("pin:set", pin),
        verify: (pin) => ipcRenderer.invoke("pin:verify", pin),
    }
});
