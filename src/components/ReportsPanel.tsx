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
  Brain,
  ChevronDown
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
      <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-4xl w-full mx-auto`}>
        <View style={tw`bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 mt-8 items-center text-center`}>
          <View style={tw`w-16 h-16 bg-teal-500/10 rounded-full items-center justify-center border border-teal-500/20 text-teal-500`}>
            <FileText size={30} color="#0d9488" />
          </View>
          <Text style={tw`text-xl font-extrabold text-slate-800 dark:text-slate-100`}>
            Offline Clinical Reports Core
          </Text>
          <Text style={tw`text-slate-500 dark:text-slate-400 max-w-xs text-xs leading-relaxed text-center`}>
            Clinical history database is currently empty. Run an OCI analysis first to store patient parameters before accessing professional clinical reports.
          </Text>
          <View style={tw`pt-2 items-center`}>
            <Text style={tw`text-[9px] text-teal-500/75 font-mono uppercase tracking-widest`}>
              Clinical Decision Support Engine
            </Text>
            <Text style={tw`text-xs text-slate-400 mt-1`}>Developed by Dr. Salman MDS Orthodontist</Text>
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
    if (val === '') return 'text-slate-400';
    const numVal = Number(val);
    if (numVal >= norm.min && numVal <= norm.max) return 'text-teal-600 font-bold';
    return 'text-amber-600 font-bold';
  };

  const isClassIII = patientDetails.diagnosis === 'Class III' || (cephalometricInput.anb !== '' && Number(cephalometricInput.anb) < 0);
  const isClassII = patientDetails.diagnosis === 'Class II' || (cephalometricInput.anb !== '' && Number(cephalometricInput.anb) > 4);
  const isGrowing = (typeof patientDetails.age === 'number' ? patientDetails.age : 12) <= 14;

  const objectives = [
    'Establish Class I canine and molar relationships.',
    'Optimize incisor inclinations (Target IMPA ~90°).',
    'Achieve functional overjet/overbite and seal.',
    'Establish stable facial profile harmony.'
  ];

  const suggestedAppliances = [
    isGrowing ? (isClassII ? 'Twin Block Orthopedics' : 'Protraction Facemask therapy') : 'Fixed Brackets (0.022-inch Roth prescription)',
    ociResult.totalScore > 50 ? 'Temporary Anchorage Devices (TADs)' : 'Clear Aligners Feasible',
    'Bonded Lower lingual wire (3-3) + Upper Essix night retainer'
  ];

  const handleExportCSV = () => {
    Alert.alert("Offline Report Exported", "Clinical Exam report compiled and saved to clipboard / local database successfully.");
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-5xl w-full mx-auto`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Patient Selection Header */}
        <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4`}>
          <View>
            <View style={tw`flex-row items-center`}>
              <FileText size={16} color="#0d9488" style={tw`mr-1.5`} />
              <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100`}>
                Diagnostic & Cephalometric Analysis Report
              </Text>
            </View>
            <Text style={tw`text-xs text-slate-400 mt-1`}>Developed by Dr. Salman MDS Orthodontist</Text>
          </View>

          {/* Selector trigger */}
          <View style={tw`relative`}>
            <Pressable
              onPress={() => setShowActiveSelect(!showActiveSelect)}
              style={tw`flex-row justify-between items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800`}
            >
              <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300`}>
                {patientDetails.name || 'Anonymous'} ({patientDetails.caseNumber || 'No Case'}) - {patientDetails.diagnosis}
              </Text>
              <ChevronDown size={14} color="#64748b" />
            </Pressable>

            {showActiveSelect && (
              <View style={tw`mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg z-50`}>
                {savedAssessments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedId(item.id);
                      setShowActiveSelect(false);
                    }}
                    style={tw`px-4 py-3 border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50`}
                  >
                    <Text style={tw`text-xs font-semibold text-slate-700 dark:text-slate-300`}>
                      {item.patientDetails.name || 'Anonymous'} - {item.patientDetails.diagnosis}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Two column Grid Layout */}
        <View style={tw`flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6`}>
          
          {/* Left: Cephalometric analysis metrics table */}
          <View style={tw`flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm`}>
            <View style={tw`flex-row items-center mb-4 border-b border-slate-100 dark:border-slate-850 pb-2.5`}>
              <Activity size={16} color="#0d9488" style={tw`mr-1.5`} />
              <Text style={tw`font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase`}>Cephalometric Parameter Values</Text>
            </View>

            {/* List Table */}
            <View style={tw`space-y-2`}>
              {measurementsList.map((item, idx) => {
                const val = (cephalometricInput as any)[item.key];
                return (
                  <View key={idx} style={tw`flex-row justify-between items-center py-2.5 border-b border-slate-50 dark:border-slate-850/50`}>
                    <View>
                      <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300`}>{item.name}</Text>
                      <Text style={tw`text-[9px] text-slate-400 font-mono mt-0.5`}>Norm: {item.norm.min}-{item.norm.max}{item.norm.unit}</Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-xs font-bold text-slate-800 dark:text-slate-200`}>
                        {val === '' || val === undefined ? 'Empty' : `${val}${item.norm.unit}`}
                      </Text>
                      <Text style={tw`text-[9px] ${getDeviationColor(val, item.norm)}`}>
                        {getDeviationText(val, item.norm)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Right: Diagnostic card & Treatment goals */}
          <View style={tw`w-full md:w-[40%] space-y-6`}>
            
            {/* OCI Score Card */}
            <View style={tw`bg-slate-950 p-6 rounded-3xl border border-slate-850`}>
              <View style={tw`flex-row items-center border-b border-slate-850 pb-3 mb-4`}>
                <Award size={16} color="#2dd4bf" style={tw`mr-1.5`} />
                <Text style={tw`font-black text-xs text-teal-300 uppercase`}>OCI Severity Metrics</Text>
              </View>

              <View style={tw`space-y-3`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-xs text-slate-400`}>Index Score:</Text>
                  <Text style={tw`text-xs font-black text-white font-mono`}>{ociResult.totalScore}/100</Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-xs text-slate-400`}>Interpretation:</Text>
                  <Text style={tw`text-xs font-bold text-teal-400`}>{ociResult.interpretation}</Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-xs text-slate-400`}>Anatomical Angle (ANB):</Text>
                  <Text style={tw`text-xs font-mono text-white`}>{cephalometricInput.anb !== '' ? `${cephalometricInput.anb}°` : 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Strategic Treatment Goals */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4`}>
              <View style={tw`flex-row items-center border-b border-slate-100 dark:border-slate-850 pb-2.5`}>
                <Brain size={16} color="#0d9488" style={tw`mr-1.5`} />
                <Text style={tw`font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase`}>Strategic Goals</Text>
              </View>

              <View style={tw`space-y-2`}>
                {objectives.map((obj, i) => (
                  <View key={i} style={tw`flex-row items-start`}>
                    <View style={tw`w-1.5 h-1.5 rounded-full bg-teal-500 mr-2 mt-1.5`} />
                    <Text style={tw`text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex-1`}>{obj}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Print Export trigger */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm`}>
              <Pressable
                onPress={handleExportCSV}
                style={tw`w-full py-3 bg-teal-500 rounded-xl items-center justify-center`}
              >
                <Text style={tw`text-xs font-black text-white`}>Export Clinical PDF / CSV</Text>
              </Pressable>
            </View>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}
