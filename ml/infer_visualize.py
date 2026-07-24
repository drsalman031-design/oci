"""Run the exported ONNX ceph model on a real image and save an annotated PNG
with all 38 landmark indices, plus a JSON of coordinates. Used to establish the
index -> anatomy mapping empirically for the prototype.

Usage:
    python infer_visualize.py --onnx ceph_unet_38.onnx --mha step5_docker_and_upload/test/stack1.mha --index 0
    python infer_visualize.py --onnx ceph_unet_38.onnx --image some_ceph.jpg
"""
import argparse
import json
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFont


def load_image(args):
    if args.image:
        img = Image.open(args.image).convert('RGB')
        return np.array(img)
    # else read from .mha stack
    import SimpleITK as sitk
    stack = sitk.ReadImage(args.mha)
    arr = sitk.GetArrayFromImage(stack)  # (N, H, W, 3) or (N, H, W)
    one = np.array(arr[args.index])
    if one.ndim == 2:
        one = np.stack([one] * 3, axis=-1)
    return one[:, :, :3]


def strip_zero_padding(image_array):
    row = np.sum(image_array, axis=(1, 2))
    col = np.sum(image_array, axis=(0, 2))
    nz_row = np.argwhere(row != 0)
    nz_col = np.argwhere(col != 0)
    if len(nz_row) == 0 or len(nz_col) == 0:
        return image_array
    last_row = int(nz_row[-1][0])
    last_col = int(nz_col[-1][0])
    return image_array[: last_row + 1, : last_col + 1, :]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--onnx', default='ceph_unet_38.onnx')
    ap.add_argument('--mha', default='step5_docker_and_upload/test/stack1.mha')
    ap.add_argument('--image', default=None)
    ap.add_argument('--index', type=int, default=0)
    ap.add_argument('--out', default='pred_visualization.png')
    ap.add_argument('--json', default='pred_landmarks.json')
    args = ap.parse_args()

    image = load_image(args)
    image = strip_zero_padding(image)
    h, w = image.shape[:2]

    # Preprocess exactly like the reference: resize to 512, scale to [0,1], CHW.
    pil = Image.fromarray(image.astype(np.uint8)).resize((512, 512), Image.BILINEAR)
    x = np.asarray(pil).astype(np.float32) / 255.0
    x = np.transpose(x, (2, 0, 1))[np.newaxis, :, :, :]

    sess = ort.InferenceSession(args.onnx, providers=['CPUExecutionProvider'])
    heatmaps = sess.run(None, {'input': x})[0][0]  # (38, 512, 512)

    landmarks = []
    for i in range(heatmaps.shape[0]):
        hm = heatmaps[i]
        yy, xx = np.where(hm == hm.max())
        x0, y0 = float(np.mean(xx)), float(np.mean(yy))
        conf = float(hm.max())
        # scale to original image size
        landmarks.append({'index': i + 1, 'x': x0 * w / 512, 'y': y0 * h / 512, 'conf': conf})

    with open(args.json, 'w') as f:
        json.dump(landmarks, f, indent=2)

    # Draw
    vis = Image.fromarray(image.astype(np.uint8)).convert('RGB')
    draw = ImageDraw.Draw(vis)
    r = max(6, w // 180)
    try:
        font = ImageFont.truetype('arial.ttf', size=max(28, w // 45))
    except Exception:
        font = ImageFont.load_default()
    for lm in landmarks:
        x0, y0 = lm['x'], lm['y']
        draw.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=(255, 40, 40), outline=(255, 255, 0), width=2)
        label = str(lm['index'])
        tx, ty = x0 + r + 2, y0 - r - 6
        # text background for readability
        bbox = draw.textbbox((tx, ty), label, font=font)
        draw.rectangle(bbox, fill=(0, 0, 0))
        draw.text((tx, ty), label, fill=(0, 255, 128), font=font)
    vis.save(args.out)
    print(f'Saved {args.out} and {args.json}. Image size {w}x{h}.')


if __name__ == '__main__':
    main()
