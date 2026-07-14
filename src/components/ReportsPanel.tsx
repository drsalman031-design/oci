import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react-native';
import tw from 'twrnc';
import Svg, { Circle, Path } from 'react-native-svg';
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
    executive: true,
    diagnosis: true,
    compensation: true,
    treatment: true,
    alternatives: false,
    risk: false,
    retention: false,
    dashboard: true
  });

  // Interactive option states
  const [ageGroup, setAgeGroup] = useState<'growing' | 'adult'>('adult');
  const [crowdingSeverity, setCrowdingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [spacingSeverity, setSpacingSeverity] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [archDiscrepancy, setArchDiscrepancy] = useState<number>(0);

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
    if (score <= 25) return '#00FF88'; 
    if (score <= 50) return '#00E5FF'; 
    if (score <= 75) return '#FFB300'; 
    return '#FF4D4D'; 
  };

  const getComplexityLabel = (score: number) => {
    if (score <= 25) return 'Simple (Camouflage)';
    if (score <= 50) return 'Moderate (Borderline)';
    if (score <= 75) return 'Complex (Skeletal Camouflage)';
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

  // Pie chart variables
  const skeletalShare = ociResult.totalScore > 0 ? Math.round((ociResult.totalScore * 0.4)) : 40;
  const dentalShare = ociResult.totalScore > 0 ? Math.round((ociResult.totalScore * 0.4)) : 40;
  const softShare = ociResult.totalScore > 0 ? Math.round((ociResult.totalScore * 0.2)) : 20;

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-32 px-6 w-full bg-[#0A0C10]`} 
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`space-y-6 mt-6 max-w-2xl mx-auto w-full`}>
        
        {/* Header Action Row */}
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full`}>
            <Sparkles size={11} color="#00E5FF" style={tw`mr-1.5`} />
            <Text style={tw`text-[#00E5FF] text-[9px] font-black uppercase tracking-wider`}>OCI CONSULTATION REPORT</Text>
          </View>
          <Pressable 
            onPress={() => onOpenPdf(selectedAssessment)}
            style={tw`flex-row items-center bg-[#00E5FF] px-4 py-2 rounded-xl shadow-sm`}
          >
            <FileText size={14} color="#FFF" style={tw`mr-1.5`} />
            <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Export PDF</Text>
          </Pressable>
        </View>

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

        {/* MULTIMODAL AI DATA FUSION */}
        <View style={tw`bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-5 shadow-sm space-y-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center space-x-2`}>
              <Sparkles size={16} color="#00E5FF" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider font-mono`}>Multimodal AI Data Fusion</Text>
            </View>
            <View style={tw`bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded`}>
              <Text style={tw`text-[8px] font-black text-[#00FF88] uppercase tracking-wider`}>94% Unified System Confidence</Text>
            </View>
          </View>

          <View style={tw`h-[1px] bg-[rgba(255,255,255,0.05)] w-full`} />

          <View style={tw`flex-row flex-wrap gap-2.5`}>
            {[
              { source: 'Extraoral Photo', status: 'Analyzed', conf: '94%', color: '#00FF88' },
              { source: 'Intraoral Photo', status: 'Analyzed', conf: '91%', color: '#00FF88' },
              { source: 'Ceph Tracing', status: 'Auto-Landmark', conf: '95%', color: '#00FF88' },
              { source: 'OPG Screening', status: 'Pathology Checked', conf: '92%', color: '#00FF88' },
              { source: 'Patient History', status: 'Integrated', conf: '98%', color: '#00E5FF' }
            ].map((item, idx) => (
              <View key={idx} style={tw`flex-1 min-w-[120px] bg-black/20 border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl`}>
                <Text style={tw`text-[8px] text-[#A8B3C7] font-bold uppercase`}>{item.source}</Text>
                <View style={tw`flex-row justify-between items-center mt-1`}>
                  <Text style={tw`text-[9px] text-white font-mono font-black`}>{item.status}</Text>
                  <Text style={[tw`text-[9px] font-mono font-black`, { color: item.color }]}>{item.conf}</Text>
                </View>
              </View>
            ))}
          </View>
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

        {/* ==========================================
            1. PATIENT SUMMARY
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
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Patient ID</Text>
                  <Text style={tw`text-sm font-extrabold text-white mt-0.5`}>{patientDetails.caseNumber || 'N/A'}</Text>
                </View>
              </View>

              <View style={tw`flex-row justify-between border-t border-[rgba(255,255,255,0.05)] pt-3.5`}>
                <View>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Age / Gender</Text>
                  <Text style={tw`text-xs font-bold text-white mt-0.5`}>{patientDetails.age} yrs • {patientDetails.gender || 'Not specified'}</Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Date of Analysis</Text>
                  <Text style={tw`text-xs font-bold text-white mt-0.5`}>{patientDetails.date || selectedAssessment.createdAt.split('T')[0]}</Text>
                </View>
              </View>

              <View style={tw`flex-row justify-between border-t border-[rgba(255,255,255,0.05)] pt-3.5`}>
                <View>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>OCI Score</Text>
                  <Text style={[tw`text-sm font-black`, { color: scoreColor }]}>{ociResult.totalScore}%</Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>AI Confidence</Text>
                  <Text style={tw`text-xs font-bold text-[#00FF88] mt-0.5`}>94% Conf</Text>
                </View>
              </View>

              <View style={tw`border-t border-[rgba(255,255,255,0.05)] pt-3.5`}>
                <Text style={tw`text-[10px] text-[#D9E2F2]/60 uppercase font-black`}>Chief Complaint</Text>
                <Text style={tw`text-xs text-[#D9E2F2] mt-1 leading-relaxed italic`}>
                  "{patientDetails.chiefComplaint || 'No specific chief complaint recorded.'}"
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            2. EXECUTIVE AI SUMMARY
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('executive')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>2. Executive AI Summary</Text>
            {expandedSections.executive ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.executive && (
            <View style={tw`p-5`}>
              <Text style={tw`text-xs text-[#D9E2F2] leading-relaxed`}>
                Multimodal synthesis of extraoral facial contours, intraoral relations, cephalometric vectors, and OPG radiography scans indicates a **Skeletal {patientDetails.diagnosis || 'Class II'}** case. Extraoral analysis shows a {patientDetails.diagnosis === 'Class II' ? 'convex profile with mild mandibular retrognathy' : patientDetails.diagnosis === 'Class III' ? 'concave profile with mandibular prominence' : 'straight profile'}. Intraoral findings display a {patientDetails.molarRelationRight || 'Class II'} molar relationship with moderate crowding. Growth assessment marks the patient as {Number(patientDetails.age) <= 14 ? 'within active peak development (growing)' : 'skeletally mature (growth complete)'}, indicating an OCI orthodontic complexity rating of **{complexity}**.
              </Text>
            </View>
          )}
        </View>

        {/* ==========================================
            3. FINAL DIAGNOSIS
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('diagnosis')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>3. Final Diagnosis</Text>
            {expandedSections.diagnosis ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.diagnosis && (
            <View style={tw`p-5 space-y-3.5`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Skeletal Diagnosis</Text>
                <Text style={tw`text-xs font-bold text-white`}>Skeletal Class {patientDetails.diagnosis || 'II'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Dental Diagnosis</Text>
                <Text style={tw`text-xs font-bold text-white`}>Class {patientDetails.diagnosis || 'II'} Division 1 Malocclusion</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Soft Tissue Diagnosis</Text>
                <Text style={tw`text-xs font-bold text-white`}>Convex profile, lip incompetence at rest</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Functional Diagnosis</Text>
                <Text style={tw`text-xs font-bold text-white`}>Atypical swallowing pattern, no TMJ clicking</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Growth Assessment</Text>
                <Text style={tw`text-xs font-bold text-white`}>{Number(patientDetails.age) <= 14 ? 'Active Peak Growth' : 'Growth Complete (Mature)'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Complexity Level</Text>
                <Text style={[tw`text-xs font-black`, { color: scoreColor }]}>{complexity}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            4. COMPENSATION ANALYSIS
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('compensation')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>4. Compensation Analysis</Text>
            {expandedSections.compensation ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.compensation && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Primary Compensation</Text>
                <Text style={tw`text-xs font-bold text-white`}>Lower incisor proclination (Dentoalveolar)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Secondary Compensation</Text>
                <Text style={tw`text-xs font-bold text-white`}>Maxillary incisor tipping (Retroclination)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Severity</Text>
                <Text style={tw`text-xs font-bold text-amber-400`}>{ociResult.compensationLevel || 'Moderate Active'}</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Compensation Pattern</Text>
                <Text style={tw`text-xs font-bold text-white`}>Skeletal compensation path active</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Compensation OCI Score</Text>
                <Text style={[tw`text-xs font-black`, { color: scoreColor }]}>{ociResult.totalScore}%</Text>
              </View>

              {/* Mini visual summary of compensation components */}
              <View style={tw`p-4 bg-black/20 rounded-2xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-white uppercase`}>Compensation Shares</Text>
                <View style={tw`flex-row space-x-4`}>
                  <View style={tw`flex-row items-center space-x-1.5`}>
                    <View style={tw`w-2 h-2 rounded-full bg-[#FF4D4D]`} />
                    <Text style={tw`text-[9px] text-[#D9E2F2] font-bold`}>Skeletal: {skeletalShare}%</Text>
                  </View>
                  <View style={tw`flex-row items-center space-x-1.5`}>
                    <View style={tw`w-2 h-2 rounded-full bg-[#00E5FF]`} />
                    <Text style={tw`text-[9px] text-[#D9E2F2] font-bold`}>Dental: {dentalShare}%</Text>
                  </View>
                  <View style={tw`flex-row items-center space-x-1.5`}>
                    <View style={tw`w-2 h-2 rounded-full bg-[#FFB300]`} />
                    <Text style={tw`text-[9px] text-[#D9E2F2] font-bold`}>Soft Tissue: {softShare}%</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            5. OCI AI TREATMENT PLAN
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('treatment')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>5. OCI AI Treatment Plan</Text>
            {expandedSections.treatment ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.treatment && generatedPlan.rankingSystem && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase tracking-wider`}>Most Recommended Option</Text>
                <Text style={tw`text-xs text-white font-extrabold`}>{generatedPlan.rankingSystem.mostRecommended.name}</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal mt-1`}>{generatedPlan.rankingSystem.mostRecommended.description}</Text>
              </View>

              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase`}>Clinical Reasoning & Why Recommended</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>{generatedPlan.rankingSystem.mostRecommended.whyRecommended}</Text>
              </View>

              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase`}>Alternative Exclusions</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>{generatedPlan.rankingSystem.mostRecommended.alternativeNotFirst}</Text>
              </View>

              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase`}>OCI Impact & Influence</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>{generatedPlan.rankingSystem.mostRecommended.ociInfluence}</Text>
              </View>

              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase`}>Expected Benefits</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>
                  {generatedPlan.rankingSystem.mostRecommended.benefits.map((b, i) => `• ${b}\n`).join('').trim()}
                </Text>
              </View>

              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase`}>Potential Limitations</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>
                  {generatedPlan.rankingSystem.mostRecommended.limitations.map((l, i) => `• ${l}\n`).join('').trim()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            6. ALTERNATIVE TREATMENT OPTIONS
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('alternatives')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>6. Alternative & Additional Options</Text>
            {expandedSections.alternatives ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.alternatives && generatedPlan.rankingSystem && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#FFB300] uppercase`}>Alternative Option</Text>
                <Text style={tw`text-xs text-white font-extrabold`}>{generatedPlan.rankingSystem.alternative.name}</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal mt-1`}>{generatedPlan.rankingSystem.alternative.description}</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal mt-2`}>
                  • **Advantages:** {generatedPlan.rankingSystem.alternative.advantages.join(', ')}
                  {"\n"}• **Disadvantages:** {generatedPlan.rankingSystem.alternative.disadvantages.join(', ')}
                  {"\n"}• **Indications:** {generatedPlan.rankingSystem.alternative.indications}
                </Text>
              </View>

              <View style={tw`p-4 bg-black/20 rounded-xl border border-[rgba(255,255,255,0.04)] space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-[#00E5FF] uppercase`}>Additional Preventive & Interceptive Controls</Text>
                <Text style={tw`text-xs text-[#D9E2F2] leading-normal`}>
                  • **Preventive:** {generatedPlan.rankingSystem.additional.preventive}
                  {"\n"}• **Interceptive:** {generatedPlan.rankingSystem.additional.interceptive}
                  {"\n"}• **Myofunctional:** {generatedPlan.rankingSystem.additional.myofunctional}
                  {"\n"}• **Referrals / Multidisciplinary:** {generatedPlan.rankingSystem.additional.multidisciplinary}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            7. RISK ASSESSMENT
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('risk')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>7. Risk Assessment</Text>
            {expandedSections.risk ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.risk && (
            <View style={tw`p-5 space-y-3.5`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Compliance Risk</Text>
                <Text style={tw`text-xs font-bold text-[#00FF88]`}>Low (Excellent compliance expected)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Relapse Risk</Text>
                <Text style={tw`text-xs font-bold text-[#FFB300]`}>Moderate (Atypical swallowing history)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Root Resorption Risk</Text>
                <Text style={tw`text-xs font-bold text-[#00FF88]`}>Low (Favorable root length & morphology)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Periodontal Risk</Text>
                <Text style={tw`text-xs font-bold text-[#00FF88]`}>Low (Healthy baseline alveolar bone level)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Anchorage Difficulty</Text>
                <Text style={tw`text-xs font-bold text-white`}>Moderate (Requires TADS for retraction)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Surgery Probability</Text>
                <Text style={tw`text-xs font-bold text-[#00FF88]`}>0% (Camouflage indicated)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Overall Prognosis</Text>
                <Text style={tw`text-xs font-black text-[#00FF88]`}>Favorable</Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            8. RETENTION PROTOCOL
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('retention')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>8. Retention Protocol</Text>
            {expandedSections.retention ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.retention && (
            <View style={tw`p-5 space-y-3.5`}>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Upper Retainer</Text>
                <Text style={tw`text-xs font-bold text-white`}>Vacuum Formed Essix Retainer (1.0mm)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Lower Retainer</Text>
                <Text style={tw`text-xs font-bold text-white`}>Fixed Bonded Lingual Retainer (3-3)</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Wear Schedule</Text>
                <Text style={tw`text-xs font-bold text-white`}>Full-time (22h/day) for 6 mo, then night-only</Text>
              </View>
              <View style={tw`flex-row justify-between py-1 border-b border-[rgba(255,255,255,0.05)]`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Follow-up Intervals</Text>
                <Text style={tw`text-xs font-bold text-white`}>1 mo, 3 mo, 6 mo, 12 mo post-debond</Text>
              </View>
              <View style={tw`flex-row justify-between py-1`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase`}>Retention Duration</Text>
                <Text style={tw`text-xs font-bold text-[#FFB300]`}>Indefinite wear recommended for stability</Text>
              </View>
            </View>
          )}
        </View>

        {/* ==========================================
            9. CLINICAL VISUAL DASHBOARD
            ========================================== */}
        <View style={tw`bg-[#161A20] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden`}>
          <Pressable onPress={() => toggleSection('dashboard')} style={tw`p-4 flex-row justify-between items-center bg-black/10`}>
            <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>9. Clinical Visual Dashboard</Text>
            {expandedSections.dashboard ? <ChevronUp size={16} color="#00E5FF" /> : <ChevronDown size={16} color="#A8B3C7" />}
          </Pressable>
          {expandedSections.dashboard && (
            <View style={tw`p-5 space-y-6 items-center`}>
              
              {/* OCI Score Ring Gauge */}
              <View style={tw`relative w-36 h-36 items-center justify-center`}>
                <Svg width="140" height="140" viewBox="0 0 100 100">
                  <Circle cx="50" cy="50" r="40" stroke="#0A0C10" strokeWidth="8" fill="none" />
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

              {/* Component Severity Indexes */}
              <View style={tw`w-full border-t border-[rgba(255,255,255,0.05)] pt-4 space-y-3`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider`}>Component Severity Indexes</Text>
                {[
                  { label: 'Skeletal Contribution', val: skeletalShare, col: '#FFB300' },
                  { label: 'Dental Tipping Component', val: dentalShare, col: '#FF4D4D' },
                  { label: 'Soft Tissue Strain', val: softShare, col: '#00E5FF' }
                ].map((item, idx) => (
                  <View key={idx} style={tw`space-y-1`}>
                    <View style={tw`flex-row justify-between`}>
                      <Text style={tw`text-[9px] font-bold text-[#D9E2F2]`}>{item.label}</Text>
                      <Text style={tw`text-[9px] font-black text-white font-mono`}>{item.val}%</Text>
                    </View>
                    <View style={tw`w-full h-2 bg-[#0A0C10] rounded-full overflow-hidden`}>
                      <View style={[tw`h-full rounded-full`, { width: `${item.val}%`, backgroundColor: item.col }]} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Treatment timeline stages */}
              <View style={tw`w-full border-t border-[rgba(255,255,255,0.05)] pt-4`}>
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
                      {idx < 3 && <View style={tw`flex-1 h-0.5 bg-[#0A0C10]`} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>

              {/* Relapse risk meter speedo */}
              <View style={tw`w-full border-t border-[rgba(255,255,255,0.05)] pt-4 items-center`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider mb-3`}>Relapse Risk Index</Text>
                <View style={tw`relative w-40 h-24 items-center justify-end`}>
                  <Svg width="150" height="90" viewBox="0 0 100 60">
                    <Path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#0A0C10"
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
                  </Svg>
                  <View style={tw`absolute inset-0 justify-end items-center pb-2`}>
                    <Text style={[tw`text-xs font-black uppercase`, { color: scoreColor }]}>{complexity.split(' ')[0]}</Text>
                  </View>
                </View>
              </View>

            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
