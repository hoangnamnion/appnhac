/**
 * ID3v2.3 Binary Writer and Parser Engine
 * Fully compatible with Windows Media Player, Apple Music, iPhone Files, Groove, and Android
 * Uses UTF-16 with BOM for full Unicode / Vietnamese character support (TIT2, TPE1, TALB)
 * Uses standard ID3v2.3 APIC (Attached Picture) frame structure
 */
export class ID3Engine {
  /**
   * Convert number to 4-byte synchsafe integer (7 bits per byte, MSB = 0)
   */
  static encodeSynchsafe(num) {
    const bytes = new Uint8Array(4);
    bytes[0] = (num >> 21) & 0x7f;
    bytes[1] = (num >> 14) & 0x7f;
    bytes[2] = (num >> 7) & 0x7f;
    bytes[3] = num & 0x7f;
    return bytes;
  }

  /**
   * Convert synchsafe 4 bytes back to normal integer
   */
  static decodeSynchsafe(bytes, offset = 0) {
    return (
      ((bytes[offset] & 0x7f) << 21) |
      ((bytes[offset + 1] & 0x7f) << 14) |
      ((bytes[offset + 2] & 0x7f) << 7) |
      (bytes[offset + 3] & 0x7f)
    );
  }

  /**
   * Encode string to UTF-16LE with BOM (0xFF, 0xFE) for ID3v2.3 Unicode compatibility
   */
  static encodeUTF16WithBOM(str) {
    const codeUnits = new Uint16Array(str.length + 1);
    codeUnits[0] = 0xFEFF; // BOM (will be written as Little Endian 0xFF 0xFE on x86/ARM)
    for (let i = 0; i < str.length; i++) {
      codeUnits[i + 1] = str.charCodeAt(i);
    }
    return new Uint8Array(codeUnits.buffer);
  }

  /**
   * Encode text frame in ID3v2.3 (Encoding byte 0x01 = UTF-16 with BOM)
   */
  static encodeTextFrame(frameId, text) {
    if (!text) return null;
    const utf16Bytes = this.encodeUTF16WithBOM(text);
    
    // Frame content: [1 byte encoding = 0x01] + [UTF-16 with BOM]
    const frameContent = new Uint8Array(1 + utf16Bytes.length);
    frameContent[0] = 0x01; // UTF-16 with BOM
    frameContent.set(utf16Bytes, 1);

    return this.createFrame(frameId, frameContent);
  }

  /**
   * Build APIC (Attached Picture) frame with Cover Art for ID3v2.3
   * @param {Uint8Array} imageBytes
   * @param {string} mimeType (e.g. 'image/jpeg', 'image/png')
   */
  static encodePictureFrame(imageBytes, mimeType = 'image/jpeg') {
    if (!imageBytes || imageBytes.length === 0) return null;

    // Detect actual MIME from magic bytes if possible
    let cleanMime = mimeType || 'image/jpeg';
    if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4E && imageBytes[3] === 0x47) {
      cleanMime = 'image/png';
    } else if (imageBytes[0] === 0xFF && imageBytes[1] === 0xD8) {
      cleanMime = 'image/jpeg';
    }

    const mimeEncoder = new TextEncoder();
    const mimeBytes = mimeEncoder.encode(cleanMime);

    // Frame layout (ID3v2.3):
    // 1. Text encoding: 1 byte (0x00 = ISO-8859-1 for MIME and description)
    // 2. MIME type: ASCII string + 0x00 null terminator
    // 3. Picture type: 1 byte (0x03 = Front Cover)
    // 4. Description: 0x00 (empty string null-terminated)
    // 5. Picture data: raw image binary
    const headerSize = 1 + mimeBytes.length + 1 + 1 + 1;
    const frameContent = new Uint8Array(headerSize + imageBytes.length);

    let offset = 0;
    frameContent[offset++] = 0x00; // ISO-8859-1

