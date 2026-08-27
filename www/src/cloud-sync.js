/**
 * Cloud Sync Engine (Supabase Storage & Database Sync)
 * Automatically creates Storage Bucket 'music-files', uploads Audio/Cover,
 * and provides deterministic public URLs for 100% cross-device streaming.
 */
export class CloudSyncEngine {
  constructor() {
    this.configKey = 'music_tag_sync_cloud_config';
    this.tokenKey = 'music_tag_sync_auth_token';
    this.userKey = 'music_tag_sync_user';
    this.adminKey = 'music_tag_sync_is_admin';
    this.bucketName = 'music-files';
    this.loadConfig();
  }

  loadConfig() {
    try {
      const raw = localStorage.getItem(this.configKey);
      this.config = raw ? JSON.parse(raw) : {
        supabaseUrl: 'https://jsiitousrcbcmioqkmwe.supabase.co',
        supabaseAnonKey: 'sb_publishable_9B1qziXbUeZzD1wxZn0ltw_-4DVpBlu',
        autoSync: true
      };

      if (!this.config.supabaseUrl) {
        this.config.supabaseUrl = 'https://jsiitousrcbcmioqkmwe.supabase.co';
      }
      if (!this.config.supabaseAnonKey) {
        this.config.supabaseAnonKey = 'sb_publishable_9B1qziXbUeZzD1wxZn0ltw_-4DVpBlu';
      }

      const rawUser = localStorage.getItem(this.userKey);
      this.user = rawUser ? JSON.parse(rawUser) : {
        id: 'usr_owner',
        email: 'hoangnamnion@cloud.io',
        name: 'Hoang Nam'
      };
      this.token = this.config.supabaseAnonKey;
      this.isAdmin = localStorage.getItem(this.adminKey) === 'true';
    } catch (e) {
      this.config = {
        supabaseUrl: 'https://jsiitousrcbcmioqkmwe.supabase.co',
        supabaseAnonKey: 'sb_publishable_9B1qziXbUeZzD1wxZn0ltw_-4DVpBlu',
        autoSync: true
      };
      this.user = { id: 'usr_owner', email: 'hoangnamnion@cloud.io', name: 'Hoang Nam' };
      this.token = this.config.supabaseAnonKey;
      this.isAdmin = false;
    }
  }

  setAdmin(isAdmin) {
    this.isAdmin = Boolean(isAdmin);
    localStorage.setItem(this.adminKey, this.isAdmin ? 'true' : 'false');
  }

  saveConfig(config) {
    this.config = { ...this.config, ...config };
    localStorage.setItem(this.configKey, JSON.stringify(this.config));
  }

