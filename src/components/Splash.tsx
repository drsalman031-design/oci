import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Activity, Cpu, Smartphone } from 'lucide-react-native';
import tw from 'twrnc';

interface SplashProps {
  onFinish: () => void;
}

const AnimatedView = Animated.View as any;

export default function Splash({ onFinish }: SplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={[tw`flex-1 bg-slate-950 items-center justify-center p-6`, StyleSheet.absoluteFill]}>
      {/* Decorative vertical grid lines / design backdrop */}
      <View style={[tw`absolute inset-0 opacity-10`, { backgroundColor: '#022c22' }]} />
      
      <AnimatedView style={[
        tw`max-w-md w-full items-center z-10`,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        
        {/* Futuristic Outer Shell */}
        <View style={tw`w-36 h-36 mb-8 bg-slate-900 rounded-3xl items-center justify-center border border-teal-500/30 relative overflow-hidden shadow-lg`}>
          <View style={tw`absolute inset-2 border border-teal-500/10 rounded-2xl bg-slate-950/40`} />
          <Cpu size={56} color="#2dd4bf" style={tw`opacity-90`} />
          <Activity size={20} color="#34d399" style={tw`absolute bottom-4 right-4`} />
        </View>

        {/* Title & Badge */}
        <View style={tw`items-center space-y-2 mb-6`}>
          <View style={tw`flex-row items-center bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full mb-3`}>
            <Cpu size={12} color="#2dd4bf" style={tw`mr-1.5`} />
            <Text style={tw`text-teal-400 text-[10px] font-bold uppercase tracking-widest`}>
              AI-Driven Diagnostic Core
            </Text>
          </View>
          
          <Text style={tw`text-3xl font-extrabold tracking-tight text-center text-teal-400`}>
            OCI ANALYZER
          </Text>
          
          <Text style={tw`text-slate-400 font-mono text-[10px] uppercase tracking-widest text-center`}>
            Orthodontic Compensation Index
          </Text>
        </View>

        {/* Clinical Summary */}
        <Text style={tw`text-xs text-slate-300 text-center px-6 leading-relaxed mb-8`}>
          Expert-mode cephalometric index calculator and patient diagnostic archiver.
        </Text>

        {/* Loading Indicator */}
        <View style={tw`flex-row items-center justify-center mb-8`}>
          <ActivityIndicator size="small" color="#2dd4bf" style={tw`mr-2`} />
          <Text style={tw`text-xs text-slate-500 font-mono`}>INITIALIZING CORE...</Text>
        </View>

        {/* Fast Action Skip */}
        <Pressable
          onPress={onFinish}
          style={({ pressed }) => [
            tw`px-6 py-3 bg-teal-500/15 border border-teal-500/30 rounded-2xl flex-row items-center justify-center transition-all`,
            pressed ? tw`bg-teal-500/30` : null
          ]}
        >
          <Text style={tw`text-teal-300 font-bold text-xs tracking-wider mr-2`}>
            Skip Diagnostics
          </Text>
          <Activity size={14} color="#2dd4bf" style={tw`animate-pulse`} />
        </Pressable>

        {/* Branding Footer */}
        <View style={tw`mt-12 items-center space-y-1`}>
          <View style={tw`flex-row items-center`}>
            <Smartphone size={12} color="#64748b" style={tw`mr-1`} />
            <Text style={tw`text-[10px] text-slate-500 font-mono uppercase tracking-wider`}>
              v1.2.0 • Standalone Mobile • Offline
            </Text>
          </View>
          <Text style={tw`text-[11px] text-teal-400/80 font-semibold tracking-wide mt-1`}>
            Developed by Dr. Salman MDS Orthodontist
          </Text>
        </View>

      </AnimatedView>
    </View>
  );
}
