import React, { useState } from 'react';
import { CephalometricInput } from '../types';
import { Norms } from '../scoringEngine';
import { 
  ArrowLeft, 
  HelpCircle, 
  Sparkles, 
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface CephInputProps {
  initialInput?: CephalometricInput;
  diagnosis: 'Class I' | 'Class II' | 'Class III' | '';
  onCalculate: (input: CephalometricInput) => void;
  onBack: () => void;
}

// Preset values for demonstrating OCI calculation easily
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
    u1Sn: 92, u1NaDeg: 12, u1NaMm: 1.5, // retroclined upper incisors to compensate
    impa: 102, l1NbDeg: 34, l1NbMm: 7, // proclined lower incisors to reach overjet
    interincisalAngle: 145, overjet: 3.5, overbite: 4.5, // moderately compensated OJ
    upperLipELine: 1, lowerLipELine: 3, nasolabialAngle: 90, facialConvexity: 22,
    molarRelation: 'Class II' as const, canineRelation: 'Class II' as const, crossbite: 'None' as const,
    deepBite: 5, openBite: 0, curveOfSpee: 3, midlineDeviation: 1,
    posteriorCrossbite: 'None' as const, archWidthDifference: -1, dentalMidlineDev: 0.5
  },
  class3Compensated: {
    anb: -4, sna: 78, snb: 82, wits: -7, snMp: 29, fma: 22,
    u1Sn: 118, u1NaDeg: 36, u1NaMm: 8.5, // extreme proclined upper incisors to reach positive overjet
    impa: 76, l1NbDeg: 14, l1NbMm: 1, // extremely retroclined lower incisors
    interincisalAngle: 122, overjet: 1.0, overbite: 0.5, // barely positive overjet!
    upperLipELine: -5, lowerLipELine: 2, nasolabialAngle: 115, facialConvexity: 3,
    molarRelation: 'Class III' as const, canineRelation: 'Class III' as const, crossbite: 'Anterior' as const,
    deepBite: 0, openBite: 1, curveOfSpee: 0.5, midlineDeviation: 1.5,
    posteriorCrossbite: 'Unilateral' as const, archWidthDifference: -4, dentalMidlineDev: 2
  }
};

