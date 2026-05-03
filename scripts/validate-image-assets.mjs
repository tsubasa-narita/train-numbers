import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const trainDataPath = path.join(root, 'src', 'data', 'quizTrains.ts');
const trainDir = path.join(root, 'public', 'images', 'trains');
const requiredTrainSize = { width: 384, height: 512 };

function pngSize(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function jpgSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error('Unsupported JPEG structure');
}

function imageSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return pngSize(buffer);
  if (ext === '.jpg' || ext === '.jpeg') return jpgSize(buffer);
  throw new Error(`Unsupported train image extension: ${ext}`);
}

const trainData = fs.readFileSync(trainDataPath, 'utf8');
const trainImages = [...trainData.matchAll(/image: '([^']+)'/g)].map((match) => match[1]);
const failures = [];

for (const imageName of trainImages) {
  const imagePath = path.join(trainDir, imageName);
  if (!fs.existsSync(imagePath)) {
    failures.push(`${imageName}: missing file`);
    continue;
  }

  const size = imageSize(imagePath);
  if (size.width !== requiredTrainSize.width || size.height !== requiredTrainSize.height) {
    failures.push(`${imageName}: expected ${requiredTrainSize.width}x${requiredTrainSize.height}, got ${size.width}x${size.height}`);
  }
}

if (failures.length > 0) {
  console.error('Train image asset validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Train image asset validation passed (${trainImages.length} images).`);
