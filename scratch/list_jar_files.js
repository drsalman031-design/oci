const fs = require('fs');

try {
  const buf = fs.readFileSync('android/gradle/wrapper/gradle-wrapper.jar');
  let pos = 0;
  const files = [];
  
  while (pos < buf.length - 30) {
    // Look for Local File Header signature: 50 4b 03 04
    if (buf[pos] === 0x50 && buf[pos+1] === 0x4b && buf[pos+2] === 0x03 && buf[pos+3] === 0x04) {
      const fileNameLen = buf.readUInt16LE(pos + 26);
      const extraLen = buf.readUInt16LE(pos + 28);
      const fileName = buf.toString('utf8', pos + 30, pos + 30 + fileNameLen);
      if (fileName) files.push(fileName);
      pos += 30 + fileNameLen + extraLen;
    } else {
      pos++;
    }
  }
  
  console.log('Files in jar (total ' + files.length + '):');
  console.log(files.slice(0, 30));
} catch (e) {
  console.error(e);
}
