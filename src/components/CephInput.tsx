import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { CephalometricInput } from '../types';
import { Norms } from '../scoringEngine';
import { 
  ArrowLeft, 
  Sparkles, 
  RotateCcw,
  BookOpen
} from 'lucide-react-native';
import tw from 'twrnc';

interface CephInputProps {
  initialInput?: CephalometricInput;
  diagnosis: 'Class I' | 'Class II' | 'Class III' | '';
  onCalculate: (input: CephalometricInput) => void;
  onBack: () => void;
}

const PRESETS = {
  class1Normal: {
    anb: 2, sna: 82, snb: 80, wits: 0, snMp: 32, fma: 25,
    u1Sn: 104, u1NaDeg: 22, u1NaMm: 4,
    impa: 90, l1NbDeg: 25, l1NbMm: 4,
    interincisalAngle: 135, overjet: 2.5, overbite: 2.5,
    upperLipELine: -2, lowerLipELine: 0, nasolabialAngle: 102, facialConvexity: 12,
    molarRelation: 'Class I' as const, canineRelation: 'Class I' as const, crossbite: 'None' as const,
    deepBite: 2, openBite: 0, curveOfSpee: 1, midlineDeviation: 0,
    posteriorCrossbite: 'None' as const, archWidthDifference: 0, dentalMidlineDev: 0
  },
  class2Compensated: {
    anb: 8, sna: 86, snb: 78, wits: 6, snMp: 36, fma: 28,
    u1Sn: 92, u1NaDeg: 12, u1NaMm: 1.5,
    impa: 102, l1NbDeg: 34, l1NbMm: 7,
    interincisalAngle: 145, overjet: 3.5, overbite: 4.5,
    upperLipELine: 1, lowerLipELine: 3, nasolabialAngle: 90, facialConvexity: 22,
    molarRelation: 'Class II' as const, canineRelation: 'Class II' as const, crossbite: 'None' as const,
    deepBite: 5, openBite: 0, curveOfSpee: 3, midlineDeviation: 1,
    posteriorCrossbite: 'None' as const, archWidthDifference: -1, dentalMidlineDev: 0.5
  },
  class3Compensated: {
    anb: -4, sna: 78, snb: 82, wits: -7, snMp: 29, fma: 22,
    u1Sn: 118, u1NaDeg: 36, u1NaMm: 8.5,
    impa: 76, l1NbDeg: 14, l1NbMm: 1,
    interincisalAngle: 122, overjet: 1.0, overbite: 0.5,
    upperLipELine: -5, lowerLipELine: 2, nasolabialAngle: 115, facialConvexity: 3,
    molarRelation: 'Class III' as const, canineRelation: 'Class III' as const, crossbite: 'Anterior' as const,
    deepBite: 0, openBite: 1, curveOfSpee: 0.5, midlineDeviation: 1.5,
    posteriorCrossbite: 'Unilateral' as const, archWidthDifference: -4, dentalMidlineDev: 2
  }
};

