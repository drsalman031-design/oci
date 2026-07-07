import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { CephalometricInput, PatientDetails } from '../types';
import { Norms } from '../scoringEngine';
import { 
  ArrowLeft, 
  Sparkles, 
  RotateCcw,
  BookOpen,
  ChevronRight,
  Cpu,
  BookmarkCheck,
  CheckCircle2,
  Trash2,
  Zap
} from 'lucide-react-native';
import tw from 'twrnc';
import CephAnalyzer from './CephAnalyzer';

interface CephInputProps {
  initialInput?: CephalometricInput;
  patientDetails: PatientDetails;
  diagnosis: 'Class I' | 'Class II' | 'Class III' | '';
  onCalculate: (input: CephalometricInput) => void;
  onBack: () => void;
  onUpdate?: (input: CephalometricInput) => void;
}

const PRESETS = {
  class1Normal: {
    anb: 2, sna: 82, snb: 80, wits: 0, snMp: 32, fma: 25,
    u1Sn: 104, u1NaDeg: 22, u1NaMm: 4,
    impa: 90, l1NbDeg: 25, l1NbMm: 4,
    interincisalAngle: 135, overjet: 2.5, overbite: 2.5,
    upperLipELine: -2, lowerLipELine: 0, nasolabialAngle: 102, facialConvexity: 12,
    yAxis: 59, coA: 85, coGn: 110,
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
    yAxis: 62, coA: 88, coGn: 106,
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
    yAxis: 56, coA: 81, coGn: 115,
    molarRelation: 'Class III' as const, canineRelation: 'Class III' as const, crossbite: 'Anterior' as const,
    deepBite: 0, openBite: 1, curveOfSpee: 0.5, midlineDeviation: 1.5,
    posteriorCrossbite: 'Unilateral' as const, archWidthDifference: -4, dentalMidlineDev: 2
  }
};

