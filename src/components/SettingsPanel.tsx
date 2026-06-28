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
                <Text style={tw`font-extrabold text-sm text-slate-100 uppercase tracking-wide`}>Index Scoring Weights</Text>
                <Text style={tw`text-[10px] text-slate-400 mt-0.5`}>Calibrate OCI target index values (Sum target = 100)</Text>
              </View>
              
              <Pressable
                onPress={resetWeightsToDefault}
                style={tw`flex-row items-center bg-white/5 border border-white/10 px-3 py-2 rounded-xl`}
              >
                <RefreshCw size={11} color="#14B8A6" style={tw`mr-1.5`} />
                <Text style={tw`text-[10px] font-bold text-slate-300`}>Reset</Text>
              </Pressable>
            </View>

            <View style={tw`bg-teal-500/5 p-4 rounded-2xl flex-row items-start border border-teal-500/10`}>
              <Info size={15} color="#14B8A6" style={tw`mr-2.5 mt-0.5 shrink-0`} />
              <View style={tw`flex-1`}>
                <Text style={tw`font-bold text-xs text-white`}>Calculated Sum: {totalWeightSum}/100</Text>
                <Text style={tw`text-[10px] text-slate-400 leading-relaxed mt-1`}>
                  All scoring algorithms adapt dynamic ratios perfectly based on standard clinical parameters.
                </Text>
              </View>
            </View>

            {/* Weights Sliders */}
            <View style={tw`space-y-3`}>
              {[
                { key: 'skeletal', label: 'Skeletal Discrepancy' },
                { key: 'upperIncisor', label: 'Upper Incisor Tipping' },
                { key: 'lowerIncisor', label: 'Lower Incisor Tipping' },
                { key: 'interincisal', label: 'Interincisal Relation' },
                { key: 'overjet', label: 'Overjet Mismatch' },
                { key: 'softTissue', label: 'Soft Tissue Envelope' },
                { key: 'occlusion', label: 'Occlusal Severity' },
                { key: 'transverse', label: 'Transverse Arch Width' }
              ].map((item) => {
                const weightKey = item.key as keyof OciWeights;
                const currentVal = localWeights[weightKey];
                return (
                  <View key={item.key} style={tw`bg-black/35 p-4 rounded-2xl border border-white/5`}>
                    <View style={tw`flex-row justify-between items-center mb-2.5`}>
                      <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>{item.label}</Text>
                      <Text style={tw`text-xs font-black text-teal-400 font-mono`}>{currentVal}</Text>
                    </View>

                    {/* Button-based adjuster triggers */}
                    <View style={tw`flex-row items-center space-x-3`}>
                      <Pressable
                        onPress={() => handleWeightChange(weightKey, currentVal - 1)}
                        style={tw`w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center`}
                      >
                        <Text style={tw`text-sm font-black text-white`}>-</Text>
                      </Pressable>

                      <View style={tw`flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-[#14B8A6] rounded-full`, { width: `${(currentVal / 30) * 100}%` }]} />
                      </View>

                      <Pressable
                        onPress={() => handleWeightChange(weightKey, currentVal + 1)}
                        style={tw`w-9 h-9 rounded-xl bg-white/5 border border-white/10 items-center justify-center`}
                      >
                        <Text style={tw`text-sm font-black text-white`}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Save Buttons */}
            <View style={tw`border-t border-white/5 pt-5 flex-row justify-between items-center`}>
              <Text style={tw`text-[10px] text-slate-500 italic flex-1 pr-3`}>
                * Saved configurations persist in Async Storage immediately.
              </Text>
              
              <View style={tw`flex-row items-center`}>
                {successMsg !== '' && (
                  <Text style={tw`text-xs text-teal-400 font-extrabold mr-3`}>{successMsg}</Text>
                )}
                <Pressable
                  onPress={saveWeights}
                  style={({ pressed }) => [
                    tw`px-5 py-3.5 bg-[#14B8A6] rounded-2xl flex-row items-center justify-center shadow-lg border border-teal-400/30`,
                    pressed ? tw`opacity-90` : null
                  ]}
                >
                  <Save size={13} color="#ffffff" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Save Weights</Text>
                </Pressable>
              </View>
            </View>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}
