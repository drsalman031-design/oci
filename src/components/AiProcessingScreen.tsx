import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Animated, StyleSheet, ScrollView } from 'react-native';
import { Sparkles, Brain, CheckCircle, ShieldCheck } from 'lucide-react-native';
import tw from 'twrnc';

interface AiProcessingScreenProps {
  patientName: string;
  onComplete: () => void;
}

const STAGES = [
  'Scanning image quality & auto-enhancing contrast...',
  'Detecting craniofacial anatomical landmarks (S, N, A, B, Go, Me)...',
  'Constructing cephalometric planes (SN, mandibular, FH, occlusal)...',
  'Measuring skeletal vectors (SNA, SNB, ANB, FMA, IMPA, Wits)...',
  'Analyzing dental occlusion & incisor compensation ratios...',
  'Calculating OCI (Orthodontic Compensation Index) severity score...',
  'Synthesizing primary & secondary skeletal diagnoses...',
  'Formulating pointwise orthodontic treatment objectives...',
  'Drafting retention protocol & risk prediction matrix...',
  'Compiling final clinical diagnostics report...'
];

export default function AiProcessingScreen({ patientName, onComplete }: AiProcessingScreenProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Elegant pulse effect on the core brain icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();

    // Rotate through processing stages to simulate active AI tracing
    const interval = setInterval(() => {
      setCurrentStageIdx(prev => {
        if (prev >= STAGES.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[tw`flex-1 bg-white items-center justify-center p-6`, StyleSheet.absoluteFill]}>
      {/* Background glowing gradients */}
      <View style={tw`absolute w-96 h-96 rounded-full bg-teal-500/5 blur-3xl`} />

      <View style={tw`max-w-md w-full items-center z-10 space-y-6`}>
        
        {/* Glowing Brain Core */}
        <Animated.View style={[
          tw`w-28 h-28 bg-teal-50 rounded-[32px] items-center justify-center border border-teal-100 shadow-sm mb-2`,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <Brain size={44} color="#14B8A6" />
        </Animated.View>

        {/* Title */}
        <View style={tw`items-center space-y-1.5`}>
          <View style={tw`flex-row items-center bg-teal-50 border border-teal-100 px-3 py-1 rounded-full`}>
            <Sparkles size={11} color="#0D9488" style={tw`mr-1.5`} />
            <Text style={tw`text-[#0D9488] text-[9px] font-black uppercase tracking-wider`}>
              OCI Autonomous Diagnostic Tracing
            </Text>
          </View>
          <Text style={tw`text-2xl font-black text-slate-900 tracking-tight`}>
            Analyzing {patientName || 'Patient'}
          </Text>
          <Text style={tw`text-xs text-slate-500 text-center px-4 leading-normal`}>
            OrthoPilot AI is running automatic landmark tracing and skeletal sagittal relationship mappings. Please do not close the app.
          </Text>
        </View>

        {/* Active Stage Tracker */}
        <View style={tw`w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-3`}>
          <View style={tw`flex-row justify-between items-center border-b border-slate-200/60 pb-3`}>
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>
              Tracing Pipeline
            </Text>
            <View style={tw`flex-row items-center space-x-1.5`}>
              <ActivityIndicator size="small" color="#14B8A6" />
              <Text style={tw`text-[10px] font-bold text-teal-600 font-mono`}>
                {Math.round(((currentStageIdx + 1) / STAGES.length) * 100)}%
              </Text>
            </View>
          </View>

          {/* Pipeline stages list */}
          <ScrollView style={tw`max-h-48`} showsVerticalScrollIndicator={false}>
            <View style={tw`space-y-2.5`}>
              {STAGES.map((stage, idx) => {
                const isActive = idx === currentStageIdx;
                const isCompleted = idx < currentStageIdx;
                
                return (
                  <View key={idx} style={tw`flex-row items-start space-x-2.5 py-0.5`}>
                    {isCompleted ? (
                      <CheckCircle size={13} color="#14B8A6" style={tw`mt-0.5`} />
                    ) : isActive ? (
                      <ActivityIndicator size="small" color="#14B8A6" style={tw`w-3 h-3 mt-0.5`} />
                    ) : (
                      <View style={tw`w-3.5 h-3.5 rounded-full border border-slate-200 mt-0.5`} />
                    )}
                    <Text style={tw`text-xs leading-relaxed flex-1 ${isActive ? 'text-slate-900 font-extrabold' : isCompleted ? 'text-slate-400' : 'text-slate-300'}`}>
                      {stage}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Practitioner Shield */}
        <View style={tw`flex-row items-center bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-2xl`}>
          <ShieldCheck size={12} color="#14B8A6" style={tw`mr-1.5`} />
          <Text style={tw`text-[9px] text-slate-500 font-mono uppercase tracking-widest`}>
            Autonomous HIPAA-Secure Tracing Layer
          </Text>
        </View>

      </View>
    </View>
  );
}
