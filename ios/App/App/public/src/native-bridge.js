/**
 * Native Platform Bridge
 * Unified interface for Web, Electron (Desktop Windows/Mac), and Capacitor (iOS/Android)
 */
export class NativeBridge {
  static getPlatform() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return 'electron';
    }
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
      return window.Capacitor.getPlatform(); // 'ios' | 'android'
    }
    return 'web';
  }

  static isNative() {
    return this.getPlatform() !== 'web';
  }

  /**
   * Send System/Local Notification
   */
  static async sendNotification(title, body) {
    const platform = this.getPlatform();
    
    // 1. Electron Desktop
    if (platform === 'electron' && window.electronAPI && window.electronAPI.sendNotification) {
      return await window.electronAPI.sendNotification(title, body);
    }

    // 2. Capacitor (iOS / Android)
    if ((platform === 'ios' || platform === 'android') && window.Capacitor?.Plugins?.LocalNotifications) {
      try {
        const { LocalNotifications } = window.Capacitor.Plugins;
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now() % 100000,
              schedule: { at: new Date(Date.now() + 100) }
            }
          ]
        });
        return true;
      } catch (e) {
        console.warn('Capacitor LocalNotification failed:', e);
      }
    }

    // 3. Web Notification API
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icons/icon-192.png' });
        return true;
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/icons/icon-192.png' });
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Save / Export Audio File to Device File System
   */
  static async saveAudioFile(filename, blob) {
    const platform = this.getPlatform();

    // 1. Electron Desktop
    if (platform === 'electron' && window.electronAPI && window.electronAPI.saveFile) {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));
      const res = await window.electronAPI.saveFile(filename, bytes);
      return res; // { success: boolean, path?: string }
    }

    // 2. Capacitor (iOS / Android Filesystem)
    if ((platform === 'ios' || platform === 'android') && window.Capacitor?.Plugins?.Filesystem) {
      try {
        const { Filesystem, Directory } = window.Capacitor.Plugins;
        const reader = new FileReader();
        const base64Data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });

        const targetDir = platform === 'android' ? Directory.Documents : Directory.Documents;
        const result = await Filesystem.writeFile({
          path: `Music/${filename}`,
          data: base64Data,
          directory: targetDir,
          recursive: true
        });
        return { success: true, uri: result.uri };
      } catch (e) {
        console.warn('Capacitor Filesystem write failed, fallback to download:', e);
      }
    }

    // 3. Browser Download (Standard Web)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return { success: true, webDownload: true };
  }
}
