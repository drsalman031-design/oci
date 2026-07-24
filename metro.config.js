const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle the ONNX model (and .ort) as a static asset so it can be loaded on-device.
config.resolver.assetExts.push('onnx', 'ort');

module.exports = config;
