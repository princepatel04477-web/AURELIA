import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Process and optimize images per AURELIA brief specs:
 * - Product shots (jewelry/*): 1600px on long edge
 * - Cinematic 16:9 plates: 2560px wide
 * - Portrait/menu/category/bespoke: 1600px on long edge
 * - .webp: quality 82
 * - .jpg: quality 84, progressive, mozjpeg
 * - Strip metadata
 */
export async function processImage(inputPath, outputPath, options = {}) {
  const isWebp = outputPath.endsWith('.webp');
  const is169 = options.is169 || outputPath.includes('chapter-') || outputPath.includes('gold-texture') || outputPath.includes('atelier-hands');

  let pipeline = sharp(inputPath).rotate(); // auto-rotate based on EXIF

  const metadata = await pipeline.metadata();

  if (is169) {
    // 2560px wide
    pipeline = pipeline.resize({ width: 2560, withoutEnlargement: false });
  } else {
    // 1600px on the long edge
    if (metadata.width >= metadata.height) {
      pipeline = pipeline.resize({ width: 1600, withoutEnlargement: false });
    } else {
      pipeline = pipeline.resize({ height: 1600, withoutEnlargement: false });
    }
  }

  // Strip metadata
  pipeline = pipeline.withMetadata(false);

  if (isWebp) {
    pipeline = pipeline.webp({ quality: 82 });
  } else {
    pipeline = pipeline.jpeg({ quality: 84, progressive: true, mozjpeg: true });
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  await pipeline.toFile(outputPath);
  const stats = fs.statSync(outputPath);
  return {
    path: outputPath,
    sizeKb: Math.round(stats.size / 1024),
    width: metadata.width,
    height: metadata.height,
  };
}

if (process.argv[2] && process.argv[3]) {
  processImage(process.argv[2], process.argv[3]).then((res) => {
    console.log(JSON.stringify(res));
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
