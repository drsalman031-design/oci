const fs = require('fs');

try {
  const buf = fs.readFileSync('android/gradle/wrapper/gradle-wrapper.jar');
  const str = buf.toString('binary');
  const index = str.indexOf('GradleWrapperMain');
  console.log('Index of GradleWrapperMain:', index);
} catch (e) {
  console.error(e);
}