export default function CephInput({ initialInput, diagnosis, onCalculate, onBack }: CephInputProps) {
  const [activeTab, setActiveTab] = useState<'skeletal' | 'dental' | 'soft' | 'clinical'>('skeletal');
  const [form, setForm] = useState<CephalometricInput>(initialInput || {
    anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
    u1Sn: '', u1NaDeg: '', u1NaMm: '',
    impa: '', l1NbDeg: '', l1NbMm: '',
    interincisalAngle: '', overjet: '', overbite: '',
    upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '',
    molarRelation: '', canineRelation: '', crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
    posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
  });

  const handleFieldChange = (key: keyof CephalometricInput, val: any) => {
    setForm(prev => ({
      ...prev,
      [key]: val === '' ? '' : Number(val)
    }));
  };

  const applyPreset = (presetType: keyof typeof PRESETS) => {
    setForm(PRESETS[presetType]);
  };

  const clearForm = () => {
    setForm({
      anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
      u1Sn: '', u1NaDeg: '', u1NaMm: '',
      impa: '', l1NbDeg: '', l1NbMm: '',
      interincisalAngle: '', overjet: '', overbite: '',
      upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '',
      molarRelation: '', canineRelation: '', crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
      posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
    });
  };

  const handleCalculate = () => {
    onCalculate(form);
  };

  const getDevColor = (field: keyof CephalometricInput, val: any) => {
    if (val === '' || val === undefined) return 'text-slate-400';
    const num = Number(val);
    const norm = Norms[field as string];
    if (!norm) return 'text-slate-700 dark:text-slate-300';
    if (num < norm.min || num > norm.max) return 'text-amber-600 font-bold';
    return 'text-teal-600 font-bold';
  };

  const renderRangeGuide = (field: string) => {
    const norm = Norms[field];
    if (!norm) return null;
    return (
      <Text style={tw`text-[10px] text-slate-400 font-mono mt-0.5`}>
        Normal: {norm.min} to {norm.max}{norm.unit} (Mean: {norm.mean})
      </Text>
    );
  };

  const renderInputField = (field: keyof CephalometricInput, label: string) => {
    const currentVal = form[field];
    return (
      <View style={tw`space-y-1 mb-4 w-full`}>
        <View style={tw`flex-row justify-between mb-1`}>
          <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide`}>{label}</Text>
          <Text style={tw`text-xs ${getDevColor(field, currentVal)}`}>
            {currentVal !== '' && currentVal !== undefined ? `${currentVal}` : 'Empty'}
          </Text>
        </View>
        <TextInput
          value={currentVal === '' || currentVal === undefined ? '' : String(currentVal)}
          onChangeText={(txt) => handleFieldChange(field, txt)}
          keyboardType="numeric"
          placeholder="e.g. 0.0"
          placeholderTextColor="#94a3b8"
          style={tw`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm`}
        />
        {renderRangeGuide(field as string)}
      </View>
    );
  };

  const renderSelectField = (field: keyof CephalometricInput, label: string, options: string[]) => {
    const currentVal = form[field];
    return (
      <View style={tw`space-y-1.5 mb-4`}>
        <Text style={tw`text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1`}>{label}</Text>
        <View style={tw`flex-row flex-wrap gap-1.5`}>
          {options.map((opt) => {
            const isSelected = currentVal === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setForm(prev => ({ ...prev, [field]: opt }))}
                style={tw`px-3 py-2 rounded-xl border ${isSelected ? 'bg-teal-500 border-teal-500' : 'bg-transparent border-slate-200 dark:border-slate-700'}`}
              >
                <Text style={tw`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-12 px-4 max-w-4xl w-full mx-auto`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Presets and top controls */}
        <View style={tw`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4`}>
          <View>
            <View style={tw`flex-row items-center mb-1`}>
              <Sparkles size={16} color="#0d9488" style={tw`mr-1.5`} />
              <Text style={tw`font-extrabold text-sm text-slate-800 dark:text-slate-100`}>Clinical Presets</Text>
            </View>
            <Text style={tw`text-xs text-slate-400`}>Quickly prefill diagnostic archetypes to evaluate scoring</Text>
          </View>
          <View style={tw`flex-row flex-wrap gap-2`}>
            <Pressable
              onPress={() => applyPreset('class1Normal')}
              style={tw`px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700`}
            >
              <Text style={tw`text-[11px] font-bold text-slate-700 dark:text-slate-300`}>Normal Class I</Text>
            </Pressable>
            
            <Pressable
              onPress={() => applyPreset('class2Compensated')}
              style={tw`px-3 py-1.5 bg-teal-500/10 rounded-lg border border-teal-500/20`}
            >
              <Text style={tw`text-[11px] font-bold text-teal-600 dark:text-teal-400`}>Class II Compensated</Text>
            </Pressable>
            
            <Pressable
              onPress={() => applyPreset('class3Compensated')}
              style={tw`px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20`}
            >
              <Text style={tw`text-[11px] font-bold text-blue-600 dark:text-blue-400`}>Class III Compensated</Text>
            </Pressable>

            <Pressable
              onPress={clearForm}
              style={tw`p-2 bg-red-500/10 rounded-lg border border-red-500/20`}
            >
              <RotateCcw size={14} color="#f87171" />
            </Pressable>
          </View>
        </View>

        {/* Form panel */}
        <View style={tw`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden`}>
          {/* Header */}
          <View style={tw`bg-slate-950 p-6 flex-row justify-between items-center`}>
            <View>
              <Text style={tw`text-[10px] font-mono text-teal-400 uppercase tracking-widest`}>Step 2 of 2</Text>
              <Text style={tw`text-lg font-bold text-white`}>Cephalometric Parameters</Text>
              {diagnosis ? (
                <Text style={tw`text-[10px] text-teal-300 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-full mt-1.5 self-start border border-teal-500/20`}>
                  Diagnosis: {diagnosis}
                </Text>
              ) : null}
            </View>
            <Pressable 
              onPress={onBack}
              style={tw`flex-row items-center bg-white/10 px-3 py-1.5 rounded-xl border border-white/10`}
            >
              <ArrowLeft size={14} color="#ffffff" style={tw`mr-1`} />
              <Text style={tw`text-xs font-bold text-white`}>Back</Text>
            </Pressable>
          </View>

          {/* Tab buttons */}
          <View style={tw`flex-row bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto`}>
            {[
              { id: 'skeletal', label: '1. Skeletal' },
              { id: 'dental', label: '2. Dental' },
              { id: 'soft', label: '3. Soft' },
              { id: 'clinical', label: '4. Clinical' }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as any)}
                  style={tw`flex-1 py-3 items-center border-b-2 ${isSelected ? 'border-teal-500 bg-white dark:bg-slate-900' : 'border-transparent'}`}
                >
                  <Text style={tw`text-xs font-extrabold ${isSelected ? 'text-teal-500' : 'text-slate-400'}`}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          <View style={tw`p-6 min-h-[350px]`}>
            {activeTab === 'skeletal' && (
              <View style={tw`space-y-4`}>
                <View style={tw`bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex-row items-start mb-2`}>
                  <BookOpen size={16} color="#0d9488" style={tw`mr-2 mt-0.5 shrink-0`} />
                  <Text style={tw`text-xs text-slate-500 leading-relaxed flex-1`}>
                    Skeletal assessment evaluates the basic sagittal & vertical bony relations. Under-compensated Class II/III skeletal patterns carry significant pre-treatment therapeutic camouflage challenges.
                  </Text>
                </View>

                {renderInputField('anb', 'ANB Angle (°) *')}
                {renderInputField('sna', 'SNA Angle (°)')}
                {renderInputField('snb', 'SNB Angle (°)')}
                {renderInputField('wits', 'Wits Appraisal (mm)')}
                {renderInputField('snMp', 'SN-MP Angle (°)')}
                {renderInputField('fma', 'FMA (Y-Axis/Tweed) (°)')}
              </View>
            )}

            {activeTab === 'dental' && (
              <View style={tw`space-y-4`}>
                {renderInputField('u1Sn', 'U1-SN Angle (°) *')}
                {renderInputField('u1NaDeg', 'U1-NA Angle (°)')}
                {renderInputField('u1NaMm', 'U1-NA Distance (mm)')}
                {renderInputField('impa', 'L1-MP Angle (IMPA) (°) *')}
                {renderInputField('l1NbDeg', 'L1-NB Angle (°)')}
                {renderInputField('l1NbMm', 'L1-NB Distance (mm)')}
                {renderInputField('interincisalAngle', 'Interincisal Angle (°) *')}
                {renderInputField('overjet', 'Overjet (mm) *')}
                {renderInputField('overbite', 'Overbite (mm)')}
              </View>
            )}

            {activeTab === 'soft' && (
              <View style={tw`space-y-4`}>
                {renderInputField('upperLipELine', 'Upper Lip to E-Line (mm)')}
                {renderInputField('lowerLipELine', 'Lower Lip to E-Line (mm)')}
                {renderInputField('nasolabialAngle', 'Nasolabial Angle (°)')}
                {renderInputField('facialConvexity', 'Facial Convexity (°)')}
              </View>
            )}

            {activeTab === 'clinical' && (
              <View style={tw`space-y-4`}>
                {renderSelectField('molarRelation', 'Molar Relation', ['Class I', 'Class II', 'Class III'])}
                {renderSelectField('canineRelation', 'Canine Relation', ['Class I', 'Class II', 'Class III'])}
                {renderSelectField('crossbite', 'Anterior Crossbite', ['None', 'Anterior', 'Posterior', 'Single Tooth'])}
                {renderSelectField('posteriorCrossbite', 'Posterior Crossbite', ['None', 'Unilateral', 'Bilateral'])}
                
                {renderInputField('deepBite', 'Deep Bite (mm)')}
                {renderInputField('openBite', 'Open Bite (mm)')}
                {renderInputField('curveOfSpee', 'Curve of Spee (mm)')}
                {renderInputField('archWidthDifference', 'Arch Width Diff (mm)')}
                {renderInputField('dentalMidlineDev', 'Dental Midline Dev (mm)')}
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={tw`bg-slate-50 dark:bg-slate-950 p-6 border-t border-slate-200 dark:border-slate-800 flex-row justify-between items-center`}>
            <View style={tw`flex-row space-x-1.5`}>
              {['skeletal', 'dental', 'soft', 'clinical'].map((tab) => (
                <View 
                  key={tab} 
                  style={tw`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-800'}`} 
                />
              ))}
            </View>
            
            <View style={tw`flex-row space-x-3`}>
              <Pressable
                onPress={onBack}
                style={tw`px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl`}
              >
                <Text style={tw`text-xs font-bold text-slate-600 dark:text-slate-400`}>Back</Text>
              </Pressable>
              
              <Pressable
                onPress={handleCalculate}
                style={tw`px-5 py-2.5 bg-teal-500 rounded-xl shadow-md`}
              >
                <Text style={tw`text-xs font-bold text-white`}>Calculate OCI</Text>
              </Pressable>
            </View>
          </View>

        </View>

      </View>
    </ScrollView>
  );
}