export default function CephInput({ initialInput, patientDetails, diagnosis, onCalculate, onBack, onUpdate }: CephInputProps) {
  const [showAiAnalyzer, setShowAiAnalyzer] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'skeletal' | 'dental' | 'soft' | 'clinical'>('skeletal');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [form, setForm] = useState<CephalometricInput>(initialInput || {
    anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
    u1Sn: '', u1NaDeg: '', u1NaMm: '',
    impa: '', l1NbDeg: '', l1NbMm: '',
    interincisalAngle: '', overjet: '', overbite: '',
    upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '',
    yAxis: '', coA: '', coGn: '',
    molarRelation: '', canineRelation: '', crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
    posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
  });

  const handleApplyAiAnalysis = (computedMeasurements: CephalometricInput) => {
    setForm(computedMeasurements);
    setShowAiAnalyzer(false);
    if (onUpdate) {
      onUpdate(computedMeasurements);
    }
  };

  const handleFieldChange = (key: keyof CephalometricInput, val: any) => {
    setValidationError(null);
    const parsedVal = val === '' ? '' : (typeof val === 'number' || key === 'molarRelation' || key === 'canineRelation' || key === 'crossbite' || key === 'posteriorCrossbite') ? val : Number(val);
    const nextForm = {
      ...form,
      [key]: parsedVal
    };
    setForm(nextForm);
    if (onUpdate) {
      onUpdate(nextForm);
    }
  };

  const applyPreset = (presetType: keyof typeof PRESETS) => {
    setValidationError(null);
    const nextForm = PRESETS[presetType];
    setForm(nextForm);
    if (onUpdate) {
      onUpdate(nextForm);
    }
  };

  const clearForm = () => {
    setValidationError(null);
    const nextForm: CephalometricInput = {
      anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
      u1Sn: '', u1NaDeg: '', u1NaMm: '',
      impa: '', l1NbDeg: '', l1NbMm: '',
      interincisalAngle: '', overjet: '', overbite: '',
      upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '',
      yAxis: '', coA: '', coGn: '',
      molarRelation: '' as any, canineRelation: '' as any, crossbite: '' as any, deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
      posteriorCrossbite: '' as any, archWidthDifference: '', dentalMidlineDev: ''
    };
    setForm(nextForm);
    if (onUpdate) {
      onUpdate(nextForm);
    }
  };

  const handleCalculate = () => {
    const requiredKeys: (keyof CephalometricInput)[] = [
      'sna', 'snb', 'anb', 'wits',
      'u1Sn', 'u1NaDeg', 'u1NaMm',
      'impa', 'l1NbDeg', 'l1NbMm',
      'interincisalAngle', 'overjet', 'overbite',
      'upperLipELine', 'lowerLipELine', 'nasolabialAngle'
    ];

    const missingLabels: string[] = [];
    requiredKeys.forEach(key => {
      if (form[key] === '' || form[key] === undefined) {
        const norm = Norms[key as string];
        missingLabels.push(norm ? norm.label : String(key));
      }
    });

    if (missingLabels.length > 0) {
      setValidationError(`Missing required clinical fields: ${missingLabels.join(', ')}. All 16 measurements are required.`);
      return;
    }

    setValidationError(null);
    onCalculate(form);
  };

  const getDevColorClass = (field: keyof CephalometricInput, val: any) => {
    if (val === '' || val === undefined) return 'text-slate-500';
    const num = Number(val);
    const norm = Norms[field as string];
    if (!norm) return 'text-slate-300';
    if (num < norm.min || num > norm.max) return 'text-amber-400 font-extrabold';
    return 'text-emerald-400 font-extrabold';
  };

  const renderRangeGuide = (field: string) => {
    const norm = Norms[field];
    if (!norm) return null;
    return (
      <Text style={tw`text-[9px] text-slate-500 font-mono mt-1.5`}>
        Ideal range: {norm.min} to {norm.max}{norm.unit} (mean: {norm.mean})
      </Text>
    );
  };

  const renderInputField = (field: keyof CephalometricInput, label: string, isRequired: boolean = false) => {
    const currentVal = form[field];
    const isMissing = isRequired && (currentVal === '' || currentVal === undefined);
    return (
      <View style={tw`space-y-1.5 mb-5 w-full`}>
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={tw`text-[11px] font-bold ${isMissing ? 'text-rose-400' : 'text-slate-300'} tracking-wide`}>
            {label} {isRequired ? '*' : ''}
          </Text>
          {currentVal !== '' && currentVal !== undefined && (
            <Text style={tw`text-xs ${getDevColorClass(field, currentVal)}`}>
              {currentVal}{Norms[field as string]?.unit || ''}
            </Text>
          )}
        </View>
        <TextInput
          value={currentVal === '' || currentVal === undefined ? '' : String(currentVal)}
          onChangeText={(txt) => handleFieldChange(field, txt)}
          keyboardType="numeric"
          placeholder="0.0"
          placeholderTextColor="#475569"
          style={tw`w-full h-13 px-4 bg-black/45 rounded-[18px] border ${isMissing ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 focus:border-[#14B8A6]'} text-white text-xs font-bold`}
        />
        {renderRangeGuide(field as string)}
      </View>
    );
  };

  const renderSelectField = (field: keyof CephalometricInput, label: string, options: string[]) => {
    const currentVal = form[field];
    return (
      <View style={tw`space-y-2 mb-5`}>
        <Text style={tw`text-xs font-bold text-slate-300`}>{label}</Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {options.map((opt) => {
            const isSelected = currentVal === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setForm(prev => ({ ...prev, [field]: opt }))}
                style={tw`px-4 py-3 bg-black/45 rounded-xl border ${isSelected ? 'bg-[#14B8A6] border-teal-400/30' : 'border-white/10'}`}
              >
                <Text style={tw`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  if (showAiAnalyzer) {
    return (
      <CephAnalyzer
        patientDetails={patientDetails}
        onApplyAnalysis={handleApplyAiAnalysis}
        onCancel={() => setShowAiAnalyzer(false)}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={tw`pb-28 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4`}>
        
        {/* Presets and top controls */}
        <View style={tw`bg-[#0B1020]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
          <View>
            <View style={tw`flex-row items-center mb-1`}>
              <Sparkles size={16} color="#14B8A6" style={tw`mr-2`} />
              <Text style={tw`font-extrabold text-sm text-white tracking-wide uppercase`}>Clinical Preset Templates</Text>
            </View>
            <Text style={tw`text-xs text-slate-400`}>Quickly prefill diagnostic index cases for study and preview</Text>
          </View>
          
          <View style={tw`flex-row flex-wrap gap-2`}>
            <Pressable
              onPress={() => applyPreset('class1Normal')}
              style={tw`px-3 py-2 bg-white/5 rounded-xl border border-white/10`}
            >
              <Text style={tw`text-[10px] font-black text-slate-300 uppercase tracking-wider`}>Class I Normal</Text>
            </Pressable>
            
            <Pressable
              onPress={() => applyPreset('class2Compensated')}
              style={tw`px-3 py-2 bg-teal-500/10 rounded-xl border border-teal-500/20`}
            >
              <Text style={tw`text-[10px] font-black text-teal-400 uppercase tracking-wider`}>Class II Comp</Text>
            </Pressable>
            
            <Pressable
              onPress={() => applyPreset('class3Compensated')}
              style={tw`px-3 py-2 bg-[#22D3EE]/10 rounded-xl border border-[#22D3EE]/20`}
            >
              <Text style={tw`text-[10px] font-black text-[#22D3EE] uppercase tracking-wider`}>Class III Comp</Text>
            </Pressable>

            <Pressable
              onPress={clearForm}
              style={tw`p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 items-center justify-center`}
            >
              <Trash2 size={13} color="#F43F5E" />
            </Pressable>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`h-1.5 w-full bg-white/5 rounded-full overflow-hidden`}>
          <View style={tw`h-full w-full bg-[#14B8A6] rounded-full`} />
        </View>

        {/* Form panel */}
        <View style={tw`bg-[#0B1020]/90 rounded-[28px] border border-white/5 shadow-2xl overflow-hidden`}>
          
          {/* Header */}
          <View style={tw`bg-black/30 p-5 flex-row justify-between items-center border-b border-white/5`}>
            <View style={tw`space-y-1`}>
              <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-1`}>
                <BookmarkCheck size={11} color="#22D3EE" style={tw`mr-1.5`} />
                <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-wider font-mono`}>Step 2 of 2 • Parameter Intake</Text>
              </View>
              <Text style={tw`text-lg font-black text-white`}>Measurements</Text>
              {diagnosis ? (
                <Text style={tw`text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider`}>
                  Pattern: Skeletal {diagnosis}
                </Text>
              ) : null}
            </View>
            
            <Pressable 
              onPress={onBack}
              style={tw`flex-row items-center bg-white/5 px-3.5 py-2 rounded-xl border border-white/10`}
            >
              <ArrowLeft size={13} color="#ffffff" style={tw`mr-1.5`} />
              <Text style={tw`text-xs font-bold text-white uppercase tracking-wider`}>Back</Text>
            </Pressable>
          </View>

          {/* Tab buttons */}
          <View style={tw`flex-row bg-[#050814]/45 border-b border-white/5`}>
            {[
              { id: 'skeletal', label: 'Skeletal' },
              { id: 'dental', label: 'Dental' },
              { id: 'soft', label: 'Soft Tissue' },
              { id: 'clinical', label: 'Dentition' }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as any)}
                  style={tw`flex-1 py-4 items-center border-b-2 ${isSelected ? 'border-[#14B8A6] bg-white/5' : 'border-transparent'}`}
                >
                  <Text style={tw`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-teal-400' : 'text-slate-400'}`}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          <View style={tw`p-6 min-h-[380px]`}>
            {activeTab === 'skeletal' && (
              <View style={tw`space-y-4`}>
                <View style={tw`bg-teal-500/5 p-4 rounded-2xl border border-teal-500/10 flex-row items-start mb-4`}>
                  <BookOpen size={14} color="#14B8A6" style={tw`mr-2.5 mt-0.5 shrink-0`} />
                  <Text style={tw`text-[11px] text-slate-300 leading-relaxed flex-1`}>
                    Skeletal factors outline the underlying bone configuration of the maxilla and mandible. Natural tooth tilt compensation masks this true discrepancy.
                  </Text>
                </View>

                {renderInputField('anb', 'ANB Angle (°)', true)}
                {renderInputField('sna', 'SNA Angle (°)', true)}
                {renderInputField('snb', 'SNB Angle (°)', true)}
                {renderInputField('wits', 'Wits Appraisal (mm)', true)}
                {renderInputField('snMp', 'SN-MP Angle (°)', false)}
                {renderInputField('fma', 'FMA Angle (°)', false)}
                {renderInputField('yAxis', 'Y-Axis Angle (°)', false)}
                {renderInputField('coA', 'Co-A Length (mm)', false)}
                {renderInputField('coGn', 'Co-Gn Length (mm)', false)}
              </View>
            )}

            {activeTab === 'dental' && (
              <View style={tw`space-y-4`}>
                {renderInputField('u1Sn', 'U1-SN Angle (°)', true)}
                {renderInputField('u1NaDeg', 'U1-NA Angle (°)', true)}
                {renderInputField('u1NaMm', 'U1-NA Dist (mm)', true)}
                {renderInputField('impa', 'L1-MP Angle (IMPA) (°)', true)}
                {renderInputField('l1NbDeg', 'L1-NB Angle (°)', true)}
                {renderInputField('l1NbMm', 'L1-NB Dist (mm)', true)}
                {renderInputField('interincisalAngle', 'Interincisal Angle (°)', true)}
                {renderInputField('overjet', 'Overjet (mm)', true)}
                {renderInputField('overbite', 'Overbite (mm or %)', true)}
              </View>
            )}

            {activeTab === 'soft' && (
              <View style={tw`space-y-4`}>
                {renderInputField('upperLipELine', 'Upper Lip to E-Line (mm)', true)}
                {renderInputField('lowerLipELine', 'Lower Lip to E-Line (mm)', true)}
                {renderInputField('nasolabialAngle', 'Nasolabial Angle (°)', true)}
                {renderInputField('facialConvexity', 'Facial Convexity (°)', false)}
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

          {validationError && (
            <View style={tw`mx-6 mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl`}>
              <Text style={tw`text-rose-400 text-xs font-bold leading-relaxed font-mono`}>{validationError}</Text>
            </View>
          )}

          {/* Footer Actions */}
          <View style={tw`bg-black/30 p-5 border-t border-white/5 flex-row justify-between items-center`}>
            <View style={tw`flex-row space-x-1.5`}>
              {['skeletal', 'dental', 'soft', 'clinical'].map((tab) => (
                <View 
                  key={tab} 
                  style={tw`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-teal-400' : 'bg-slate-700'}`} 
                />
              ))}
            </View>
            
            <View style={tw`flex-row space-x-2.5`}>
              <Pressable
                onPress={onBack}
                style={tw`px-4 py-3 bg-white/5 border border-white/10 rounded-2xl items-center`}
              >
                <Text style={tw`text-xs font-black text-slate-400 uppercase tracking-widest`}>Back</Text>
              </Pressable>
              
              <Pressable
                onPress={handleCalculate}
                style={({ pressed }) => [
                  tw`px-5 py-3 bg-[#14B8A6] rounded-2xl flex-row items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30`,
                  pressed ? tw`opacity-90 scale-98` : null
                ]}
              >
                <Text style={tw`text-white font-black text-xs uppercase tracking-widest mr-1.5`}>Solve OCI</Text>
                <CheckCircle2 size={14} color="#ffffff" />
              </Pressable>
            </View>
          </View>

        </View>

      </View>
    </ScrollView>
  );
}
