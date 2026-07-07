const Jimp = require('jimp-compact');
const fs = require('fs');

async function main() {
  if (!fs.existsSync('assets/logo.jpg')) {
    console.error('logo.jpg does not exist');
    return;
  }
  const img = await Jimp.read('assets/logo.jpg');
  console.log(`Width: ${img.getWidth()}, Height: ${img.getHeight()}`);
  
  // Crop only the top skull graphic (from y = 0 to y = 640 of a 1024x1024 image)
  // Let's crop it to a square containing the skull: x=100, y=0, w=824, h=660
  const width = img.getWidth();
  const height = img.getHeight();
  
  // Let's crop the top part containing the skull icon
  // The skull is centered, let's crop x=50, y=0, w=width-100, h=Math.round(height * 0.62)
  const cropW = Math.round(width * 0.85);
  const cropH = Math.round(height * 0.62);
  const cropX = Math.round((width - cropW) / 2);
  const cropY = 10; // offset slightly from top
  
  const cropped = img.clone().crop(cropX, cropY, cropW, cropH);
  await cropped.writeAsync('assets/logo_icon.jpg');
  console.log('Successfully cropped logo icon to assets/logo_icon.jpg!');
}

main().catch(console.error);
