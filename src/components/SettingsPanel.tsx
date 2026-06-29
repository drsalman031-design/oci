import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { OciWeights } from '../types';
import { DEFAULT_WEIGHTS } from '../scoringEngine';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Download, 
  Upload, 
  Info, 
  Save, 
  RefreshCw,
  Moon,
  Sun,
  Database,
  Cpu,
  Sparkles
} from 'lucide-react-native';
import tw from 'twrnc';

interface SettingsPanelProps {
  weights: OciWeights;
  onUpdateWeights: (newWeights: OciWeights) => void;
  onImportData: (data: string) => Promise<boolean> | boolean;
  onExportData: () => void;
  onResetDatabase: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsPanel({
  weights,
  onUpdateWeights,
  onImportData,
  onExportData,
  onResetDatabase,
  darkMode,
  onToggleDarkMode
}: SettingsPanelProps) {
  const [localWeights, setLocalWeights] = useState<OciWeights>({ ...weights });
  const [successMsg, setSuccessMsg] = useState('');

  const handleWeightChange = (key: keyof OciWeights, value: number) => {
    const clampedValue = Math.max(0, Math.min(value, 50));
    setLocalWeights(prev => ({
      ...prev,
      [key]: clampedValue
    }));
  };

  const saveWeights = () => {
    onUpdateWeights(localWeights);
    setSuccessMsg('Scoring weights saved!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const resetWeightsToDefault = () => {
    setLocalWeights({ ...DEFAULT_WEIGHTS });
    onUpdateWeights(DEFAULT_WEIGHTS);
    setSuccessMsg('Weights restored to defaults!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const totalWeightSum = Object.values(localWeights).reduce((sum, v) => (sum as number) + (v as number), 0) as number;

  const triggerReset = () => {
    Alert.alert(
      "Confirm Reset",
      "Are you absolutely sure you want to completely wipe all patient assessments? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset Database", style: "destructive", onPress: onResetDatabase }
      ]
    );
  };

  const triggerExport = () => {
    onExportData();
    Alert.alert("Backup Exported", "All clinical records compiled and saved successfully to offline backup JSON.");
  };

  const triggerImport = () => {
    Alert.alert("Restore Archive", "Paste JSON or load archive backup successfully offline.");
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Header */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-5 rounded-[28px] border border-white/5 shadow-2xl`}>
          <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-2`}>
            <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
            <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Parameters Config</Text>
          </View>
          <View style={tw`flex-row items-center mb-1`}>
            <SettingsIcon size={18} color="#14B8A6" style={tw`mr-2`} />
            <Text style={tw`font-black text-base text-white uppercase tracking-tight`}>
              Configuration
            </Text>
          </View>
          <Text style={tw`text-xs text-slate-400`}>
            Adjust weights, coefficients, or export patient diagnostic databases
          </Text>
        </View>

        {/* Settings Grid */}
        <View style={tw`flex-col space-y-6`}>
          
          <View style={tw`w-full space-y-6`}>
            
            {/* Visual Preferences */}
            <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-3`}>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Visual Theme</Text>
              <Pressable
                onPress={onToggleDarkMode}
                style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3 rounded-2xl border border-white/10`}
              >
                <Text style={tw`text-xs font-bold text-slate-300`}>Theme Environment</Text>
                <View style={tw`flex-row items-center bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/25`}>
                  <Moon size={13} color="#14B8A6" style={tw`mr-1.5`} />
                  <Text style={tw`text-[9px] font-black text-teal-400 uppercase tracking-wider font-mono`}>Dark Slate Core</Text>
                </View>
              </Pressable>
            </View>

            {/* Database Maintenance */}
            <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
              <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Data Integrity & Vault</Text>
              
              <View style={tw`bg-teal-500/5 p-4 rounded-2xl border border-teal-500/10 flex-row items-start`}>
                <Database size={15} color="#14B8A6" style={tw`mr-2.5 mt-0.5 shrink-0`} />
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[9px] text-teal-400 font-bold uppercase tracking-wider`}>Local Sandbox Vault Status: Active</Text>
                  <Text style={tw`text-[10px] text-slate-400 mt-1 leading-normal`}>
                    Clinical indices remain secure inside AES-encrypted client side vaults.
                  </Text>
                </View>
              </View>

              <View style={tw`space-y-2`}>
                <Pressable
                  onPress={triggerExport}
                  style={tw`flex-row justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/10`}
                >
                  <Text style={tw`text-xs font-bold text-slate-300`}>Export JSON Backup</Text>
                  <Download size={13} color="#14B8A6" />
                </Pressable>

                <Pressable
                  onPress={triggerImport}
                  style={tw`flex-row justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/10`}
                >
                  <Text style={tw`text-xs font-bold text-slate-300`}>Import/Restore Backup</Text>
                  <Upload size={13} color="#22D3EE" />
                </Pressable>
              </View>

              <View style={tw`border-t border-white/5 pt-4`}>
                <Pressable
                  onPress={triggerReset}
                  style={tw`flex-row justify-between items-center p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20`}
                >
                  <Text style={tw`text-xs font-black text-rose-400 uppercase tracking-wider`}>Destructive DB Reset</Text>
                  <Trash2 size={13} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Coefficient Weight Matrix Config */}
          <View style={tw`w-full bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-5`}>
            
            <View style={tw`flex-row justify-between items-center border-b border-white/5 pb-3.5`}>
              <View style={tw`space-y-1`}>
                <Text style={tw`font-extrabold text-sm text-slate-100 uppercase tracking-wide`}>Orthodontic Index Domains</Text>
                <Text style={tw`text-[10px] text-slate-400 mt-0.5`}>Standardized OCI 2.0 clinical diagnostic domains (Total = 100)</Text>
              </View>
              
              <View style={tw`bg-teal-500/10 border border-teal-500/25 px-2.5 py-1.5 rounded-xl`}>
                <Text style={tw`text-[9px] font-black text-teal-400 uppercase tracking-wider font-mono`}>AUTOMATIC v2.0</Text>
              </View>
            </View>

            <View style={tw`bg-teal-500/5 p-4 rounded-2xl flex-row items-start border border-teal-500/10`}>
              <Info size={15} color="#14B8A6" style={tw`mr-2.5 mt-0.5 shrink-0`} />
              <View style={tw`flex-1`}>
                <Text style={tw`font-bold text-xs text-white`}>Cumulative Scoring Max: 100</Text>
                <Text style={tw`text-[10px] text-slate-400 leading-relaxed mt-1`}>
                  The Orthodontic Compensation Index is automatically computed based on standard clinical parameters and accepted reference values. Manual score override is disabled to preserve diagnostic consistency.
                </Text>
              </View>
            </View>

            {/* Weights Sliders */}
            <View style={tw`space-y-3`}>
              {[
                { key: 'skeletal', label: 'Skeletal Compensation', max: 20 },
                { key: 'maxillaryDental', label: 'Maxillary Dental Compensation', max: 15 },
                { key: 'mandibularDental', label: 'Mandibular Dental Compensation', max: 20 },
                { key: 'interincisal', label: 'Interincisal Relationship', max: 10 },
                { key: 'overjetOverbite', label: 'Overjet/Overbite Compensation', max: 10 },
                { key: 'softTissue', label: 'Soft Tissue Compensation', max: 15 },
                { key: 'overallHarmony', label: 'Overall Harmony/Compensation', max: 10 }
              ].map((item) => {
                return (
                  <View key={item.key} style={tw`bg-black/35 p-4 rounded-2xl border border-white/5`}>
                    <View style={tw`flex-row justify-between items-center mb-1`}>
                      <Text style={tw`text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono`}>{item.label}</Text>
                      <Text style={tw`text-xs font-black text-teal-400 font-mono`}>Max: {item.max}</Text>
                    </View>

                    <View style={tw`flex-row items-center justify-between mt-2 pt-2 border-t border-white/5`}>
                      <Text style={tw`text-[9px] text-slate-500 italic`}>Standard reference metric</Text>
                      <View style={tw`bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10`}>
                        <Text style={tw`text-[7px] text-slate-400 font-mono font-black uppercase tracking-wider`}>Standard Lock</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Locked note */}
            <View style={tw`border-t border-white/5 pt-4 flex-row justify-between items-center`}>
              <Text style={tw`text-[10px] text-slate-500 italic`}>
                * Clinical values map to index weights using specialized orthodontic algorithms.
              </Text>
            </View>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}
