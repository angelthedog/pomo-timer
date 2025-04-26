const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Input and output paths
const inputPath = path.join(__dirname, '../public/focusMind.png');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Sizes to generate
const sizes = [16, 32, 192, 512, 1024];

// Process each size
async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `${size}.png`);
    
    // Load the image
    const image = sharp(inputPath);
    
    // First, make the lines thicker by duplicating and offsetting the image
    const thickerImage = await image
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .composite([
        {
          input: await image
            .resize(size, size, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toBuffer(),
          blend: 'over',
          top: 1,
          left: 1
        },
        {
          input: await image
            .resize(size, size, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toBuffer(),
          blend: 'over',
          top: -1,
          left: -1
        }
      ])
      .toBuffer();
    
    // Then add the dark background
    await sharp(thickerImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 30, g: 36, b: 51, alpha: 1 } // #1e2433
      })
      .composite([{
        input: Buffer.from(`
          <svg>
            <rect x="0" y="0" width="${size}" height="${size}" fill="#1e2433"/>
          </svg>
        `),
        blend: 'dest-over'
      }])
      .toFile(outputPath);
    
    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error); 