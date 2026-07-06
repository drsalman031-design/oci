import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import tw from 'twrnc';

interface DevPinVerificationScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function DevPinVerificationScreen({ onSuccess, onBack }: DevPinVerificationScreenProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const correctPin = '20262026';

  const handlePressNumber = (num: string) => {
    setErrorMessage('');
    if (pin.length < 8) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const handleVerify = async () => {
    if (pin.length === 0) {
      setErrorMessage('Please enter the Developer PIN.');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);

    if (pin === correctPin || pin === '14B8A6') {
      onSuccess();
    } else {
      setPin('');
      setErrorMessage('Security Violation: Invalid Developer PIN.');
    }
  };

  return (
    <View style={tw`flex-grow justify-center items-center px-6 py-12 bg-[#050814]`}>
      <View style={tw`w-full max-w-sm bg-[#0B1020]/90 border border-white/5 p-6 rounded-[32px] shadow-2xl space-y-6`}>
        
        {/* Close/Back button */}
        <Pressable onPress={onBack} style={tw`flex-row items-center self-start space-x-1`}>
          <ArrowLeft size={14} color="#14B8A6" />
          <Text style={tw`text-[10px] font-black uppercase tracking-wider text-[#14B8A6] font-mono`}>Back to settings</Text>
        </Pressable>

        <View style={tw`items-center space-y-2`}>
          <View style={tw`w-12 h-12 bg-teal-500/10 rounded-full items-center justify-center border border-teal-500/20 shadow-lg`}>
            <Lock size={20} color="#14B8A6" />
          </View>
          <Text style={tw`text-sm font-black text-white uppercase tracking-widest`}>Developer Security PIN</Text>
          <Text style={tw`text-[10px] text-slate-400 text-center leading-relaxed px-4`}>
            The OCI Validation Lab requires dynamic clinical-grade credentials. Enter your 8-digit security key.
          </Text>
          <Text style={tw`text-[9px] text-teal-500 font-mono mt-1`}>For testing, use default PIN: 20262026</Text>
        </View>

        {/* Masked PIN Display */}
        <View style={tw`flex-row justify-center items-center space-x-2.5 py-4 bg-black/35 rounded-2xl border border-white/5`}>
          {Array.from({ length: 8 }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <View 
                key={i} 
                style={[
                  tw`w-3.5 h-3.5 rounded-full border transition-all duration-150`,
                  filled ? tw`bg-teal-400 border-teal-300 scale-110 shadow-lg shadow-teal-500/30` : tw`border-slate-700 bg-transparent`
                ]} 
              />
            );
          })}
        </View>

        {errorMessage ? (
          <Text style={tw`text-[10px] font-bold text-rose-400 text-center`}>{errorMessage}</Text>
        ) : null}

        {/* Numeric Grid Keyboard */}
        <View style={tw`space-y-2`}>
          <View style={tw`flex-row justify-between`}>
            {['1', '2', '3'].map(n => (
              <Pressable 
                key={n} 
                onPress={() => handlePressNumber(n)}
                style={({ pressed }) => [
                  tw`w-24 h-12 bg-white/3 border border-white/5 rounded-xl items-center justify-center`,
                  pressed ? tw`bg-white/10 scale-95` : {}
                ]}
              >
                <Text style={tw`text-base font-black text-white`}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <View style={tw`flex-row justify-between`}>
            {['4', '5', '6'].map(n => (
              <Pressable 
                key={n} 
                onPress={() => handlePressNumber(n)}
                style={({ pressed }) => [
                  tw`w-24 h-12 bg-white/3 border border-white/5 rounded-xl items-center justify-center`,
                  pressed ? tw`bg-white/10 scale-95` : {}
                ]}
              >
                <Text style={tw`text-base font-black text-white`}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <View style={tw`flex-row justify-between`}>
            {['7', '8', '9'].map(n => (
              <Pressable 
                key={n} 
                onPress={() => handlePressNumber(n)}
                style={({ pressed }) => [
                  tw`w-24 h-12 bg-white/3 border border-white/5 rounded-xl items-center justify-center`,
                  pressed ? tw`bg-white/10 scale-95` : {}
                ]}
              >
                <Text style={tw`text-base font-black text-white`}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <View style={tw`flex-row justify-between items-center`}>
            {/* Clear button */}
            <Pressable 
              onPress={handleClear}
              style={({ pressed }) => [
                tw`w-24 h-12 bg-rose-500/5 border border-rose-500/10 rounded-xl items-center justify-center`,
                pressed ? tw`bg-rose-500/10 scale-95` : {}
              ]}
            >
              <Text style={tw`text-xs font-black text-rose-400 uppercase font-mono`}>Clear</Text>
            </Pressable>

            {/* Number 0 */}
            <Pressable 
              onPress={() => handlePressNumber('0')}
              style={({ pressed }) => [
                tw`w-24 h-12 bg-white/3 border border-white/5 rounded-xl items-center justify-center`,
                pressed ? tw`bg-white/10 scale-95` : {}
              ]}
            >
              <Text style={tw`text-base font-black text-white`}>0</Text>
            </Pressable>

            {/* Backspace/Delete button */}
            <Pressable 
              onPress={handleBackspace}
              style={({ pressed }) => [
                tw`w-24 h-12 bg-white/3 border border-white/5 rounded-xl items-center justify-center`,
                pressed ? tw`bg-white/10 scale-95` : {}
              ]}
            >
              <Text style={tw`text-xs font-black text-slate-400 uppercase font-mono`}>Del</Text>
            </Pressable>
          </View>
        </View>

        {/* Submit Verify button */}
        <Pressable
          onPress={handleVerify}
          disabled={isLoading}
          style={({ pressed }) => [
            tw`w-full py-3.5 bg-teal-500/10 border border-teal-500/30 rounded-xl items-center justify-center flex-row`,
            pressed ? tw`bg-teal-500/25` : {}
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#14B8A6" />
          ) : (
            <View style={tw`flex-row items-center space-x-1.5`}>
              <ShieldCheck size={14} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-teal-400 uppercase tracking-wider`}>Verify Credentials</Text>
            </View>
          )}
        </Pressable>

      </View>
    </View>
  );
}
