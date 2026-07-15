const { contextBridge, ipcRenderer } = require("electron");

if (window.location.protocol === "clinicnova:") {
  const listeners = new Set();
  ipcRenderer.on("clinicnova:sync-result", (_event, status, responseText) => {
    for (const listener of listeners) listener(status, responseText);
  });
  contextBridge.exposeInMainWorld("ClinicNovaNative", Object.freeze({
    platform: "desktop",
    sync(serverUrl, batchJson) {
      ipcRenderer.send("clinicnova:sync", serverUrl, batchJson);
    },
    onSyncResult(listener) {
      if (typeof listener === "function") listeners.add(listener);
    },
    storage: Object.freeze({
      getItem(key) { return ipcRenderer.sendSync("clinicnova:storage-get", key); },
      setItem(key, value) { return ipcRenderer.sendSync("clinicnova:storage-set", key, value); },
      removeItem(key) { return ipcRenderer.sendSync("clinicnova:storage-remove", key); }
    })
  }));
}
