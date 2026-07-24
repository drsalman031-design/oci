# Cephalometric Auto-Landmark Detection — Implementation Plan

Status: PLAN (no code written yet)
Target app: OCI Analyzer (Expo SDK 52 / React Native 0.76.6 / TypeScript)
Decisions locked in with product owner:
- Model runs **on-device** (offline-capable)
- Online connectivity is acceptable for the ceph feature
- Write this plan **before** any code

---

## 1. What we're actually building (and the honest truth)

We want to replicate WebCeph's "auto-detect landmarks on a lateral cephalogram" feature so that
downstream **linear and angular measurements** (SNA, SNB, ANB, IMPA, FMA, Wits, E-line, etc.) are
computed correctly.

### How WebCeph does it
WebCeph, AudaxCeph, CephX, WeDoCeph, DentaliQ.ortho all use the **same class of technology**:
a **deep-learning convolutional neural network** (typically a *heatmap-regression* network such
as a stacked-hourglass or U-Net / HRNet). For each anatomical landmark the network outputs a
2-D probability heatmap; the **peak of the heatmap** is the predicted (x, y) point. This is the
approach that wins the MICCAI CL-Detection challenges.

### Can we do it "without AI model training"?
Two different things are being conflated, so to be precise:
- **Training a model from scratch** — we do NOT need to do this. Pre-trained models exist.
- **Running a model (inference)** — we CANNOT avoid this. Auto-detection *is* running a neural
  network. There is **no classical (non-AI) image-processing trick** that reaches clinical quality
  on real X-rays. Contrast, patient anatomy, and machine variance are too high.

So the realistic path is: **take a pre-trained cephalometric model and run inference on-device.**
We skip the expensive part (data collection, annotation, training) and just ship the finished model.

### The "100% accuracy" reality (important, read this)
100% accuracy is **not achievable** and **no commercial product, including WebCeph, claims it.**
Peer-reviewed evidence:
- Best models detect ~**82%** of landmarks within **2 mm** of the expert ground truth; mean radial
  error ~**1.2 mm**.
- Some landmarks (Gonion, Orbitale, Articulare, PNS) are unreliable **even for human experts** and
  are the largest error source.
- Every study concludes the same thing: **AI auto-detection + a mandatory human review/correction
  step** is what reaches expert-level accuracy. Auto alone is fast but not clinically final.

That is exactly why WebCeph shows a **"Modify"** button (visible in the reference screenshot): the
clinician drags any misplaced point before measurements are trusted. **Our app must do the same.**
Correct measurements come from correct *points*; the auto-detector gets us ~80–90% of the way in
seconds, and the drag-to-correct UI closes the gap.

---

## 2. Two blockers to resolve BEFORE building (do not skip)

### 2.1 Model licensing (commercial use)
This app is a commercial/paid product (`com.dr.salman.oci`). Most open cephalometric models and the
common training dataset (**ISBI 2015 Grand Challenge**, 400 images) are released for **research /
non-commercial** use only. Shipping them in a paid app may violate their license.

Options, in order of preference:
1. Find a model/dataset with a **permissive commercial license** (MIT/Apache/CC-BY).
2. **License a dataset commercially** and train our own model (adds cost + time, but clean IP).
3. Use a research model **only for internal validation/prototyping**, and swap to a
   commercially-licensed model before release.

Action: legal/licensing review of the chosen model+dataset is a **release gate**.

### 2.2 mm-calibration (this is why measurements go wrong)
Angles (SNA, SNB, ANB, FMA, IMPA, interincisal) are **scale-independent** — they're correct from
pixel coordinates alone. But every **millimetre** measurement (Wits, overjet, overbite, E-line mm,
U1-NA mm, L1-NB mm) requires a **pixel→mm scale factor**. That is what WebCeph's **"Calibration"**
button (also in the screenshot) does: the user marks a known distance (a ruler fiducial on the film,
or a known ruler length) and enters the real mm value.

Without calibration, we can only trust angles. We **must** ship a calibration tool, or every mm
value will be wrong.

---

## 3. Landmark coverage gap (drives what measurements are possible)

The app's `CephAnalyzer.tsx` already declares **27 landmarks**. The most common pre-trained models
(ISBI-19) provide **19**. Mapping:

| Category | App needs | ISBI-19 provides? |
|---|---|---|
| Cranial base | S, N, Or, Po, Ba, Ar | S, N, Or, Po, Ar ✅ (Ba ❌) |
| Maxilla | ANS, PNS, A | ✅ all |
| Mandible | B, Pog, Gn, Me, Go | ✅ all |
| Incisor tips | U1T, L1T | ✅ both |
| **Incisor apices** | **U1A, L1A** | ❌ **NOT in ISBI-19** |
| **Molars** | **U6, L6** | ❌ not in ISBI-19 |
| Soft tissue | Ls, Li, Sn, Pog', N', Pr, Me' | Ls, Li, Sn, Pog' ✅ (N', Pr, Me' ❌) |

