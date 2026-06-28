import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { 
  Award, 
  Sparkles, 
  CheckCircle,
  FileText,
  BookmarkPlus,
  Cpu,
  Edit2
} from 'lucide-react-native';
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
        const response = await fetch('/api/assessments/ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientDetails,
            cephalometricInput,
            ociResult
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setAiSummary(data.summary);
          setEditedSummary(data.summary);
        } else {
          throw new Error('Failed to generate summary');
        }
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
    if (score <= 20) return 'text-emerald-500';
    if (score <= 40) return 'text-teal-500';
    if (score <= 60) return 'text-amber-500';
    if (score <= 80) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-5xl w-full mx-auto`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Title / Action Header */}
        <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
          <View>
            <Text style={tw`text-[10px] font-mono text-slate-400 uppercase tracking-widest`}>OCI Assessment Completed</Text>
            <Text style={tw`text-lg font-extrabold text-slate-800 dark:text-slate-100`}>
              Results Dashboard: {patientDetails.name || 'Anonymous'}
            </Text>
          </View>
          
          <View style={tw`flex-row flex-wrap gap-2 w-full md:w-auto`}>
            <Pressable
              onPress={onBack}
              style={tw`flex-1 md:flex-initial px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl items-center`}
            >
              <Text style={tw`text-xs font-bold text-slate-600 dark:text-slate-400`}>Edit Inputs</Text>
            </Pressable>

            <Pressable
              onPress={() => onOpenPdf(editedSummary)}
              style={tw`flex-row items-center justify-center flex-1 md:flex-initial px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl`}
            >
              <FileText size={14} color="#3b82f6" style={tw`mr-1.5`} />
              <Text style={tw`text-xs font-bold text-blue-600 dark:text-blue-400`}>PDF Report</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={savedSuccess}
              style={tw`flex-row items-center justify-center flex-1 md:flex-initial px-4 py-2.5 ${savedSuccess ? 'bg-emerald-500' : 'bg-teal-500'} rounded-xl`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle size={14} color="#ffffff" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-bold text-white`}>Saved!</Text>
                </>
              ) : (
                <>
                  <BookmarkPlus size={14} color="#ffffff" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-bold text-white`}>Save Case</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Circular Gauge and Severity Scale Grid */}
        <View style={tw`flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6`}>
          
          {/* Circular Score Gauge */}
          <View style={tw`w-full md:w-[35%] bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm items-center justify-center`}>
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4`}>
              Orthodontic Compensation Index
            </Text>
            
            <View style={tw`w-36 h-36 items-center justify-center bg-teal-500/5 rounded-full border-4 border-slate-100 dark:border-slate-800 relative`}>
              <Text style={[tw`text-4xl font-black font-mono tracking-tighter`, getScoreColor(ociResult.totalScore)]}>
                {ociResult.totalScore}%
              </Text>
              <Text style={tw`text-[10px] text-slate-400 font-mono`}>Max 100%</Text>
            </View>

            <Text style={tw`text-base font-extrabold text-slate-800 dark:text-slate-100 mt-4 text-center`}>
              {ociResult.interpretation}
            </Text>
            <Text style={tw`text-[11px] text-slate-400 mt-1 text-center leading-relaxed`}>
              Dentoalveolar structures show compensation levels masking sagittal patterns.
            </Text>
          </View>

          {/* Recommendations and Severity Indicators */}
          <View style={tw`flex-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm justify-between space-y-6`}>
            <View style={tw`space-y-4`}>
              <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2`}>
                Clinical Interpretation Severity Scale
              </Text>

              {/* Severity tier blocks */}
              <View style={tw`flex-row flex-wrap justify-between gap-1.5`}>
                {[
                  { range: '0-20', label: 'Minimal', color: 'bg-emerald-500', active: ociResult.totalScore <= 20 },
                  { range: '21-40', label: 'Mild', color: 'bg-teal-500', active: ociResult.totalScore > 20 && ociResult.totalScore <= 40 },
                  { range: '41-60', label: 'Moderate', color: 'bg-amber-500', active: ociResult.totalScore > 40 && ociResult.totalScore <= 60 },
                  { range: '61-80', label: 'Severe', color: 'bg-orange-500', active: ociResult.totalScore > 60 && ociResult.totalScore <= 80 },
                  { range: '81-100', label: 'Extreme', color: 'bg-red-500', active: ociResult.totalScore > 80 }
                ].map((tier, idx) => (
                  <View 
                    key={idx} 
                    style={tw`w-[18%] py-2 rounded-xl border items-center ${
                      tier.active 
                        ? `${tier.color} border-transparent` 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850'
                    }`}
                  >
                    <Text style={tw`text-[9px] font-black uppercase ${tier.active ? 'text-white' : 'text-slate-400'}`}>
                      {tier.label}
                    </Text>
                    <Text style={tw`text-[8px] font-mono ${tier.active ? 'text-white/80' : 'text-slate-400'}`}>
                      {tier.range}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Algorithmic Clinical recommendation card */}
              <View style={tw`bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex-row items-start`}>
                <Award size={18} color="#3b82f6" style={tw`mr-3 mt-0.5`} />
                <View style={tw`flex-1`}>
                  <Text style={tw`font-bold text-xs text-blue-900 dark:text-blue-100`}>
                    Algorithmic Recommendation
                  </Text>
                  <Text style={tw`text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed mt-1`}>
                    {ociResult.recommendation}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={tw`text-[10px] text-slate-400 italic`}>
              * This index evaluates sagittal dental compensation. Treatment pathways must also integrate vertical profile esthetics, soft-tissue contours, TMJ health, and patient consent.
            </Text>
          </View>

        </View>

        {/* Gemini Copilot Summary section */}
        <View style={tw`bg-slate-950 p-6 rounded-3xl border border-slate-850 space-y-4`}>
          <View style={tw`flex-row justify-between items-center border-b border-slate-850 pb-3`}>
            <View style={tw`flex-row items-center`}>
              <Cpu size={18} color="#2dd4bf" style={tw`mr-2.5 animate-pulse`} />
              <View>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`font-black text-sm text-white mr-1.5`}>Gemini Clinical Copilot Summary</Text>
                  <View style={tw`bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/25`}>
                    <Text style={tw`text-[8px] text-teal-300 font-bold uppercase`}>Live</Text>
                  </View>
                </View>
                <Text style={tw`text-[10px] text-slate-500 mt-0.5`}>Synthesizes ANB metrics & dental tipping profiles</Text>
              </View>
            </View>
            
            <Pressable
              onPress={() => setIsEditingSummary(!isEditingSummary)}
              style={tw`flex-row items-center bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10`}
            >
              <Edit2 size={10} color="#cbd5e1" style={tw`mr-1`} />
              <Text style={tw`text-[10px] font-bold text-slate-300`}>
                {isEditingSummary ? 'View' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          {loadingSummary ? (
            <View style={tw`py-6 items-center justify-center space-y-2`}>
              <ActivityIndicator size="small" color="#2dd4bf" />
              <Text style={tw`text-xs font-mono text-slate-400`}>SYNTHESIZING PATIENT PARAMETERS...</Text>
            </View>
          ) : isEditingSummary ? (
            <View style={tw`space-y-2`}>
              <TextInput
                value={editedSummary}
                onChangeText={setEditedSummary}
                multiline
                numberOfLines={5}
                style={[tw`w-full px-4 py-3 bg-slate-900 text-slate-100 font-sans text-xs rounded-xl border border-slate-800`, { minHeight: 100 }]}
              />
              <Text style={tw`text-[9px] font-mono text-slate-500`}>
                You can adjust this AI text before saving to patient charts or exporting files.
              </Text>
            </View>
          ) : (
            <View style={tw`bg-slate-900/60 p-4 rounded-2xl border border-white/5`}>
              <Text style={tw`text-xs text-slate-200 leading-relaxed font-sans`}>
                {editedSummary || 'No clinical summary generated.'}
              </Text>
            </View>
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
  const anbText = ceph.anb !== '' && ceph.anb !== undefined ? `ANB is ${ceph.anb}°` : 'ANB';
  const impaText = ceph.impa !== '' && ceph.impa !== undefined ? `IMPA is ${ceph.impa}°` : 'IMPA';
  const overjetText = ceph.overjet !== '' && ceph.overjet !== undefined ? `Overjet is ${ceph.overjet}mm` : 'Overjet';

  let summary = `The patient displays a ${oci.interpretation} of sagittal disharmony (computed OCI score: ${oci.totalScore}/100) associated with a skeletal ${dx} discrepancy. `;

  if (patient.diagnosis === 'Class III') {
    summary += `Cephalometrics indicate skeletal Class III relationship (${anbText}). Upper incisors display proclination while lower incisors show retroclination as a primary compensatory mechanism to establish positive overjet (${overjetText}). `;
    if (oci.totalScore > 60) {
      summary += `Due to the severe degree of dental compensation, orthodontic camouflage possesses high limitation. Mandibular incisors have exceeded normal biomechanical limits (${impaText}). An orthognathic consultation should be strongly pursued.`;
    } else {
      summary += `Compensation levels are within clinical guidelines. Orthodontic dental camouflage may be successfully achieved with carefully managed mechanics and anchorage.`;
    }
  } else if (patient.diagnosis === 'Class II') {
    summary += `Cephalometrics indicate skeletal Class II sagittal profile (${anbText}). Compensatory dental patterns show a mismatch, with proclined lower incisors (${impaText}) and retroclined upper incisors to maintain functional overjet (${overjetText}). `;
    if (oci.totalScore > 60) {
      summary += `With an OCI of ${oci.totalScore}, dentoalveolar limits have been heavily compromised. Camouflage will yield unstable or periodontally hazardous outcomes. Suggest presurgical decompensation and surgical correction.`;
    } else {
      summary += `Moderate compensation is observed. Dentoalveolar camouflage is realistic, potentially involving selective dental extractions or interproximal reduction (IPR) to preserve labial bone plates.`;
    }
  } else {
    summary += `Diagnostic parameters show well-balanced sagittal relations (${anbText}) and mild dentialveolar compensations, appropriate for conventional orthodontic alignment.`;
  }

  return summary;
}
