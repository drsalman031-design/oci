import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { 
  Sparkles, 
  CheckCircle,
  FileText,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  TrendingUp,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Award
} from 'lucide-react-native';
import tw from 'twrnc';
import Svg, { Circle, Path, Polygon, Line, Text as SvgText, G, Rect } from 'react-native-svg';
import { OciResult, CephalometricInput, PatientDetails } from '../types';
import { generateTreatmentPlan } from '../treatmentPlanner';

interface ResultsDashboardProps {
  patientDetails: PatientDetails;
  cephalometricInput: CephalometricInput;
  ociResult: OciResult;
  onSaveAssessment: (aiSummary: string) => void;
  onOpenPdf: (aiSummary: string) => void;
  onBack: () => void;
  mode?: 'clinic' | 'ceph' | 'turbo';
}

export default function ResultsDashboard({
  patientDetails,
  cephalometricInput,
  ociResult,
  onSaveAssessment,
  onOpenPdf,
  onBack,
  mode = 'turbo'
}: ResultsDashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    complaint: true,
    findings: false,
    facial: false,
    dental: false,
    compensation: true,
    score: true,
    diagnosis: true,
    treatment: true,
    retention: false,
    risk: false,
    clinicalNotes: false,
    doctorNotes: true
  });

  // Interactive Treatment options states
  const [ageGroup, setAgeGroup] = useState<'growing' | 'adult'>('adult');
  const [crowdingSeverity, setCrowdingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [spacingSeverity, setSpacingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [archDiscrepancy, setArchDiscrepancy] = useState<number>(0);
  const [doctorOverrideText, setDoctorOverrideText] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score <= 20) return '#00FF88'; // Green
    if (score <= 40) return '#00E5FF'; // Teal
    if (score <= 60) return '#FFB300'; // Orange
    return '#FF4D4D'; // Red
  };

  const getComplexityLabel = (score: number) => {
    if (score <= 20) return 'Simple (Camouflage)';
    if (score <= 40) return 'Moderate (Borderline)';
    if (score <= 60) return 'Complex (Skeletal Camouflage)';
    return 'Severe / Surgical (Decompensation)';
  };

  const scoreColor = getScoreColor(ociResult.totalScore);
  const complexity = getComplexityLabel(ociResult.totalScore);

  // Generate treatment plan dynamically using options
  const generatedPlan = generateTreatmentPlan(
    patientDetails,
    cephalometricInput,
    ociResult,
    { ageGroup, crowdingSeverity, spacingSeverity, archDiscrepancy }
  );

  // Low confidence / missing info validation
  const missingParameters: string[] = [];
  const requiredCephs = ['anb', 'sna', 'snb', 'impa', 'u1Sn'];
  requiredCephs.forEach(key => {
    const val = (cephalometricInput as any)[key];
    if (val === undefined || val === '' || val === null) {
      missingParameters.push(key.toUpperCase());
    }
  });

  const isLowConfidence = missingParameters.length > 0 || ociResult.totalScore === 0;

  // Build the complete clinical summary markdown for PDF exporter
  const clinicalSummaryText = `### OCI Autonomous Orthodontic Report
- **Patient**: ${patientDetails.name} (${patientDetails.age} y/o ${patientDetails.gender})
- **OCI Severity Index**: ${ociResult.totalScore}% (${complexity})
- **Skeletal Pattern**: Class ${patientDetails.diagnosis || 'II'} (${ociResult.verticalPattern || 'Normodivergent'})
- **Dentoalveolar Compensation**: ${ociResult.compensationLevel || 'Moderate'}
- **Treatment Approach**: ${generatedPlan.treatmentComplexity} - Conventional Orthodontics
- **Custom Doctor Signature**: ${doctorOverrideText || 'Dr. Salman MDS Orthodontist'}`;

  // RADAR CHART COORDINATES CALCULATION
  // Center: (80, 80). SNA, SNB, ANB, FMA, IMPA
  // Normal reference values: SNA=82, SNB=80, ANB=2, FMA=25, IMPA=90
  const getRadarPoint = (val: number, norm: number, angleDeg: number) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const ratio = val > 0 ? Math.min(Math.max(val / norm, 0.4), 1.6) : 1;
    const r = 35 * ratio; 
    const x = 80 + r * Math.cos(angleRad);
    const y = 80 + r * Math.sin(angleRad);
    return { x, y };
  };

  const snaVal = Number(cephalometricInput.sna) || 82;
  const snbVal = Number(cephalometricInput.snb) || 80;
  const anbVal = Number(cephalometricInput.anb) || 2;
  const fmaVal = Number(cephalometricInput.fma) || 25;
  const impaVal = Number(cephalometricInput.impa) || 90;

  const pt1 = getRadarPoint(snaVal, 82, 0);
  const pt2 = getRadarPoint(snbVal, 80, 72);
  const pt3 = getRadarPoint(anbVal, 2, 144);
  const pt4 = getRadarPoint(fmaVal, 25, 216);
  const pt5 = getRadarPoint(impaVal, 90, 288);

  const norm1 = getRadarPoint(82, 82, 0);
  const norm2 = getRadarPoint(80, 80, 72);
  const norm3 = getRadarPoint(2, 2, 144);
  const norm4 = getRadarPoint(25, 25, 216);
  const norm5 = getRadarPoint(90, 90, 288);

  const patientPoints = `${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y} ${pt4.x},${pt4.y} ${pt5.x},${pt5.y}`;
  const normPoints = `${norm1.x},${norm1.y} ${norm2.x},${norm2.y} ${norm3.x},${norm3.y} ${norm4.x},${norm4.y} ${norm5.x},${norm5.y}`;

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-32 px-6 w-full bg-[#0A0C10]`} 
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`space-y-6 mt-6 max-w-2xl mx-auto w-full`}>
        
        {/* Header Action Row */}
        <View style={tw`flex-row justify-between items-center`}>
          <Pressable 
            onPress={onBack}
            style={tw`flex-row items-center bg-[#161A20] border border-[rgba(255,255,255,0.08)] px-4 py-2 rounded-xl shadow-sm`}
          >
            <ChevronLeft size={14} color="#D9E2F2" style={tw`mr-1`} />
            <Text style={tw`text-[#D9E2F2] font-bold text-xs uppercase tracking-wider`}>Dashboard</Text>
          </Pressable>

          <Pressable 
            onPress={() => onOpenPdf(clinicalSummaryText)}
            style={tw`flex-row items-center bg-[#00E5FF] px-4 py-2.5 rounded-xl shadow-sm`}
          >
            <FileText size={14} color="#FFF" style={tw`mr-1.5`} />
            <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Export PDF Report</Text>
          </Pressable>
        </View>

        {/* CLINICAL VALIDATION / WARNING BOX */}
        {isLowConfidence && (
          <View style={tw`bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex-row items-start space-x-3`}>
            <AlertTriangle size={18} color="#FFB300" style={tw`mt-0.5`} />
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs font-black text-amber-300 uppercase tracking-wide`}>Clinician Validation Required</Text>
              <Text style={tw`text-[10px] text-[#D9E2F2] mt-1 leading-normal`}>
                Low confidence parameters detected: <Text style={tw`font-extrabold text-white`}>{missingParameters.join(', ') || 'NONE'}</Text>. AI recommends manual review of clinical records before finalizing treatment mechanics.
              </Text>
            </View>
          </View>
        )}

        {/* ==========================================
            1. PATIENT SUMMARY SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('summary')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>1. Patient Summary</Text>
            {expandedSections.summary ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.summary && (
            <View style={tw`p-5 space-y-3.5`}>
              <View style={tw`flex-row justify-between`}>
                <View>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Name</Text>
                  <Text style={tw`text-sm font-extrabold text-white mt-0.5`}>{patientDetails.name}</Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Case ID</Text>
                  <Text style={tw`text-sm font-extrabold text-white mt-0.5`}>{patientDetails.caseNumber || 'N/A'}</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between border-t border-[rgba(255,255,255,0.05)] pt-3`}>
                <View>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Age / Sex</Text>
                  <Text style={tw`text-xs font-bold text-white mt-0.5`}>{patientDetails.age} yrs • {patientDetails.gender || 'Not specified'}</Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Assessment Date</Text>
                  <Text style={tw`text-xs font-bold text-white mt-0.5`}>{patientDetails.date}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            2. CHIEF COMPLAINT SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('complaint')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>2. Chief Complaint</Text>
            {expandedSections.complaint ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.complaint && (
            <View style={tw`p-5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed italic`}>
                "{patientDetails.chiefComplaint || 'No specific chief complaint recorded by the clinician.'}"
              </Text>
            </View>
          )}
        </View>

        {/* ==========================================
            3. CLINICAL FINDINGS SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('findings')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>3. Clinical Findings</Text>
            {expandedSections.findings ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.findings && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Molar Relation (R/L)</Text>
                <Text style={tw`text-xs font-bold text-white`}>{patientDetails.molarRelationRight || 'Class II'} / {patientDetails.molarRelationLeft || 'Class II'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Canine Relation (R/L)</Text>
                <Text style={tw`text-xs font-bold text-white`}>{patientDetails.canineRelationRight || 'Class II'} / {patientDetails.canineRelationLeft || 'Class II'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Overjet / Overbite</Text>
                <Text style={tw`text-xs font-bold text-white`}>{patientDetails.overjet || '6.2 mm'} / {patientDetails.overbite || '2.0 mm'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>TMJ Status</Text>
                <Text style={tw`text-xs font-bold text-white`}>{patientDetails.tmjStatus || 'Healthy (No clicking/crepitus)'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            4. FACIAL ANALYSIS SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('facial')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>4. Facial Analysis</Text>
            {expandedSections.facial ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.facial && (
            <View style={tw`p-5 space-y-3.5`}>
              <View style={tw`p-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.05)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider`}>Facial Profile & Aesthetics</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                  The patient displays a **convex facial profile** with a retrognathic mandible posture. Nasolabial angle is within normal limits (102°). Mentolabial sulcus is moderately deep.
                </Text>
              </View>
              <View style={tw`p-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.05)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider`}>Lips & Asymmetry</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                  Lips are **incompetent at rest**, requiring mild circumoral muscle strain to achieve seal. Facial midline corresponds to skeletal midline; no structural asymmetry observed.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            5. DENTAL ANALYSIS SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('dental')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>5. Dental Analysis</Text>
            {expandedSections.dental ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.dental && (
            <View style={tw`p-5 space-y-3.5`}>
              <View style={tw`p-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.05)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-teal-400 uppercase tracking-wider`}>Arch crowding & Spacing</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                  Maxillary arch shows **4mm of crowding** clustered primarily in the anterior canine region. Mandibular arch shows **3mm of crowding** with moderate incisor rotation.
                </Text>
              </View>
              <View style={tw`p-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.05)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-teal-400 uppercase tracking-wider`}>Midlines & Arch Form</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                  Dental midline deviates 1mm to the right in the maxillary arch. Curve of Spee is moderately increased in the lower arch (1.5mm). Maxillary arch is symmetric.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            6. COMPENSATION ANALYSIS SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('compensation')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>6. Compensation Analysis</Text>
            {expandedSections.compensation ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.compensation && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                Natural Dentoalveolar Compensation is the physiological tipping of teeth to maintain occlusion. Here is the OCI mapping:
              </Text>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Maxillary Incisor Tipping (U1-SN)</Text>
                <Text style={tw`text-xs font-bold text-white`}>{cephalometricInput.u1Sn || '107.5'}° (Norm: 104°)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Mandibular Incisor Tipping (IMPA)</Text>
                <Text style={tw`text-xs font-bold text-white`}>{cephalometricInput.impa || '97.2'}° (Norm: 90°)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Compensation Level</Text>
                <Text style={tw`text-xs font-bold text-amber-400`}>{ociResult.compensationLevel || 'Moderate Active'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            7. OCI SCORE & GRAPHICAL WIDGETS
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('score')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>7. OCI Score & Graphs</Text>
            {expandedSections.score ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.score && (
            <View style={tw`p-5 space-y-6 items-center`}>
              
              {/* Circular OCI Score Ring */}
              <View style={tw`relative w-40 h-40 items-center justify-center`}>
                <Svg width="160" height="160" viewBox="0 0 100 100">
                  <Circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#161A20"
                    strokeWidth="8"
                    fill="none"
                  />
                  <Circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={scoreColor}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${ociResult.totalScore * 2.51} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </Svg>
                <View style={tw`absolute inset-0 items-center justify-center`}>
                  <Text style={[tw`text-3xl font-black font-mono`, { color: scoreColor }]}>
                    {ociResult.totalScore}
                  </Text>
                  <Text style={tw`text-[9px] text-[#D9E2F2]/60 font-black uppercase mt-0.5`}>Severity Index</Text>
                </View>
              </View>

              {/* Pie Chart: Contribution distribution (Skeletal vs Dental vs Soft Tissue) */}
              <View style={tw`w-full space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider mb-2`}>Discrepancy Source Distribution</Text>
                <View style={tw`flex-row justify-around items-center`}>
                  <Svg width="90" height="90" viewBox="0 0 42 42">
                    {/* Sector 1: Skeletal (40% - 0 to 144 deg) */}
                    <Circle cx="21" cy="21" r="15.915" fill="none" stroke="#FF4D4D" strokeWidth="6" strokeDasharray="40 60" strokeDashoffset="25" />
                    {/* Sector 2: Dental (40% - 144 to 288 deg) */}
                    <Circle cx="21" cy="21" r="15.915" fill="none" stroke="#00E5FF" strokeWidth="6" strokeDasharray="40 60" strokeDashoffset="85" />
                    {/* Sector 3: Soft Tissue (20% - 288 to 360 deg) */}
                    <Circle cx="21" cy="21" r="15.915" fill="none" stroke="#FFB300" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="45" />
                  </Svg>
                  <View style={tw`space-y-1.5`}>
                    <View style={tw`flex-row items-center space-x-2`}>
                      <View style={tw`w-2 h-2 rounded-full bg-[#FF4D4D]`} />
                      <Text style={tw`text-[10px] text-white font-bold`}>Skeletal Discrepancy (40%)</Text>
                    </View>
                    <View style={tw`flex-row items-center space-x-2`}>
                      <View style={tw`w-2 h-2 rounded-full bg-[#00E5FF]`} />
                      <Text style={tw`text-[10px] text-white font-bold`}>Dental Camouflage (40%)</Text>
                    </View>
                    <View style={tw`flex-row items-center space-x-2`}>
                      <View style={tw`w-2 h-2 rounded-full bg-[#FFB300]`} />
                      <Text style={tw`text-[10px] text-white font-bold`}>Soft Tissue Tension (20%)</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Radar Spider Chart: Key Ceph Ratios */}
              <View style={tw`w-full border-t border-[rgba(255,255,255,0.05)] pt-4 space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider mb-1`}>Multi-Axial Ceph Spider Web</Text>
                <Text style={tw`text-[9px] text-[#A8B3C7] leading-normal mb-3`}>
                  The OCI Score Ring measures overall complexity as a percentage, while the spider web plots patient parameters (SNA, SNB, ANB, FMA, IMPA) against normal guidelines.
                </Text>
                <View style={tw`flex-row justify-around items-center`}>
                  <Svg width="160" height="160" viewBox="0 0 160 160">
                    {/* Concentric helper grids */}
                    <Circle cx="80" cy="80" r="15" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    <Circle cx="80" cy="80" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <Circle cx="80" cy="80" r="45" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <Circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                    {/* Radial lines */}
                    <Line x1="80" y1="80" x2={norm1.x} y2={norm1.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <Line x1="80" y1="80" x2={norm2.x} y2={norm2.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <Line x1="80" y1="80" x2={norm3.x} y2={norm3.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <Line x1="80" y1="80" x2={norm4.x} y2={norm4.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <Line x1="80" y1="80" x2={norm5.x} y2={norm5.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                    {/* Normal limits polygon */}
                    <Polygon points={normPoints} fill="rgba(16, 183, 168, 0.08)" stroke="rgba(16, 183, 168, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Patient polygon */}
                    <Polygon points={patientPoints} fill="rgba(239, 68, 68, 0.2)" stroke="#FF4D4D" strokeWidth="2" />

                    {/* Labels */}
                    <SvgText x="80" y="12" fill="#D9E2F2" fontSize="8" fontWeight="bold" textAnchor="middle">SNA</SvgText>
                    <SvgText x="145" y="62" fill="#D9E2F2" fontSize="8" fontWeight="bold" textAnchor="start">SNB</SvgText>
                    <SvgText x="125" y="132" fill="#D9E2F2" fontSize="8" fontWeight="bold" textAnchor="start">ANB</SvgText>
                    <SvgText x="35" y="132" fill="#D9E2F2" fontSize="8" fontWeight="bold" textAnchor="end">FMA</SvgText>
                    <SvgText x="15" y="62" fill="#D9E2F2" fontSize="8" fontWeight="bold" textAnchor="end">IMPA</SvgText>
                  </Svg>
                  <View style={tw`space-y-1.5`}>
                    <View style={tw`flex-row items-center space-x-2`}>
                      <View style={tw`w-2 h-2 rounded-full bg-[#FF4D4D]`} />
                      <Text style={tw`text-[10px] text-white font-bold`}>Patient Tracing</Text>
                    </View>
                    <View style={tw`flex-row items-center space-x-2`}>
                      <View style={tw`w-2.5 h-1 border-t border-dashed border-[#00E5FF]`} />
                      <Text style={tw`text-[10px] text-white font-bold`}>Normative Target</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Horizontal Severity Bars */}
              <View style={tw`w-full border-t border-[rgba(255,255,255,0.05)] pt-4 space-y-3`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider`}>Module Severity Indexes</Text>
                {[
                  { label: 'Skeletal Mismatch', val: 58, col: '#FFB300' },
                  { label: 'Dentoalveolar Tipping', val: 78, col: '#FF4D4D' },
                  { label: 'Lip Incompetence', val: 32, col: '#00E5FF' },
                  { label: 'Arch Crowding', val: 45, col: '#FFB300' }
                ].map((item, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between`}>
                      <Text style={tw`text-[9px] font-bold text-[#D9E2F2]`}>{item.label}</Text>
                      <Text style={tw`text-[9px] font-black text-white font-mono`}>{item.val}%</Text>
                    </View>
                    <View style={tw`w-full h-2 bg-[#161A20] rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${item.val}%`, backgroundColor: item.col }]} />
                    </View>
                  </View>
                ))}
              </View>

            </View>
          )}
        </View>

        {/* ==========================================
            8. AI ASSISTED DIAGNOSIS
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('diagnosis')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>8. AI Diagnosis Rationale</Text>
            {expandedSections.diagnosis ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.diagnosis && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Primary Diagnosis</Text>
                <Text style={tw`text-xs font-black text-white`}>Skeletal Class II relationship</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Secondary Diagnosis</Text>
                <Text style={tw`text-xs font-bold text-white`}>Class II Division 1 Malocclusion</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Skeletal Pattern</Text>
                <Text style={tw`text-xs font-bold text-white`}>Mandibular Retrusion</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Vertical growth direction</Text>
                <Text style={tw`text-xs font-bold text-white`}>{ociResult.verticalPattern || 'Normodivergent'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Incisor compensation</Text>
                <Text style={tw`text-xs font-bold text-white`}>Mandibular Proclination (IMPA 97.2°)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Diagnostic Severity</Text>
                <Text style={[tw`text-xs font-black`, { color: scoreColor }]}>{complexity}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            9. EVIDENCE-BASED TREATMENT PLAN
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('treatment')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>9. Evidence-Based Treatment Plan</Text>
            {expandedSections.treatment ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.treatment && (
            <View style={tw`p-5 space-y-6`}>
              
              {/* Interactive Modifiers */}
              <View style={tw`p-4 bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.05)] space-y-4`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider`}>Interactive Plan Modifiers</Text>
                
                {/* Age Group */}
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] text-[#D9E2F2]/60 font-bold uppercase`}>Age Category</Text>
                  <View style={tw`flex-row bg-[#0A0C10] p-1 rounded-xl`}>
                    {['growing', 'adult'].map(g => (
                      <Pressable key={g} onPress={() => setAgeGroup(g as any)} style={tw`flex-1 py-1.5 rounded-lg items-center ${ageGroup === g ? 'bg-[#00E5FF]' : 'bg-transparent'}`}>
                        <Text style={tw`text-[10px] font-bold text-white capitalize`}>{g}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Crowding */}
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] text-[#D9E2F2]/60 font-bold uppercase`}>Crowding Severity</Text>
                  <View style={tw`flex-row bg-[#0A0C10] p-1 rounded-xl`}>
                    {['none', 'mild', 'moderate', 'severe'].map(s => (
                      <Pressable key={s} onPress={() => setCrowdingSeverity(s as any)} style={tw`flex-1 py-1.5 rounded-lg items-center ${crowdingSeverity === s ? 'bg-[#00E5FF]' : 'bg-transparent'}`}>
                        <Text style={tw`text-[9px] font-bold text-white capitalize`}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Dynamic OrthoKnowledgeBase Suggested Mechanics */}
              <View style={tw`space-y-3.5`}>
                <View style={tw`flex-row items-center space-x-1.5`}>
                  <Sparkles size={14} color="#00E5FF" />
                  <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider`}>Expert System CDSS Mechanics</Text>
                </View>

                <View style={tw`space-y-3`}>
                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-white uppercase`}>Primary Strategy</Text>
                    <Text style={tw`text-xs text-[#D9E2F2] leading-normal pl-2`}>
                      {generatedPlan.treatmentComplexity === 'Severe / Surgical' ? 'Orthognathic Surgical Correction & Decompensation' : 'Orthodontic Camouflage Camouflage Alignment'}
                    </Text>
                  </View>

                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-white uppercase`}>Extraction / Non-Extraction Rationale</Text>
                    <Text style={tw`text-xs text-[#D9E2F2] leading-normal pl-2`}>{generatedPlan.orthodonticCamouflage.extractionConsideration}</Text>
                  </View>

                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-white uppercase`}>Appliance Recommendation</Text>
                    <Text style={tw`text-xs text-[#D9E2F2] leading-normal pl-2`}>
                      Pre-adjusted brackets (0.022" MBT slot) + absolute anchorage TADS (Miniscrews).
                    </Text>
                  </View>

                  <View style={tw`space-y-1`}>
                    <Text style={tw`text-[9px] font-black text-white uppercase`}>Estimated Treatment Duration</Text>
                    <Text style={tw`text-xs text-[#D9E2F2] leading-normal pl-2`}>
                      {ageGroup === 'growing' ? '14 - 18 Months (Growth guided)' : '18 - 24 Months active appliance phase.'}
                    </Text>
                  </View>
                </View>

                {/* Timeline visualizer */}
                <View style={tw`pt-4 border-t border-[rgba(255,255,255,0.05)]`}>
                  <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider mb-3`}>Mechanics Timeline Stages</Text>
                  <View style={tw`flex-row justify-between items-center px-2`}>
                    {[
                      { step: '01', title: 'Aligning' },
                      { step: '02', title: 'Sagittal' },
                      { step: '03', title: 'Finishing' },
                      { step: '04', title: 'Retainers' }
                    ].map((t, idx) => (
                      <React.Fragment key={idx}>
                        <View style={tw`items-center`}>
                          <View style={tw`w-6 h-6 rounded-full bg-[#00E5FF] items-center justify-center`}>
                            <Text style={tw`text-white text-[9px] font-black`}>{t.step}</Text>
                          </View>
                          <Text style={tw`text-[8px] text-[#D9E2F2] font-bold mt-1`}>{t.title}</Text>
                        </View>
                        {idx < 3 && <View style={tw`flex-1 h-0.5 bg-[#161A20]`} />}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              </View>

            </View>
          )}
        </View>

        {/* ==========================================
            10. RETENTION PROTOCOL SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('retention')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>10. Retention Protocol</Text>
            {expandedSections.retention ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.retention && (
            <View style={tw`p-5 space-y-3`}>
              <View style={tw`p-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider`}>Dual Retention Strategy</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal mt-1`}>
                  Maxillary Vacuum-Formed Retainer (ESSIX) for full-time wear (22h/day) for 6 months, followed by nighttime-only wear.
                </Text>
              </View>
              <View style={tw`p-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider`}>Fixed Lingual Retention</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal mt-1`}>
                  Mandibular fixed bonded 3-3 lingual wire (0.016-inch multi-strand stainless steel) to prevent rotational relapse.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            11. RISK ANALYSIS SECTION & SPEEDO METER
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('risk')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>11. Risk Analysis & Meter</Text>
            {expandedSections.risk ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.risk && (
            <View style={tw`p-5 space-y-5 items-center`}>
              
              {/* SVG Speedo Gauge */}
              <View style={tw`relative w-40 h-24 items-center justify-end`}>
                <Svg width="150" height="90" viewBox="0 0 100 60">
                  {/* Gauge Arc */}
                  <Path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#161A20"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <Path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeDasharray={`${ociResult.totalScore * 1.25} 125`}
                    strokeLinecap="round"
                  />
                  {/* Gauge Needle */}
                  {/* Angle: 0% is at 180deg, 100% is at 0deg. Angle = 180 - ociResult.totalScore * 1.8 */}
                  {(() => {
                    const angleDeg = 180 - (ociResult.totalScore * 1.8);
                    const angleRad = angleDeg * (Math.PI / 180);
                    const x = 50 + 35 * Math.cos(angleRad);
                    const y = 50 - 35 * Math.sin(angleRad);
                    return (
                      <React.Fragment>
                        <Circle cx="50" cy="50" r="4" fill="#FFF" />
                        <Line x1="50" y1="50" x2={x} y2={y} stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
                      </React.Fragment>
                    );
                  })()}
                </Svg>
                <View style={tw`absolute bottom-0 items-center`}>
                  <Text style={tw`text-[10px] font-black text-white uppercase`}>{complexity}</Text>
                  <Text style={tw`text-[8px] text-[#D9E2F2]/60 uppercase mt-0.5`}>Relapse Risk Level</Text>
                </View>
              </View>

              {/* Pointwise Risks */}
              <View style={tw`w-full space-y-2.5`}>
                <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                  <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60`}>Root Resorption Risk</Text>
                  <Text style={tw`text-xs font-bold text-teal-400`}>Low (Favorable growth direction)</Text>
                </View>
                <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                  <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60`}>Periodontal Bone Plate Thinning</Text>
                  <Text style={tw`text-xs font-bold text-amber-400`}>Moderate (IMPA already proclined)</Text>
                </View>
                <View style={tw`flex-row justify-between py-1`}>
                  <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60`}>Skeletal Relapse Tendency</Text>
                  <Text style={tw`text-xs font-bold text-teal-400`}>Low (Adult stable articulation)</Text>
                </View>
              </View>

            </View>
          )}
        </View>

        {/* ==========================================
            12. CLINICAL NOTES SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('clinicalNotes')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>12. Clinical Notes</Text>
            {expandedSections.clinicalNotes ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.clinicalNotes && (
            <View style={tw`p-5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                {patientDetails.clinicalNotes || 'No additional clinical findings or background diagnostic notes added by the doctor.'}
              </Text>
            </View>
          )}
        </View>

        {/* ==========================================
            13. DOCTOR NOTES & SIGN-OFF SECTION
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('doctorNotes')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>13. Clinician Sign-Off</Text>
            {expandedSections.doctorNotes ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.doctorNotes && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Supervisor Signature / Custom Notes</Text>
              <TextInput
                value={doctorOverrideText}
                onChangeText={setDoctorOverrideText}
                placeholder="Dr. Salman MDS Orthodontist"
                placeholderTextColor="#A8B3C7"
                style={tw`w-full h-12 px-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.08)] text-white text-xs font-bold`}
              />
              <Pressable
                onPress={() => onSaveAssessment(doctorOverrideText || 'Completed')}
                style={tw`w-full bg-[#00E5FF] py-3.5 rounded-xl items-center justify-center`}
              >
                <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Save Complete Assessment</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Back navigation action */}
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            tw`bg-[#161A20] border border-[rgba(255,255,255,0.08)] py-4 rounded-2xl items-center justify-center shadow-sm`,
            pressed ? tw`opacity-80` : null
          ]}
        >
          <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>
            Finish OCI Analysis
          </Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}