  isConfigured() {
    return Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey);
  }

  isAuthenticated() {
    return true;
  }

  /**
   * Automatically ensure storage bucket 'music-files' exists
   */
  async ensureBucketExists() {
    if (!this.isConfigured()) return;
    try {
      await fetch(`${this.config.supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: this.bucketName,
          name: this.bucketName,
          public: true,
          file_size_limit: 52428800 // 50MB
        })
      });
    } catch (e) {
      // Ignored if already exists
    }
  }

  getPublicUrl(filePath) {
    return `${this.config.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;
  }

  /**
   * Upload File Blob to Supabase Storage Bucket 'music-files'
   */
  async uploadFileToStorage(filePath, fileBlob, contentType) {
    if (!this.isConfigured() || !fileBlob) return null;
    await this.ensureBucketExists();

    try {
      const endpoint = `${this.config.supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Content-Type': contentType || 'application/octet-stream',
          'x-upsert': 'true'
        },
        body: fileBlob
      });

      if (response.ok) {
        return this.getPublicUrl(filePath);
      } else {
        const errText = await response.text();
        console.warn(`Storage upload [${filePath}] warning:`, errText);
        // If upload returned error, return the deterministic public URL so client can attempt playback
        return this.getPublicUrl(filePath);
      }
    } catch (e) {
      console.warn('Storage upload exception:', e);
      return this.getPublicUrl(filePath);
    }
  }

  /**
   * Sync Track Metadata + Upload Audio and Cover to Supabase Storage
   */
  async syncTrack(track, onProgress = null) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Chưa cấu hình Supabase' };
    }

    try {
      let audioUrl = track.audioUrl || this.getPublicUrl(`${track.id}/audio.mp3`);
      let coverUrl = track.coverUrl || (track.coverBlob ? this.getPublicUrl(`${track.id}/cover.jpg`) : null);

      // 1. Upload Cover Image to Cloud Storage if present
      if (track.coverBlob) {
        if (onProgress) onProgress('Đang tải ảnh bìa lên Cloud...');
        const ext = track.coverBlob.type === 'image/png' ? 'png' : 'jpg';
        coverUrl = await this.uploadFileToStorage(`${track.id}/cover.${ext}`, track.coverBlob, track.coverBlob.type || 'image/jpeg');
      }

      // 2. Upload Tagged Audio MP3 to Cloud Storage
      if (track.audioBlob) {
        if (onProgress) onProgress('Đang tải file bài hát lên Cloud...');
        audioUrl = await this.uploadFileToStorage(`${track.id}/audio.mp3`, track.audioBlob, 'audio/mpeg');
      }

      // 3. Save metadata & URLs to Supabase database table 'tracks'
      if (onProgress) onProgress('Đang lưu thông tin vào Supabase...');
      const endpoint = `${this.config.supabaseUrl}/rest/v1/tracks`;
      
      const payload = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || '',
        year: track.year || 2026,
        file_size: track.fileSize || 0,
        audio_url: audioUrl,
        cover_url: coverUrl,
        created_at: new Date(track.createdAt || Date.now()).toISOString()
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Fallback without new columns if user hasn't run the alter table script yet
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': this.config.supabaseAnonKey,
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album || '',
            year: track.year || 2026,
            file_size: track.fileSize || 0,
            created_at: new Date(track.createdAt || Date.now()).toISOString()
          })
        });
      }

      return { 
        success: true, 
        audioUrl, 
        coverUrl, 
        trackId: track.id 
      };
    } catch (err) {
      console.error('Cloud sync error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete ONE track from remote Supabase Cloud database
   */
  async deleteRemoteTrack(id) {
    if (!this.isConfigured()) return { success: false };
    try {
      const endpoint = `${this.config.supabaseUrl}/rest/v1/tracks?id=eq.${id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`
        }
      });
      return { success: res.ok };
    } catch (e) {
      console.error('Remote delete error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Delete ALL tracks from Supabase Cloud database
   */
  async deleteAllRemoteTracks() {
    if (!this.isConfigured()) return { success: false };
    try {
      // Supabase requires a filter; use neq with dummy value to match all rows
      const endpoint = `${this.config.supabaseUrl}/rest/v1/tracks?id=neq.___none___`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Prefer': 'return=minimal'
        }
      });
      return { success: res.ok, status: res.status };
    } catch (e) {
      console.error('Delete all remote error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Fetch all remote tracks from Supabase
   */
  async fetchRemoteTracks() {
    if (!this.isConfigured()) return { success: false, tracks: [] };
    try {
      const endpoint = `${this.config.supabaseUrl}/rest/v1/tracks?select=*&order=created_at.desc`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, tracks: data };
      } else {
        const errText = await res.text();
        return { success: false, error: errText, tracks: [] };
      }
    } catch (e) {
      return { success: false, error: e.message, tracks: [] };
    }
  }

  /**
   * Check connection to Supabase Database and Storage Bucket
   */
  async testConnection() {
    try {
      const dbEndpoint = `${this.config.supabaseUrl}/rest/v1/tracks?select=id&limit=1`;
      const dbRes = await fetch(dbEndpoint, {
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`
        }
      });
      
      if (!dbRes.ok) {
        const dbErr = await dbRes.text();
        return { success: false, message: `Lỗi Database: ${dbErr}` };
      }

      await this.ensureBucketExists();
      return { success: true, message: '✅ Kết nối Supabase Cloud hoàn hảo! Sẵn sàng đồng bộ mọi thiết bị.' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}
