import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  PanResponder,
  Dimensions,
  Platform,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Line, Circle, G, Text as SvgText } from 'react-native-svg';
import tw from 'twrnc';
import {
  ArrowLeft,
  ImagePlus,
  Ruler,
  MapPin,
  RotateCcw,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FlipHorizontal2,
  Sparkles,
} from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { autoDetectLandmarks } from '../lib/cephInference';
import { CephalometricInput, PatientDetails } from '../types';
import {
  LANDMARKS,
  LANDMARK_BY_ID,
  LandmarkPositions,
  MEASUREMENT_SPECS,
  Point,
} from '../lib/cephLandmarks';
import { computeMeasurements, pxPerMmFrom, distance } from '../lib/cephMath';

interface CephTracingProps {
  patientDetails: PatientDetails;
  onApplyAnalysis: (input: CephalometricInput, report: string) => void;
  onCancel: () => void;
}

type Mode = 'landmarks' | 'calibration';
type Facing = 'right' | 'left';

const HIT_RADIUS = 24; // px in display space for grabbing an existing point
const TYPE_COLOR: Record<string, string> = {
  skeletal: '#10B981',
  dental: '#EC4899',
  'soft-tissue': '#A855F7',
};

const EMPTY_INPUT: CephalometricInput = {
  anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
  u1Sn: '', u1NaDeg: '', u1NaMm: '',
  impa: '', l1NbDeg: '', l1NbMm: '',
  interincisalAngle: '', overjet: '', overbite: '',
  upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '',
  yAxis: '', coA: '', coGn: '',
  molarRelation: '', canineRelation: '', crossbite: '', deepBite: '', openBite: '',
  curveOfSpee: '', midlineDeviation: '',
  posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: '',
};

function mirrorPositions(pos: LandmarkPositions, width: number): LandmarkPositions {
  const out: LandmarkPositions = {};
  for (const id of Object.keys(pos)) {
    out[id] = { x: width - pos[id].x, y: pos[id].y };
  }
  return out;
}

