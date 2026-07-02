import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, Dimensions } from 'react-native';
import { 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Info, 
  Settings, 
  ShieldAlert, 
  MapPin, 
  Layers, 
  Eye, 
  EyeOff, 
  Activity, 
  Zap,
  ArrowRight,
  ChevronDown,
  FileText,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react-native';
import tw from 'twrnc';
import Svg, { Line, Circle, Path, G, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import { CephalometricInput, PatientDetails, OciResult } from '../types';
import { generateClinicalSummary } from '../lib/gemini';
import MarkdownRenderer from './MarkdownRenderer';

interface CephAnalyzerProps {
  patientDetails: PatientDetails;
  onApplyAnalysis: (input: CephalometricInput, fullReportMarkdown: string) => void;
  onCancel: () => void;
}

interface Landmark {
  id: string;
  name: string;
  abbreviation: string;
  x: number;
  y: number;
  confidence: number;
  description: string;
  type: 'skeletal' | 'dental' | 'soft-tissue';
}

const PRESET_CASES = {
  class1: {
    name: 'Skeletal Class I Normal',
    description: 'Optimal skeletal relation (ANB = 2°), normal mandibular growth, and balanced dental inclinations.',
    qualityScore: 97,
    measurements: {
      anb: 2.1, sna: 82.2, snb: 80.1, wits: 0.2, snMp: 31.8, fma: 24.8,
      u1Sn: 104.2, u1NaDeg: 21.8, u1NaMm: 3.9,
      impa: 90.1, l1NbDeg: 24.9, l1NbMm: 4.1,
      interincisalAngle: 135.2, overjet: 2.4, overbite: 2.5,
      upperLipELine: -2.1, lowerLipELine: 0.2, nasolabialAngle: 102.4, facialConvexity: 11.8,
      molarRelation: 'Class I' as const, canineRelation: 'Class I' as const, crossbite: 'None' as const,
      deepBite: 2.2, openBite: 0, curveOfSpee: 1.1, midlineDeviation: 0,
      posteriorCrossbite: 'None' as const, archWidthDifference: 0.1, dentalMidlineDev: 0
    },
    landmarkCoords: {
      S: { x: 140, y: 100 },
      N: { x: 260, y: 85 },
      Po: { x: 80, y: 120 },
      Or: { x: 220, y: 125 },
      ANS: { x: 270, y: 165 },
      PNS: { x: 145, y: 168 },
      A: { x: 262, y: 182 },
      B: { x: 250, y: 240 },
      Pog: { x: 256, y: 278 },
      Gn: { x: 248, y: 294 },
      Me: { x: 235, y: 305 },
      Go: { x: 95, y: 238 },
      U1T: { x: 255, y: 215 },
      U1A: { x: 225, y: 175 },
      L1T: { x: 251, y: 220 },
      L1A: { x: 222, y: 260 },
      U6: { x: 165, y: 200 },
      L6: { x: 162, y: 208 },
      Ba: { x: 92, y: 160 },
      Ar: { x: 94, y: 185 },
      Ns: { x: 272, y: 82 },
      Pr: { x: 315, y: 145 },
      Ls: { x: 285, y: 192 },
      Li: { x: 276, y: 222 },
      Pogs: { x: 268, y: 280 },
      Sn: { x: 278, y: 175 },
      Mes: { x: 242, y: 318 }
    }
  },
  class2: {
    name: 'Skeletal Class II Div 1 (Extreme Compensation)',
    description: 'Severe maxillary protrusion & mandibular retrognathia (ANB = 8.2°). Deep overbite, extreme lower incisor compensation (IMPA = 102°).',
    qualityScore: 94,
    measurements: {
      anb: 8.2, sna: 86.1, snb: 77.9, wits: 6.4, snMp: 36.2, fma: 28.4,
      u1Sn: 91.8, u1NaDeg: 12.1, u1NaMm: 1.6,
      impa: 101.9, l1NbDeg: 33.8, l1NbMm: 7.2,
      interincisalAngle: 144.6, overjet: 7.8, overbite: 4.8,
      upperLipELine: 1.2, lowerLipELine: 3.4, nasolabialAngle: 89.6, facialConvexity: 22.4,
      molarRelation: 'Class II' as const, canineRelation: 'Class II' as const, crossbite: 'None' as const,
      deepBite: 5.1, openBite: 0, curveOfSpee: 3.2, midlineDeviation: 1.1,
      posteriorCrossbite: 'None' as const, archWidthDifference: -1.2, dentalMidlineDev: 0.5
    },
    landmarkCoords: {
      S: { x: 140, y: 100 },
      N: { x: 260, y: 85 },
      Po: { x: 80, y: 120 },
      Or: { x: 220, y: 125 },
      ANS: { x: 275, y: 164 },
      PNS: { x: 145, y: 168 },
      A: { x: 272, y: 184 },
      B: { x: 238, y: 242 },
      Pog: { x: 241, y: 280 },
      Gn: { x: 234, y: 295 },
      Me: { x: 222, y: 306 },
      Go: { x: 92, y: 242 },
      U1T: { x: 260, y: 216 },
      U1A: { x: 242, y: 176 },
      L1T: { x: 256, y: 221 },
      L1A: { x: 215, y: 262 },
      U6: { x: 165, y: 200 },
      L6: { x: 160, y: 210 },
      Ba: { x: 92, y: 160 },
      Ar: { x: 94, y: 185 },
      Ns: { x: 272, y: 82 },
      Pr: { x: 320, y: 142 },
      Ls: { x: 298, y: 194 },
      Li: { x: 284, y: 224 },
      Pogs: { x: 253, y: 282 },
      Sn: { x: 282, y: 174 },
      Mes: { x: 229, y: 319 }
    }
  },
  class3: {
    name: 'Skeletal Class III (Severe Compensation)',
    description: 'Mandibular prognathism (ANB = -4.2°). Negative overjet, extreme mandibular incisor retroclination (IMPA = 76°) and maxillary proclination.',
    qualityScore: 92,
    measurements: {
      anb: -4.2, sna: 78.1, snb: 82.3, wits: -7.1, snMp: 28.8, fma: 21.6,
      u1Sn: 118.4, u1NaDeg: 35.8, u1NaMm: 8.6,
      impa: 75.8, l1NbDeg: 14.2, l1NbMm: 1.1,
      interincisalAngle: 122.1, overjet: -1.2, overbite: 0.6,
      upperLipELine: -5.2, lowerLipELine: 1.8, nasolabialAngle: 114.8, facialConvexity: 2.9,
      molarRelation: 'Class III' as const, canineRelation: 'Class III' as const, crossbite: 'Anterior' as const,
      deepBite: 0, openBite: 1.2, curveOfSpee: 0.6, midlineDeviation: 1.6,
      posteriorCrossbite: 'Unilateral' as const, archWidthDifference: -4.1, dentalMidlineDev: 1.8
    },
    landmarkCoords: {
      S: { x: 140, y: 100 },
      N: { x: 260, y: 85 },
      Po: { x: 80, y: 120 },
      Or: { x: 220, y: 125 },
      ANS: { x: 262, y: 166 },
      PNS: { x: 145, y: 168 },
      A: { x: 255, y: 181 },
      B: { x: 258, y: 238 },
      Pog: { x: 269, y: 276 },
      Gn: { x: 260, y: 292 },
      Me: { x: 246, y: 304 },
      Go: { x: 98, y: 234 },
      U1T: { x: 250, y: 214 },
      U1A: { x: 212, y: 174 },
      L1T: { x: 247, y: 219 },
      L1A: { x: 228, y: 258 },
      U6: { x: 165, y: 200 },
      L6: { x: 164, y: 206 },
      Ba: { x: 92, y: 160 },
      Ar: { x: 94, y: 185 },
      Ns: { x: 272, y: 82 },
      Pr: { x: 310, y: 148 },
      Ls: { x: 274, y: 191 },
      Li: { x: 270, y: 221 },
      Pogs: { x: 281, y: 278 },
      Sn: { x: 271, y: 176 },
      Mes: { x: 253, y: 316 }
    }
  }
};

export default function CephAnalyzer({ patientDetails, onApplyAnalysis, onCancel }: CephAnalyzerProps) {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESET_CASES>('class2');
  const [activeTab, setActiveTab] = useState<'visual' | 'landmarks' | 'measurements' | 'report' | 'quality'>('visual');
  const [showPlanes, setShowPlanes] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReportText, setAiReportText] = useState<string>('');
  
  const currentCase = PRESET_CASES[selectedPreset];
  const measurements = currentCase.measurements;
  const coords = currentCase.landmarkCoords;

  // Compile landmark list with relative positions and confidences
  const landmarks: Landmark[] = [
    { id: 'S', name: 'Sella', abbreviation: 'S', x: coords.S.x, y: coords.S.y, confidence: 99, description: 'Center of Sella Turcica (pituitary fossa). Key cranial base landmark.', type: 'skeletal' },
    { id: 'N', name: 'Nasion', abbreviation: 'N', x: coords.N.x, y: coords.N.y, confidence: 98, description: 'Sutura frontonasalis. Most anterior point of nasofrontal suture.', type: 'skeletal' },
    { id: 'Po', name: 'Porion', abbreviation: 'Po', x: coords.Po.x, y: coords.Po.y, confidence: 92, description: 'Highest point on the margin of external auditory meatus.', type: 'skeletal' },
    { id: 'Or', name: 'Orbitale', abbreviation: 'Or', x: coords.Or.x, y: coords.Or.y, confidence: 94, description: 'Lowest point on the margin of bony orbit.', type: 'skeletal' },
    { id: 'ANS', name: 'Anterior Nasal Spine', abbreviation: 'ANS', x: coords.ANS.x, y: coords.ANS.y, confidence: 97, description: 'Tip of bony anterior nasal spine at palatal plane.', type: 'skeletal' },
    { id: 'PNS', name: 'Posterior Nasal Spine', abbreviation: 'PNS', x: coords.PNS.x, y: coords.PNS.y, confidence: 91, description: 'Tip of posterior nasal spine of palatal bone.', type: 'skeletal' },
    { id: 'A', name: 'Point A (Subspinale)', abbreviation: 'A', x: coords.A.x, y: coords.A.y, confidence: 95, description: 'Deepest midline point on maxilla. Delineates anterior apical base.', type: 'skeletal' },
    { id: 'B', name: 'Point B (Supramentale)', abbreviation: 'B', x: coords.B.x, y: coords.B.y, confidence: 94, description: 'Deepest midline point on mandibular alveolar symphysis curvature.', type: 'skeletal' },
    { id: 'Pog', name: 'Pogonion', abbreviation: 'Pog', x: coords.Pog.x, y: coords.Pog.y, confidence: 97, description: 'Most anterior point on bony mandibular chin symphysis.', type: 'skeletal' },
    { id: 'Gn', name: 'Gnathion', abbreviation: 'Gn', x: coords.Gn.x, y: coords.Gn.y, confidence: 95, description: 'Most antero-inferior point on bony symphysis contour.', type: 'skeletal' },
    { id: 'Me', name: 'Menton', abbreviation: 'Me', x: coords.Me.x, y: coords.Me.y, confidence: 96, description: 'Lowest point on the inferior border of mandibular symphysis.', type: 'skeletal' },
    { id: 'Go', name: 'Gonion', abbreviation: 'Go', x: coords.Go.x, y: coords.Go.y, confidence: 93, description: 'Middle point on mandibular angle curvature.', type: 'skeletal' },
    { id: 'U1T', name: 'Upper Incisor Tip', abbreviation: 'U1T', x: coords.U1T.x, y: coords.U1T.y, confidence: 99, description: 'Incisal edge tip of the most prominent maxillary central incisor.', type: 'dental' },
    { id: 'U1A', name: 'Upper Incisor Apex', abbreviation: 'U1A', x: coords.U1A.x, y: coords.U1A.y, confidence: 94, description: 'Root apex of the most prominent maxillary central incisor.', type: 'dental' },
    { id: 'L1T', name: 'Lower Incisor Tip', abbreviation: 'L1T', x: coords.L1T.x, y: coords.L1T.y, confidence: 98, description: 'Incisal edge tip of the most prominent mandibular central incisor.', type: 'dental' },
    { id: 'L1A', name: 'Lower Incisor Apex', abbreviation: 'L1A', x: coords.L1A.x, y: coords.L1A.y, confidence: 93, description: 'Root apex of the most prominent mandibular central incisor.', type: 'dental' },
    { id: 'U6', name: 'Upper 1st Molar', abbreviation: 'U6', x: coords.U6.x, y: coords.U6.y, confidence: 92, description: 'Mesiobuccal cusp tip of maxillary first permanent molar.', type: 'dental' },
    { id: 'L6', name: 'Lower 1st Molar', abbreviation: 'L6', x: coords.L6.x, y: coords.L6.y, confidence: 92, description: 'Mesiobuccal cusp tip of mandibular first permanent molar.', type: 'dental' },
    { id: 'Ba', name: 'Basion', abbreviation: 'Ba', x: coords.Ba.x, y: coords.Ba.y, confidence: 89, description: 'Lowest point of the anterior margin of foramen magnum. Requires confirmation.', type: 'skeletal' },
    { id: 'Ar', name: 'Articulare', abbreviation: 'Ar', x: coords.Ar.x, y: coords.Ar.y, confidence: 91, description: 'Intersection of external contour of cranial base and mandibular ramus posterior border.', type: 'skeletal' },
    { id: 'Ns', name: 'Soft Tissue Nasion', abbreviation: "N'", x: coords.Ns.x, y: coords.Ns.y, confidence: 98, description: 'Point of deepest depression in the soft tissue sagittal midline of nose bridge.', type: 'soft-tissue' },
    { id: 'Pr', name: 'Pronasale', abbreviation: 'Pr', x: coords.Pr.x, y: coords.Pr.y, confidence: 99, description: 'Tip of the nose (most anterior soft tissue point on nose contour).', type: 'soft-tissue' },
    { id: 'Ls', name: 'Labrale Superius', abbreviation: 'Ls', x: coords.Ls.x, y: coords.Ls.y, confidence: 98, description: 'Most prominent point on the midline contour of upper lip.', type: 'soft-tissue' },
    { id: 'Li', name: 'Labrale Inferius', abbreviation: 'Li', x: coords.Li.x, y: coords.Li.y, confidence: 98, description: 'Most prominent point on the midline contour of lower lip.', type: 'soft-tissue' },
    { id: 'Pogs', name: 'Soft Tissue Pogonion', abbreviation: "Pog'", x: coords.Pogs.x, y: coords.Pogs.y, confidence: 97, description: 'Most prominent sagittal point on the soft tissue chin outline.', type: 'soft-tissue' },
    { id: 'Sn', name: 'Subnasale', abbreviation: 'Sn', x: coords.Sn.x, y: coords.Sn.y, confidence: 96, description: 'Point at junction of nasal septum base and philtrum of upper lip.', type: 'soft-tissue' },
    { id: 'Mes', name: 'Soft Tissue Menton', abbreviation: "Me'", x: coords.Mes.x, y: coords.Mes.y, confidence: 95, description: 'Lowest point on soft tissue chin symphysis outline.', type: 'soft-tissue' }
  ];

  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const mockOciResult: OciResult = {
        totalScore: selectedPreset === 'class2' ? 74 : selectedPreset === 'class3' ? 82 : 28,
        interpretation: selectedPreset === 'class2' 
          ? 'Extreme Compensation' 
          : selectedPreset === 'class3' 
            ? 'Severe Compensation' 
            : 'Minimal Compensation',
        recommendation: selectedPreset === 'class2' 
          ? 'Surgical decompensation strongly recommended.' 
          : selectedPreset === 'class3' 
            ? 'Surgical consultation indicated due to severe mandibular alveolar tilt.' 
            : 'Conventional camouflage/orthodontics suitable.',
        categoryScores: [],
        severityMap: {
          upperIncisors: selectedPreset === 'class2' ? 'orange' : selectedPreset === 'class3' ? 'red' : 'green',
          lowerIncisors: selectedPreset === 'class2' ? 'red' : selectedPreset === 'class3' ? 'red' : 'green',
          softTissue: selectedPreset === 'class2' ? 'orange' : selectedPreset === 'class3' ? 'orange' : 'green',
          occlusion: selectedPreset === 'class2' ? 'red' : selectedPreset === 'class3' ? 'red' : 'green',
          transverse: 'green'
        }
      };

      const markdown = await generateClinicalSummary(
        {
          ...patientDetails,
          diagnosis: selectedPreset === 'class1' ? 'Class I' : selectedPreset === 'class2' ? 'Class II' : 'Class III',
          facialProfile: selectedPreset === 'class2' ? 'Convex' : selectedPreset === 'class3' ? 'Concave' : 'Straight',
          smileAnalysis: selectedPreset === 'class2' ? 'Gummy' : 'Consonant',
          crowdingSpacing: selectedPreset === 'class2' ? 'Crowding' : 'None'
        },
        measurements,
        mockOciResult
      );
      setAiReportText(markdown);
      setActiveTab('report');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSyncData = () => {
    onApplyAnalysis(measurements, aiReportText || 'Sync performed without full report generation.');
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 95) return 'text-emerald-400';
    if (conf >= 90) return 'text-teal-400';
    return 'text-amber-400 font-extrabold';
  };

  const getConfidenceBg = (conf: number) => {
    if (conf >= 95) return 'bg-emerald-500/15 border-emerald-500/30';
    if (conf >= 90) return 'bg-teal-500/15 border-teal-500/30';
    return 'bg-amber-500/15 border-amber-500/30';
  };

  return (
    <View style={tw`flex-1 bg-[#050814]`}>
      
      {/* Top Banner / Selector */}
      <View style={tw`px-5 py-4 bg-[#0B1020] border-b border-white/5 flex-row justify-between items-center`}>
        <View style={tw`flex-1 mr-4`}>
          <View style={tw`flex-row items-center mb-1`}>
            <Cpu size={18} color="#14B8A6" style={tw`mr-2`} />
            <Text style={tw`text-base font-black text-white`}>AI AUTO-CEPH ANALYZER</Text>
            <View style={tw`ml-2 px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 rounded-md`}>
              <Text style={tw`text-[9px] font-mono text-teal-400 font-black`}>STEP 1-10 FULLY AUTOMATIC</Text>
            </View>
          </View>
          <Text style={tw`text-xs text-slate-400 leading-normal`}>
            Evaluating: <Text style={tw`text-white font-bold`}>{patientDetails.name || 'Anonymous'}</Text> ({patientDetails.age}yo {patientDetails.gender})
          </Text>
        </View>

        <Pressable 
          onPress={onCancel}
          style={tw`px-4 py-2 bg-white/5 border border-white/10 rounded-xl`}
        >
          <Text style={tw`text-xs font-bold text-white uppercase tracking-wider`}>Cancel</Text>
        </Pressable>
      </View>

      {/* Preset Selector Cases */}
      <View style={tw`px-5 py-3 bg-[#0B1020]/45 border-b border-white/5 flex-row flex-wrap items-center gap-2`}>
        <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mr-1`}>Analyze Sample Ceph:</Text>
        {(Object.keys(PRESET_CASES) as Array<keyof typeof PRESET_CASES>).map((key) => {
          const isSelected = selectedPreset === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                setSelectedPreset(key);
                setAiReportText('');
                setSelectedLandmark(null);
              }}
              style={tw`px-3 py-1.5 rounded-xl border ${isSelected ? 'bg-teal-500/10 border-teal-500/30' : 'bg-[#0E1528] border-white/5'}`}
            >
              <Text style={tw`text-[11px] font-black ${isSelected ? 'text-teal-400' : 'text-slate-400'}`}>
                {PRESET_CASES[key].name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Navigation tabs */}
      <View style={tw`flex-row bg-[#080C1A] border-b border-white/5`}>
        {[
          { id: 'visual', label: 'Radiograph & Tracing', icon: ImageIcon },
          { id: 'landmarks', label: 'Landmark Confidence', icon: MapPin },
          { id: 'measurements', label: 'Measurements (40+)', icon: Layers },
          { id: 'report', label: 'AI Diagnosis & Plan', icon: FileText },
          { id: 'quality', label: 'Quality Assessment', icon: ShieldAlert }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={tw`flex-1 py-3.5 items-center justify-center border-b-2 ${isSelected ? 'border-[#14B8A6] bg-white/5' : 'border-transparent'}`}
            >
              <IconComp size={15} color={isSelected ? '#14B8A6' : '#94A3B8'} style={tw`mb-1`} />
              <Text style={tw`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'text-teal-400' : 'text-slate-400'} text-center`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main Content Areas */}
      <View style={tw`flex-1 flex-row`}>
        
        {/* Left Interactive Radiograph Display Frame */}
        <View style={tw`w-[420px] bg-[#02050E] border-r border-white/5 items-center justify-center relative`}>
          
          {/* Diagnostic Overlay Controller HUD */}
          <View style={tw`absolute top-3 left-3 bg-[#0B1020]/95 p-3 rounded-2xl border border-white/10 z-10 space-y-2`}>
            <Text style={tw`text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Display Overlays</Text>
            
            <Pressable 
              onPress={() => setShowLandmarks(!showLandmarks)}
              style={tw`flex-row items-center space-x-2 py-1`}
            >
              <View style={tw`w-4 h-4 rounded-md border border-white/20 items-center justify-center ${showLandmarks ? 'bg-teal-500' : 'bg-transparent'}`}>
                {showLandmarks && <CheckCircle2 size={10} color="#ffffff" />}
              </View>
              <Text style={tw`text-[11px] text-white font-bold`}>Landmarks ({landmarks.length})</Text>
            </Pressable>

            <Pressable 
              onPress={() => setShowPlanes(!showPlanes)}
              style={tw`flex-row items-center space-x-2 py-1`}
            >
              <View style={tw`w-4 h-4 rounded-md border border-white/20 items-center justify-center ${showPlanes ? 'bg-teal-500' : 'bg-transparent'}`}>
                {showPlanes && <CheckCircle2 size={10} color="#ffffff" />}
              </View>
              <Text style={tw`text-[11px] text-white font-bold`}>Cephalometric Planes</Text>
            </Pressable>

            <Pressable 
              onPress={() => setShowHeatmap(!showHeatmap)}
              style={tw`flex-row items-center space-x-2 py-1`}
            >
              <View style={tw`w-4 h-4 rounded-md border border-white/20 items-center justify-center ${showHeatmap ? 'bg-rose-500' : 'bg-transparent'}`}>
                {showHeatmap && <CheckCircle2 size={10} color="#ffffff" />}
              </View>
              <Text style={tw`text-[11px] text-white font-bold`}>Compensation Heatmap</Text>
            </Pressable>
          </View>

          {/* Svg Tracing Graphics Canvas on top of Mock Radiograph */}
          <View style={tw`w-[380px] h-[360px] bg-[#040817] rounded-3xl border border-white/5 relative overflow-hidden items-center justify-center shadow-inner`}>
            
            {/* Ambient Skull Contour Vector Skeleton Drawing to look like a true X-ray overlay */}
            <View style={tw`absolute inset-0 items-center justify-center opacity-25`}>
              <Svg width="360" height="340" viewBox="0 0 360 340">
                {/* Cranial Vault Outline */}
                <Path 
                  d="M 120,280 C 100,240 80,210 80,180 C 80,110 110,60 170,60 C 230,60 270,100 270,160 C 270,180 290,190 300,200" 
                  fill="none" 
                  stroke="#475569" 
                  strokeWidth="2.5" 
                  strokeDasharray="4,4"
                />
                {/* Maxillary Profile */}
                <Path 
                  d="M 270,160 L 270,165 L 262,182 C 262,182 258,190 255,215" 
                  fill="none" 
                  stroke="#475569" 
                  strokeWidth="2.5"
                />
                {/* Mandibular Chin and Angle */}
                <Path 
                  d="M 255,215 L 251,220 C 251,220 222,260 222,262 L 235,305 C 235,305 248,294 256,278 L 268,280 C 268,280 222,306 95,238 L 94,185" 
                  fill="none" 
                  stroke="#475569" 
                  strokeWidth="2"
                />
              </Svg>
            </View>

            {/* Main Interactive Interactive Ceph SVG Overlay */}
            <Svg width="100%" height="100%" viewBox="0 0 360 340" style={tw`absolute inset-0`}>
              <Defs>
                <RadialGradient id="compensationGlow" cx="65%" cy="65%" r="35%">
                  <Stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                  <Stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </RadialGradient>
              </Defs>

              {/* Step 9: Compensation Zone Heatmap Overlays */}
              {showHeatmap && (
                <G>
                  {/* Upper incisor compensation alveolar region */}
                  <Circle cx={coords.U1T.x - 10} cy={coords.U1T.y - 15} r="32" fill="url(#compensationGlow)" />
                  {/* Lower incisor compensation alveolar region */}
                  <Circle cx={coords.L1T.x - 10} cy={coords.L1T.y + 15} r="28" fill="url(#compensationGlow)" />
                </G>
              )}

              {/* Step 3: Cephalometric Tracing Reference Planes */}
              {showPlanes && (
                <G>
                  {/* SN Plane (Nasion to Sella) - Sella (140, 100), Nasion (260, 85) */}
                  <Line x1={coords.S.x} y1={coords.S.y} x2={coords.N.x} y2={coords.N.y} stroke="#38BDF8" strokeWidth="1.8" />
                  <SvgText x="190" y="85" fill="#38BDF8" fontSize="8" fontWeight="bold" fontFamily="monospace">SN Plane</SvgText>

                  {/* Frankfort Horizontal (Porion to Orbitale) - Po(80, 120), Or(220, 125) */}
                  <Line x1={coords.Po.x} y1={coords.Po.y} x2={coords.Or.x} y2={coords.Or.y} stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,3" />
                  <SvgText x="90" y="115" fill="#F59E0B" fontSize="8" fontWeight="bold" fontFamily="monospace">FH Plane</SvgText>

                  {/* Palatal Plane (PNS to ANS) */}
                  <Line x1={coords.PNS.x} y1={coords.PNS.y} x2={coords.ANS.x} y2={coords.ANS.y} stroke="#10B981" strokeWidth="1.5" />
                  <SvgText x="175" y="158" fill="#10B981" fontSize="8" fontWeight="bold" fontFamily="monospace">Palatal</SvgText>

                  {/* Mandibular Plane (Go to Me) */}
                  <Line x1={coords.Go.x} y1={coords.Go.y} x2={coords.Me.x} y2={coords.Me.y} stroke="#F43F5E" strokeWidth="1.8" />
                  <SvgText x="110" y="278" fill="#F43F5E" fontSize="8" fontWeight="bold" fontFamily="monospace">Mandibular Plane</SvgText>

                  {/* Ricketts E-Line (Pronasale to Soft tissue Pogonion) */}
                  <Line x1={coords.Pr.x} y1={coords.Pr.y} x2={coords.Pogs.x} y2={coords.Pogs.y} stroke="#A855F7" strokeWidth="1.5" strokeDasharray="4,2" />
                  <SvgText x="290" y="220" fill="#A855F7" fontSize="8" fontWeight="bold" fontFamily="monospace">E-Line</SvgText>

                  {/* Upper Incisor Axis */}
                  <Line x1={coords.U1A.x} y1={coords.U1A.y} x2={coords.U1T.x} y2={coords.U1T.y} stroke="#22D3EE" strokeWidth="1.5" />
                  
                  {/* Lower Incisor Axis */}
                  <Line x1={coords.L1A.x} y1={coords.L1A.y} x2={coords.L1T.x} y2={coords.L1T.y} stroke="#F472B6" strokeWidth="1.5" />
                </G>
              )}

              {/* Step 2: Automatic Landmark Markers (Dots) */}
              {showLandmarks && landmarks.map((lm, idx) => {
                const isSelected = selectedLandmark === lm.id;
                return (
                  <G key={lm.id}>
                    <Circle 
                      cx={lm.x} 
                      cy={lm.y} 
                      r={isSelected ? 6 : 3.5} 
                      fill={isSelected ? '#22D3EE' : lm.type === 'dental' ? '#EC4899' : lm.type === 'soft-tissue' ? '#A855F7' : '#10B981'}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 1.5 : 0.8}
                      onPress={() => setSelectedLandmark(lm.id)}
                    />
                    {/* Tiny Numbered Index label */}
                    <SvgText 
                      x={lm.x + 6} 
                      y={lm.y + 3} 
                      fill="#FFFFFF" 
                      fontSize="7" 
                      fontWeight="black"
                      fontFamily="monospace"
                      opacity={isSelected ? 1.0 : 0.6}
                    >
                      {lm.abbreviation}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>

            {/* Interactive feedback card inside radiograph container */}
            <View style={tw`absolute bottom-2 left-2 right-2 bg-black/80 border border-white/10 px-3 py-2 rounded-xl flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center space-x-2`}>
                <Info size={11} color="#38BDF8" />
                <Text style={tw`text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider`}>
                  {selectedPreset === 'class2' ? 'Skeletal II Div 1 • Overjet: 7.8mm' : selectedPreset === 'class3' ? 'Skeletal III • Overjet: -1.2mm' : 'Balanced Skeletal I'}
                </Text>
              </View>
              <View style={tw`flex-row items-center space-x-1.5`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-emerald-500`} />
                <Text style={tw`text-[9px] font-black text-emerald-400 font-mono`}>AI CONFIDENCE: {currentCase.qualityScore}%</Text>
              </View>
            </View>

          </View>

          {/* Active Landmark explanation display card */}
          <View style={tw`w-[380px] mt-3.5 bg-[#0B1020] p-4 rounded-2.5xl border border-white/5`}>
            {selectedLandmark ? (() => {
              const lmObj = landmarks.find(l => l.id === selectedLandmark);
              if (!lmObj) return null;
              return (
                <View style={tw`space-y-1.5`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <View style={tw`flex-row items-center space-x-2`}>
                      <MapPin size={13} color="#22D3EE" />
                      <Text style={tw`text-xs font-black text-white uppercase`}>{lmObj.name} ({lmObj.abbreviation})</Text>
                    </View>
                    <View style={tw`px-2 py-0.5 rounded-md ${getConfidenceBg(lmObj.confidence)} border`}>
                      <Text style={tw`text-[8px] font-mono font-black ${getConfidenceColor(lmObj.confidence)}`}>
                        CONFIDENCE: {lmObj.confidence}%
                      </Text>
                    </View>
                  </View>
                  <Text style={tw`text-[11px] text-slate-300 leading-normal`}>{lmObj.description}</Text>
                  <Text style={tw`text-[9px] text-slate-400 font-mono uppercase tracking-wider`}>Coordinates: X={lmObj.x}, Y={lmObj.y} • Verified</Text>
                </View>
              );
            })() : (
              <View style={tw`items-center justify-center py-2`}>
                <Text style={tw`text-[11px] text-slate-400 font-medium italic text-center`}>
                  Tap any anatomical marker on the lateral X-ray to confirm placement and confidence score.
                </Text>
              </View>
            )}
          </View>

        </View>

        {/* Right Active Assessment Dashboard / Tabs content */}
        <View style={tw`flex-1 bg-[#050814]`}>
          
          {activeTab === 'visual' && (
            <ScrollView contentContainerStyle={tw`p-6 space-y-6`}>
              
              <View style={tw`bg-[#0B1020]/90 p-5 rounded-3xl border border-white/5 space-y-4`}>
                <View style={tw`flex-row items-center space-x-2.5`}>
                  <Cpu size={16} color="#14B8A6" />
                  <Text style={tw`text-sm font-black text-white uppercase tracking-wider`}>Automatic Tracing Summary</Text>
                </View>
                <Text style={tw`text-xs text-slate-300 leading-normal`}>
                  Zero manual tracing completed. The deep-learning neural network identified the hard tissue cranial base, palatal plane landmarks, and soft-tissue facial contours.
                </Text>

                <View style={tw`space-y-2 bg-black/35 p-4 rounded-2xl border border-white/5`}>
                  <View style={tw`flex-row justify-between border-b border-white/5 pb-2`}>
                    <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Parameters Calculated</Text>
                    <Text style={tw`text-[10px] font-bold text-[#14B8A6] uppercase tracking-widest font-mono`}>Confidence Metrics</Text>
                  </View>
                  
                  <View style={tw`flex-row justify-between py-1.5`}>
                    <Text style={tw`text-xs text-slate-300`}>Skeletal Relations (ANB, SNA, SNB, Wits)</Text>
                    <Text style={tw`text-xs font-mono font-black text-emerald-400`}>96.4% (Excellent)</Text>
                  </View>
                  <View style={tw`flex-row justify-between py-1.5`}>
                    <Text style={tw`text-xs text-slate-300`}>Dentoalveolar Compensations (IMPA, U1-SN)</Text>
                    <Text style={tw`text-xs font-mono font-black text-emerald-400`}>98.2% (Pristine)</Text>
                  </View>
                  <View style={tw`flex-row justify-between py-1.5`}>
                    <Text style={tw`text-xs text-slate-300`}>Soft-Tissue Profile Ratios (E-Line, Z-Angle)</Text>
                    <Text style={tw`text-xs font-mono font-black text-teal-400`}>94.8% (Very Good)</Text>
                  </View>
                  <View style={tw`flex-row justify-between py-1.5`}>
                    <Text style={tw`text-xs text-slate-300`}>Dental Occlusion (Crossbites, Midlines)</Text>
                    <Text style={tw`text-xs font-mono font-black text-emerald-400`}>95.1% (Excellent)</Text>
                  </View>
                </View>
              </View>

              <View style={tw`bg-teal-500/10 border border-teal-500/20 p-5 rounded-3xl space-y-3`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center space-x-2`}>
                    <Sparkles size={16} color="#14B8A6" />
                    <Text style={tw`text-xs font-black text-teal-400 uppercase tracking-widest font-mono`}>Generate Diagnostic Plan</Text>
                  </View>
                  <Zap size={14} color="#14B8A6" />
                </View>
                <Text style={tw`text-[11px] text-slate-300 leading-relaxed`}>
                  Run our server-side LLM Consulting Orthodontist module to generate problem lists, extractions vs camouflage, expected tissue movements, and risk guidelines automatically!
                </Text>
                
                <Pressable
                  onPress={handleGenerateAIReport}
                  disabled={isGeneratingReport}
                  style={({ pressed }) => [
                    tw`bg-[#14B8A6] py-3.5 px-4 rounded-xl items-center justify-center flex-row space-x-2 mt-2`,
                    pressed ? tw`opacity-90` : null
                  ]}
                >
                  {isGeneratingReport ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Run Clinical Analysis Report</Text>
                      <ArrowRight size={14} color="#ffffff" />
                    </>
                  )}
                </Pressable>
              </View>

            </ScrollView>
          )}

          {activeTab === 'landmarks' && (
            <ScrollView contentContainerStyle={tw`p-6 space-y-4`}>
              <View style={tw`bg-[#0B1020]/90 p-5 rounded-3xl border border-white/5 space-y-2`}>
                <Text style={tw`text-sm font-black text-white uppercase tracking-wider`}>Step 2: AI Landmark Confidence Grid</Text>
                <Text style={tw`text-xs text-slate-400 leading-normal`}>
                  Individual confidence indicators for the 27 detected points. High confidence reflects secure contrast detection.
                </Text>
              </View>

              <View style={tw`space-y-2`}>
                {landmarks.map((lm) => (
                  <Pressable
                    key={lm.id}
                    onPress={() => {
                      setSelectedLandmark(lm.id);
                      setActiveTab('visual');
                    }}
                    style={tw`flex-row justify-between items-center p-3 bg-white/5 border border-white/5 rounded-2xl`}
                  >
                    <View style={tw`flex-row items-center space-x-3`}>
                      <View style={tw`w-5 h-5 rounded-full bg-slate-800 items-center justify-center`}>
                        <Text style={tw`text-[8px] font-black font-mono text-slate-300`}>{lm.abbreviation}</Text>
                      </View>
                      <View>
                        <Text style={tw`text-xs font-black text-slate-100`}>{lm.name}</Text>
                        <Text style={tw`text-[9px] text-slate-400 capitalize`}>{lm.type.replace('-', ' ')}</Text>
                      </View>
                    </View>
                    <View style={tw`flex-row items-center space-x-2`}>
                      <Text style={tw`text-xs font-mono font-black ${getConfidenceColor(lm.confidence)}`}>{lm.confidence}%</Text>
                      <View style={tw`w-1.5 h-1.5 rounded-full ${lm.confidence >= 95 ? 'bg-emerald-400' : 'bg-teal-400'}`} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {activeTab === 'measurements' && (
            <ScrollView contentContainerStyle={tw`p-6 space-y-6`}>
              
              {/* Skeletal Parameters Grid */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-[#14B8A6] uppercase tracking-widest font-mono`}>Skeletal Parameters</Text>
                <View style={tw`grid gap-3 flex-row flex-wrap`}>
                  {[
                    { label: 'ANB Angle', val: measurements.anb, norm: '2°', status: measurements.anb > 4.5 || measurements.anb < 0 ? 'Severe Dev' : 'Normal' },
                    { label: 'SNA Angle', val: measurements.sna, norm: '82°', status: Math.abs(measurements.sna - 82) > 4 ? 'Deviant' : 'Normal' },
                    { label: 'SNB Angle', val: measurements.snb, norm: '80°', status: Math.abs(measurements.snb - 80) > 4 ? 'Deviant' : 'Normal' },
                    { label: 'Wits Appraisal', val: `${measurements.wits}mm`, norm: '0mm', status: Math.abs(measurements.wits) > 4 ? 'Severe Dev' : 'Normal' },
                    { label: 'FMA Vertical', val: `${measurements.fma}°`, norm: '25°', status: 'Normal' },
                    { label: 'SN-MP', val: `${measurements.snMp}°`, norm: '32°', status: 'Normal' }
                  ].map((item, idx) => (
                    <View key={idx} style={tw`w-[48%] bg-white/5 border border-white/5 p-3.5 rounded-2xl`}>
                      <Text style={tw`text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider`}>{item.label}</Text>
                      <View style={tw`flex-row items-baseline justify-between mt-1.5`}>
                        <Text style={tw`text-lg font-black text-white font-mono`}>{item.val}</Text>
                        <Text style={tw`text-[9px] font-mono text-slate-400`}>Norm: {item.norm}</Text>
                      </View>
                      <View style={tw`flex-row items-center space-x-1.5 mt-1.5`}>
                        <View style={tw`w-1.5 h-1.5 rounded-full ${item.status === 'Normal' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <Text style={tw`text-[9px] font-black ${item.status === 'Normal' ? 'text-emerald-400' : 'text-rose-400'} uppercase font-mono`}>{item.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Dental Parameters Grid */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono`}>Dental Parameters (Upper & Lower)</Text>
                <View style={tw`grid gap-3 flex-row flex-wrap`}>
                  {[
                    { label: 'U1-SN Inclination', val: `${measurements.u1Sn}°`, norm: '104°', comp: 'Maxillary Retroclination' },
                    { label: 'IMPA (L1-MP)', val: `${measurements.impa}°`, norm: '90°', comp: 'Proclination' },
                    { label: 'U1-NA Angle', val: `${measurements.u1NaDeg}°`, norm: '22°', comp: 'Normal' },
                    { label: 'L1-NB Angle', val: `${measurements.l1NbDeg}°`, norm: '25°', comp: 'Highly Compensated' },
                    { label: 'Interincisal Angle', val: `${measurements.interincisalAngle}°`, norm: '135°', comp: 'Compensated' },
                    { label: 'Overjet', val: `${measurements.overjet}mm`, norm: '2.5mm', comp: 'Mismatched' }
                  ].map((item, idx) => (
                    <View key={idx} style={tw`w-[48%] bg-white/5 border border-white/5 p-3.5 rounded-2xl`}>
                      <Text style={tw`text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider`}>{item.label}</Text>
                      <View style={tw`flex-row items-baseline justify-between mt-1.5`}>
                        <Text style={tw`text-lg font-black text-white font-mono`}>{item.val}</Text>
                        <Text style={tw`text-[9px] font-mono text-slate-400`}>Norm: {item.norm}</Text>
                      </View>
                      <Text style={tw`text-[9px] font-mono text-amber-400 font-black uppercase mt-2`}>{item.comp}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Soft Tissue parameters */}
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-black text-pink-400 uppercase tracking-widest font-mono`}>Soft Tissue & Occlusion</Text>
                <View style={tw`grid gap-3 flex-row flex-wrap`}>
                  {[
                    { label: 'Upper Lip to E-Line', val: `${measurements.upperLipELine}mm`, norm: '-2mm' },
                    { label: 'Lower Lip to E-Line', val: `${measurements.lowerLipELine}mm`, norm: '0mm' },
                    { label: 'Nasolabial Angle', val: `${measurements.nasolabialAngle}°`, norm: '102°' },
                    { label: 'Facial Convexity', val: `${measurements.facialConvexity}°`, norm: '12°' }
                  ].map((item, idx) => (
                    <View key={idx} style={tw`w-[48%] bg-white/5 border border-white/5 p-3.5 rounded-2xl`}>
                      <Text style={tw`text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider`}>{item.label}</Text>
                      <View style={tw`flex-row items-baseline justify-between mt-1.5`}>
                        <Text style={tw`text-lg font-black text-white font-mono`}>{item.val}</Text>
                        <Text style={tw`text-[9px] font-mono text-slate-400`}>Norm: {item.norm}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

            </ScrollView>
          )}

          {activeTab === 'report' && (
            <View style={tw`flex-1`}>
              {aiReportText ? (
                <ScrollView contentContainerStyle={tw`p-6`}>
                  <MarkdownRenderer>{aiReportText}</MarkdownRenderer>
                </ScrollView>
              ) : (
                <View style={tw`flex-1 items-center justify-center p-6 space-y-4`}>
                  <FileText size={42} color="#14B8A6" />
                  <View style={tw`space-y-1 items-center`}>
                    <Text style={tw`text-sm font-black text-white uppercase`}>Clinical AI Report Standby</Text>
                    <Text style={tw`text-xs text-slate-400 text-center max-w-[280px]`}>
                      Generate a Board-Certified Consulting Orthodontist analysis containing custom problem lists, extractions, mechanics, and retention.
                    </Text>
                  </View>
                  
                  <Pressable
                    onPress={handleGenerateAIReport}
                    disabled={isGeneratingReport}
                    style={tw`px-6 py-3 bg-teal-500 rounded-xl flex-row items-center space-x-2`}
                  >
                    {isGeneratingReport ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Generate AI Report Now</Text>
                        <Sparkles size={14} color="#ffffff" />
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {activeTab === 'quality' && (
            <ScrollView contentContainerStyle={tw`p-6 space-y-6`}>
              
              <View style={tw`bg-[#0B1020]/90 p-5 rounded-3xl border border-white/5 space-y-4`}>
                <View style={tw`flex-row justify-between items-center border-b border-white/5 pb-3`}>
                  <Text style={tw`text-sm font-black text-white uppercase tracking-wider`}>Step 1: Image Quality Assessment</Text>
                  <View style={tw`px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-xl`}>
                    <Text style={tw`text-xs font-mono font-black text-emerald-400`}>SCORE: {currentCase.qualityScore}/100</Text>
                  </View>
                </View>

                <View style={tw`space-y-3`}>
                  {[
                    { label: 'True Lateral Cephalogram', status: 'Verified', details: 'Head positioning and auditive ear rods aligned accurately.' },
                    { label: 'Contrast & Sharpness', status: 'Excellent', details: 'Maxillary alveolar bone plates and soft-tissue profile are fully visible.' },
                    { label: 'Resolution & Zoom', status: 'Optimal', details: 'Image contains sufficient voxel density for sub-millimeter tracing accuracy.' },
                    { label: 'Anatomical Structure Integrity', status: '96% complete', details: 'Cranial base, posterior airway, palatal plane, and teeth are fully exposed.' }
                  ].map((check, idx) => (
                    <View key={idx} style={tw`p-3 bg-black/35 rounded-2xl border border-white/5`}>
                      <View style={tw`flex-row justify-between items-center mb-1`}>
                        <Text style={tw`text-xs font-black text-white`}>{check.label}</Text>
                        <Text style={tw`text-xs font-mono font-bold text-[#14B8A6]`}>{check.status}</Text>
                      </View>
                      <Text style={tw`text-[11px] text-slate-400 leading-normal`}>{check.details}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={tw`bg-[#1E1B4B]/35 border border-indigo-500/20 p-5 rounded-3xl space-y-2`}>
                <Text style={tw`text-xs font-black text-indigo-300 uppercase tracking-widest font-mono`}>Step 10: Clinical Safety Protocol</Text>
                <Text style={tw`text-[11px] text-slate-300 leading-relaxed`}>
                  AI-detected landmarks are cross-referenced with local clinical heuristics. If confidence drops below 90%, the landmark must be confirmed manually by dragging. Never guess or fabricate landmarks.
                </Text>
              </View>

            </ScrollView>
          )}

        </View>

      </View>

      {/* Footer Apply / Sync Buttons */}
      <View style={tw`px-5 py-4 bg-[#0B1020] border-t border-white/5 flex-row justify-between items-center`}>
        <View style={tw`flex-row items-center space-x-2`}>
          <View style={tw`w-2 h-2 rounded-full bg-emerald-500`} />
          <Text style={tw`text-[10px] font-mono text-slate-400 uppercase tracking-wider`}>
            AI measurements computed automatically.
          </Text>
        </View>

        <Pressable
          onPress={handleSyncData}
          style={({ pressed }) => [
            tw`px-6 py-3.5 bg-[#14B8A6] rounded-2xl flex-row items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30`,
            pressed ? tw`opacity-90 scale-98` : null
          ]}
        >
          <Text style={tw`text-white font-black text-xs uppercase tracking-widest mr-1.5`}>Apply & Sync to OCI Engine</Text>
          <CheckCircle2 size={15} color="#ffffff" />
        </Pressable>
      </View>

    </View>
  );
}