export default function CephInput({ initialInput, diagnosis, onCalculate, onBack }: CephInputProps) {
  // Setup forms
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
      [key]: val
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(form);
  };

  // Helper to render normal ranges inline with validation alert
  const renderRangeGuide = (field: string) => {
    const norm = Norms[field];
    if (!norm) return null;
    return (
      <span className="text-[10px] text-slate-400 font-mono">
        Normal: {norm.min} to {norm.max}{norm.unit} (Mean: {norm.mean})
      </span>
    );
  };

  const getDevColor = (field: keyof CephalometricInput, val: any) => {
    if (val === '') return 'text-slate-400';
    const num = Number(val);
    const norm = Norms[field as string];
    if (!norm) return 'text-slate-700 dark:text-slate-300';
    if (num < norm.min || num > norm.max) return 'text-amber-600 font-semibold';
    return 'text-teal-600 font-semibold';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top controls and presets */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            <span>Clinical Presets</span>
          </h3>
          <p className="text-xs text-slate-500">Quickly prefill diagnostic archetypes to evaluate scoring behavior</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('class1Normal')}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            Normal Class I
          </button>
          <button
            type="button"
            onClick={() => applyPreset('class2Compensated')}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-900 transition cursor-pointer"
          >
            Class II Compensated
          </button>
          <button
            type="button"
            onClick={() => applyPreset('class3Compensated')}
            className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-lg text-xs font-semibold border border-teal-200 dark:border-teal-900 transition cursor-pointer"
          >
            Class III Compensated
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs border border-red-200 transition cursor-pointer"
            title="Clear all fields"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-8 py-6 text-white border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-teal-400 font-mono">Step 2 of 2</span>
            <h2 className="text-2xl font-bold tracking-tight">Cephalometric & Clinical Parameters</h2>
            {diagnosis && (
              <span className="inline-block mt-1.5 bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-400/25">
                Target Pattern: {diagnosis}
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition cursor-pointer flex items-center space-x-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Patient Info</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50 dark:bg-slate-950">
          {[
            { id: 'skeletal', label: '1. Skeletal (Sagittal/Vertical)' },
            { id: 'dental', label: '2. Dental (Incisors / Joint)' },
            { id: 'soft', label: '3. Soft Tissue & Profile' },
            { id: 'clinical', label: '4. Occlusion & Transverse' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 border-b-2 font-semibold text-xs uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <div className="p-8 min-h-[350px]">
          {activeTab === 'skeletal' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-start space-x-3 text-xs text-slate-500 leading-relaxed border border-slate-100 dark:border-slate-800">
                <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
                <p>
                  **Skeletal assessment** evaluates basic sagitto-vertical bony discrepancies. Under-compensated cases with massive skeletal disharmony but normal overjets indicate extreme natural compensation. Use standard Steiner, Tweed, and Downs landmarks.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ANB */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>ANB Angle (°) *</span>
                    <span className={getDevColor('anb', form.anb)}>
                      {form.anb !== '' ? `${form.anb}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.anb}
                    onChange={(e) => handleFieldChange('anb', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('anb')}
                </div>

                {/* SNA */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>SNA Angle (°)</span>
                    <span className={getDevColor('sna', form.sna)}>
                      {form.sna !== '' ? `${form.sna}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.sna}
                    onChange={(e) => handleFieldChange('sna', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('sna')}
                </div>

                {/* SNB */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>SNB Angle (°)</span>
                    <span className={getDevColor('snb', form.snb)}>
                      {form.snb !== '' ? `${form.snb}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.snb}
                    onChange={(e) => handleFieldChange('snb', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('snb')}
                </div>

                {/* Wits */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Wits Appraisal (mm)</span>
                    <span className={getDevColor('wits', form.wits)}>
                      {form.wits !== '' ? `${form.wits}mm` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.wits}
                    onChange={(e) => handleFieldChange('wits', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('wits')}
                </div>

                {/* SN-MP */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>SN-MP Angle (°)</span>
                    <span className={getDevColor('snMp', form.snMp)}>
                      {form.snMp !== '' ? `${form.snMp}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.snMp}
                    onChange={(e) => handleFieldChange('snMp', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('snMp')}
                </div>

                {/* FMA */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>FMA (°)</span>
                    <span className={getDevColor('fma', form.fma)}>
                      {form.fma !== '' ? `${form.fma}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.fma}
                    onChange={(e) => handleFieldChange('fma', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('fma')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dental' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* U1-SN */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>U1-SN Angle (°)</span>
                    <span className={getDevColor('u1Sn', form.u1Sn)}>
                      {form.u1Sn !== '' ? `${form.u1Sn}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.u1Sn}
                    onChange={(e) => handleFieldChange('u1Sn', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('u1Sn')}
                </div>

                {/* IMPA */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>IMPA Angle (°)</span>
                    <span className={getDevColor('impa', form.impa)}>
                      {form.impa !== '' ? `${form.impa}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.impa}
                    onChange={(e) => handleFieldChange('impa', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('impa')}
                </div>

                {/* U1-NA Deg */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>U1-NA Angle (°)</span>
                    <span className={getDevColor('u1NaDeg', form.u1NaDeg)}>
                      {form.u1NaDeg !== '' ? `${form.u1NaDeg}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.u1NaDeg}
                    onChange={(e) => handleFieldChange('u1NaDeg', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('u1NaDeg')}
                </div>

                {/* L1-NB Deg */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>L1-NB Angle (°)</span>
                    <span className={getDevColor('l1NbDeg', form.l1NbDeg)}>
                      {form.l1NbDeg !== '' ? `${form.l1NbDeg}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.l1NbDeg}
                    onChange={(e) => handleFieldChange('l1NbDeg', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('l1NbDeg')}
                </div>

                {/* U1-NA mm */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>U1-NA Distance (mm)</span>
                    <span className={getDevColor('u1NaMm', form.u1NaMm)}>
                      {form.u1NaMm !== '' ? `${form.u1NaMm}mm` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.u1NaMm}
                    onChange={(e) => handleFieldChange('u1NaMm', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('u1NaMm')}
                </div>

                {/* L1-NB mm */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>L1-NB Distance (mm)</span>
                    <span className={getDevColor('l1NbMm', form.l1NbMm)}>
                      {form.l1NbMm !== '' ? `${form.l1NbMm}mm` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.l1NbMm}
                    onChange={(e) => handleFieldChange('l1NbMm', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('l1NbMm')}
                </div>

                {/* Interincisal Angle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Interincisal Angle (°) *</span>
                    <span className={getDevColor('interincisalAngle', form.interincisalAngle)}>
                      {form.interincisalAngle !== '' ? `${form.interincisalAngle}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.interincisalAngle}
                    onChange={(e) => handleFieldChange('interincisalAngle', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('interincisalAngle')}
                </div>

                {/* Overjet */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Overjet (mm) *</span>
                    <span className={getDevColor('overjet', form.overjet)}>
                      {form.overjet !== '' ? `${form.overjet}mm` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.overjet}
                    onChange={(e) => handleFieldChange('overjet', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('overjet')}
                </div>

                {/* Overbite */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Overbite (mm)</span>
                    <span className={getDevColor('overbite', form.overbite)}>
                      {form.overbite !== '' ? `${form.overbite}mm` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.overbite}
                    onChange={(e) => handleFieldChange('overbite', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('overbite')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'soft' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upper Lip to E-line */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Upper Lip to E-Line (mm)</span>
                    <span className={getDevColor('upperLipELine', form.upperLipELine)}>
                      {form.upperLipELine !== '' ? `${form.upperLipELine}mm` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.upperLipELine}
                    onChange={(e) => handleFieldChange('upperLipELine', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('upperLipELine')}
                </div>

                {/* Lower Lip to E-line */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Lower Lip to E-Line (mm)</span>
                    <span className={getDevColor('lowerLipELine', form.lowerLipELine)}>
                      {form.lowerLipELine !== '' ? `${form.lowerLipELine}mm` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.lowerLipELine}
                    onChange={(e) => handleFieldChange('lowerLipELine', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('lowerLipELine')}
                </div>

                {/* Nasolabial Angle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Nasolabial Angle (°)</span>
                    <span className={getDevColor('nasolabialAngle', form.nasolabialAngle)}>
                      {form.nasolabialAngle !== '' ? `${form.nasolabialAngle}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.nasolabialAngle}
                    onChange={(e) => handleFieldChange('nasolabialAngle', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('nasolabialAngle')}
                </div>

                {/* Facial Convexity */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Facial Convexity (°)</span>
                    <span className={getDevColor('facialConvexity', form.facialConvexity)}>
                      {form.facialConvexity !== '' ? `${form.facialConvexity}°` : 'Unentered'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.facialConvexity}
                    onChange={(e) => handleFieldChange('facialConvexity', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                  {renderRangeGuide('facialConvexity')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinical' && (
            <div className="space-y-6">
              {/* Category selector fields & millimeter inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Molar Relation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Molar Relation
                  </label>
                  <select
                    value={form.molarRelation}
                    onChange={(e) => handleFieldChange('molarRelation', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  >
                    <option value="" className="dark:bg-slate-900">Unselected</option>
                    <option value="Class I" className="dark:bg-slate-900">Class I</option>
                    <option value="Class II" className="dark:bg-slate-900">Class II</option>
                    <option value="Class III" className="dark:bg-slate-900">Class III</option>
                  </select>
                </div>

                {/* Canine Relation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Canine Relation
                  </label>
                  <select
                    value={form.canineRelation}
                    onChange={(e) => handleFieldChange('canineRelation', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  >
                    <option value="" className="dark:bg-slate-900">Unselected</option>
                    <option value="Class I" className="dark:bg-slate-900">Class I</option>
                    <option value="Class II" className="dark:bg-slate-900">Class II</option>
                    <option value="Class III" className="dark:bg-slate-900">Class III</option>
                  </select>
                </div>

                {/* Crossbite */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Crossbite Presence
                  </label>
                  <select
                    value={form.crossbite}
                    onChange={(e) => handleFieldChange('crossbite', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  >
                    <option value="" className="dark:bg-slate-900">Unselected</option>
                    <option value="None" className="dark:bg-slate-900">None</option>
                    <option value="Anterior" className="dark:bg-slate-900">Anterior</option>
                    <option value="Posterior" className="dark:bg-slate-900">Posterior</option>
                    <option value="Single Tooth" className="dark:bg-slate-900">Single Tooth</option>
                  </select>
                </div>

                {/* Posterior Crossbite */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Posterior Crossbite
                  </label>
                  <select
                    value={form.posteriorCrossbite}
                    onChange={(e) => handleFieldChange('posteriorCrossbite', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  >
                    <option value="" className="dark:bg-slate-900">Unselected</option>
                    <option value="None" className="dark:bg-slate-900">None</option>
                    <option value="Unilateral" className="dark:bg-slate-900">Unilateral</option>
                    <option value="Bilateral" className="dark:bg-slate-900">Bilateral</option>
                  </select>
                </div>

                {/* Deep Bite mm */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Deep Bite (mm)</span>
                    <span className="text-teal-600 font-mono text-xs">{form.deepBite !== '' ? `${form.deepBite}mm` : ''}</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.deepBite}
                    onChange={(e) => handleFieldChange('deepBite', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    placeholder="e.g. 2"
                  />
                </div>

                {/* Open Bite mm */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Open Bite (mm)</span>
                    <span className="text-teal-600 font-mono text-xs">{form.openBite !== '' ? `${form.openBite}mm` : ''}</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.openBite}
                    onChange={(e) => handleFieldChange('openBite', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    placeholder="e.g. 0"
                  />
                </div>

                {/* Curve of Spee */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Curve of Spee (mm)</span>
                    <span className="text-teal-600 font-mono text-xs">{form.curveOfSpee !== '' ? `${form.curveOfSpee}mm` : ''}</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.curveOfSpee}
                    onChange={(e) => handleFieldChange('curveOfSpee', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    placeholder="e.g. 1.5"
                  />
                </div>

                {/* Arch Width Difference */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Arch Width Difference (mm)</span>
                    <span className="text-teal-600 font-mono text-xs">{form.archWidthDifference !== '' ? `${form.archWidthDifference}mm` : ''}</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.archWidthDifference}
                    onChange={(e) => handleFieldChange('archWidthDifference', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    placeholder="Maxilla minus Mandible"
                  />
                </div>

                {/* Dental Midline Deviation */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                    <span>Dental Midline Deviation (mm)</span>
                    <span className="text-teal-600 font-mono text-xs">{form.dentalMidlineDev !== '' ? `${form.dentalMidlineDev}mm` : ''}</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.dentalMidlineDev}
                    onChange={(e) => handleFieldChange('dentalMidlineDev', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    placeholder="e.g. 0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-950 px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-3 items-center">
          <div className="flex space-x-1">
            {['skeletal', 'dental', 'soft', 'clinical'].map((tab) => (
              <div 
                key={tab} 
                className={`w-2.5 h-2.5 rounded-full ${activeTab === tab ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} 
              />
            ))}
          </div>
          
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 sm:flex-initial px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-medium text-xs transition cursor-pointer"
            >
              Back to Patient Info
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-teal-500/10"
            >
              <span>Calculate OCI Score</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
