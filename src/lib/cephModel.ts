// On-device ceph landmark-detection model contract + channel->landmark mapping.
//
// Model: CL-Detection2023 UNet baseline (see ml/README.md).
//   input  : Float32 tensor [1, 3, 512, 512], RGB, normalized to [0,1] (CHW)
//   output : Float32 tensor [1, 38, 512, 512], per-channel sigmoid heatmaps
//   decode : arg-max of each channel -> (x, y) in 512-space; peak value = confidence
//
// PROTOTYPE / NON-COMMERCIAL: the model is trained on a CC BY-NC dataset and is a
// modest-accuracy baseline (MRE ~3.3mm). Auto-placement MUST be reviewed/corrected by
// the clinician before measurements are trusted. Swap before commercial release.

export const CEPH_MODEL_INPUT_SIZE = 512;
export const CEPH_MODEL_CHANNELS = 38;

// 0-based output channel -> app landmark id. Verified empirically on the two challenge
// sample cephs (see ml/README.md). Channels not listed are unused by our measurements.
export const CHANNEL_TO_LANDMARK: Record<number, string> = {
  0: 'S',
  1: 'N',
  2: 'Or',
  3: 'Po',
  4: 'A',
  5: 'B',
  6: 'Pog',
  7: 'Me',
  8: 'Gn',
  9: 'Go',
  10: 'L1T',
  11: 'U1T',
  12: 'Ls',
  13: 'Li',
  14: 'Sn',
  15: 'Pogs',
  16: 'PNS',
  17: 'ANS',
  18: 'Ar',
  20: 'U1A',
  21: 'L1A',
  25: 'Pr',
  32: 'Mes',
  34: 'Ns',
  36: 'U6',
  37: 'L6',
};

// Landmarks that come from lower-confidence channels (dental/soft-tissue extras that
// were verified but are worth a closer look by the clinician).
export const LOWER_CONFIDENCE_LANDMARKS = new Set(['U1A', 'L1A', 'U6', 'L6', 'Ns', 'Mes']);