    frameContent.set(mimeBytes, offset);
    offset += mimeBytes.length;
    frameContent[offset++] = 0x00; // Null terminator for MIME

    frameContent[offset++] = 0x03; // Picture Type: 0x03 = Cover (Front)
    frameContent[offset++] = 0x00; // Empty description terminator

    frameContent.set(imageBytes, offset);

    return this.createFrame('APIC', frameContent);
  }

  /**
   * Create an ID3v2.3 Frame with 10-byte header
   */
  static createFrame(frameId, contentBytes) {
    const frameIdBytes = new TextEncoder().encode(frameId.padEnd(4, ' ').slice(0, 4));
    const frame = new Uint8Array(10 + contentBytes.length);

    // 4 bytes: Frame ID (e.g. 'APIC', 'TIT2', 'TPE1')
    frame.set(frameIdBytes, 0);

    // 4 bytes: Frame size (Standard 32-bit big-endian integer for ID3v2.3)
    const size = contentBytes.length;
    frame[4] = (size >> 24) & 0xff;
    frame[5] = (size >> 16) & 0xff;
    frame[6] = (size >> 8) & 0xff;
    frame[7] = size & 0xff;

    // 2 bytes: Flags (0x00 0x00)
    frame[8] = 0x00;
    frame[9] = 0x00;

    // Frame payload
    frame.set(contentBytes, 10);
    return frame;
  }

  /**
   * Strip existing ID3v2 header if present in MP3
   */
  static stripExistingID3(audioBuffer) {
    const bytes = new Uint8Array(audioBuffer);
    if (bytes.length < 10) return bytes;

    // Check for 'ID3' header
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const tagSize = this.decodeSynchsafe(bytes, 6);
      const totalHeaderSize = 10 + tagSize;
      if (totalHeaderSize < bytes.length) {
        return bytes.slice(totalHeaderSize);
      }
    }
    return bytes;
  }

  /**
   * Embed Cover Art and Metadata into an MP3 Audio ArrayBuffer
   * Returns a new Uint8Array ready for download or playback
   */
  static async tagMP3(audioArrayBuffer, { title, artist, album, year, imageBytes, mimeType }) {
    const rawAudio = this.stripExistingID3(audioArrayBuffer);
    const frames = [];

    if (title) {
      const f = this.encodeTextFrame('TIT2', title);
      if (f) frames.push(f);
    }
    if (artist) {
      const f = this.encodeTextFrame('TPE1', artist);
      if (f) frames.push(f);
    }
    if (album) {
      const f = this.encodeTextFrame('TALB', album);
      if (f) frames.push(f);
    }
    if (year) {
      const f = this.encodeTextFrame('TYER', year.toString());
      if (f) frames.push(f);
    }
    if (imageBytes && imageBytes.length > 0) {
      const f = this.encodePictureFrame(imageBytes, mimeType || 'image/jpeg');
      if (f) frames.push(f);
    }

    // Calculate total frames size
    const totalFramesSize = frames.reduce((acc, frame) => acc + frame.length, 0);

    // Build 10-byte ID3v2.3 Header
    const id3Header = new Uint8Array(10);
    id3Header[0] = 0x49; // 'I'
    id3Header[1] = 0x44; // 'D'
    id3Header[2] = 0x33; // '3'
    id3Header[3] = 0x03; // Version 2.3
    id3Header[4] = 0x00; // Revision 0
    id3Header[5] = 0x00; // Flags

    const synchsafeSize = this.encodeSynchsafe(totalFramesSize);
    id3Header.set(synchsafeSize, 6);

    // Combine: [ID3 Header] + [Frames] + [Raw Audio]
    const finalBuffer = new Uint8Array(10 + totalFramesSize + rawAudio.length);
    finalBuffer.set(id3Header, 0);

    let offset = 10;
    for (const frame of frames) {
      finalBuffer.set(frame, offset);
      offset += frame.length;
    }
    finalBuffer.set(rawAudio, offset);

    return finalBuffer;
  }
}
