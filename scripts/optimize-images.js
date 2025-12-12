import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';

const ASSETS_DIR = './Assets';
const OUTPUT_DIR = './public/images';

// Configuration for different image types
const imageConfigs = {
  // Hero carousel images - larger for above the fold
  hero: {
    width: 1200,
    height: 800,
    quality: 85,
  },
  // CTA background - wider aspect ratio
  cta: {
    width: 1920,
    height: 1080,
    quality: 80,
  },
};

async function optimizeImages() {
  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = await readdir(ASSETS_DIR);

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const inputPath = join(ASSETS_DIR, file);
    const baseName = basename(file, ext).toLowerCase().replace(/_/g, '-');
    const outputPath = join(OUTPUT_DIR, `${baseName}.webp`);

    // Determine config based on filename
    const isHero = file.toLowerCase().includes('home');
    const config = isHero ? imageConfigs.hero : imageConfigs.cta;

    console.log(`Processing: ${file} -> ${baseName}.webp`);

    await sharp(inputPath)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: config.quality })
      .toFile(outputPath);

    // Get file sizes for comparison
    const originalSize = (await sharp(inputPath).metadata()).size;
    const optimizedMeta = await sharp(outputPath).metadata();

    console.log(
      `  Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> Optimized: ${(optimizedMeta.size / 1024).toFixed(0)}KB`
    );
  }

  console.log('\nAll images optimized successfully!');
}

optimizeImages().catch(console.error);
