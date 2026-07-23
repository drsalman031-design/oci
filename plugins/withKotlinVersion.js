const { withProjectBuildGradle } = require('@expo/config-plugins');

const withKotlinVersion = (config) => {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Ensure the fallback Kotlin version is 1.9.25
    contents = contents.replace(
      /kotlinVersion = findProperty\('android\.kotlinVersion'\) \?: '1\.9\.\d+'/,
      "kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.25'"
    );

    // Explicitly set the Kotlin Gradle Plugin version to use our kotlinVersion
    contents = contents.replace(
      /classpath\('org\.jetbrains\.kotlin:kotlin-gradle-plugin'\)/,
      "classpath(\"org.jetbrains.kotlin:kotlin-gradle-plugin:\$${kotlinVersion}\")"
    );

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withKotlinVersion;
