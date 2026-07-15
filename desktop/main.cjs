const { app, BrowserWindow, ipcMain, net, protocol, safeStorage, session, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([{ scheme: "clinicnova", privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

const allowedAssets = new Set(["index.html", "app.css", "app.js", "runtime-config.js"]);
let mainWindow;
let storePath;
let encryptedStore = {};

function rendererAllowed(event) {
  try { return new URL(event.senderFrame.url).origin === "clinicnova://app"; } catch { return false; }
}

function validStorageKey(key) {
  return typeof key === "string" && /^clinicnova\.[A-Za-z0-9._-]{1,80}$/.test(key);
}

function persistStore() {
  const temporary = `${storePath}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(encryptedStore), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, storePath);
}

function readEncryptedValue(key) {
  if (!validStorageKey(key) || typeof encryptedStore[key] !== "string") return null;
  try { return safeStorage.decryptString(Buffer.from(encryptedStore[key], "base64")); } catch { return null; }
}

function installIpcHandlers() {
  ipcMain.on("clinicnova:storage-get", (event, key) => {
    event.returnValue = rendererAllowed(event) ? readEncryptedValue(key) : null;
  });
  ipcMain.on("clinicnova:storage-set", (event, key, value) => {
    event.returnValue = false;
    if (!rendererAllowed(event) || !validStorageKey(key) || typeof value !== "string" || Buffer.byteLength(value) > 5 * 1024 * 1024) return;
    if (!safeStorage.isEncryptionAvailable()) return;
    encryptedStore[key] = safeStorage.encryptString(value).toString("base64");
    persistStore();
    event.returnValue = true;
  });
  ipcMain.on("clinicnova:storage-remove", (event, key) => {
    event.returnValue = false;
    if (!rendererAllowed(event) || !validStorageKey(key)) return;
    delete encryptedStore[key];
    persistStore();
    event.returnValue = true;
  });
  ipcMain.on("clinicnova:sync", async (event, serverUrl, batchJson) => {
    if (!rendererAllowed(event)) return;
    let status = 0;
    let responseText = "";
    try {
      const base = new URL(String(serverUrl));
      if (base.protocol !== "https:" || !base.hostname) throw new Error("HTTPS sunucu adresi gerekli.");
      if (typeof batchJson !== "string" || Buffer.byteLength(batchJson) > 4 * 1024 * 1024) throw new Error("Senkronizasyon paketi çok büyük.");
      const parsed = JSON.parse(batchJson);
      if (!parsed || !Array.isArray(parsed.operations) || parsed.operations.length > 50) throw new Error("Senkronizasyon paketi geçersiz.");
      const endpoint = new URL("/api/mobile/sync", base.origin);
      const response = await event.sender.session.fetch(endpoint.href, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json; charset=utf-8", Accept: "application/json", "User-Agent": `ClinicNovaDesktop/${app.getVersion()}` },
        body: batchJson
      });
      status = response.status;
      responseText = (await response.text()).slice(0, 1024 * 1024);
    } catch (error) {
      responseText = JSON.stringify({ error: error instanceof Error ? error.message : "Sunucuya ulaşılamadı." });
    }
    if (!event.sender.isDestroyed()) event.sender.send("clinicnova:sync-result", status, responseText);
  });
}

function createWindow() {
  let allowedServerOrigin = "";
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    show: false,
    backgroundColor: "#f8fafc",
    title: "ClinicNova",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try { if (new URL(url).protocol === "https:") void shell.openExternal(url); } catch { /* Ignore invalid external URL. */ }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    try {
      const target = new URL(targetUrl);
      const current = new URL(mainWindow.webContents.getURL());
      if (target.protocol === "clinicnova:" && target.hostname === "sync") {
        event.preventDefault();
        void mainWindow.loadURL("clinicnova://app/index.html?sync=1");
        return;
      }
      if (target.origin === "clinicnova://app") return;
      if (target.protocol === "https:" && current.origin === "clinicnova://app") {
        allowedServerOrigin = target.origin;
        return;
      }
      if (target.protocol === "https:" && target.origin === allowedServerOrigin) return;
    } catch { /* Block malformed navigation. */ }
    event.preventDefault();
  });
  mainWindow.webContents.on("did-fail-load", (_event, _code, _description, validatedUrl, isMainFrame) => {
    if (isMainFrame && validatedUrl.startsWith("https:")) void mainWindow.loadURL("clinicnova://app/index.html?offline=1");
  });
  void mainWindow.loadURL("clinicnova://app/index.html");
}

app.whenReady().then(async () => {
  storePath = path.join(app.getPath("userData"), "clinicnova-local-store.json");
  try { encryptedStore = JSON.parse(fs.readFileSync(storePath, "utf8")); } catch { encryptedStore = {}; }
  const assets = app.isPackaged ? path.join(process.resourcesPath, "mobile") : path.join(__dirname, "build");
  protocol.handle("clinicnova", (request) => {
    const url = new URL(request.url);
    const asset = decodeURIComponent(url.pathname.replace(/^\//, "") || "index.html");
    if (url.hostname !== "app" || !allowedAssets.has(asset)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(path.join(assets, asset)).href);
  });
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(webContents.getURL().startsWith("clinicnova://app/") && permission === "media");
  });
  installIpcHandlers();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
