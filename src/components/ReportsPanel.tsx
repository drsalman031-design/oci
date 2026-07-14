import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Heart, 
  Calendar 
} from 'lucide-react-native';
import tw from 'twrnc';
import Svg, { Circle, Path, Polygon, Line, Text as SvgText } from 'react-native-svg';
import { Assessment } from '../types';
import { generateTreatmentPlan } from '../treatmentPlanner';

interface ReportsPanelProps {
  savedAssessments: Assessment[];
  onOpenPdf: (assessment: Assessment) => void;
}

export default function ReportsPanel({ savedAssessments, onOpenPdf }: ReportsPanelProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
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

  // Interactive option states
  const [ageGroup, setAgeGroup] = useState<'growing' | 'adult'>('adult');
  const [crowdingSeverity, setCrowdingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [spacingSeverity, setSpacingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [archDiscrepancy, setArchDiscrepancy] = useState<number>(0);
  const [doctorOverrideText, setDoctorOverrideText] = useState('');

  useEffect(() => {
    if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [savedAssessments, selectedId]);

  if (savedAssessments.length === 0) {
    return (
      <ScrollView contentContainerStyle={tw`pb-28 px-6 bg-[#0A0C10]`} style={tw`flex-1`}>
        <View style={tw`bg-[#161A20] p-8 rounded-[32px] border border-[rgba(255,255,255,0.08)] shadow-2xl mt-8 items-center space-y-4`}>
          <View style={tw`w-14 h-14 bg-teal-500/10 rounded-full items-center justify-center border border-teal-500/20`}>
            <FileText size={28} color="#00E5FF" />
          </View>
          <Text style={tw`text-lg font-black text-white`}>Reports Archive</Text>
          <Text style={tw`text-[#D9E2F2] text-xs text-center leading-normal max-w-xs`}>
            Clinical history database is currently empty. Run an OCI analysis first to store patient parameters before accessing professional clinical reports.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const selectedAssessment = savedAssessments.find(a => a.id === selectedId) || savedAssessments[0];
  const { patientDetails } = selectedAssessment;

  const activeMode = patientDetails.analysisMode || 'turbo';
  const workspace = activeMode === 'clinic' 
    ? selectedAssessment.clinicWorkspace 
    : activeMode === 'ceph' 
      ? selectedAssessment.cephWorkspace 
      : selectedAssessment.turboWorkspace;

  const ociResult: any = workspace?.ociResult || {
    totalScore: 0,
    interpretation: 'Normal',
    recommendation: '',
    categoryScores: [],
    verticalPattern: 'Normodivergent',
    compensationLevel: 'Normal',
    severityMap: {
      upperIncisors: 'green',
      lowerIncisors: 'green',
      softTissue: 'green',
      occlusion: 'green',
      transverse: 'green'
    }
  };

  const cephalometricInput = (workspace as any)?.cephalometricInput || {
    anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
    u1Sn: '', u1NaDeg: '', u1NaMm: '', impa: '', l1NbDeg: '', l1NbMm: '',
    interincisalAngle: '', overjet: '', overbite: '', upperLipELine: '', lowerLipELine: '',
    nasolabialAngle: '', facialConvexity: '', molarRelation: '', canineRelation: '',
    crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
    posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score <= 20) return '#00FF88'; 
    if (score <= 40) return '#00E5FF'; 
    if (score <= 60) return '#FFB300'; 
    return '#FF4D4D'; 
  };

  const getComplexityLabel = (score: number) => {
    if (score <= 20) return 'Simple (Camouflage)';
    if (score <= 40) return 'Moderate (Borderline)';
    if (score <= 60) return 'Complex (Skeletal Camouflage)';
    return 'Severe / Surgical (Decompensation)';
  };

  const scoreColor = getScoreColor(ociResult.totalScore);
  const complexity = getComplexityLabel(ociResult.totalScore);

  const generatedPlan = generateTreatmentPlan(
    patientDetails,
    cephalometricInput,
    ociResult,
    { ageGroup, crowdingSeverity, spacingSeverity, archDiscrepancy }
  );

  // Validation
  const missingParameters: string[] = [];
  const requiredCephs = ['anb', 'sna', 'snb', 'impa', 'u1Sn'];
  requiredCephs.forEach(key => {
    const val = (cephalometricInput as any)[key];
    if (val === undefined || val === '' || val === null) {
      missingParameters.push(key.toUpperCase());
    }
  });

  const isLowConfidence = missingParameters.length > 0 || ociResult.totalScore === 0;

  // Radar points
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

  const clinicalSummaryText = `### OCI Autonomous Orthodontic Report
- **Patient**: ${patientDetails.name} (${patientDetails.age} y/o ${patientDetails.gender})
- **OCI Severity Index**: ${ociResult.totalScore}% (${complexity})
- **Skeletal Pattern**: Class ${patientDetails.diagnosis || 'II'}
- **Custom Doctor Signature**: ${doctorOverrideText || 'Dr. Salman MDS Orthodontist'}`;

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-32 px-6 w-full bg-[#0A0C10]`} 
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`space-y-6 mt-6 max-w-2xl mx-auto w-full`}>
        
        {/* Dropdown Selector */}
        <View style={tw`bg-[#161A20] p-4 rounded-[24px] border border-[rgba(255,255,255,0.08)]`}>
          <Pressable 
            onPress={() => setShowDropdown(!showDropdown)}
            style={tw`flex-row justify-between items-center bg-[#161A20] px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)]`}
          >
            <View style={tw`flex-row items-center space-x-2.5`}>
              <User size={15} color="#00E5FF" />
              <Text style={tw`text-xs font-black text-white`}>
                {patientDetails.name} ({patientDetails.caseNumber || 'No ID'})
              </Text>
            </View>
            <ChevronDown size={16} color="#00E5FF" />
          </Pressable>

          {showDropdown && (
            <View style={tw`mt-2 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden`}>
              {savedAssessments.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedId(item.id);
                    setShowDropdown(false);
                  }}
                  style={tw`px-4 py-3 border-b border-[rgba(255,255,255,0.04)]`}
                >
                  <Text style={tw`text-xs font-bold text-white`}>{item.patientDetails.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Validation Box */}
        {isLowConfidence && (
          <View style={tw`bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex-row items-start space-x-3`}>
            <AlertTriangle size={18} color="#FFB300" />
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs font-black text-amber-300 uppercase`}>Clinician Validation Required</Text>
              <Text style={tw`text-[10px] text-[#D9E2F2] mt-1 leading-normal`}>
                Missing ceph values: <Text style={tw`font-extrabold text-white`}>{missingParameters.join(', ')}</Text>. Check clinical records.
              </Text>
            </View>
          </View>
        )}

        {/* Accordions */}
        {/* 1. Patient Summary */}
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
            </View>
          )}
        </View>

        {/* 2. Chief Complaint */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('complaint')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>2. Chief Complaint</Text>
            {expandedSections.complaint ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.complaint && (
            <View style={tw`p-5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed italic`}>
                "{patientDetails.chiefComplaint || 'No specific chief complaint recorded.'}"
              </Text>
            </View>
          )}
        </View>

        {/* 3. Clinical Findings */}
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
            </View>
          )}
        </View>

        {/* 4. Facial Analysis */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('facial')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>4. Facial Analysis</Text>
            {expandedSections.facial ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.facial && (
            <View style={tw`p-5 space-y-3.5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                Profile is **convex** with retrognathic mandible. Lips are incompetent at rest.
              </Text>
            </View>
          )}
        </View>

        {/* 5. Dental Analysis */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('dental')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>5. Dental Analysis</Text>
            {expandedSections.dental ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.dental && (
            <View style={tw`p-5 space-y-3.5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                Arch crowding of **4mm upper** and **3mm lower** arches. Midline is aligned.
              </Text>
            </View>
          )}
        </View>

        {/* 6. Compensation Analysis */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('compensation')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>6. Compensation Analysis</Text>
            {expandedSections.compensation ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.compensation && (
            <View style={tw`p-5 space-y-3`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60`}>Maxillary Incisor Tipping (U1-SN)</Text>
                <Text style={tw`text-xs font-bold text-white`}>{cephalometricInput.u1Sn || '107.5'}°</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60`}>Mandibular Incisor Tipping (IMPA)</Text>
                <Text style={tw`text-xs font-bold text-white`}>{cephalometricInput.impa || '97.2'}°</Text>
              </View>
            </View>
          )}
        </View>

        {/* 7. OCI Score Graphs */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('score')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>7. OCI Score & Graphs</Text>
            {expandedSections.score ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.score && (
            <View style={tw`p-5 space-y-6 items-center`}>
              
              {/* OCI Score Ring */}
              <View style={tw`relative w-36 h-36 items-center justify-center`}>
                <Svg width="140" height="140" viewBox="0 0 100 100">
                  <Circle cx="50" cy="50" r="40" stroke="#161A20" strokeWidth="8" fill="none" />
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
                  <Text style={[tw`text-2xl font-black font-mono`, { color: scoreColor }]}>{ociResult.totalScore}</Text>
                  <Text style={tw`text-[9px] text-[#D9E2F2]/60 uppercase mt-0.5`}>OCI Score</Text>
                </View>
              </View>

              {/* Spider Web */}
              <View style={tw`w-full border-t border-[rgba(255,255,255,0.05)] pt-4`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase mb-1`}>Multi-Axial Ceph Spider Web</Text>
                <Text style={tw`text-[9px] text-[#A8B3C7] leading-normal mb-3`}>
                  The OCI Score Ring measures overall complexity as a percentage, while the spider web plots patient parameters (SNA, SNB, ANB, FMA, IMPA) against normal guidelines.
                </Text>
                <View style={tw`flex-row justify-around items-center`}>
                  <Svg width="120" height="120" viewBox="0 0 160 160">
                    <Circle cx="80" cy="80" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <Circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <Polygon points={normPoints} fill="rgba(16, 183, 168, 0.08)" stroke="rgba(16, 183, 168, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <Polygon points={patientPoints} fill="rgba(239, 68, 68, 0.2)" stroke="#FF4D4D" strokeWidth="2" />
                  </Svg>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 8. AI Diagnosis */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('diagnosis')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>8. AI Diagnosis Rationale</Text>
            {expandedSections.diagnosis ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.diagnosis && (
            <View style={tw`p-5 space-y-3`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60`}>Skeletal Pattern</Text>
                <Text style={tw`text-xs font-bold text-white`}>Skeletal Class {patientDetails.diagnosis || 'II'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60`}>Diagnostic Severity</Text>
                <Text style={[tw`text-xs font-black`, { color: scoreColor }]}>{complexity}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 9. Evidence-Based Treatment Plan */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('treatment')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>9. Evidence-Based Treatment Plan</Text>
            {expandedSections.treatment ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.treatment && (
            <View style={tw`p-5 space-y-6`}>
              <View style={tw`p-4 bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.05)] space-y-3`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase`}>Plan Modifiers</Text>
                <View style={tw`flex-row bg-[#0A0C10] p-1 rounded-xl`}>
                  {['growing', 'adult'].map(g => (
                    <Pressable key={g} onPress={() => setAgeGroup(g as any)} style={tw`flex-1 py-1 rounded-lg items-center ${ageGroup === g ? 'bg-[#00E5FF]' : 'bg-transparent'}`}>
                      <Text style={tw`text-[10px] font-bold text-white capitalize`}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={tw`space-y-3`}>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal pl-2`}>{generatedPlan.orthodonticCamouflage.extractionConsideration}</Text>
              </View>
            </View>
          )}
        </View>

        {/* 10. Retention Protocol */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('retention')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>10. Retention Protocol</Text>
            {expandedSections.retention ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.retention && (
            <View style={tw`p-5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>
                Vacuum formed maxillary Essix retainer + mandibular fixed lingual wire.
              </Text>
            </View>
          )}
        </View>

        {/* 11. Risk Analysis */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('risk')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>11. Risk Analysis & Meter</Text>
            {expandedSections.risk ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.risk && (
            <View style={tw`p-5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>
                Risk Level: **{complexity}**. Relapse risk is moderate post-treatment.
              </Text>
            </View>
          )}
        </View>

        {/* 12. Clinical Notes */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('clinicalNotes')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>12. Clinical Notes</Text>
            {expandedSections.clinicalNotes ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.clinicalNotes && (
            <View style={tw`p-5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                {patientDetails.clinicalNotes || 'No notes added.'}
              </Text>
            </View>
          )}
        </View>

        {/* 13. Clinician Sign-Off */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('doctorNotes')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>13. Clinician Sign-Off</Text>
            {expandedSections.doctorNotes ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.doctorNotes && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Doctor Notes</Text>
              <TextInput
                value={doctorOverrideText}
                onChangeText={setDoctorOverrideText}
                placeholder="Dr. Salman MDS Orthodontist"
                placeholderTextColor="#A8B3C7"
                style={tw`w-full h-12 px-4 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.08)] text-white text-xs font-bold`}
              />
              <Pressable
                onPress={() => onOpenPdf(selectedAssessment)}
                style={tw`w-full bg-[#00E5FF] py-3.5 rounded-xl items-center justify-center`}
              >
                <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Export PDF Report</Text>
              </Pressable>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