export default function CephTracing({ patientDetails, onApplyAnalysis, onCancel }: CephTracingProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [positions, setPositions] = useState<LandmarkPositions>({});
  const [mode, setMode] = useState<Mode>('landmarks');
  const [facing, setFacing] = useState<Facing>('right');
  const [activeId, setActiveId] = useState<string>(LANDMARKS[0].id);

  // Calibration
  const [calib, setCalib] = useState<{ a?: Point; b?: Point }>({});
  const [calibMm, setCalibMm] = useState<string>('');

  // Auto-detection
  const [detecting, setDetecting] = useState<boolean>(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [autoConfidence, setAutoConfidence] = useState<Record<string, number>>({});

  // Container geometry for touch->canvas coordinate mapping
  const containerRef = useRef<View>(null);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggingRef = useRef<{ kind: 'landmark' | 'calibA' | 'calibB'; id?: string } | null>(null);
  // Live refs so the PanResponder (created once) sees current state.
  const stateRef = useRef({ mode, activeId, positions, calib });
  stateRef.current = { mode, activeId, positions, calib };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const screen = Dimensions.get('window');
    const maxW = Math.min(screen.width - 24, 520);
    const maxH = screen.height * 0.5;
    const aspect = asset.width && asset.height ? asset.width / asset.height : 1;
    let w = maxW;
    let h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    setImageUri(asset.uri);
    setCanvas({ w, h });
    setPositions({});
    setCalib({});
    setAutoConfidence({});
    setDetectError(null);
    setActiveId(LANDMARKS[0].id);
  };

  const runAutoDetect = async () => {
    if (!imageUri || !canvas.w || detecting) return;
    setDetecting(true);
    setDetectError(null);
    try {
      const { positions: detected, confidence } = await autoDetectLandmarks(imageUri, canvas.w, canvas.h);
      // Auto-placed points overwrite existing ones; clinician then drags to correct.
      setPositions((prev) => ({ ...prev, ...detected }));
      setAutoConfidence(confidence);
      setActiveId(nextUnplaced(detected));
    } catch (e: any) {
      setDetectError(e?.message ? String(e.message) : 'Auto-detection failed. Place points manually.');
    } finally {
      setDetecting(false);
    }
  };

  const nextUnplaced = (pos: LandmarkPositions): string => {
    const next = LANDMARKS.find((lm) => pos[lm.id] == null);
    return next ? next.id : LANDMARKS[LANDMARKS.length - 1].id;
  };

  const nearestLandmark = (p: Point, pos: LandmarkPositions): string | null => {
    let best: string | null = null;
    let bestD = HIT_RADIUS;
    for (const id of Object.keys(pos)) {
      const d = distance(p, pos[id]);
      if (d <= bestD) {
        bestD = d;
        best = id;
      }
    }
    return best;
  };

  const clampToCanvas = (p: Point): Point => ({
    x: Math.max(0, Math.min(canvas.w, p.x)),
    y: Math.max(0, Math.min(canvas.h, p.y)),
  });

  const toCanvasPoint = (pageX: number, pageY: number): Point =>
    clampToCanvas({ x: pageX - offset.current.x, y: pageY - offset.current.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        const p = toCanvasPoint(pageX, pageY);
        const s = stateRef.current;

        if (s.mode === 'calibration') {
          // Grab nearest calibration handle, else set the next undefined one.
          const da = s.calib.a ? distance(p, s.calib.a) : Infinity;
          const db = s.calib.b ? distance(p, s.calib.b) : Infinity;
          if (da <= HIT_RADIUS && da <= db) {
            draggingRef.current = { kind: 'calibA' };
            setCalib((c) => ({ ...c, a: p }));
          } else if (db <= HIT_RADIUS) {
            draggingRef.current = { kind: 'calibB' };
            setCalib((c) => ({ ...c, b: p }));
          } else if (!s.calib.a) {
            draggingRef.current = { kind: 'calibA' };
            setCalib((c) => ({ ...c, a: p }));
          } else if (!s.calib.b) {
            draggingRef.current = { kind: 'calibB' };
            setCalib((c) => ({ ...c, b: p }));
          } else {
            // Both set: move whichever is closer.
            draggingRef.current = da <= db ? { kind: 'calibA' } : { kind: 'calibB' };
            setCalib((c) => (da <= db ? { ...c, a: p } : { ...c, b: p }));
          }
          return;
        }

        // Landmark mode: grab nearest existing point, else place the active one.
        const near = nearestLandmark(p, s.positions);
        const targetId = near ?? s.activeId;
        draggingRef.current = { kind: 'landmark', id: targetId };
        setPositions((prev) => {
          const updated = { ...prev, [targetId]: p };
          if (!near) setActiveId(nextUnplaced(updated));
          return updated;
        });
      },
      onPanResponderMove: (evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        const p = toCanvasPoint(gesture.moveX, gesture.moveY);
        const drag = draggingRef.current;
        if (!drag) return;
        if (drag.kind === 'landmark' && drag.id) {
          setPositions((prev) => ({ ...prev, [drag.id as string]: p }));
        } else if (drag.kind === 'calibA') {
          setCalib((c) => ({ ...c, a: p }));
        } else if (drag.kind === 'calibB') {
          setCalib((c) => ({ ...c, b: p }));
        }
      },
      onPanResponderRelease: () => {
        draggingRef.current = null;
      },
      onPanResponderTerminate: () => {
        draggingRef.current = null;
      },
    }),
  ).current;

  const onCanvasLayout = () => {
    if (containerRef.current) {
      containerRef.current.measureInWindow((x, y) => {
        offset.current = { x, y };
      });
    }
  };

  // px per mm from calibration (in display space; angles are unaffected by scale)
  const pxPerMm = useMemo(() => {
    if (calib.a && calib.b && calibMm) {
      const mm = parseFloat(calibMm);
      return pxPerMmFrom(calib.a, calib.b, mm);
    }
    return null;
  }, [calib, calibMm]);

  const computed = useMemo(() => {
    const pos = facing === 'right' ? positions : mirrorPositions(positions, canvas.w);
    return computeMeasurements(pos, pxPerMm);
  }, [positions, facing, canvas.w, pxPerMm]);

  const placedCount = Object.keys(positions).length;

  const clearActive = () => {
    setPositions((prev) => {
      const copy = { ...prev };
      delete copy[activeId];
      return copy;
    });
  };

  const resetAll = () => {
    setPositions({});
    setCalib({});
    setCalibMm('');
    setAutoConfidence({});
    setDetectError(null);
    setActiveId(LANDMARKS[0].id);
  };

  const handleApply = () => {
    const input: CephalometricInput = { ...EMPTY_INPUT };
    const c = computed;
    const numericKeys: (keyof CephalometricInput)[] = [
      'sna', 'snb', 'anb', 'snMp', 'fma', 'facialConvexity',
      'u1Sn', 'u1NaDeg', 'u1NaMm', 'impa', 'l1NbDeg', 'l1NbMm', 'interincisalAngle',
      'wits', 'overjet', 'overbite', 'upperLipELine', 'lowerLipELine', 'nasolabialAngle',
    ];
    for (const k of numericKeys) {
      const val = (c as any)[k];
      if (val != null && !Number.isNaN(val)) (input as any)[k] = val;
    }
    const report = [
      `Cephalometric tracing for ${patientDetails.name || 'patient'}.`,
      `${placedCount} landmarks placed. Facing: ${facing}.`,
      pxPerMm ? `Calibrated at ${pxPerMm.toFixed(2)} px/mm.` : 'Not calibrated — mm values omitted.',
    ].join(' ');
    onApplyAnalysis(input, report);
  };

  const missingCalibNote = !pxPerMm;

  return (
    <View style={tw`flex-1 bg-[#050814]`}>
      {/* Header */}
      <View style={tw`px-4 py-3 bg-[#0B1020] border-b border-white/5 flex-row justify-between items-center`}>
        <View style={tw`flex-row items-center flex-1 mr-3`}>
          <MapPin size={16} color="#14B8A6" style={tw`mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-black text-white`}>Manual Ceph Tracing</Text>
            <Text style={tw`text-[10px] text-slate-400`} numberOfLines={1}>
              {patientDetails.name || 'Anonymous'} • {placedCount}/{LANDMARKS.length} points
            </Text>
          </View>
        </View>
        <Pressable onPress={onCancel} style={tw`flex-row items-center bg-white/5 px-3 py-2 rounded-xl border border-white/10`}>
          <ArrowLeft size={13} color="#fff" style={tw`mr-1.5`} />
          <Text style={tw`text-xs font-bold text-white uppercase tracking-wider`}>Back</Text>
        </Pressable>
      </View>

      {/* Mode + facing controls */}
      <View style={tw`px-4 py-2.5 bg-[#0B1020]/60 border-b border-white/5 flex-row items-center gap-2`}>
        <Pressable
          onPress={() => setMode('landmarks')}
          style={tw`flex-row items-center px-3 py-2 rounded-xl border ${mode === 'landmarks' ? 'bg-teal-500/15 border-teal-500/40' : 'bg-white/5 border-white/10'}`}
        >
          <MapPin size={12} color={mode === 'landmarks' ? '#14B8A6' : '#94A3B8'} style={tw`mr-1.5`} />
          <Text style={tw`text-[10px] font-black uppercase ${mode === 'landmarks' ? 'text-teal-400' : 'text-slate-400'}`}>Landmarks</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('calibration')}
          style={tw`flex-row items-center px-3 py-2 rounded-xl border ${mode === 'calibration' ? 'bg-amber-500/15 border-amber-500/40' : 'bg-white/5 border-white/10'}`}
        >
          <Ruler size={12} color={mode === 'calibration' ? '#F59E0B' : '#94A3B8'} style={tw`mr-1.5`} />
          <Text style={tw`text-[10px] font-black uppercase ${mode === 'calibration' ? 'text-amber-400' : 'text-slate-400'}`}>Calibrate</Text>
        </Pressable>
        <View style={tw`flex-1`} />
        <Pressable
          onPress={() => setFacing((f) => (f === 'right' ? 'left' : 'right'))}
          style={tw`flex-row items-center px-3 py-2 rounded-xl border bg-white/5 border-white/10`}
        >
          <FlipHorizontal2 size={12} color="#94A3B8" style={tw`mr-1.5`} />
          <Text style={tw`text-[10px] font-black uppercase text-slate-300`}>Faces {facing}</Text>
        </Pressable>
      </View>

      {/* Canvas */}
      <View style={tw`items-center justify-center bg-[#02050E] py-3`}>
        {imageUri ? (
          <View
            ref={containerRef}
            onLayout={onCanvasLayout}
            style={{ width: canvas.w, height: canvas.h }}
            {...panResponder.panHandlers}
          >
            <Image source={{ uri: imageUri }} style={{ width: canvas.w, height: canvas.h }} resizeMode="contain" />
            <Svg width={canvas.w} height={canvas.h} style={tw`absolute inset-0`} viewBox={`0 0 ${canvas.w} ${canvas.h}`}>
              {/* Calibration line */}
              {calib.a && calib.b && (
                <Line x1={calib.a.x} y1={calib.a.y} x2={calib.b.x} y2={calib.b.y} stroke="#F59E0B" strokeWidth={2} strokeDasharray="5,3" />
              )}
              {calib.a && <Circle cx={calib.a.x} cy={calib.a.y} r={6} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} />}
              {calib.b && <Circle cx={calib.b.x} cy={calib.b.y} r={6} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} />}

              {/* Landmarks */}
              {Object.keys(positions).map((id) => {
                const p = positions[id];
                const def = LANDMARK_BY_ID[id];
                const isActive = id === activeId && mode === 'landmarks';
                return (
                  <G key={id}>
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={isActive ? 6 : 4}
                      fill={TYPE_COLOR[def?.type] || '#10B981'}
                      stroke="#fff"
                      strokeWidth={isActive ? 1.6 : 0.8}
                    />
                    <SvgText x={p.x + 6} y={p.y - 5} fill="#fff" fontSize={9} fontWeight="bold" fontFamily="monospace">
                      {def?.abbreviation || id}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </View>
        ) : (
          <Pressable
            onPress={pickImage}
            style={tw`w-[90%] h-52 rounded-3xl border-2 border-dashed border-white/15 items-center justify-center bg-[#0B1020]/50`}
          >
            <ImagePlus size={34} color="#14B8A6" />
            <Text style={tw`text-sm font-black text-white mt-3`}>Upload Lateral Cephalogram</Text>
            <Text style={tw`text-[11px] text-slate-400 mt-1`}>Tap to select an X-ray image</Text>
          </Pressable>
        )}
      </View>

      {imageUri && (
        <View style={tw`px-4 pt-1 pb-1`}>
          <Pressable
            onPress={runAutoDetect}
            disabled={detecting}
            style={tw`px-4 py-2.5 rounded-xl border flex-row items-center justify-center ${detecting ? 'bg-teal-500/10 border-teal-500/20' : 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-teal-500/40'}`}
          >
            {detecting ? (
              <ActivityIndicator size="small" color="#14B8A6" style={tw`mr-2`} />
            ) : (
              <Sparkles size={13} color="#22D3EE" style={tw`mr-2`} />
            )}
            <Text style={tw`text-[11px] font-black text-white uppercase tracking-wider`}>
              {detecting ? 'Detecting landmarks…' : 'Auto-detect landmarks'}
            </Text>
          </Pressable>
          <Text style={tw`text-[8px] text-slate-500 font-bold uppercase text-center mt-1`}>
            AI places points • you verify & drag to correct
          </Text>
          {detectError && (
            <View style={tw`flex-row items-center bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 mt-2`}>
              <AlertTriangle size={12} color="#F43F5E" style={tw`mr-2`} />
              <Text style={tw`text-[10px] text-rose-300 flex-1`}>{detectError}</Text>
            </View>
          )}
        </View>
      )}

      {imageUri && (
        <View style={tw`px-4 pb-2 flex-row items-center justify-center gap-2`}>
          <Pressable onPress={pickImage} style={tw`flex-row items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10`}>
            <ImagePlus size={11} color="#94A3B8" style={tw`mr-1.5`} />
            <Text style={tw`text-[10px] font-bold text-slate-300 uppercase`}>Replace</Text>
          </Pressable>
          <Pressable onPress={clearActive} style={tw`flex-row items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10`}>
            <RotateCcw size={11} color="#94A3B8" style={tw`mr-1.5`} />
            <Text style={tw`text-[10px] font-bold text-slate-300 uppercase`}>Clear active</Text>
          </Pressable>
          <Pressable onPress={resetAll} style={tw`flex-row items-center px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20`}>
            <Trash2 size={11} color="#F43F5E" style={tw`mr-1.5`} />
            <Text style={tw`text-[10px] font-bold text-rose-400 uppercase`}>Reset</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom panel */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pb-28 pt-1`}>
        {mode === 'calibration' ? (
          <View style={tw`bg-[#0B1020]/90 p-4 rounded-2xl border border-amber-500/20 space-y-3`}>
            <View style={tw`flex-row items-center`}>
              <Ruler size={14} color="#F59E0B" style={tw`mr-2`} />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Scale Calibration</Text>
            </View>
            <Text style={tw`text-[11px] text-slate-400 leading-relaxed`}>
              Tap two points a known real distance apart on the film (e.g. a ruler fiducial), then enter that distance in millimetres. Required for all mm measurements.
            </Text>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={tw`text-[11px] text-slate-300 font-bold`}>Known distance:</Text>
              <TextInput
                value={calibMm}
                onChangeText={setCalibMm}
                keyboardType="numeric"
                placeholder="mm"
                placeholderTextColor="#475569"
                style={tw`w-24 h-10 px-3 bg-black/45 rounded-xl border border-white/10 text-white text-xs font-bold`}
              />
              {pxPerMm && <Text style={tw`text-[11px] font-mono text-emerald-400`}>{pxPerMm.toFixed(2)} px/mm</Text>}
            </View>
          </View>
        ) : (
          <View style={tw`bg-[#0B1020]/90 p-4 rounded-2xl border border-white/5 space-y-3`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>
                Place: <Text style={tw`text-teal-400`}>{LANDMARK_BY_ID[activeId]?.name}</Text>
              </Text>
              {autoConfidence[activeId] != null && (
                <Text style={tw`text-[9px] font-mono font-bold ${autoConfidence[activeId] >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  AI {(autoConfidence[activeId] * 100).toFixed(0)}%
                </Text>
              )}
            </View>
            <Text style={tw`text-[11px] text-slate-400 leading-relaxed`}>
              {LANDMARK_BY_ID[activeId]?.description}
            </Text>
            <Text style={tw`text-[10px] text-slate-500`}>
              Tap the X-ray to place this point (auto-advances). Tap near any existing point and drag to fine-tune.
            </Text>
            <View style={tw`flex-row flex-wrap gap-1.5`}>
              {LANDMARKS.map((lm) => {
                const placed = positions[lm.id] != null;
                const isActive = lm.id === activeId;
                return (
                  <Pressable
                    key={lm.id}
                    onPress={() => setActiveId(lm.id)}
                    style={tw`px-2 py-1 rounded-lg border ${isActive ? 'bg-teal-500/20 border-teal-500/50' : placed ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-white/5 border-white/10'}`}
                  >
                    <Text style={tw`text-[9px] font-black ${isActive ? 'text-teal-300' : placed ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {placed ? '● ' : '○ '}{lm.abbreviation}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Live measurements */}
        <View style={tw`mt-4 bg-[#0B1020]/90 p-4 rounded-2xl border border-white/5`}>
          <Text style={tw`text-xs font-black text-white uppercase tracking-wider mb-1`}>Live Measurements</Text>
          {missingCalibNote && (
            <View style={tw`flex-row items-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 my-2`}>
              <AlertTriangle size={12} color="#F59E0B" style={tw`mr-2`} />
              <Text style={tw`text-[10px] text-amber-300 flex-1`}>Not calibrated — millimetre values are hidden until you calibrate.</Text>
            </View>
          )}
          <View style={tw`mt-1`}>
            {MEASUREMENT_SPECS.map((spec) => {
              const val = (computed as any)[spec.key] as number | null;
              const missing = spec.landmarks.filter((id) => positions[id] == null);
              const blocked = spec.requiresScale && !pxPerMm;
              let display: string;
              let color: string;
              if (missing.length > 0) {
                display = `need ${missing.join(', ')}`;
                color = 'text-slate-500';
              } else if (blocked) {
                display = 'calibrate';
                color = 'text-amber-400';
              } else if (val != null) {
                display = `${val}${spec.unit}`;
                color = 'text-emerald-400';
              } else {
                display = '—';
                color = 'text-slate-500';
              }
              return (
                <View key={spec.key} style={tw`flex-row justify-between items-center py-1.5 border-b border-white/5`}>
                  <Text style={tw`text-[11px] text-slate-300`}>{spec.label}</Text>
                  <Text style={tw`text-[11px] font-mono font-black ${color}`}>{display}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer apply */}
      <View style={tw`px-4 py-3 bg-[#0B1020] border-t border-white/5 flex-row justify-between items-center`}>
        <Text style={tw`text-[10px] font-mono text-slate-400 uppercase tracking-wider flex-1 mr-3`}>
          Verify every point before applying.
        </Text>
        <Pressable
          onPress={handleApply}
          style={({ pressed }) => [
            tw`px-5 py-3 bg-[#14B8A6] rounded-2xl flex-row items-center justify-center border border-teal-400/30`,
            pressed ? tw`opacity-90` : null,
          ]}
        >
          <Text style={tw`text-white font-black text-xs uppercase tracking-widest mr-1.5`}>Apply to OCI</Text>
          <CheckCircle2 size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
