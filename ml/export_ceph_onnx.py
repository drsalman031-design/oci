"""Export the CL-Detection2023 pretrained UNet (38-landmark heatmap model) to ONNX.

Usage:
    python export_ceph_onnx.py --weights best_model.pt --out ceph_unet_38.onnx
"""
import argparse
import torch

from utils.model import load_model


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--weights', default='best_model.pt')
    ap.add_argument('--out', default='ceph_unet_38.onnx')
    ap.add_argument('--opset', type=int, default=18)
    args = ap.parse_args()

    model = load_model(model_name='UNet')
    state = torch.load(args.weights, map_location='cpu')
    # Some checkpoints wrap the state dict; handle both.
    if isinstance(state, dict) and 'state_dict' in state:
        state = state['state_dict']
    model.load_state_dict(state)
    model.eval()

    dummy = torch.randn(1, 3, 512, 512, dtype=torch.float32)
    torch.onnx.export(
        model,
        dummy,
        args.out,
        input_names=['input'],
        output_names=['heatmaps'],
        opset_version=args.opset,
        do_constant_folding=True,
        verbose=False,
    )
    print(f'Exported ONNX -> {args.out}')

    # Quick shape sanity check with onnxruntime.
    import onnxruntime as ort
    import numpy as np
    sess = ort.InferenceSession(args.out, providers=['CPUExecutionProvider'])
    out = sess.run(None, {'input': dummy.numpy()})[0]
    print('ONNX output shape:', out.shape)  # expect (1, 38, 512, 512)


if __name__ == '__main__':
    main()
