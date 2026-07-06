const fs = require('fs');
const zlib = require('zlib');

try {
  const buf = fs.readFileSync('android/gradle/wrapper/gradle-wrapper.jar');
  console.log('Size of jar:', buf.length);
  // A ZIP file starts with 'PK\x03\x04'
  console.log('Magic bytes:', buf.toString('hex', 0, 4));
} catch (e) {
  console.error(e);
}
