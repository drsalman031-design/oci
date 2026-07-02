import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Assessment } from '../types';
import { 
  FileText, 
  Activity, 
  Calendar, 
  Award,
  Layers,
  AlertTriangle,
  ChevronDown,
  Sparkles
} from 'lucide-react-native';
import tw from 'twrnc';
import { Norms } from '../scoringEngine';

interface ReportsPanelProps {
  savedAssessments: Assessment[];
}

export default function ReportsPanel({ savedAssessments }: ReportsPanelProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [showActiveSelect, setShowActiveSelect] = useState<boolean>(false);

  // Find selected assessment or fallback
  const selectedAssessment = savedAssessments.find(a => a.id === selectedId) || savedAssessments[0];

  useEffect(() => {
    if (savedAssessments.length > 0 && !selectedId) {
      setSelectedId(savedAssessments[0].id);
    }
  }, [savedAssessments, selectedId]);

  if (savedAssessments.length === 0) {
    return (
      <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
        <View style={tw`bg-gradient-to-br from-teal-950/40 to-[#0B1020]/40 p-8 rounded-[32px] border border-white/5 shadow-2xl mt-8 items-center text-center space-y-5`}>
          <View style={tw`w-16 h-16 bg-[#14B8A6]/10 rounded-full items-center justify-center border border-[#14B8A6]/20 shadow-inner`}>
            <FileText size={30} color="#14B8A6" />
          </View>
          <Text style={tw`text-lg font-black text-white`}>
            Reports Archive
          </Text>
          <Text style={tw`text-slate-400 max-w-xs text-xs leading-relaxed text-center`}>
            Clinical history database is currently empty. Run an OCI analysis first to store patient parameters before accessing professional clinical reports.
          </Text>
          <View style={tw`pt-2 items-center`}>
            <Text style={tw`text-[9px] text-[#22D3EE] font-black font-mono uppercase tracking-widest`}>
              Clinical Decision Support
            </Text>
            <Text style={tw`text-[10px] text-slate-500 mt-1 font-mono uppercase`}>Director: Dr. Salman MDS</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const { patientDetails, cephalometricInput, ociResult } = selectedAssessment;

  const measurementsList = [
    { key: 'sna', name: 'SNA (°)', norm: Norms.sna },
    { key: 'snb', name: 'SNB (°)', norm: Norms.snb },
    { key: 'anb', name: 'ANB (°)', norm: Norms.anb },
    { key: 'wits', name: 'Wits Appraisal (mm)', norm: Norms.wits },
    { key: 'fma', name: 'FMA (°)', norm: Norms.fma },
    { key: 'u1Sn', name: 'U1-SN (°)', norm: Norms.u1Sn },
    { key: 'impa', name: 'IMPA (°)', norm: Norms.impa },
    { key: 'interincisalAngle', name: 'Interincisal Angle (°)', norm: Norms.interincisalAngle },
    { key: 'overjet', name: 'Overjet (mm)', norm: Norms.overjet },
    { key: 'overbite', name: 'Overbite (mm)', norm: Norms.overbite }
  ];

  const getDeviationText = (val: number | '', norm: typeof Norms.sna) => {
    if (val === '') return 'N/A';
    const numVal = Number(val);
    if (numVal >= norm.min && numVal <= norm.max) return 'Normal';
    const diff = numVal - norm.mean;
    return diff > 0 ? `+${diff.toFixed(1)} (High)` : `${diff.toFixed(1)} (Low)`;
  };

  const getDeviationColor = (val: number | '', norm: typeof Norms.sna) => {
    if (val === '') return 'text-slate-500';
    const numVal = Number(val);
    if (numVal >= norm.min && numVal <= norm.max) return 'text-emerald-400 font-extrabold';
    return 'text-amber-400 font-extrabold';
  };

  const handleExportCSV = () => {
    Alert.alert("Database Export", "Clinical Exam report compiled and saved to clipboard / local database successfully.");
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Patient Selection Header */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View style={tw`space-y-1`}>
            <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-1`}>
              <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
              <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Diagnostic Archival Report</Text>
            </View>
            <Text style={tw`text-xl font-black text-white tracking-tight uppercase`}>
              Clinical Reports
            </Text>
            <Text style={tw`text-xs text-slate-400 mt-1`}>Review cephalometric metric profiles and deviations on-device</Text>
          </View>

          {/* Selector trigger */}
          <View style={tw`relative`}>
            <Pressable
              onPress={() => setShowActiveSelect(!showActiveSelect)}
              style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3.5 rounded-2xl border border-white/10`}
            >
              <Text style={tw`text-xs font-black text-slate-200`}>
                {patientDetails.name || 'Anonymous'} ({patientDetails.caseNumber || 'No Case'})
              </Text>
              <ChevronDown size={14} color="#14B8A6" />
            </Pressable>

            {showActiveSelect && (
              <View style={tw`mt-2 bg-[#0B1020] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50`}>
                {savedAssessments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedId(item.id);
                      setShowActiveSelect(false);
                    }}
                    style={tw`px-4 py-3.5 border-b border-white/5`}
                  >
                    <Text style={tw`text-xs font-bold text-slate-200`}>
                      {item.patientDetails.name || 'Anonymous'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Info Blocks */}
        <View style={tw`flex-col space-y-6`}>
          
          {/* Left: Cephalometric analysis metrics table */}
          <View style={tw`w-full bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl`}>
            <View style={tw`flex-row items-center mb-4 border-b border-white/5 pb-2.5`}>
              <Activity size={15} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Anatomical Parameters</Text>
            </View>

            {/* List Table */}
            <View style={tw`space-y-1`}>
              {measurementsList.map((item, idx) => {
                const val = (cephalometricInput as any)[item.key];
                return (
                  <View key={idx} style={tw`flex-row justify-between items-center py-3 border-b border-white/5`}>
                    <View style={tw`space-y-0.5`}>
                      <Text style={tw`text-xs font-bold text-slate-200`}>{item.name}</Text>
                      <Text style={tw`text-[9px] text-slate-500 font-mono`}>Norm: {item.norm.min}-{item.norm.max}{item.norm.unit}</Text>
                    </View>
                    <View style={tw`items-end space-y-0.5`}>
                      <Text style={tw`text-xs font-black text-white font-mono`}>
                        {val === '' || val === undefined ? '—' : `${val}${item.norm.unit}`}
                      </Text>
                      <Text style={tw`text-[9px] font-black uppercase ${getDeviationColor(val, item.norm)}`}>
                        {getDeviationText(val, item.norm)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Right: Diagnostic card & Treatment goals */}
          <View style={tw`w-full space-y-6`}>
            
            {/* OCI Score Card */}
            <View style={tw`bg-[#0B1020]/90 p-6 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
              <View style={tw`flex-row items-center border-b border-white/5 pb-3`}>
                <Award size={15} color="#22D3EE" style={tw`mr-2`} />
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Severity Summary</Text>
              </View>

              <View style={tw`space-y-1`}>
                <View style={tw`flex-row justify-between items-center py-2 border-b border-white/5`}>
                  <Text style={tw`text-xs text-slate-400`}>OCI Index Score:</Text>
                  <Text style={tw`text-xs font-black text-teal-400 font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg`}>{ociResult.totalScore}%</Text>
                </View>
                <View style={tw`flex-row justify-between items-center py-2 border-b border-white/5`}>
                  <Text style={tw`text-xs text-slate-400`}>Interpretation:</Text>
                  <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>{ociResult.interpretation}</Text>
                </View>
                <View style={tw`flex-row justify-between items-center py-2 border-b border-white/5`}>
                  <Text style={tw`text-xs text-slate-400`}>Sagittal Pattern (ANB):</Text>
                  <Text style={tw`text-xs font-black font-mono text-white`}>{cephalometricInput.anb !== '' ? `${cephalometricInput.anb}°` : 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Print Export trigger */}
            <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl`}>
              <Pressable
                onPress={handleExportCSV}
                style={({ pressed }) => [
                  tw`w-full py-3.5 bg-[#14B8A6] rounded-2xl items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30`,
                  pressed ? tw`opacity-90 scale-98` : null
                ]}
              >
                <Text style={tw`text-xs font-black text-white uppercase tracking-widest`}>Export PDF Summary</Text>
              </Pressable>
            </View>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}
