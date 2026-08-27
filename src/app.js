import { ID3Engine } from './id3-engine.js';
import { StorageEngine } from './storage-engine.js';
import { CloudSyncEngine } from './cloud-sync.js';
import { AudioPlayer } from './audio-player.js';
import { runAllTests } from './tests.js';

// Premium Apple Music Fallback Cover (Vibrant Gradient with Music Note)
const DEFAULT_COVER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23007aff"/><stop offset="100%" stop-color="%2300c6ff"/></linearGradient></defs><rect width="120" height="120" rx="26" fill="url(%23bg)"/><path d="M45 78a10 10 0 1 1-10-10c2.5 0 4.8 1 6.5 2.5V32l38-8v42a10 10 0 1 1-10-10c2.5 0 4.8 1 6.5 2.5V36L45 42v36z" fill="%23ffffff"/></svg>`;

class App {
  constructor() {
    this.cloudSync = new CloudSyncEngine();
    this.audioPlayer = new AudioPlayer();

    // State
    this.selectedAudioFile = null;
    this.selectedAudioBuffer = null;
    this.selectedAudioDuration = 0;
    this.selectedCoverFile = null;
    this.selectedCoverBytes = null;
    this.selectedCoverBlob = null;
    this.selectedCoverMime = 'image/jpeg';
    this.currentTrackList = [];
    this.currentPlayingIndex = 0;
    this.isUserSeeking = false;

    // Theme State
    this.currentTheme = localStorage.getItem('musictag_theme') || 'ocean';
    this.applyTheme(this.currentTheme);

    this.initElements();
    this.bindEvents();
    this.initVisualizer();
    this.loadLibrary(true);  // Always sync from Cloud on startup
    this.renderCloudUser();
    this.updateAdminUI();
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('musictag_theme', theme);
    const themeBtn = document.getElementById('btnToggleTheme');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '🌊' : '🌙';
      themeBtn.title = theme === 'dark' ? 'Chuyển sang Giao diện Xanh Trắng' : 'Chuyển sang Giao diện Đen Apple';
    }
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'ocean' : 'dark';
    this.applyTheme(nextTheme);
    this.showToast(nextTheme === 'dark' ? '🌙 Đã đổi sang Giao diện Đen' : '🌊 Đã đổi sang Giao diện Xanh Trắng');
  }

  initElements() {
    // iOS Tabs & Title
    this.tabs = document.querySelectorAll('.ios-tab-item, .nav-tab');
    this.sections = document.querySelectorAll('.view-section');
    this.pageMainTitle = document.getElementById('pageMainTitle');

    // Studio Elements
    this.coverFrame = document.getElementById('coverFrame');
    this.coverFileInput = document.getElementById('coverFileInput');
    this.coverPreview = document.getElementById('coverPreview');
    this.coverPlaceholder = document.getElementById('coverPlaceholder');

    this.audioZone = document.getElementById('audioZone');
    this.audioFileInput = document.getElementById('audioFileInput');
    this.audioFileName = document.getElementById('audioFileName');
    this.audioFileSize = document.getElementById('audioFileSize');

    this.inputTitle = document.getElementById('inputTitle');
    this.inputArtist = document.getElementById('inputArtist');
    this.inputAlbum = document.getElementById('inputAlbum');
    this.inputYear = document.getElementById('inputYear');
    this.btnCreateTrack = document.getElementById('btnCreateTrack');

    // Library Elements
    this.libraryContainer = document.getElementById('libraryContainer');
    this.libraryCount = document.getElementById('libraryCount');
    this.btnExportJSON = document.getElementById('btnExportJSON');
    this.btnSyncNow = document.getElementById('btnSyncNow');

    // Mini Player Elements
    this.miniPlayer = document.getElementById('miniPlayer');
    this.miniProgress = document.getElementById('miniProgress');
    this.playerCover = document.getElementById('playerCover');
    this.playerTitle = document.getElementById('playerTitle');
    this.playerArtist = document.getElementById('playerArtist');
    this.btnPlayPause = document.getElementById('btnPlayPause');
    this.playIcon = document.getElementById('playIcon');
    this.waveformCanvas = document.getElementById('waveformCanvas');

    // Fullscreen Now Playing Sheet Elements
    this.nowPlayingSheet = document.getElementById('nowPlayingSheet');
    this.btnCloseNowPlaying = document.getElementById('btnCloseNowPlaying');
    this.nowPlayingArt = document.getElementById('nowPlayingArt');
    this.nowPlayingTitle = document.getElementById('nowPlayingTitle');
    this.nowPlayingArtist = document.getElementById('nowPlayingArtist');
    this.seekSlider = document.getElementById('seekSlider');
    this.currTime = document.getElementById('currTime');
    this.durTime = document.getElementById('durTime');
    this.btnPlayPauseLarge = document.getElementById('btnPlayPauseLarge');
    this.playIconLarge = document.getElementById('playIconLarge');
    this.btnPrevTrack = document.getElementById('btnPrevTrack');
    this.btnNextTrack = document.getElementById('btnNextTrack');
    this.btnRewind10 = document.getElementById('btnRewind10');
    this.btnForward10 = document.getElementById('btnForward10');

    // Modals
    this.modalCloud = document.getElementById('modalCloud');
    this.modalTests = document.getElementById('modalTests');
    this.modalIPA = document.getElementById('modalIPA');
    this.btnOpenCloudModal = document.getElementById('btnOpenCloudModal');
    this.btnOpenTests = document.getElementById('btnOpenTests');
    this.btnOpenIPAGuide = document.getElementById('btnOpenIPAGuide');
    this.testResultsList = document.getElementById('testResultsList');
    this.btnRunTestsNow = document.getElementById('btnRunTestsNow');

    // Cloud User & Admin UI
    this.cloudUserSection = document.getElementById('cloudUserSection');
    this.cfgSupabaseUrl = document.getElementById('cfgSupabaseUrl');
    this.cfgSupabaseKey = document.getElementById('cfgSupabaseKey');
    this.btnSaveCloudConfig = document.getElementById('btnSaveCloudConfig');
    this.btnToggleAdvancedCloud = document.getElementById('btnToggleAdvancedCloud');
    this.advancedCloudBox = document.getElementById('advancedCloudBox');
    this.btnToggleAdmin = document.getElementById('btnToggleAdmin');
    this.adminStatusNotice = document.getElementById('adminStatusNotice');
  }

  bindEvents() {
    // Tab switching (iOS Standard)
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.tabs.forEach(t => t.classList.remove('active'));
        this.sections.forEach(s => s.classList.remove('active'));

        tab.classList.add('active');
        const isStudio = tab.dataset.tab === 'studio';
        const targetId = isStudio ? 'tabStudio' : 'tabLibrary';
        const sec = document.getElementById(targetId);
        if (sec) sec.classList.add('active');

        if (this.pageMainTitle) {
          this.pageMainTitle.textContent = isStudio ? 'Tạo Nhạc' : 'Thư Viện';
        }
      });
    });

    // Cover upload
    this.coverFrame.addEventListener('click', () => this.coverFileInput.click());
    this.coverFileInput.addEventListener('change', (e) => this.handleCoverSelect(e.target.files[0]));

    // Drag and drop cover
    this.coverFrame.addEventListener('dragover', (e) => { e.preventDefault(); });
    this.coverFrame.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleCoverSelect(e.dataTransfer.files[0]);
      }
    });

    // Audio upload
    this.audioZone.addEventListener('click', () => this.audioFileInput.click());
    this.audioFileInput.addEventListener('change', (e) => this.handleAudioSelect(e.target.files[0]));

    // Drag and drop audio
    this.audioZone.addEventListener('dragover', (e) => { e.preventDefault(); });
    this.audioZone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleAudioSelect(e.dataTransfer.files[0]);
      }
    });

    // Create and Tag Track
    this.btnCreateTrack.addEventListener('click', () => this.createAndTagTrack());

    // Audio Player State Listener
    this.audioPlayer.onStateChange((isPlaying) => {
      const playSvg = '<path d="M8 5v14l11-7z"/>';
      const pauseSvg = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      this.playIcon.innerHTML = isPlaying ? pauseSvg : playSvg;
      if (this.playIconLarge) {
        this.playIconLarge.innerHTML = isPlaying ? pauseSvg : playSvg;
      }
    });

    // Audio Time & Progress Update
    this.audioPlayer.onTimeUpdate((curr, dur) => {
      if (dur > 0) {
        const pct = (curr / dur) * 100;
        
        if (this.miniProgress) {
          this.miniProgress.style.width = pct + '%';
        }

        if (this.audioPlayer.currentTrack) {
          this.playerArtist.textContent = `${this.audioPlayer.currentTrack.artist} • ${this.formatTime(curr)} / ${this.formatTime(dur)}`;
        }

        if (!this.isUserSeeking && this.seekSlider) {
          this.seekSlider.value = pct;
        }

        if (this.currTime) this.currTime.textContent = this.formatTime(curr);
        if (this.durTime) this.durTime.textContent = this.formatTime(dur);
      }
    });

    // Interactive Slider Scrubbing
    if (this.seekSlider) {
      this.seekSlider.addEventListener('mousedown', () => { this.isUserSeeking = true; });
      this.seekSlider.addEventListener('touchstart', () => { this.isUserSeeking = true; });

      this.seekSlider.addEventListener('input', (e) => {
        if (this.audioPlayer.audio.duration) {
          const targetSec = (e.target.value / 100) * this.audioPlayer.audio.duration;
          if (this.currTime) this.currTime.textContent = this.formatTime(targetSec);
        }
      });

      this.seekSlider.addEventListener('change', (e) => {
        this.isUserSeeking = false;
        this.audioPlayer.seek(parseFloat(e.target.value));
      });
      this.seekSlider.addEventListener('mouseup', () => { this.isUserSeeking = false; });
      this.seekSlider.addEventListener('touchend', () => { this.isUserSeeking = false; });
    }

    // Rewind 10s & Forward 10s
    if (this.btnRewind10) {
      this.btnRewind10.addEventListener('click', () => {
        this.audioPlayer.seekRelative(-10);
        this.showToast('⏪ Đã tua lùi 10 giây');
      });
    }
    if (this.btnForward10) {
      this.btnForward10.addEventListener('click', () => {
        this.audioPlayer.seekRelative(10);
        this.showToast('⏩ Đã tua tới 10 giây');
      });
    }

    // Toggle mini player Play/Pause
    this.btnPlayPause.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audioPlayer.togglePlay();
    });

    if (this.btnPlayPauseLarge) {
      this.btnPlayPauseLarge.addEventListener('click', () => this.audioPlayer.togglePlay());
    }

    // Open Fullscreen Now Playing Sheet
    this.miniPlayer.addEventListener('click', (e) => {
      if (e.target.closest('#btnPlayPause')) return;
      this.nowPlayingSheet.classList.add('active');
    });

    if (this.btnCloseNowPlaying) {
      this.btnCloseNowPlaying.addEventListener('click', () => {
        this.nowPlayingSheet.classList.remove('active');
      });
    }

    // Next / Prev track
    if (this.btnNextTrack) {
      this.btnNextTrack.addEventListener('click', () => this.playNextTrack());
    }
    if (this.btnPrevTrack) {
      this.btnPrevTrack.addEventListener('click', () => this.playPrevTrack());
    }

    // Theme Switcher button
    const btnToggleTheme = document.getElementById('btnToggleTheme');
    if (btnToggleTheme) {
      btnToggleTheme.addEventListener('click', () => this.toggleTheme());
    }

    // Admin Mode Toggle with PIN 2005
    if (this.btnToggleAdmin) {
      this.btnToggleAdmin.addEventListener('click', () => {
        if (!this.cloudSync.isAdmin) {
          const pin = prompt('Nhập mã PIN Quản Trị:');
          if (pin === '2005') {
            this.cloudSync.setAdmin(true);
            this.updateAdminUI();
            this.renderLibraryList(this.currentTrackList);
            this.showToast('🛡️ Đã bật Chế độ Admin!');
          } else if (pin !== null) {
            alert('Mã PIN không chính xác!');
          }
        } else {
          this.cloudSync.setAdmin(false);
          this.updateAdminUI();
          this.renderLibraryList(this.currentTrackList);
          this.showToast('Đã tắt Chế độ Admin');
        }
      });
    }

    // Clear all local stale data + Supabase Cloud
    const btnClearLocalData = document.getElementById('btnClearLocalData');
    if (btnClearLocalData) {
      btnClearLocalData.addEventListener('click', async () => {
        if (confirm('⚠️ Xóa TOÀN BỘ dữ liệu bài hát trên MÁY NÀY và trên SUPABASE CLOUD?\n\nHành động này không thể hoàn tác!')) {
          btnClearLocalData.disabled = true;
          btnClearLocalData.textContent = '⏳ Đang xóa...';

          // 1. Xóa hết trên Supabase Cloud
          await this.cloudSync.deleteAllRemoteTracks();

          // 2. Xóa hết local IndexedDB
          await StorageEngine.clearAll();

          this.currentTrackList = [];
          this.libraryCount.textContent = '0';
          this.renderLibraryList([]);
          document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));

          btnClearLocalData.disabled = false;
          btnClearLocalData.textContent = '🗑️ Xóa Sạch Dữ Liệu Cũ Trên Máy Này';

          this.showToast('🧹 Đã xóa sạch cả máy lẫn Cloud! Bắt đầu lại nào 🎵');
        }
      });
    }

    // Modals
    this.btnOpenCloudModal.addEventListener('click', () => this.openModal(this.modalCloud));
    this.btnOpenTests.addEventListener('click', () => {
      this.openModal(this.modalTests);
      this.runTDDTests();
    });
    this.btnOpenIPAGuide.addEventListener('click', () => this.openModal(this.modalIPA));
    this.btnRunTestsNow.addEventListener('click', () => this.runTDDTests());

    // Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      });
    });

    // Close modal when clicking outside (on backdrop)
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });

    // Test Supabase Connection
    const btnTestSupabase = document.getElementById('btnTestSupabase');
    const supabaseTestResult = document.getElementById('supabaseTestResult');
    if (btnTestSupabase && supabaseTestResult) {
      btnTestSupabase.addEventListener('click', async () => {
        btnTestSupabase.disabled = true;
        btnTestSupabase.textContent = '⏳ Đang kiểm tra...';
        supabaseTestResult.style.display = 'block';
        supabaseTestResult.style.background = 'var(--ios-bg-grouped)';
        supabaseTestResult.style.color = 'var(--text-primary)';
        supabaseTestResult.textContent = 'Đang kết nối Supabase REST API & Storage...';

        const res = await this.cloudSync.testConnection();
        btnTestSupabase.disabled = false;
        btnTestSupabase.textContent = '⚡ Kiểm Tra Kết Nối Supabase';

        if (res.success) {
          supabaseTestResult.style.background = res.needsBucket ? '#fffbeb' : '#f0fdf4';
          supabaseTestResult.style.color = res.needsBucket ? '#b45309' : '#15803d';
          supabaseTestResult.style.border = res.needsBucket ? '1px solid #fde68a' : '1px solid #86efac';
          supabaseTestResult.innerHTML = res.message;
          this.showToast(res.needsBucket ? 'Cần tạo Storage Bucket!' : 'Kết nối Supabase Cloud thành công!');
        } else {
          supabaseTestResult.style.background = '#fef2f2';
          supabaseTestResult.style.color = '#b91c1c';
          supabaseTestResult.style.border = '1px solid #fca5a5';
          supabaseTestResult.innerHTML = `❌ Lỗi: ${res.message}`;
        }
      });
    }

    // Toggle Advanced Cloud Settings
    if (this.btnToggleAdvancedCloud && this.advancedCloudBox) {
      this.btnToggleAdvancedCloud.addEventListener('click', () => {
        const isHidden = this.advancedCloudBox.style.display === 'none';
        this.advancedCloudBox.style.display = isHidden ? 'block' : 'none';
        this.btnToggleAdvancedCloud.textContent = isHidden ? '▲ Ẩn Cài Đặt Nâng Cao' : '⚙️ Cài Đặt Nâng Cao (Supabase API)';
      });
    }

    // Sync Now button
    if (this.btnSyncNow) {
      this.btnSyncNow.addEventListener('click', async () => {
        this.btnSyncNow.style.transform = 'rotate(360deg)';
        this.btnSyncNow.style.transition = 'transform 0.6s ease';
        await this.loadLibrary(true);
        setTimeout(() => { this.btnSyncNow.style.transform = 'none'; }, 600);
      });
    }

    // Export Library JSON
    this.btnExportJSON.addEventListener('click', async () => {
      const json = await CloudSyncEngine.exportLibraryJSON(this.currentTrackList);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ShinTag_Backup_${Date.now()}.json`;
      a.click();
      this.showToast('Đã xuất bản sao lưu!');
    });

    // Save Supabase Config
    this.btnSaveCloudConfig.addEventListener('click', () => {
      this.cloudSync.saveConfig({
        supabaseUrl: this.cfgSupabaseUrl.value.trim(),
        supabaseAnonKey: this.cfgSupabaseKey.value.trim()
      });
      this.showToast('Đã lưu cấu hình Supabase!');
    });
  }

  updateAdminUI() {
    if (!this.btnToggleAdmin || !this.adminStatusNotice) return;
    if (this.cloudSync.isAdmin) {
      this.btnToggleAdmin.textContent = 'Tắt Admin';
      this.btnToggleAdmin.style.background = 'var(--ios-red)';
      this.btnToggleAdmin.style.color = '#fff';
      this.adminStatusNotice.style.display = 'block';
    } else {
      this.btnToggleAdmin.textContent = 'Bật Admin';
      this.btnToggleAdmin.style.background = 'var(--ios-surface)';
      this.btnToggleAdmin.style.color = 'var(--ios-blue)';
      this.adminStatusNotice.style.display = 'none';
    }
  }

  formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  openModal(modalElement) {
    modalElement.classList.add('active');
  }

  async handleCoverSelect(file) {
    if (!file) return;
    this.selectedCoverFile = file;
    this.selectedCoverMime = file.type || 'image/jpeg';
    this.selectedCoverBlob = file;
    
    const arrayBuf = await file.arrayBuffer();
    this.selectedCoverBytes = new Uint8Array(arrayBuf);

    const url = URL.createObjectURL(file);
    this.coverPreview.src = url;
    this.coverPreview.style.display = 'block';
    this.coverPlaceholder.style.display = 'none';

    this.showToast('Đã tải ảnh bìa!');
  }

  async handleAudioSelect(file) {
    if (!file) return;
    this.selectedAudioFile = file;
    this.selectedAudioBuffer = await file.arrayBuffer();

    const tempAudio = new Audio();
    const tempUrl = URL.createObjectURL(file);
    tempAudio.src = tempUrl;
    tempAudio.addEventListener('loadedmetadata', () => {
      this.selectedAudioDuration = tempAudio.duration || 0;
      const durText = this.formatTime(this.selectedAudioDuration);
      const sizeText = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      this.audioFileSize.textContent = `⏱️ Thời lượng: ${durText} • 📦 Dung lượng: ${sizeText}`;
      URL.revokeObjectURL(tempUrl);
    });

    this.audioFileName.textContent = file.name;
    this.audioZone.classList.add('has-file');

    if (!this.inputTitle.value) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      this.inputTitle.value = baseName;
    }

    this.showToast('Đã tải file bài hát!');
  }

  async createAndTagTrack() {
    if (!this.selectedAudioBuffer) {
      alert('Vui lòng chọn file nhạc trước!');
      return;
    }

    const title = this.inputTitle.value.trim() || 'Untitled Track';
    const artist = this.inputArtist.value.trim() || 'Unknown Artist';
    const album = this.inputAlbum.value.trim() || 'ShinTag Music';
    const year = parseInt(this.inputYear.value) || new Date().getFullYear();

    this.btnCreateTrack.disabled = true;
    this.btnCreateTrack.innerHTML = `<span>⏳ Đang nhúng ảnh & tải lên Cloud...</span>`;

    try {
      const taggedBytes = await ID3Engine.tagMP3(this.selectedAudioBuffer, {
        title,
        artist,
        album,
        year,
        imageBytes: this.selectedCoverBytes,
        mimeType: this.selectedCoverMime
      });

      const audioBlob = new Blob([taggedBytes], { type: 'audio/mpeg' });
      const coverBlob = this.selectedCoverBytes ? new Blob([this.selectedCoverBytes], { type: this.selectedCoverMime }) : null;

      const trackRecord = {
        title,
        artist,
        album,
        year,
        duration: this.selectedAudioDuration || 0,
        audioBlob,
        coverBlob,
        fileSize: audioBlob.size,
        syncStatus: 'synced'
      };

      const savedTrack = await StorageEngine.saveTrack(trackRecord);

      // Upload Audio & Cover to Supabase Storage so ALL devices can play it
      if (this.cloudSync.isAuthenticated()) {
        const syncResult = await this.cloudSync.syncTrack(savedTrack, (msg) => {
          this.btnCreateTrack.innerHTML = `<span>⏳ ${msg}</span>`;
        });
        if (syncResult.success) {
          if (syncResult.audioUrl) savedTrack.audioUrl = syncResult.audioUrl;
          if (syncResult.coverUrl) savedTrack.coverUrl = syncResult.coverUrl;
          await StorageEngine.saveTrack(savedTrack);
          this.showToast('☁️ Đã lưu nhạc & ảnh lên Supabase Cloud!');
        }
      }

      // Trigger Instant Download
      const downloadUrl = URL.createObjectURL(audioBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${artist} - ${title}.mp3`;
      downloadLink.click();

      this.showToast(`Đã tạo xong "${title}" có ảnh bìa & tải về!`);

      // Refresh Library
      await this.loadLibrary();

      // Switch to Library tab
      const libraryTab = document.querySelector('[data-tab="library"]');
      if (libraryTab) libraryTab.click();

      // Start playing
      this.playTrackInApp(savedTrack);

    } catch (err) {
      console.error(err);
      alert('Lỗi: ' + err.message);
    } finally {
      this.btnCreateTrack.disabled = false;
      this.btnCreateTrack.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        <span>Tạo File & Lưu Bài Hát</span>
      `;
    }
  }

  async loadLibrary(syncCloud = false) {
    const localTracks = await StorageEngine.getAllTracks();
    const trackMap = new Map();
    localTracks.forEach(t => trackMap.set(t.id, t));

    // Always fetch remote tracks from Supabase to get latest data
    if (this.cloudSync.isConfigured()) {
      const remoteRes = await this.cloudSync.fetchRemoteTracks();
      if (remoteRes.success && remoteRes.tracks && remoteRes.tracks.length > 0) {
        for (const r of remoteRes.tracks) {
          const defaultAudioUrl = this.cloudSync.getPublicUrl(`${r.id}/audio.mp3`);
          const defaultCoverUrl = this.cloudSync.getPublicUrl(`${r.id}/cover.jpg`);

          if (!trackMap.has(r.id)) {
            const mergedRecord = {
              id: r.id,
              title: r.title,
              artist: r.artist,
              album: r.album,
              year: r.year,
              fileSize: r.file_size,
              audioUrl: r.audio_url || defaultAudioUrl,
              coverUrl: r.cover_url || defaultCoverUrl,
              createdAt: new Date(r.created_at).getTime(),
              syncStatus: 'synced'
            };
            await StorageEngine.saveTrack(mergedRecord);
            trackMap.set(r.id, mergedRecord);
          } else {
            const existing = trackMap.get(r.id);
            if (!existing.audioUrl) existing.audioUrl = r.audio_url || defaultAudioUrl;
            if (!existing.coverUrl) existing.coverUrl = r.cover_url || defaultCoverUrl;
            await StorageEngine.saveTrack(existing);
          }
        }
      }
    }

    this.currentTrackList = Array.from(trackMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    this.libraryCount.textContent = this.currentTrackList.length;
    this.renderLibraryList(this.currentTrackList);

    if (syncCloud) {
      const count = this.currentTrackList.length;
      this.showToast(count > 0 ? `☁️ Đã đồng bộ (${count} bài hát)!` : '☁️ Đã kết nối Cloud — Thư viện trống');
    }
  }

  renderLibraryList(tracks) {
    this.libraryContainer.innerHTML = '';

    if (tracks.length === 0) {
      this.libraryContainer.innerHTML = `
        <div style="text-align:center; padding: 48px 20px; color: var(--text-secondary);">
          <div style="font-size:46px;margin-bottom:10px;">🎵</div>
          <p style="font-weight:800;font-size:17px;color:var(--text-primary)">Chưa Có Bài Hát Nào</p>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:4px;">Chạm vào tab "Tạo Nhạc" ở góc dưới để nhúng ảnh bìa bài hát đầu tiên nhé!</p>
        </div>
      `;
      return;
    }

    tracks.forEach((track, index) => {
      const row = document.createElement('div');
      row.className = 'ios-track-row';

      const thumbImg = document.createElement('img');
      thumbImg.className = 'ios-track-thumb';
      if (track.coverBlob) {
        thumbImg.src = URL.createObjectURL(track.coverBlob);
      } else if (track.coverUrl) {
        thumbImg.src = track.coverUrl;
      } else {
        thumbImg.src = DEFAULT_COVER_SVG;
      }
      thumbImg.alt = 'Artwork';
      thumbImg.onerror = () => { thumbImg.src = DEFAULT_COVER_SVG; };

      const metaDiv = document.createElement('div');
      metaDiv.className = 'ios-track-meta';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'ios-track-title';
      titleDiv.textContent = track.title || 'Untitled Track';

      const subDiv = document.createElement('div');
      subDiv.className = 'ios-track-sub';
      const durFormatted = track.duration ? ` • ⏱️ ${this.formatTime(track.duration)}` : '';
      subDiv.textContent = `${track.artist || 'Unknown Artist'}${durFormatted}`;

      const badgeDiv = document.createElement('div');
      badgeDiv.className = 'ios-track-badge';
      badgeDiv.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span>${track.syncStatus === 'synced' ? 'Đã đồng bộ Supabase' : 'Lưu trên iPhone'}</span>
      `;

      metaDiv.appendChild(titleDiv);
      metaDiv.appendChild(subDiv);
      metaDiv.appendChild(badgeDiv);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'ios-row-actions';

      const dlBtn = document.createElement('button');
      dlBtn.className = 'ios-circle-btn btn-download-track';
      dlBtn.title = 'Tải file MP3';
      dlBtn.style.width = '36px';
      dlBtn.style.height = '36px';
      dlBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';

      dlBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (track.audioBlob) {
          const url = URL.createObjectURL(track.audioBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${track.artist} - ${track.title}.mp3`;
          a.click();
          this.showToast(`Đang tải "${track.title}.mp3"...`);
        } else if (track.audioUrl) {
          this.showToast(`Đang tải từ Cloud...`);
          try {
            const resp = await fetch(track.audioUrl);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${track.artist} - ${track.title}.mp3`;
            a.click();
          } catch (err) {
            window.open(track.audioUrl, '_blank');
          }
        } else {
          this.showToast(`Đã lưu trên Cloud: "${track.title}"`);
        }
      });
      actionsDiv.appendChild(dlBtn);

      // Admin Delete Button
      const delBtn = document.createElement('button');
      delBtn.className = 'ios-circle-btn btn-delete-track';
      delBtn.title = this.cloudSync.isAdmin ? 'Xóa bài hát (Admin)' : 'Cần quyền Admin để xóa';
      delBtn.style.width = '36px';
      delBtn.style.height = '36px';
      delBtn.style.color = this.cloudSync.isAdmin ? 'var(--ios-red)' : 'var(--text-tertiary)';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        if (!this.cloudSync.isAdmin) {
          const pin = prompt('Nhập mã PIN Admin để xóa bài hát:');
          if (pin !== '2005') {
            alert('Mã PIN Admin không chính xác!');
            return;
          }
          this.cloudSync.setAdmin(true);
          this.updateAdminUI();
        }

        if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bài "${track.title}" khỏi cả thiết bị và Supabase Cloud không?`)) {
          await StorageEngine.deleteTrack(track.id);
          await this.cloudSync.deleteRemoteTrack(track.id);

          this.currentTrackList = this.currentTrackList.filter(t => t.id !== track.id);
          this.libraryCount.textContent = this.currentTrackList.length;
          this.renderLibraryList(this.currentTrackList);

          this.showToast('🗑️ Đã xóa bài hát khỏi cả máy và Supabase!');
        }
      });
      actionsDiv.appendChild(delBtn);

      row.appendChild(thumbImg);
      row.appendChild(metaDiv);
      row.appendChild(actionsDiv);

      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-download-track') || e.target.closest('.btn-delete-track')) return;
        this.currentPlayingIndex = index;
        this.playTrackInApp(track);
      });

      this.libraryContainer.appendChild(row);
    });
  }

  async playTrackInApp(track) {
    this.miniPlayer.style.display = 'flex';
    
    let coverSrc = DEFAULT_COVER_SVG;
    if (track.coverBlob) {
      coverSrc = URL.createObjectURL(track.coverBlob);
    } else if (track.coverUrl) {
      coverSrc = track.coverUrl;
    }

    // Mini Player
    this.playerCover.src = coverSrc;
    this.playerCover.onerror = () => { this.playerCover.src = DEFAULT_COVER_SVG; };
    this.playerTitle.textContent = track.title;
    this.playerArtist.textContent = `${track.artist} • 0:00 / 0:00`;

    // Fullscreen Now Playing Sheet
    if (this.nowPlayingArt) {
      this.nowPlayingArt.src = coverSrc;
      this.nowPlayingArt.onerror = () => { this.nowPlayingArt.src = DEFAULT_COVER_SVG; };
    }
    if (this.nowPlayingTitle) this.nowPlayingTitle.textContent = track.title;
    if (this.nowPlayingArtist) this.nowPlayingArtist.textContent = track.artist;
    if (this.seekSlider) this.seekSlider.value = 0;

    if (!track.audioBlob && track.audioUrl) {
      this.showToast(`☁️ Đang phát trực tuyến từ Supabase Cloud...`);
    }

    await this.audioPlayer.playTrack(track, track.coverBlob || coverSrc);
  }

  playNextTrack() {
    if (this.currentTrackList.length > 0) {
      this.currentPlayingIndex = (this.currentPlayingIndex + 1) % this.currentTrackList.length;
      this.playTrackInApp(this.currentTrackList[this.currentPlayingIndex]);
    }
  }

  playPrevTrack() {
    if (this.currentTrackList.length > 0) {
      this.currentPlayingIndex = (this.currentPlayingIndex - 1 + this.currentTrackList.length) % this.currentTrackList.length;
      this.playTrackInApp(this.currentTrackList[this.currentPlayingIndex]);
    }
  }

  initVisualizer() {
    this.audioPlayer.attachVisualizer(this.waveformCanvas);
  }

  renderCloudUser() {
    const u = this.cloudSync.user || { name: 'Hoang Nam', email: 'hoangnamnion@cloud.io' };
    this.cloudUserSection.innerHTML = `
      <div style="background:var(--ios-bg);border:1px solid var(--ios-card-border);border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg, var(--ios-green), #10b981);display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:18px;">
          ${(u.name || 'H')[0].toUpperCase()}
        </div>
        <div style="flex:1;">
          <div style="font-weight:800;font-size:15px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
            ${u.name}
            <span style="font-size:11px;font-weight:700;background:rgba(52,199,89,0.15);color:var(--ios-green);padding:2px 8px;border-radius:12px;">🟢 Tự động kết nối</span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);font-weight:500;">${u.email}</div>
        </div>
      </div>
    `;
  }

  async runTDDTests() {
    this.testResultsList.innerHTML = '<div style="color:var(--text-secondary);">Đang kiểm thử...</div>';
    const results = await runAllTests();
    this.testResultsList.innerHTML = '';

    results.forEach(res => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: var(--ios-bg);
        border: 1px solid ${res.passed ? 'var(--ios-green)' : 'var(--ios-red)'};
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
      item.innerHTML = `
        <span style="font-size:16px;">${res.passed ? '✅' : '❌'}</span>
        <div>
          <div style="font-weight:700;">${res.name}</div>
          <div style="color:var(--text-secondary);font-size:12px;">${res.message}</div>
        </div>
      `;
      this.testResultsList.appendChild(item);
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>🎵</span>
      <span>${message}</span>
    `;
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px) scale(0.9)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 2800);
    }, 2800);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
