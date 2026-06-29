import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { 
  Award, 
  Sparkles, 
  CheckCircle,
  FileText,
  BookmarkPlus,
  Cpu,
  Edit2,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react-native';
import MarkdownRenderer from './MarkdownRenderer';
import { generateClinicalSummary } from '../lib/gemini';
import tw from 'twrnc';
import { OciResult, CephalometricInput, PatientDetails } from '../types';
import SvgCharts from './SvgCharts';
import Heatmap from './Heatmap';

interface ResultsDashboardProps {
  patientDetails: PatientDetails;
  cephalometricInput: CephalometricInput;
  ociResult: OciResult;
  onSaveAssessment: (aiSummary: string) => void;
  onOpenPdf: (aiSummary: string) => void;
  onBack: () => void;
}

export default function ResultsDashboard({
  patientDetails,
  cephalometricInput,
  ociResult,
  onSaveAssessment,
  onOpenPdf,
  onBack
}: ResultsDashboardProps) {
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch AI Clinical Summary on mount (fallback to local synthesis)
  useEffect(() => {
    async function fetchAiSummary() {
      setLoadingSummary(true);
      try {
        const summary = await generateClinicalSummary(patientDetails, cephalometricInput, ociResult);
        setAiSummary(summary);
        setEditedSummary(summary);
      } catch (err) {
        console.warn('AI API offline or restricted, using local synthesis:', err);
        const localSynthesis = generateLocalClinicalSynthesis(patientDetails, cephalometricInput, ociResult);
        setAiSummary(localSynthesis);
        setEditedSummary(localSynthesis);
      } finally {
        setLoadingSummary(false);
      }
    }

    fetchAiSummary();
  }, [patientDetails, cephalometricInput, ociResult]);

  const handleSave = () => {
    onSaveAssessment(editedSummary);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getScoreColor = (score: number) => {
    if (score <= 20) return 'text-[#10B981]';
    if (score <= 40) return 'text-[#14B8A6]';
    if (score <= 60) return 'text-[#F59E0B]';
    if (score <= 80) return 'text-orange-400';
    return 'text-[#EF4444]';
  };

  const getGaugeBorderColor = (score: number) => {
    if (score <= 20) return 'border-[#10B981]/40';
    if (score <= 40) return 'border-[#14B8A6]/40';
    if (score <= 60) return 'border-[#F59E0B]/40';
    if (score <= 80) return 'border-orange-500/40';
    return 'border-[#EF4444]/40';
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Title / Action Header Card */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`space-y-1`}>
            <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-1`}>
              <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Calculated Diagnostics</Text>
            </View>
            <Text style={tw`text-xl font-black text-white tracking-tight`}>
              Case: {patientDetails.name || 'Anonymous'}
            </Text>
            <Text style={tw`text-xs text-slate-400`}>Review instant computational compensations & diagnostic limits</Text>
          </View>
          
          <View style={tw`flex-row gap-2.5 w-full`}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                tw`flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl items-center`,
                pressed ? tw`bg-white/10` : null
              ]}
            >
              <Text style={tw`text-xs font-black text-slate-300 uppercase tracking-widest`}>Modify Input</Text>
            </Pressable>

            <Pressable
              onPress={() => onOpenPdf(editedSummary)}
              style={({ pressed }) => [
                tw`flex-row items-center justify-center flex-1 py-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl`,
                pressed ? tw`bg-[#22D3EE]/20` : null
              ]}
            >
              <FileText size={13} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-xs font-black text-cyan-400 uppercase tracking-widest`}>PDF Report</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={savedSuccess}
              style={({ pressed }) => [
                tw`flex-row items-center justify-center flex-1 py-3.5 ${savedSuccess ? 'bg-[#10B981]' : 'bg-[#14B8A6]'} rounded-2xl shadow-lg border border-teal-400/30`,
                pressed ? tw`opacity-90` : null
              ]}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle size={13} color="#ffffff" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-black text-white uppercase tracking-widest`}>Saved</Text>
                </>
              ) : (
                <>
                  <BookmarkPlus size={13} color="#ffffff" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-black text-white uppercase tracking-widest`}>Save Case</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Circular Gauge and Severity Scale */}
        <View style={tw`flex-col space-y-6`}>
          
          {/* Circular Score Gauge */}
          <View style={tw`w-full bg-[#0B1020]/80 p-6 rounded-[28px] border border-white/5 shadow-2xl items-center justify-center relative overflow-hidden`}>
            {/* Ambient background glow inside the gauge */}
            <View style={tw`absolute w-40 h-40 rounded-full bg-teal-500/5 blur-3xl`} />
            
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center font-mono`}>
              Orthodontic Compensation Index
            </Text>
            
            <View style={tw`w-40 h-40 items-center justify-center bg-black/40 rounded-full border-4 ${getGaugeBorderColor(ociResult.totalScore)} relative shadow-inner`}>
              <Text style={tw`text-4xl font-black font-mono tracking-tighter ${getScoreColor(ociResult.totalScore)}`}>
                {ociResult.totalScore}%
              </Text>
              <Text style={tw`text-[9px] text-slate-400 font-mono font-bold mt-1 uppercase tracking-widest`}>Tilt Index</Text>
            </View>

            <Text style={tw`text-lg font-black text-white mt-6 text-center`}>
              {ociResult.interpretation}
            </Text>
            <Text style={tw`text-xs text-slate-300 mt-2 text-center leading-relaxed px-4`}>
              Incisor coordinates display compensation levels masking underlying skeletal sagittal discrepancies.
            </Text>
          </View>

          {/* Recommendations and Severity Indicators */}
          <View style={tw`w-full bg-[#0B1020]/80 p-6 rounded-[28px] border border-white/5 shadow-2xl space-y-5`}>
            <View style={tw`space-y-4`}>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2.5 font-mono`}>
                Clinical Interpretation Severity Scale
              </Text>

              {/* Severity tier blocks */}
              <View style={tw`flex-row space-x-1 justify-between`}>
                {[
                  { range: '0-20', label: 'Minimal', color: 'bg-emerald-500', active: ociResult.totalScore <= 20 },
                  { range: '21-40', label: 'Mild', color: 'bg-teal-500', active: ociResult.totalScore > 20 && ociResult.totalScore <= 40 },
                  { range: '41-60', label: 'Mod', color: 'bg-amber-500', active: ociResult.totalScore > 40 && ociResult.totalScore <= 60 },
                  { range: '61-80', label: 'Sev', color: 'bg-orange-500', active: ociResult.totalScore > 60 && ociResult.totalScore <= 80 },
                  { range: '81-100', label: 'Ext', color: 'bg-rose-500', active: ociResult.totalScore > 80 }
                ].map((tier, idx) => (
                  <View 
                    key={idx} 
                    style={tw`flex-1 py-2 rounded-xl border items-center ${
                      tier.active 
                        ? `${tier.color} border-transparent shadow-lg` 
                        : 'bg-black/30 border-white/5'
                    }`}
                  >
                    <Text style={tw`text-[8px] font-black uppercase tracking-wider ${tier.active ? 'text-white' : 'text-slate-500'}`}>
                      {tier.label}
                    </Text>
                    <Text style={tw`text-[7px] font-mono mt-0.5 ${tier.active ? 'text-white/80' : 'text-slate-500'}`}>
                      {tier.range}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Algorithmic Clinical recommendation card */}
              <View style={tw`bg-teal-500/5 border border-teal-500/15 p-4 rounded-2xl flex-row items-start space-x-3`}>
                <Award size={16} color="#14B8A6" style={tw`mr-1.5 mt-0.5 shrink-0`} />
                <View style={tw`flex-1`}>
                  <Text style={tw`font-extrabold text-xs text-white uppercase tracking-wide`}>
                    Algorithmic Recommendation
                  </Text>
                  <Text style={tw`text-[11px] text-slate-300 leading-relaxed mt-1.5`}>
                    {ociResult.recommendation}
                  </Text>
                </View>
              </View>
            </View>

            <View style={tw`flex-row items-start space-x-2`}>
              <Info size={11} color="#64748b" style={tw`mt-0.5 shrink-0`} />
              <Text style={tw`text-[9px] text-slate-500 italic leading-relaxed`}>
                This index evaluates sagittal dental compensation. Treatment pathways must also integrate vertical profile esthetics, soft-tissue contours, TMJ health, and patient consent.
              </Text>
            </View>
          </View>

        </View>

        {/* Gemini Copilot Summary section with ReactMarkdown */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-6 rounded-[28px] border border-[#14B8A6]/20 space-y-4 shadow-2xl`}>
          <View style={tw`flex-row justify-between items-center border-b border-white/5 pb-3.5`}>
            <View style={tw`flex-row items-center`}>
              <Cpu size={16} color="#22D3EE" style={tw`mr-2.5`} />
              <View>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`font-black text-sm text-white mr-2`}>Gemini Clinical Copilot</Text>
                  <View style={tw`bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/25`}>
                    <Text style={tw`text-[7px] text-[#22D3EE] font-mono font-black uppercase tracking-widest`}>LIVE CORE</Text>
                  </View>
                </View>
                <Text style={tw`text-[9px] text-slate-400 mt-0.5`}>Synthesizes ANB metrics & dental tipping profiles</Text>
              </View>
            </View>
            
            <Pressable
              onPress={() => setIsEditingSummary(!isEditingSummary)}
              style={tw`flex-row items-center bg-white/5 px-3 py-1.5 rounded-xl border border-white/10`}
            >
              <Edit2 size={10} color="#cbd5e1" style={tw`mr-1.5`} />
              <Text style={tw`text-[9px] font-black text-slate-300 uppercase tracking-widest`}>
                {isEditingSummary ? 'View' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          {loadingSummary ? (
            <View style={tw`py-6 items-center justify-center space-y-2`}>
              <ActivityIndicator size="small" color="#14B8A6" />
              <Text style={tw`text-[9px] font-mono text-teal-400 font-black uppercase tracking-wider`}>SYNTHESIZING CLINICAL DATA...</Text>
            </View>
          ) : isEditingSummary ? (
            <View style={tw`space-y-2`}>
              <TextInput
                value={editedSummary}
                onChangeText={setEditedSummary}
                multiline
                numberOfLines={6}
                style={[tw`w-full px-4 py-3.5 bg-black/45 text-slate-100 font-sans text-xs rounded-2xl border border-white/10 focus:border-[#14B8A6]`, { minHeight: 120 }]}
              />
              <Text style={tw`text-[9px] font-mono text-slate-500`}>
                You can adjust this AI text before saving to patient charts or exporting files.
              </Text>
            </View>
          ) : (
            <MarkdownRenderer>{editedSummary}</MarkdownRenderer>
          )}
        </View>

        {/* Heatmap visualizer */}
        <Heatmap severityMap={ociResult.severityMap} input={cephalometricInput} />

        {/* Charts */}
        <SvgCharts categoryScores={ociResult.categoryScores} />

      </View>
    </ScrollView>
  );
}

