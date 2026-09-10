const {
  app,
  BrowserWindow,
  ipcMain,
  powerMonitor,
  session,
} = require("electron");
const { spawn } = require("node:child_process");
const { createInterface } = require("node:readline");
const path = require("node:path");
let window,
  child,
  retry,
  watchdog,
  quitting = false;
let frame = {
  available: false,
  angle: null,
  message: "Connecting to lid sensor…",
  timestamp: Date.now(),
};
const devURL = process.env.HINGE_DEV === "1" ? "http://127.0.0.1:5173" : null;
const send = (next) => {
  frame = { ...next, timestamp: Date.now() };
  if (window && !window.isDestroyed())
    window.webContents.send("hinge:frame", frame);
};
function stopSensor() {
  clearTimeout(retry);
  clearInterval(watchdog);
  const old = child;
  child = null;
  old?.kill();
}
function startSensor() {
  stopSensor();
  if (quitting) return;
  if (process.platform !== "darwin") {
    send({
      available: false,
      angle: null,
      message: "Live input needs a supported MacBook. Try Simulate.",
    });
    return;
  }
  const processRef = spawn(
    app.isPackaged
      ? path.join(process.resourcesPath, "lid-sensor")
      : path.join(app.getAppPath(), "bin/lid-sensor"),
    [],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child = processRef;
  let last = Date.now();
  const lines = createInterface({ input: processRef.stdout });
  lines.on("line", (line) => {
    if (child !== processRef) return;
    try {
      const value = JSON.parse(line);
      if (
        Number.isFinite(value.angle) &&
        value.angle >= 0 &&
        value.angle <= 180
      ) {
        last = Date.now();
        send({ available: true, angle: value.angle, message: "Live sensor" });
      } else if (value.error)
        send({ available: false, angle: null, message: String(value.error) });
    } catch {
      /* Ignore malformed helper output. */
    }
  });
  processRef.stderr.on("data", () => {});
  const unavailable = () => {
    if (child !== processRef) return;
    child = null;
    clearInterval(watchdog);
    lines.close();
    send({
      available: false,
      angle: null,
      message: "Sensor unavailable. Reconnecting… or try Simulate.",
    });
    if (!quitting) retry = setTimeout(startSensor, 3000);
  };
  processRef.once("error", unavailable);
  processRef.once("exit", unavailable);
  watchdog = setInterval(() => {
    if (Date.now() - last > 1500) {
      send({
        available: false,
        angle: null,
        message: "Sensor timed out. Reconnecting…",
      });
      startSensor();
    }
  }, 1000);
}
function trusted(event) {
  return (
    window &&
    event.sender === window.webContents &&
    event.senderFrame === window.webContents.mainFrame
  );
}
function createWindow() {
  window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 800,
    minHeight: 620,
    title: "HyperHinge",
    backgroundColor: "#101112",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 17 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.on("enter-full-screen", () =>
    window?.webContents.send("hinge:fullscreen-changed", true),
  );
  window.on("leave-full-screen", () =>
    window?.webContents.send("hinge:fullscreen-changed", false),
  );
  window.webContents.on("before-input-event", (event, input) => {
    if (
      input.type === "keyDown" &&
      input.key === "Escape" &&
      window?.isFullScreen()
    ) {
      event.preventDefault();
      window.setFullScreen(false);
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  if (devURL) window.loadURL(devURL);
  else window.loadFile(path.join(__dirname, "../dist/index.html"));
  window.on("closed", () => {
    window = null;
    stopSensor();
  });
  startSensor();
}
app.setName("HyperHinge");
app.whenReady().then(() => {
  if (process.platform === "darwin")
    app.dock?.setIcon(path.join(app.getAppPath(), "public/hyperhinge.png"));
  session.defaultSession.setPermissionRequestHandler(
    (_wc, _permission, callback) => callback(false),
  );
  ipcMain.handle("hinge:snapshot", (event) => (trusted(event) ? frame : null));
  ipcMain.handle("hinge:fullscreen", (event, enabled) => {
    if (!trusted(event) || typeof enabled !== "boolean") return;
    window.setFullScreen(enabled);
  });
  powerMonitor.on("suspend", () => {
    stopSensor();
    send({
      available: false,
      angle: null,
      message: "Sensor paused during sleep",
    });
  });
  powerMonitor.on("resume", startSensor);
  createWindow();
  app.on("activate", () => {
    if (!window) createWindow();
  });
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  quitting = true;
  stopSensor();
});
