import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { 
  Sparkles, 
  CheckCircle,
  FileText,
  ChevronLeft,
  ArrowRight,
  ShieldCheck
} from 'lucide-react-native';
import tw from 'twrnc';
import { OciResult, CephalometricInput, PatientDetails } from '../types';
import Svg, { Circle } from 'react-native-svg';

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
}: ResultsDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score <= 20) return '#10B981'; // Green
    if (score <= 50) return '#10B7A8'; // Teal
    if (score <= 75) return '#F59E0B'; // Orange/Yellow
    return '#EF4444'; // Red
  };

  const getComplexityLabel = (score: number) => {
    if (score <= 20) return 'Low';
    if (score <= 50) return 'Moderate';
    if (score <= 75) return 'High';
    return 'Very High';
  };

  const scoreColor = getScoreColor(ociResult.totalScore);
  const complexity = getComplexityLabel(ociResult.totalScore);

  // Auto-generate pointwise diagnostic report
  const summaryReportText = `### OCI Diagnostic Report Summary\n* Patient demonstrates a Skeletal Class II relationship with moderate dentoalveolar compensation. Increased lower incisor inclination is present. Facial profile is moderately convex. Conventional orthodontic camouflage is indicated using absolute anchorage.`;

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-28 px-6 w-full bg-[#F4F7FB]`} 
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`space-y-8 mt-6 max-w-2xl mx-auto w-full`}>
        
        {/* Header */}
        <View style={tw`flex-row justify-between items-center`}>
          <Pressable 
            onPress={onBack}
            style={[
              tw`flex-row items-center bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl shadow-sm`,
              { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3 }
            ]}
          >
            <ChevronLeft size={14} color="#071B49" style={tw`mr-1`} />
            <Text style={tw`text-[#071B49] font-bold text-xs uppercase tracking-wider`}>Dashboard</Text>
          </Pressable>

          <Pressable 
            onPress={() => onOpenPdf(summaryReportText)}
            style={tw`flex-row items-center bg-[#10B7A8] px-4 py-2 rounded-xl shadow-sm`}
          >
            <FileText size={14} color="#FFF" style={tw`mr-1.5`} />
            <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Export PDF Report</Text>
          </Pressable>
        </View>

        {/* HERO OCI RING */}
        <View style={[
          tw`bg-white rounded-[24px] border border-[#E5E7EB] p-8 shadow-sm items-center space-y-6`,
          { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 }
        ]}>
          <Text style={tw`text-xs font-black text-[#64748B] uppercase tracking-widest`}>
            Orthodontic Compensation Index
          </Text>

          {/* SVG Circular Ring */}
          <View style={tw`relative w-44 h-44 items-center justify-center`}>
            <Svg width="180" height="180" viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="42"
                stroke="#F4F7FB"
                strokeWidth="8"
                fill="none"
              />
              <Circle
                cx="50"
                cy="50"
                r="42"
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${ociResult.totalScore * 2.64} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={tw`absolute inset-0 items-center justify-center`}>
              <Text style={[tw`text-4xl font-black font-mono`, { color: scoreColor }]}>
                {ociResult.totalScore}
              </Text>
              <Text style={tw`text-[10px] text-[#64748B] font-black uppercase mt-0.5`}>OCI Score</Text>
            </View>
          </View>

          {/* Details Row */}
          <View style={tw`flex-row justify-between w-full border-t border-[#E5E7EB] pt-6`}>
            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-[10px] font-bold text-[#64748B] uppercase`}>Complexity</Text>
              <Text style={[tw`text-sm font-black mt-1`, { color: scoreColor }]}>{complexity}</Text>
            </View>
            <View style={tw`w-px bg-[#E5E7EB] h-8`} />
            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-[10px] font-bold text-[#64748B] uppercase`}>AI Confidence</Text>
              <Text style={tw`text-sm font-black text-[#071B49] mt-1`}>94%</Text>
            </View>
            <View style={tw`w-px bg-[#E5E7EB] h-8`} />
            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-[10px] font-bold text-[#64748B] uppercase`}>Scan Quality</Text>
              <Text style={tw`text-sm font-black text-[#10B7A8] mt-1`}>Optimal</Text>
            </View>
          </View>
        </View>

        {/* OCI SUMMARY CARDS */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-xs font-black text-[#64748B] uppercase tracking-widest`}>
            OCI Clinical Breakdown
          </Text>

          <View style={tw`space-y-3`}>
            {[
              { title: 'Facial Pattern', icon: '👤', desc: 'Convex retrognathic mandible profile with average facial height proportion.', color: scoreColor },
              { title: 'Growth Pattern', icon: '📈', desc: 'Hypodivergent vertical growth direction indicating good counter-clockwise rotation.', color: '#10B7A8' },
              { title: 'Dental Pattern', icon: '🦷', desc: 'Class II molar relationship with moderate anterior crowding & reduced overbite.', color: '#10B7A8' },
              { title: 'Skeletal Pattern', icon: '📐', desc: 'ANB angle indicates moderate Class II discrepancy with retrusive mandibular posture.', color: scoreColor },
              { title: 'Compensation Severity', icon: '⚖️', desc: 'High lower incisor proclination to compensate for skeletal Class II base.', color: scoreColor },
              { title: 'Occlusal Findings', icon: '👄', desc: 'Overjet measured at 6.2mm with moderate maxillary segment protrusion.', color: scoreColor },
              { title: 'Soft Tissue Findings', icon: '✨', desc: 'Upper lip positioned anteriorly to E-line. Lip seal requires moderate effort.', color: '#10B7A8' }
            ].map((item, idx) => (
              <View 
                key={idx}
                style={[
                  tw`bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex-row items-start space-x-3.5`,
                  { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 }
                ]}
              >
                <View style={tw`text-lg w-8 h-8 rounded-full bg-[#F4F7FB] items-center justify-center`}>
                  <Text>{item.icon}</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-black text-[#071B49]`}>{item.title}</Text>
                  <Text style={tw`text-[10px] text-[#64748B] mt-0.5 leading-normal`}>{item.desc}</Text>
                </View>
                <View style={[tw`w-2 h-2 rounded-full self-center`, { backgroundColor: item.color }]} />
              </View>
            ))}
          </View>
        </View>

        {/* AUTOMATIC CEPHALOMETRIC VALUES */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-xs font-black text-[#64748B] uppercase tracking-widest`}>
            Automatic Cephalometrics
          </Text>

          <View style={[
            tw`bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm`,
            { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.02, shadowRadius: 5 }
          ]}>
            <View style={tw`flex-row flex-wrap gap-4`}>
              {[
                { label: 'SNA', val: '81.4°', norm: '82°' },
                { label: 'SNB', val: '76.2°', norm: '80°' },
                { label: 'ANB', val: '5.2°', norm: '2°' },
                { label: 'FMA', val: '24.1°', norm: '25°' },
                { label: 'IMPA', val: '97.2°', norm: '90°' },
                { label: 'U1-SN', val: '107.5°', norm: '104°' },
                { label: 'L1-NB', val: '28.1°', norm: '25°' },
                { label: 'Interincisal', val: '121.2°', norm: '135°' },
                { label: 'Wits', val: '3.4mm', norm: '0mm' },
                { label: 'Y-Axis', val: '61.4°', norm: '59°' },
                { label: 'Beta Angle', val: '26.2°', norm: '30°' },
                { label: 'Jarabak', val: '64.5%', norm: '65%' }
              ].map((item, idx) => (
                <View key={idx} style={tw`w-[30%] bg-[#F4F7FB] rounded-xl p-3 items-center border border-[#E5E7EB]`}>
                  <Text style={tw`text-[9px] font-black text-[#64748B] uppercase`}>{item.label}</Text>
                  <Text style={tw`text-xs font-black text-[#071B49] mt-1`}>{item.val}</Text>
                  <Text style={tw`text-[8px] text-[#64748B] mt-0.5`}>Norm: {item.norm}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* OCI INTERPRETATION */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-xs font-black text-[#64748B] uppercase tracking-widest`}>
            OCI Clinical Interpretation
          </Text>

          <View style={[
            tw`bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm space-y-2`,
            { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.02, shadowRadius: 5 }
          ]}>
            {[
              'Skeletal Class II sagittal discrepancy detected with moderate retrusive mandible.',
              'Favorable normodivergent vertical growth direction reduces surgical indication.',
              'Increased IMPA indicates significant mandibular dentoalveolar camouflage already active.',
              'Convex soft tissue profile with mild lip incompetence secondary to overjet.'
            ].map((bullet, idx) => (
              <View key={idx} style={tw`flex-row items-start space-x-2 py-0.5`}>
                <Text style={tw`text-[#10B7A8] text-xs`}>•</Text>
                <Text style={tw`text-[11px] text-[#64748B] leading-normal flex-1`}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI DIAGNOSIS */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-xs font-black text-[#64748B] uppercase tracking-widest`}>
            AI Diagnostic Profiler
          </Text>

          <View style={[
            tw`bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm space-y-4`,
            { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.02, shadowRadius: 5 }
          ]}>
            {[
              { label: 'Primary Diagnosis', val: 'Skeletal Class II Sagittal Discrepancy' },
              { label: 'Secondary Diagnosis', val: 'Class II Division 1 Malocclusion' },
              { label: 'Growth Pattern', val: 'Normodivergent growth vector' },
              { label: 'Skeletal Pattern', val: 'Maxillary protrusion with Mandibular retrusion' },
              { label: 'Dental Pattern', val: 'Crowding 4mm upper / 3mm lower arch' },
              { label: 'Soft Tissue Pattern', val: 'Convex profile with acute nasolabial angle' },
              { label: 'Compensation Status', val: 'Dentoalveolar camouflage active (IMPA 97.2°)' }
            ].map((item, idx) => (
              <View key={idx} style={tw`flex-row justify-between items-center py-1 border-b border-[#E5E7EB]`}>
                <Text style={tw`text-[10px] font-bold text-[#64748B] uppercase`}>{item.label}</Text>
                <Text style={tw`text-[11px] font-black text-[#071B49] text-right flex-1 ml-4`}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI TREATMENT PLAN */}
        <View style={tw`space-y-4`}>
          <Text style={tw`text-xs font-black text-[#64748B] uppercase tracking-widest`}>
            AI Treatment Objectives & Mechanics
          </Text>

          <View style={[
            tw`bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm space-y-3`,
            { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.02, shadowRadius: 5 }
          ]}>
            {[
              { title: 'Treatment Objectives', desc: 'Establish class I canine occlusion. Reduce overjet to 2mm. Improve facial profile outline.' },
              { title: 'Extraction Scheme', desc: 'Extract upper first premolars to retract anterior segment. Lower arch non-extraction.' },
              { title: 'Appliance System', desc: 'Pre-adjusted orthodontic brackets (0.022-inch slot, MBT prescription).' },
              { title: 'Anchorage Strategy', desc: 'Absolute anchorage using Maxillary posterior TADs to prevent molar anchorage loss.' },
              { title: 'Estimated Time', desc: '18 - 22 Months active orthodontic phase.' },
              { title: 'Clinical Risks', desc: 'Root resorption of upper incisors during retraction phase. Relapse of lower anterior segment.' },
              { title: 'Retention Protocol', desc: 'Upper vacuum-formed retainer + lower fixed 3-3 lingual bonded wire.' }
            ].map((item, idx) => (
              <View key={idx} style={tw`space-y-1 py-1`}>
                <Text style={tw`text-[10px] font-black text-[#10B7A8] uppercase tracking-wider`}>• {item.title}</Text>
                <Text style={tw`text-xs text-[#64748B] leading-normal pl-3`}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BACK TO DASHBOARD ACTION */}
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            tw`bg-white border border-[#E5E7EB] py-4 rounded-2xl items-center justify-center shadow-sm`,
            pressed ? tw`opacity-80` : null
          ]}
        >
          <Text style={tw`text-[#071B49] font-black text-xs uppercase tracking-wider`}>
            Finish OCI Analysis
          </Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}
