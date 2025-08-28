import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("lawid", {
  readItems: () => ipcRenderer.invoke("items:read"),
  writeItems: (items: any[]) => ipcRenderer.invoke("items:write", items),

  config: {
    read:  () => ipcRenderer.invoke("config:read"),
    write: (cfg:any) => ipcRenderer.invoke("config:write", cfg),
  },

  scan: () => ipcRenderer.invoke("scan:run"),

  steam: {
    owned: () => ipcRenderer.invoke("steam:owned"),
  },

  launch: {
    steam: (id:string)=>ipcRenderer.invoke("launch:steam", id),
    epic:  (n:string)=>ipcRenderer.invoke("launch:epic", n),
    url:   (u:string)=>ipcRenderer.invoke("launch:url", u),
    exe:   (p:string,a:string)=>ipcRenderer.invoke("launch:exe", p, a),
  },

  install: {
    steam: (id:string)=>ipcRenderer.invoke("install:steam", id),
    epic:  (n:string)=>ipcRenderer.invoke("install:epic", n),
  },

  pin: {
    set:    (pin:string)=>ipcRenderer.invoke("pin:set", pin),
    verify: (pin:string)=>ipcRenderer.invoke("pin:verify", pin),
  }
});