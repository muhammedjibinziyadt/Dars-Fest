/**
 * Icon Generator Script
 * 
 * This script generates PWA icons from a source image.
 * Place your source logo/icon as public/icon-source.png (or .jpg, .webp)
 * and run: node scripts/generate-icons.js
 * 
 * Requires: sharp package (npm install sharp --save-dev)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = path.join(__dirname, '../public/funoon-logo.webp');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // Check if source image exists
    if (!fs.existsSync(sourceImage)) {
      console.error(`Source image not found: ${sourceImage}`);
      console.log('Please ensure funoon-logo.webp exists in the public folder');
      return;
    }

    console.log('Generating PWA icons...');

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 59, g: 7, b: 100, alpha: 1 } // #3b0764 theme color
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    }

    // Generate apple-touch-icon (180x180)
    await sharp(sourceImage)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 59, g: 7, b: 100, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    console.log('✓ Generated apple-touch-icon.png');
    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();

