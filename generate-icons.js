import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Simple uncompressed or deflate PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(2, 9); // color type 2: RGB
  ihdrData.writeUInt8(0, 10); // compression method 0
  ihdrData.writeUInt8(0, 11); // filter method 0
  ihdrData.writeUInt8(0, 12); // interlace method 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter type 0 (none) for each scanline
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter byte 0 (None)

    // Rounded rectangle corner check
    const radius = Math.floor(width * 0.22);
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      
      // Calculate distance to nearest corner for rounded squircle
      let inside = true;
      const dx = Math.min(x, width - 1 - x);
      const dy = Math.min(y, height - 1 - y);
      if (dx < radius && dy < radius) {
        const cornerDist = Math.hypot(radius - dx, radius - dy);
        if (cornerDist > radius) {
          inside = false;
        }
      }

      if (inside) {
        // Subtle vertical gradient from warm champagne to golden tan
        const factor = y / height;
        const curR = Math.round(248 - factor * 25);
        const curG = Math.round(230 - factor * 40);
        const curB = Math.round(200 - factor * 60);

        // Chef hat central mark outline check
        const cx = width / 2;
        const cy = height / 2;
        const distFromCenter = Math.hypot(x - cx, y - cy);
        const isCenterIcon = distFromCenter < width * 0.22 && distFromCenter > width * 0.16;

        if (isCenterIcon) {
          rawData[pxOffset] = 140;
          rawData[pxOffset + 1] = 90;
          rawData[pxOffset + 2] = 40;
        } else {
          rawData[pxOffset] = curR;
          rawData[pxOffset + 1] = curG;
          rawData[pxOffset + 2] = curB;
        }
      } else {
        // Outer background is ivory
        rawData[pxOffset] = 248;
        rawData[pxOffset + 1] = 244;
        rawData[pxOffset + 2] = 240;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 table & calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPng(192, 192));
fs.writeFileSync('./public/pwa-512x512.png', createPng(512, 512));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPng(512, 512));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180));
console.log('PWA PNG icons generated successfully!');