Consequence: with an ISBI-19 model we can compute the **core skeletal + soft-tissue** measurements,
but **incisor-axis measurements that need root apices** (U1-SN uses tip+apex axis, IMPA uses L1
axis, interincisal angle, U1-NA, L1-NB) will be **incomplete**. Getting the full 40+ set requires a
model trained on a **larger landmark set** (or a second stage). This directly shapes phasing below.

---

## 4. Target architecture (on-device)

```
[Lateral ceph image]
   │  expo-image-picker (pick from gallery / file)
   ▼
[Preprocess]  expo-image-manipulator (resize → model input, e.g. 512×512, grayscale/RGB)
   │          jpeg-js (decode resized JPEG → pixel buffer) → normalized Float32 tensor [1,C,H,W]
   ▼
[Inference]   onnxruntime-react-native  → heatmaps [1, K, h, w]  (K = #landmarks)
   │
   ▼
[Postprocess] per-channel arg-max → (x,y) in heatmap space
   │          rescale → resized-image space → original-image space
   │          peak value → confidence score
   ▼
[Overlay UI]  react-native-svg points over the real image
   │          drag-to-correct (react-native-gesture-handler / PanResponder)
   │          calibration tool (2-point known distance → px→mm scale)
   ▼
[cephMath.ts] landmarks (+ scale) → SNA/SNB/ANB/FMA/IMPA/Wits/E-line/…  (live recompute)
   ▼
[onApplyAnalysis(input)] → existing scoringEngine.ts → OCI result (UNCHANGED)
```

Everything downstream of `onApplyAnalysis` (scoring engine, results, PDF, treatment planner) stays
as-is. We are only replacing the **mock input** with **real detected + corrected + calculated** input.

### Why on-device runtime = ONNX Runtime (recommended)
- **`onnxruntime-react-native`** — mature, Microsoft-maintained, full ONNX opset, hardware
  acceleration (NNAPI on Android, CoreML on iOS), has an Expo config plugin. Research models are
  almost all PyTorch → **ONNX export is trivial**.
- Alternative: `react-native-fast-tflite` (JSI, very fast, GPU delegates) — but converting
  PyTorch→TFLite is painful and lossy. Prefer ONNX unless we hit a wall.

### Build implications
- These are **native modules** → **NOT available in Expo Go**. Requires a **Dev Client** and
  `expo prebuild` — **which the CI already does** (the `android/` gradle build works). Good news:
  no CI architecture change needed, just new native deps + config plugin.
- APK size grows by ORT runtime (~10–20 MB) + model (~10–40 MB, mitigated by int8/fp16 quantization).
  Current APK ~30 MB → expect ~60–90 MB. Quantize the model to keep this down.

### On-device preprocessing caveat (the trickiest engineering bit)
RN has no built-in raw-pixel access. Plan: `expo-image-manipulator` resizes the picked image to the
model input size and returns a small JPEG; `jpeg-js` decodes that small buffer (e.g. 512² ≈ 262k px,
fast enough in JS) to an RGBA `Uint8Array`; we build the normalized `Float32Array` tensor from it.
If JS decode proves too slow on low-end phones, fall back to a tiny native/JSI decode helper.

---

## 5. Measurement math module (`src/lib/cephMath.ts`) — where accuracy lives

New pure-TS module (fully unit-testable, no native deps). Primitives:
- `angle3(p1, vertex, p2)` — angle at a vertex (SNA, SNB, nasolabial, facial convexity).
- `angleBetweenLines(a1,a2, b1,b2)` — SN-MP, FMA, U1-SN, IMPA, interincisal.
- `signedDistancePointToLine(p, l1, l2)` — Wits, E-line (needs mm scale).
- `distanceMm(p1, p2, pxPerMm)` — overjet, overbite, incisor mm.

Measurement definitions (all from the 27 landmarks):

