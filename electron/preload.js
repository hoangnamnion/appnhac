const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  saveFile: (filename, bytes) => ipcRenderer.invoke('save-file', { filename, bytes }),
  openFolder: (filePath) => ipcRenderer.invoke('open-path', filePath),
  platform: process.platform
});
