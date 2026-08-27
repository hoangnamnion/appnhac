import { ID3Engine } from './id3-engine.js';
import { StorageEngine } from './storage-engine.js';
import { CloudSyncEngine } from './cloud-sync.js';

export async function runAllTests() {
  const results = [];

  function assert(name, condition, message = '') {
    results.push({
      name,
      passed: Boolean(condition),
      message: condition ? 'Passed' : message || 'Assertion failed'
    });
  }

  // TEST 1: Synchsafe Integer Encoder / Decoder
  try {
    const originalNum = 123456;
    const encoded = ID3Engine.encodeSynchsafe(originalNum);
    const decoded = ID3Engine.decodeSynchsafe(encoded, 0);
    assert('TDD 1: Synchsafe integer encoding & decoding math', originalNum === decoded, `Expected ${originalNum} but got ${decoded}`);
  } catch (e) {
    assert('TDD 1: Synchsafe integer math', false, e.message);
  }

  // TEST 2: ID3 Text Frame & APIC Frame Header
  try {
    const textFrame = ID3Engine.encodeTextFrame('TIT2', 'Song Test Title');
    const headerId = new TextDecoder().decode(textFrame.slice(0, 4));
    assert('TDD 2: Text Frame Header TIT2 Generation', headerId === 'TIT2', `Got ${headerId}`);

    const dummyPic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // Fake JPEG
    const picFrame = ID3Engine.encodePictureFrame(dummyPic, 'image/jpeg');
    const picHeaderId = new TextDecoder().decode(picFrame.slice(0, 4));
    assert('TDD 3: APIC Picture Frame Header Generation', picHeaderId === 'APIC', `Got ${picHeaderId}`);
  } catch (e) {
    assert('TDD 2 & 3: ID3 Frames', false, e.message);
  }

  // TEST 3: Full MP3 Binary Tagging
  try {
    // Generate a minimal dummy MP3 array buffer (MPEG sync word 0xFF 0xFB)
    const fakeAudio = new Uint8Array([0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const fakeCover = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]); // Minimal JPEG markers
    
    const tagged = await ID3Engine.tagMP3(fakeAudio.buffer, {
      title: 'TDD Hit Track',
      artist: 'Antigravity Artist',
      album: 'Vibrant Hits',
      year: 2026,
      imageBytes: fakeCover,
      mimeType: 'image/jpeg'
    });

    const isID3 = tagged[0] === 0x49 && tagged[1] === 0x44 && tagged[2] === 0x33;
    assert('TDD 4: Tagged MP3 Header starts with ID3 signature (0x49, 0x44, 0x33)', isID3);
    assert('TDD 5: Tagged MP3 output size is greater than raw audio', tagged.length > fakeAudio.length);
  } catch (e) {
    assert('TDD 4 & 5: MP3 Tagging', false, e.message);
  }

  // TEST 4: IndexedDB Storage Engine CRUD
  try {
    const testTrack = {
      id: 'tdd_track_' + Date.now(),
      title: 'Unit Test Song',
      artist: 'Tester',
      createdAt: Date.now(),
      syncStatus: 'local',
      audioBlob: new Blob(['fake audio content'], { type: 'audio/mpeg' })
    };

    await StorageEngine.saveTrack(testTrack);
    const retrieved = await StorageEngine.getTrackById(testTrack.id);
    assert('TDD 6: IndexedDB Save & Retrieve Track Record', retrieved && retrieved.title === 'Unit Test Song');

    await StorageEngine.deleteTrack(testTrack.id);
    const afterDelete = await StorageEngine.getTrackById(testTrack.id);
    assert('TDD 7: IndexedDB Delete Track Record', !afterDelete);
  } catch (e) {
    assert('TDD 6 & 7: IndexedDB Storage', false, e.message);
  }

  // TEST 5: Cloud Sync Engine Demo Auth
  try {
    const sync = new CloudSyncEngine();
    const user = sync.loginDemo('test@music.com');
    assert('TDD 8: Cloud Sync Engine Demo User Authentication', user && user.email === 'test@music.com');
  } catch (e) {
    assert('TDD 8: Cloud Sync Engine Auth', false, e.message);
  }

  return results;
}