| Measurement | Formula | Needs mm scale? | Needs apex/molar? |
|---|---|---|---|
| SNA | angle3(S, N, A) | no | no |
| SNB | angle3(S, N, B) | no | no |
| ANB | SNA − SNB | no | no |
| SN-MP | angleBetweenLines(S-N, Go-Me) | no | no |
| FMA | angleBetweenLines(Po-Or, Go-Me) | no | no |
| U1-SN | angleBetweenLines(U1A-U1T, S-N) | no | **yes (U1A)** |
| IMPA | angleBetweenLines(L1A-L1T, Go-Me) | no | **yes (L1A)** |
| Interincisal | angleBetweenLines(U1A-U1T, L1A-L1T) | no | **yes (apices)** |
| Wits | signed proj. of A,B on occlusal plane | **yes** | (occlusal from molars/incisors) |
| U1-NA mm | dist(U1T, line N-A) | **yes** | no |
| Upper/Lower lip–E-line | signed dist(Ls/Li, Pr-Pog') | **yes** | no |
| Nasolabial angle | angle3(Pr region, Sn, Ls) | no | no |
| Overjet / Overbite | horizontal/vertical dist(U1T, L1T) | **yes** | no |

This table also documents exactly which values are **untrustworthy until** (a) calibration is done
and (b) apex/molar landmarks exist — so the UI can grey them out honestly.

---

## 6. UI changes (replace the mock, reuse the shell)

`CephAnalyzer.tsx` already has: tab layout, SVG overlay, landmark list w/ confidence, planes, and
the `onApplyAnalysis` footer. We keep the shell and change the data source:

1. **Image input** — add `expo-image-picker`; user selects the lateral cephalogram. Replace the
   fake SVG "skull" with the **real image** as the SVG/Image background.
2. **Auto-detect** — run the pipeline (Section 4); place the 19/27 points with real coordinates +
   per-point confidence (reuse the existing confidence UI, now real).
3. **Drag-to-correct** — make each landmark draggable (gesture handler). This is the **mandatory
   human-in-the-loop** step. Points below a confidence threshold are highlighted for review.
4. **Calibration tool** — 2-tap known-distance workflow → sets `pxPerMm`. Block/grey mm-based
   measurements until set. (Mirrors WebCeph's "Calibration".)
5. **Live measurements** — recompute via `cephMath.ts` whenever a point moves or calibration
   changes. Remove the hard-coded preset numbers from the "measurements" tab.
6. **Apply** — `onApplyAnalysis(calculatedInput, report)` feeds the **existing** OCI engine. No
   change downstream.
7. **Disclaimer** — add a clear "decision-support only, verify all landmarks, not a diagnostic
   device" notice (regulatory + matches the reality in Section 1).

Keep the 3 preset cases as a **demo/offline sample** mode, clearly labelled "Sample", so the mock
still works when no image is loaded.

---

## 7. Dependencies to add

| Package | Purpose | Native? |
|---|---|---|
| `expo-image-picker` | pick the ceph image | config plugin |
| `expo-image-manipulator` | resize/preprocess | JS + native |
| `onnxruntime-react-native` | on-device inference | **yes** (prebuild) |
| `jpeg-js` | decode resized JPEG → pixels | pure JS |
| `react-native-gesture-handler` | draggable landmarks | **yes** (already common) |

All native pieces are already compatible with the existing prebuild-based CI.

---

## 8. Phased delivery (each phase ships independently)

**Phase 0 — Math + manual placement + calibration (NO model).**
Build `cephMath.ts`, image upload, draggable manual landmark placement, and calibration. This alone
already **replaces manual number entry** and produces **correct measurements from manually placed
points**. It validates the math + UI with zero ML risk and delivers immediate value. Includes unit
tests for every formula against known cases.

**Phase 1 — Auto-detect landmarks (ONNX on-device). ✅ IMPLEMENTED (prototype).**
Integrated the **CL-Detection2023 UNet** baseline (38-landmark heatmap model) exported to ONNX and
bundled at `assets/models/ceph_unet_38.onnx` (~27 MB). Runs on-device via `onnxruntime-react-native`;
an **Auto-detect landmarks** button in the tracer auto-places points, then the clinician drags to
correct. Covers **26 of our 27 landmarks** — including the incisor apices (U1A, L1A) and molars
(U6, L6), so this single model actually spans what was originally split into Phase 1 + Phase 2. Only
Basion (unused by our measurements) is unmapped. See `ml/README.md` for the conversion tooling and the
verified channel→landmark mapping.

> ⚠️ **Prototype only.** The model is a modest-accuracy baseline (MRE ~3.3 mm) trained on a
> **CC BY-NC (non-commercial)** dataset. Must be swapped for a commercially-licensed / higher-accuracy
> model before the paid app ships (release gate — Section 2.1).

**Phase 3 — Polish.**
Image-quality checks, confidence-based auto-flagging, and (optional) superimposition/growth overlays.

---

## 9. Open questions / decisions still needed

1. **Licensing** (Section 2.1): which model+dataset can we use commercially? — release gate.
2. **Landmark set for v1**: ship Phase 1 with 19 auto + manual dental, or wait for the full set?
3. **Calibration UX**: is a physical ruler/fiducial always present on your films? If not, we need a
   fallback (e.g. known image DPI, or a standard ruler the clinic includes).
4. **Min device spec**: lowest-end Android we must support (drives quantization + input resolution).
5. **iOS**: is iOS in scope, or Android-only for now (affects CoreML vs NNAPI testing)?

---

## 10. TL;DR

- Auto-detection **is** a neural network; there is no non-AI shortcut, but we can **use a pre-trained
  model and only run inference** (no training required from us).
- **100% accuracy is impossible**; the correct design is **auto-detect + mandatory drag-to-correct**,
  exactly like WebCeph's "Modify" button.
- **Angles work from pixels; millimetres require a calibration step** (WebCeph's "Calibration").
- On-device runtime: **ONNX Runtime for React Native**, integrated via the **existing prebuild CI**.
- Correct measurements come from `cephMath.ts` operating on **corrected landmark points**, then feed
  the **unchanged** OCI scoring engine.
- **Two blockers to clear first: commercial licensing of the model, and the mm-calibration workflow.**
