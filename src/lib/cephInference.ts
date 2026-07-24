// On-device cephalometric landmark auto-detection.
//
// Loads the bundled ONNX UNet, runs it on a picked X-ray, and returns landmark
// positions in the DISPLAY coordinate space used by the tracing canvas.
//
// Prototype / non-commercial model — see src/lib/cephModel.ts and ml/README.md.

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Asset } from 'expo-asset';
import { decode as decodeJpeg } from 'jpeg-js';
import { LandmarkPositions } from './cephLandmarks';
import {
  CEPH_MODEL_INPUT_SIZE as SIZE,
  CHANNEL_TO_LANDMARK,
} from './cephModel';

export interface AutoDetectResult {
  positions: LandmarkPositions;
  confidence: Record<string, number>;
}

let sessionPromise: Promise<InferenceSession> | null = null;

async function getSession(): Promise<InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const asset = Asset.fromModule(require('../../assets/models/ceph_unet_38.onnx'));
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      const resp = await fetch(uri);
      const bytes = new Uint8Array(await resp.arrayBuffer());
      return InferenceSession.create(bytes);
    })().catch((e) => {
      sessionPromise = null; // allow retry on failure
      throw e;
    });
  }
  return sessionPromise;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') bufferLength--;
  if (base64[base64.length - 2] === '=') bufferLength--;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const e1 = lookup[base64.charCodeAt(i)];
    const e2 = lookup[base64.charCodeAt(i + 1)];
    const e3 = lookup[base64.charCodeAt(i + 2)];
    const e4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < bufferLength) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < bufferLength) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}

/** Preprocess: resize to 512x512, RGB [0,1], CHW Float32 tensor data. */
async function preprocess(uri: string): Promise<Float32Array> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: SIZE, height: SIZE } }],
    { base64: true, format: ImageManipulator.SaveFormat.JPEG },
  );
  if (!manipulated.base64) throw new Error('Image preprocessing failed (no base64).');
  const jpegBytes = base64ToUint8Array(manipulated.base64);
  const { data } = decodeJpeg(jpegBytes, { useTArray: true }); // RGBA, length SIZE*SIZE*4

  const chw = new Float32Array(3 * SIZE * SIZE);
  const plane = SIZE * SIZE;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const px = (y * SIZE + x) * 4;
      const idx = y * SIZE + x;
      chw[idx] = data[px] / 255; // R
      chw[plane + idx] = data[px + 1] / 255; // G
      chw[2 * plane + idx] = data[px + 2] / 255; // B
    }
  }
  return chw;
}

/** arg-max decode of one heatmap channel -> {x,y,conf} in 512-space. */
function argmaxChannel(data: Float32Array, channel: number): { x: number; y: number; conf: number } {
  const plane = SIZE * SIZE;
  const start = channel * plane;
  let maxVal = -Infinity;
  let maxIdx = 0;
  for (let i = 0; i < plane; i++) {
    const v = data[start + i];
    if (v > maxVal) {
      maxVal = v;
      maxIdx = i;
    }
  }
  return { x: maxIdx % SIZE, y: Math.floor(maxIdx / SIZE), conf: maxVal };
}

/**
 * Auto-detect landmarks on the given image and return positions in display space
 * (canvasW x canvasH). The model squashes the image to 512x512, so we scale x and y
 * independently back to the canvas — consistent with the reference pipeline.
 */
export async function autoDetectLandmarks(
  uri: string,
  canvasW: number,
  canvasH: number,
): Promise<AutoDetectResult> {
  const session = await getSession();
  const inputData = await preprocess(uri);
  const input = new Tensor('float32', inputData, [1, 3, SIZE, SIZE]);

  const inputName = session.inputNames[0] ?? 'input';
  const outputName = session.outputNames[0] ?? 'heatmaps';
  const output = await session.run({ [inputName]: input });
  const heatmaps = output[outputName].data as Float32Array;

  const positions: LandmarkPositions = {};
  const confidence: Record<string, number> = {};
  const sx = canvasW / SIZE;
  const sy = canvasH / SIZE;

  for (const channelStr of Object.keys(CHANNEL_TO_LANDMARK)) {
    const channel = Number(channelStr);
    const id = CHANNEL_TO_LANDMARK[channel];
    const { x, y, conf } = argmaxChannel(heatmaps, channel);
    positions[id] = { x: x * sx, y: y * sy };
    confidence[id] = conf;
  }

  return { positions, confidence };
}
