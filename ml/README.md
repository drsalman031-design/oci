# Ceph auto-detection model — conversion tooling (prototype)

This folder documents how the on-device landmark-detection model in the app
(`assets/models/ceph_unet_38.onnx`) was produced, so it can be reproduced or
swapped later.

## Source model

- **Repo:** [szuboy/CL-Detection2023](https://github.com/szuboy/CL-Detection2023)
  (MICCAI CL-Detection 2023 challenge baseline).
- **Architecture:** UNet, input `1x3x512x512` RGB in `[0,1]`, output `1x38x512x512`
  sigmoid heatmaps. Landmark = arg-max of each heatmap channel.
- **Pretrained weights:** `best_model.pt` (~27 MB), Google Drive id
  `1Qvnym4oGSG903ti0z2HE6Dm1udNO692G` (linked from the repo README).
- **Reported accuracy:** MRE ≈ 3.3 mm, 2 mm SDR ≈ 65%. This is a *baseline* — good
  enough to prototype auto-placement + manual correction, NOT final clinical accuracy.

## ⚠️ Licensing (must resolve before commercial release)

The CL-Detection 2023 **dataset** is **CC BY-NC 4.0 (non-commercial)**. This model is
therefore for **prototyping / internal evaluation only**. Before shipping in the paid
app, replace it with a commercially-licensed model (or one trained on a licensed
dataset). See `docs/ceph-autodetect-plan.md` §2.1.

## Reproduce the ONNX export

```bash
# 1. Clone the baseline repo
git clone https://github.com/szuboy/CL-Detection2023.git
cd CL-Detection2023

# 2. Python env (CPU is fine for export)
python -m venv .venv && . .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install onnx onnxruntime onnxscript gdown numpy pillow scikit-image SimpleITK

# 3. Download pretrained weights
python -m gdown 1Qvnym4oGSG903ti0z2HE6Dm1udNO692G -O best_model.pt

# 4. Copy the two scripts from this folder into the repo, then export
python export_ceph_onnx.py --weights best_model.pt --out ceph_unet_38.onnx --opset 18
#    -> verifies output shape (1, 38, 512, 512)

# 5. (optional) visualize predictions to re-verify the landmark mapping
python infer_visualize.py --onnx ceph_unet_38.onnx --mha step5_docker_and_upload/test/stack1.mha --index 0

# 6. Copy the model into the app
cp ceph_unet_38.onnx ../assets/models/ceph_unet_38.onnx
```

On Windows set `PYTHONUTF8=1` before step 4/5 (torch's exporter prints unicode).

## Verified landmark mapping (0-based ONNX channel -> app landmark id)

Established empirically by running the model on the challenge's two sample cephs and
identifying each point by anatomical position (the challenge only labels points 1–38;
anatomical names live in the gated annotation guide). Indices 1–19 match the classic
ISBI-2015 order. This mapping lives in code at `src/lib/cephModel.ts`.

| ch | id  | landmark            | ch | id   | landmark              |
|----|-----|---------------------|----|------|-----------------------|
| 0  | S   | Sella               | 15 | Pogs | Soft-tissue pogonion  |
| 1  | N   | Nasion              | 16 | PNS  | Post. nasal spine     |
| 2  | Or  | Orbitale            | 17 | ANS  | Ant. nasal spine      |
| 3  | Po  | Porion              | 18 | Ar   | Articulare            |
| 4  | A   | Point A             | 20 | U1A  | Upper incisor apex    |
| 5  | B   | Point B             | 21 | L1A  | Lower incisor apex    |
| 6  | Pog | Pogonion            | 25 | Pr   | Pronasale (nose tip)  |
| 7  | Me  | Menton              | 32 | Mes  | Soft-tissue menton    |
| 8  | Gn  | Gnathion            | 34 | Ns   | Soft-tissue nasion    |
| 9  | Go  | Gonion              | 36 | U6   | Upper first molar     |
| 10 | L1T | Lower incisor tip   | 37 | L6   | Lower first molar     |
| 11 | U1T | Upper incisor tip   |    |      |                       |
| 12 | Ls  | Labrale superius    |    |      |                       |
| 13 | Li  | Labrale inferius    |    |      |                       |
| 14 | Sn  | Subnasale           |    |      |                       |

Notes:
- Channels 1–19 (ISBI set) are high confidence. The dental extras (20/21/36/37) and
  soft-tissue extras (25/32/34) were verified across both sample patients but should be
  spot-checked; the app lets the clinician drag any point to correct it.
- Basion (Ba) is not mapped (no measurement uses it) — place manually if needed.
