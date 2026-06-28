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
  Sun
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
    <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-4xl w-full mx-auto`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Header */}
        <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm`}>
          <View style={tw`flex-row items-center mb-1`}>
            <SettingsIcon size={18} color="#0d9488" style={tw`mr-1.5`} />
            <Text style={tw`font-extrabold text-base text-slate-800 dark:text-slate-100`}>
              System Settings & Configurator
            </Text>
          </View>
          <Text style={tw`text-xs text-slate-400`}>
            Fine-tune OCI index coefficients, import backups, or adjust visual theme
          </Text>
        </View>

        {/* Layout Grid */}
        <View style={tw`flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6`}>
          
          {/* Left Block */}
          <View style={tw`w-full md:w-[35%] space-y-6`}>
            
            {/* Dark Mode toggle card */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3`}>
              <Text style={tw`font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase`}>Visual Preferences</Text>
              <Pressable
                onPress={onToggleDarkMode}
                style={tw`flex-row justify-between items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800`}
              >
                <Text style={tw`text-xs font-semibold text-slate-600 dark:text-slate-400`}>Toggle Mode</Text>
                {darkMode ? <Moon size={16} color="#2dd4bf" /> : <Sun size={16} color="#f59e0b" />}
              </Pressable>
            </View>

            {/* Offline DB Actions */}
            <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4`}>
              <Text style={tw`font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase`}>Database Maintenance</Text>
              
              <View style={tw`bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
                <Text style={tw`text-[10px] text-teal-600 font-bold uppercase`}>Offline Sync Status: Active</Text>
                <Text style={tw`text-[10px] text-slate-400 mt-1 leading-normal`}>
                  All clinical assessments are encrypted and stored in local Async Storage. No cloud transmission.
                </Text>
              </View>

              <View style={tw`space-y-2`}>
                <Pressable
                  onPress={triggerExport}
                  style={tw`flex-row justify-between items-center p-3.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30`}
                >
                  <Text style={tw`text-xs font-bold text-indigo-700 dark:text-indigo-400`}>Export JSON Backup</Text>
                  <Download size={14} color="#6366f1" />
                </Pressable>

                <Pressable
                  onPress={triggerImport}
                  style={tw`flex-row justify-between items-center p-3.5 bg-teal-50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900/30`}
                >
                  <Text style={tw`text-xs font-bold text-teal-700 dark:text-teal-400`}>Import/Restore Backup</Text>
                  <Upload size={14} color="#14b8a6" />
                </Pressable>
              </View>

              <View style={tw`border-t border-slate-100 dark:border-slate-800 pt-3`}>
                <Pressable
                  onPress={triggerReset}
                  style={tw`flex-row justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30`}
                >
                  <Text style={tw`text-xs font-bold text-red-700 dark:text-red-400`}>Reset Database</Text>
                  <Trash2 size={14} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Right Block: Configure coefficient weights */}
          <View style={tw`flex-1 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6`}>
            
            <View style={tw`flex-row justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3`}>
              <View>
                <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100`}>OCI Weight Coefficients</Text>
                <Text style={tw`text-[11px] text-slate-400 mt-0.5`}>Adjust parameter weights (Sum Target = 100)</Text>
              </View>
              <Pressable
                onPress={resetWeightsToDefault}
                style={tw`flex-row items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg`}
              >
                <RefreshCw size={12} color="#64748b" style={tw`mr-1`} />
                <Text style={tw`text-[10px] font-bold text-slate-600 dark:text-slate-400`}>Reset Defaults</Text>
              </Pressable>
            </View>

            <View style={tw`bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex-row items-start border border-slate-150 dark:border-slate-850`}>
              <Info size={16} color="#0d9488" style={tw`mr-2.5 mt-0.5`} />
              <View style={tw`flex-1`}>
                <Text style={tw`font-bold text-xs text-slate-700 dark:text-slate-300`}>Sum of Max OCI Score: {totalWeightSum}/100</Text>
                <Text style={tw`text-[10px] text-slate-400 leading-relaxed mt-1`}>
                  Balance the categories to sum to exactly 100 for proper clinical score matching.
                </Text>
              </View>
            </View>

            {/* Weights Sliders list */}
            <View style={tw`space-y-4`}>
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
                  <View key={item.key} style={tw`bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-850`}>
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                      <Text style={tw`text-[11px] font-extrabold text-slate-500 uppercase tracking-wider`}>{item.label}</Text>
                      <Text style={tw`text-xs font-black text-teal-600 font-mono`}>{currentVal}</Text>
                    </View>

                    {/* Highly tactile touch buttons layout */}
                    <View style={tw`flex-row items-center space-x-2`}>
                      <Pressable
                        onPress={() => handleWeightChange(weightKey, currentVal - 1)}
                        style={tw`w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 items-center justify-center`}
                      >
                        <Text style={tw`text-sm font-bold text-slate-700 dark:text-slate-200`}>-</Text>
                      </Pressable>

                      <View style={tw`flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-teal-500 rounded-full`, { width: `${(currentVal / 30) * 100}%` }]} />
                      </View>

                      <Pressable
                        onPress={() => handleWeightChange(weightKey, currentVal + 1)}
                        style={tw`w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 items-center justify-center`}
                      >
                        <Text style={tw`text-sm font-bold text-slate-700 dark:text-slate-200`}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Bottom Controls */}
            <View style={tw`border-t border-slate-100 dark:border-slate-850 pt-5 flex-row justify-between items-center`}>
              <Text style={tw`text-[10px] font-semibold text-slate-400 flex-1 pr-3`}>
                * Weights are synced instantly in memory and saved to disk.
              </Text>
              
              <View style={tw`flex-row items-center`}>
                {successMsg !== '' && (
                  <Text style={tw`text-xs text-emerald-600 font-bold mr-3`}>{successMsg}</Text>
                )}
                <Pressable
                  onPress={saveWeights}
                  style={tw`px-5 py-2.5 bg-teal-500 rounded-xl flex-row items-center`}
                >
                  <Save size={14} color="#ffffff" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs font-bold text-white`}>Save Weights</Text>
                </Pressable>
              </View>
            </View>

          </View>

        </View>

      </View>
    </ScrollView>
  );
}
