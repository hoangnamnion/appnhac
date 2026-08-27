/**
 * Local IndexedDB Storage Engine
 * Stores audio files, artwork blobs, metadata and sync status offline
 */
const DB_NAME = 'MusicTagSyncDB';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks';

export class StorageEngine {
  static async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_TRACKS)) {
          const store = db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async saveTrack(track) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      
      const record = {
        id: track.id || 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: track.title || 'Untitled Track',
        artist: track.artist || 'Unknown Artist',
        album: track.album || '',
        year: track.year || new Date().getFullYear(),
        duration: track.duration || 0,
        createdAt: track.createdAt || Date.now(),
        syncStatus: track.syncStatus || 'local', // 'local' | 'synced' | 'pending'
        coverBlob: track.coverBlob, // Blob of image
        audioBlob: track.audioBlob, // Tagged audio Blob
        rawAudioBlob: track.rawAudioBlob || null,
        fileSize: track.fileSize || (track.audioBlob ? track.audioBlob.size : 0),
        mimeType: track.mimeType || 'audio/mpeg',
        audioUrl: track.audioUrl || null,
        coverUrl: track.coverUrl || null
      };

      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllTracks() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort descending by createdAt
        const tracks = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(tracks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async getTrackById(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteTrack(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  static async updateSyncStatus(id, status) {
    const track = await this.getTrackById(id);
    if (!track) return false;
    track.syncStatus = status;
    return await this.saveTrack(track);
  }

  static async clearAll() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}