function generateLocalClinicalSynthesis(
  patient: PatientDetails,
  ceph: CephalometricInput,
  oci: OciResult
): string {
  const dx = patient.diagnosis || 'skeletal malocclusion';
  const anbText = ceph.anb !== '' && ceph.anb !== undefined ? `ANB is **${ceph.anb}°**` : 'ANB';
  const impaText = ceph.impa !== '' && ceph.impa !== undefined ? `IMPA is **${ceph.impa}°**` : 'IMPA';
  const overjetText = ceph.overjet !== '' && ceph.overjet !== undefined ? `Overjet is **${ceph.overjet}mm**` : 'Overjet';

  let summary = `The patient displays a **${oci.interpretation}** of sagittal disharmony (computed OCI score: **${oci.totalScore}/100**) associated with a skeletal **${dx}** discrepancy.\n\n`;

  if (patient.diagnosis === 'Class III') {
    summary += `### Diagnostic Synthesis\n\nCephalometrics indicate skeletal Class III relationship (${anbText}). Upper incisors display proclination while lower incisors show retroclination as a primary compensatory mechanism to establish positive overjet (${overjetText}).\n\n`;
    if (oci.totalScore > 60) {
      summary += `### Surgical Pathway suggested\n\nDue to the severe degree of dental compensation, orthodontic camouflage possesses high limitation. Mandibular incisors have exceeded normal biomechanical limits (${impaText}). An orthognathic consultation should be strongly pursued.`;
    } else {
      summary += `### Camouflage Predictability\n\nCompensation levels are within clinical guidelines. Orthodontic dental camouflage may be successfully achieved with carefully managed mechanics and anchorage.`;
    }
  } else if (patient.diagnosis === 'Class II') {
    summary += `### Diagnostic Synthesis\n\nCephalometrics indicate skeletal Class II sagittal profile (${anbText}). Compensatory dental patterns show a mismatch, with proclined lower incisors (${impaText}) and retroclined upper incisors to maintain functional overjet (${overjetText}).\n\n`;
    if (oci.totalScore > 60) {
      summary += `### Decompensation Guide\n\nWith an OCI of **${oci.totalScore}%**, dentoalveolar limits have been heavily compromised. Camouflage will yield unstable or periodontally hazardous outcomes. Suggest presurgical decompensation and surgical correction.`;
    } else {
      summary += `### Camouflage Guide\n\nModerate compensation is observed. Dentoalveolar camouflage is realistic, potentially involving selective dental extractions or interproximal reduction (IPR) to preserve labial bone plates.`;
    }
  } else {
    summary += `### General Note\n\nDiagnostic parameters show well-balanced sagittal relations (${anbText}) and mild dentialveolar compensations, appropriate for conventional orthodontic alignment.`;
  }

  return summary;
}
