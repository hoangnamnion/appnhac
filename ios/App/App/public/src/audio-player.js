/**
 * Audio Player with Web Audio API Waveform Visualizer, Seeking / Scrubbing & Lockscreen MediaSession API
 */
export class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentTrack = null;
    this.isPlaying = false;
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.canvasContext = null;
    this.animationFrameId = null;

    this.onStateChangeCallbacks = [];
    this.onTimeUpdateCallbacks = [];
    this.onLoadedMetadataCallbacks = [];

    this.initAudioEvents();
  }

  initAudioEvents() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateMediaSessionPlaybackState('playing');
      this.notifyStateChange();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateMediaSessionPlaybackState('paused');
      this.notifyStateChange();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.notifyTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
      this.updateMediaSessionPositionState();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.notifyLoadedMetadata(this.audio.duration || 0);
      this.updateMediaSessionPositionState();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.notifyStateChange();
      this.notifyAction('next');
    });

    this.setupMediaSessionActionHandlers();
  }

  setupMediaSessionActionHandlers() {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          this.audio.currentTime = details.seekTime;
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        this.seekRelative(-skipTime);
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        this.seekRelative(skipTime);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.notifyAction('prev');
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.notifyAction('next');
      });
    }
  }

  updateMediaSessionPlaybackState(state) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  updateMediaSessionPositionState() {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: this.audio.duration,
            playbackRate: this.audio.playbackRate,
            position: Math.min(this.audio.currentTime, this.audio.duration)
          });
        } catch (e) {
          // Ignored if unsupported
        }
      }
    }
  }

  static async blobToBase64(blob) {
    if (!blob) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  }

  async updateMediaSessionMetadata(track, coverBlobOrDataUrl) {
    if ('mediaSession' in navigator) {
      let dataUrl = null;
      if (typeof coverBlobOrDataUrl === 'string') {
        dataUrl = coverBlobOrDataUrl;
      } else if (coverBlobOrDataUrl instanceof Blob) {
        dataUrl = await AudioPlayer.blobToBase64(coverBlobOrDataUrl);
      }

      const artworkList = [];
      if (dataUrl) {
        artworkList.push(
          { src: dataUrl, sizes: '96x96', type: 'image/jpeg' },
          { src: dataUrl, sizes: '128x128', type: 'image/jpeg' },
          { src: dataUrl, sizes: '192x192', type: 'image/jpeg' },
          { src: dataUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: dataUrl, sizes: '384x384', type: 'image/jpeg' },
          { src: dataUrl, sizes: '512x512', type: 'image/jpeg' }
        );
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Untitled Track',
        artist: track.artist || 'Unknown Artist',
        album: track.album || 'ShinTag Music',
        artwork: artworkList
      });
    }
  }

  async playTrack(track, coverBlobOrUrl) {
    this.currentTrack = track;

    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }

    if (track.audioBlob) {
      this.currentUrl = URL.createObjectURL(track.audioBlob);
      this.audio.src = this.currentUrl;
    } else if (track.audioUrl) {
      this.audio.src = track.audioUrl;
    } else {
      console.warn('No audio source available for track:', track.id);
      return;
    }

    await this.updateMediaSessionMetadata(track, track.coverBlob || coverBlobOrUrl);

    // Resume AudioContext first (browser may suspend it until user interaction)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      await this.audio.play();
    } catch (e) {
      console.warn('Autoplay blocked or playback error:', e);
    }
  }

  play() {
    if (this.audio.src) {
      // Always resume AudioContext before playing
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.audio.play().catch(e => console.warn(e));
        });
      } else {
        this.audio.play().catch(e => console.warn(e));
      }
    }
  }

  pause() {
    this.audio.pause();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(percentage) {
    if (this.audio.duration) {
      this.audio.currentTime = (percentage / 100) * this.audio.duration;
    }
  }

  seekToSeconds(sec) {
    if (this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, sec));
    }
  }

  seekRelative(deltaSeconds) {
    if (this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + deltaSeconds));
    }
  }

  setVolume(vol) {
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  onTimeUpdate(cb) {
    this.onTimeUpdateCallbacks.push(cb);
  }

  onLoadedMetadata(cb) {
    this.onLoadedMetadataCallbacks.push(cb);
  }

  notifyStateChange() {
    this.onStateChangeCallbacks.forEach(cb => cb(this.isPlaying, this.currentTrack));
  }

  notifyTimeUpdate(curr, dur) {
    this.onTimeUpdateCallbacks.forEach(cb => cb(curr, dur));
  }

  notifyLoadedMetadata(dur) {
    this.onLoadedMetadataCallbacks.forEach(cb => cb(dur));
  }

  notifyAction(action) {
    if (this.onTrackAction) this.onTrackAction(action);
  }

  attachVisualizer(canvasElement) {
    if (!canvasElement) return;
    this.canvas = canvasElement;
    this.canvasContext = canvasElement.getContext('2d');

    const startAudioGraph = () => {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;

        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        } catch (err) {
          // Already connected
        }
      }
      this.renderVisualizer();
    };

    // Resume AudioContext on ANY user interaction, not just once
    const resumeOnInteraction = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    };
    document.addEventListener('click', resumeOnInteraction);
    document.addEventListener('touchstart', resumeOnInteraction);

    startAudioGraph();
  }

  renderVisualizer() {
    if (!this.canvasContext || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationFrameId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      const width = this.canvas.width;
      const height = this.canvas.height;
      const ctx = this.canvasContext;

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.85;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, 'rgba(0, 122, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 122, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(50, 173, 230, 1)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();
  }
}
