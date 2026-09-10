const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "hyperHinge",
  Object.freeze({
    getSnapshot: () => ipcRenderer.invoke("hinge:snapshot"),
    onFrame: (listener) => {
      const handler = (_event, frame) => listener(frame);
      ipcRenderer.on("hinge:frame", handler);
      return () => ipcRenderer.removeListener("hinge:frame", handler);
    },
    onFullscreenChange: (listener) => {
      const handler = (_event, enabled) => listener(enabled);
      ipcRenderer.on("hinge:fullscreen-changed", handler);
      return () =>
        ipcRenderer.removeListener("hinge:fullscreen-changed", handler);
    },
    setFullscreen: (enabled) =>
      ipcRenderer.invoke("hinge:fullscreen", !!enabled),
  }),
);
