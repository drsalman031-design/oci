import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Sparkles, Brain, Cpu, ShieldCheck } from 'lucide-react-native';
import tw from 'twrnc';

interface SplashProps {
  onFinish: () => void;
}

const AnimatedView = Animated.View as any;

export default function Splash({ onFinish }: SplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Elegant entrance fade & subtle scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      )
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={[tw`flex-1 bg-[#050814] items-center justify-center p-6`, StyleSheet.absoluteFill]}>
      {/* Absolute high-end glowing background lights */}
      <View style={tw`absolute w-96 h-96 rounded-full bg-teal-500/10 blur-3xl`} />
      <View style={tw`absolute w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl -top-20 -left-10`} />
      
      <AnimatedView style={[
        tw`max-w-md w-full items-center z-10`,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        
        {/* Floating Futuristic Core Icon */}
        <View style={tw`w-36 h-36 mb-8 relative items-center justify-center`}>
          {/* Animated spinning background ring */}
          <Animated.View style={[
            tw`absolute w-36 h-36 border-2 border-dashed border-[#14B8A6]/20 rounded-full`,
            { transform: [{ rotate: spin }] }
          ]} />
          
          {/* Main glass capsule */}
          <View style={tw`w-28 h-28 bg-gradient-to-br from-white/10 to-white/5 rounded-[38px] items-center justify-center border border-[#14B8A6]/30 shadow-2xl relative overflow-hidden`}>
            <View style={tw`absolute inset-1 border border-white/10 rounded-[34px] bg-black/45`} />
            <Brain size={48} color="#22D3EE" style={tw`opacity-95`} />
            
            {/* Corner status pulse */}
            <View style={tw`absolute top-4 right-4 w-2.5 h-2.5 bg-teal-400 rounded-full border border-black`}>
              <View style={tw`w-full h-full bg-teal-400 rounded-full animate-ping opacity-75`} />
            </View>
          </View>
        </View>
  
        {/* Title & Premium Badging */}
        <View style={tw`items-center mb-6`}>
          <View style={tw`flex-row items-center bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4 shadow-inner`}>
            <Sparkles size={11} color="#22D3EE" style={tw`mr-2`} />
            <Text style={tw`text-[#22D3EE] text-[9px] font-black uppercase tracking-widest font-mono`}>
              Autonomous Clinical Modeling
            </Text>
          </View>
          
          <Text style={tw`text-4xl font-black tracking-tighter text-center text-white`}>
            OCI CLINIC
          </Text>
          
          <Text style={tw`text-teal-400 font-mono text-[9px] uppercase tracking-widest text-center font-black mt-1.5`}>
            Orthodontic Compensation Index
          </Text>
        </View>
  
        {/* Purpose / Philosophy */}
        <Text style={tw`text-xs text-slate-400 text-center px-8 leading-relaxed mb-10`}>
          Quantifying sagittal dentoalveolar masking through advanced diagnostic automation. Engineered to reveal boundaries of camouflage versus orthognathic surgical planning.
        </Text>
  
        {/* Sleek Loader */}
        <View style={tw`items-center mb-8`}>
          <View style={tw`flex-row items-center justify-center`}>
            <ActivityIndicator size="small" color="#14B8A6" style={tw`mr-2.5`} />
            <Text style={tw`text-[10px] text-teal-400 font-mono font-black uppercase tracking-wider`}>
              Booting OrthoPilot Core v2.0
            </Text>
          </View>
        </View>
  
        {/* Developer Seal */}
        <View style={tw`mt-6 items-center`}>
          <View style={tw`flex-row items-center bg-white/5 border border-white/5 px-3.5 py-1.5 rounded-2xl`}>
            <ShieldCheck size={12} color="#10B981" style={tw`mr-1.5`} />
            <Text style={tw`text-[9px] text-slate-400 font-mono uppercase tracking-widest`}>
              Director: Dr. Salman MDS Orthodontist
            </Text>
          </View>
        </View>
  
      </AnimatedView>
    </View>
  );
}
