const fs = require('fs');
const path = require('path');

const dir1 = 'c:\\Users\\HP\\Downloads\\OCI MODAY';

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
console.log(JSON.stringify(files1, null, 2));
