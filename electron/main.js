const { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain, Notification, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 840,
    minWidth: 400,
    minHeight: 650,
    title: 'ShinTag Music',
    backgroundColor: '#0a0c10',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'manifest.json'); // fallback check
    tray = new Tray(nativeImage.createEmpty());

    const contextMenu = Menu.buildFromTemplate([
      { label: '🎵 Mở ShinTag Music', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
      { type: 'separator' },
      { label: '❌ Thoát Ứng Dụng', click: () => { app.exit(0); } }
    ]);

    tray.setToolTip('ShinTag Music Desktop');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    });
  } catch (e) {
    console.warn('Tray init notice:', e.message);
  }
}

// IPC Handlers
ipcMain.handle('show-notification', async (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
    return true;
  }
  return false;
});

ipcMain.handle('save-file', async (event, { filename, bytes }) => {
  try {
    const defaultPath = path.join(app.getPath('music') || app.getPath('downloads'), filename);
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Lưu bài hát MP3',
      defaultPath: defaultPath,
      filters: [{ name: 'Audio Files', extensions: ['mp3', 'm4a', 'wav'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);
    return { success: true, filePath };
  } catch (err) {
    console.error('Save file error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-path', async (event, filePath) => {
  if (filePath) shell.showItemInFolder(filePath);
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
