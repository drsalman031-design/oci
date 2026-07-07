const Jimp = require('jimp-compact');
const fs = require('fs');

async function main() {
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }
  const createImage = (w, h, color) => new Promise((resolve, reject) => {
    new Jimp(w, h, color, (err, img) => {
      if (err) reject(err);
      else resolve(img);
    });
  });
  const iconImg = await createImage(1024, 1024, 0x14B8A6FF);
  await iconImg.writeAsync('assets/icon.png');
  await iconImg.writeAsync('assets/adaptive-icon.png');
  const splashImg = await createImage(1284, 2778, 0x0B1020FF);
  await splashImg.writeAsync('assets/splash.png');
  const faviconImg = await createImage(48, 48, 0x14B8A6FF);
  await faviconImg.writeAsync('assets/favicon.png');
  const loaderImg = await createImage(512, 512, 0x14B8A6FF);
  await loaderImg.writeAsync('assets/loader.png');
  console.log('Successfully regenerated all assets dynamically!');
}

main().catch(err => {
  console.error('Failed to regenerate assets:', err);
  process.exit(1);
});
