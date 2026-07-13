const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir1 = 'c:\\Users\\HP\\Downloads\\OCI MODAY';
const dir2 = 'c:\\Users\\HP\\Downloads\\OCI MODAY\\extracted_oci';

function getHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== '.git' && file !== 'extracted_oci' && file !== 'node_modules' && file !== '.expo') {
        walk(filePath, fileList);
      }
    } else {
      if (file !== 'orthodontic-compensation-index-(oci) (2).zip') {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const files1 = walk(dir1).map(p => path.relative(dir1, p));
const files2 = walk(dir2).map(p => path.relative(dir2, p));

console.log(`Files in workspace: ${files1.length}`);
console.log(`Files in ZIP: ${files2.length}`);

const allFiles = Array.from(new Set([...files1, ...files2]));

console.log('Comparing files...');
let diffs = 0;
for (const file of allFiles) {
  const path1 = path.join(dir1, file);
  const path2 = path.join(dir2, file);
  
  const exists1 = fs.existsSync(path1);
  const exists2 = fs.existsSync(path2);
  
  if (!exists1) {
    console.log(`Only in ZIP: ${file}`);
    diffs++;
  } else if (!exists2) {
    console.log(`Only in Workspace: ${file}`);
    diffs++;
  } else {
    const hash1 = getHash(path1);
    const hash2 = getHash(path2);
    if (hash1 !== hash2) {
      console.log(`DIFFERENT: ${file}`);
      diffs++;
    }
  }
}
console.log(`Comparison finished. Found ${diffs} differences.`);
