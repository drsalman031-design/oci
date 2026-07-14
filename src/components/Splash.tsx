import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Sparkles, Brain, ShieldCheck } from 'lucide-react-native';
import tw from 'twrnc';

interface SplashProps {
  onFinish: () => void;
}

const AnimatedView = Animated.View as any;

export default function Splash({ onFinish }: SplashProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      )
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={[tw`flex-1 bg-white items-center justify-center p-6`, StyleSheet.absoluteFill]}>
      {/* Premium subtle glowing background gradients */}
      <View style={tw`absolute w-96 h-96 rounded-full bg-teal-500/5 blur-3xl`} />
      
      <AnimatedView style={[
        tw`max-w-md w-full items-center z-10`,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}>
        
        {/* Core Icon */}
        <View style={tw`w-32 h-32 mb-8 relative items-center justify-center`}>
          <Animated.View style={[
            tw`absolute w-32 h-32 border border-dashed border-teal-500/20 rounded-full`,
            { transform: [{ rotate: spin }] }
          ]} />
          
          <View style={tw`w-24 h-24 bg-teal-500/5 rounded-[32px] items-center justify-center border border-teal-500/10 shadow-sm`}>
            <Brain size={44} color="#00E5FF" />
          </View>
        </View>
  
        {/* Title */}
        <View style={tw`items-center mb-6`}>
          <View style={tw`flex-row items-center bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 rounded-full mb-3`}>
            <Sparkles size={11} color="#00B8CC" style={tw`mr-2`} />
            <Text style={tw`text-[#00B8CC] text-[9px] font-black uppercase tracking-widest font-mono`}>
              AI Orthodontic Decision Support
            </Text>
          </View>
          
          <Text style={tw`text-3xl font-black tracking-tight text-[#0F172A]`}>
            OCI ANALYZER
          </Text>
          
          <Text style={tw`text-teal-600 font-mono text-[9px] uppercase tracking-widest text-center font-black mt-1.5`}>
            Orthodontic Compensation Index
          </Text>
        </View>
  
        {/* Description */}
        <Text style={tw`text-xs text-slate-500 text-center px-8 leading-relaxed mb-10`}>
          Revealing biological boundaries of dentoalveolar camouflage versus surgical correction through automated cephalometric modeling.
        </Text>
  
        {/* Loader */}
        <View style={tw`items-center mb-8`}>
          <View style={tw`flex-row items-center justify-center bg-slate-50 border border-slate-100 rounded-full px-4 py-2`}>
            <ActivityIndicator size="small" color="#00E5FF" style={tw`mr-2.5`} />
            <Text style={tw`text-[10px] text-slate-600 font-mono font-bold uppercase tracking-wider`}>
              Initializing OCI Core Engine...
            </Text>
          </View>
        </View>
  
        {/* Practitioner Info */}
        <View style={tw`mt-4 items-center`}>
          <View style={tw`flex-row items-center bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-2xl`}>
            <ShieldCheck size={12} color="#00E5FF" style={tw`mr-1.5`} />
            <Text style={tw`text-[9px] text-slate-500 font-mono uppercase tracking-widest`}>
              Director: Dr. Salman MDS Orthodontist
            </Text>
          </View>
        </View>
  
      </AnimatedView>
    </View>
  );
}
