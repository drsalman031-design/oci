import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Sparkles, Send, Brain, ShieldAlert, BookOpen, AlertCircle, RefreshCw } from 'lucide-react-native';
import MarkdownRenderer from './MarkdownRenderer';
import { generateChatResponse } from '../lib/gemini';
import tw from 'twrnc';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `### Welcome, Dr. Salman.

I am **OrthoPilot**, your clinical decision support co-pilot. I can help you evaluate **dentoalveolar compensation limits**, review skeletal indices, and discuss therapeutic strategies.

How would you like to proceed today? Select a preset topic below or write your specific inquiry.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const presets = [
    { label: 'IMPA Torque Boundaries', query: 'Tell me about lower incisor IMPA torque boundaries and periodontal limits' },
    { label: 'Class III Decompensation', query: 'What are the presurgical decompensation goals in Skeletal Class III orthognathic surgery?' },
    { label: 'Class II Extraction Matrix', query: 'Explain premolar extraction patterns and decision matrix for Skeletal Class II camouflage' }
  ];

  const loadingStatuses = [
    'Analyzing alveolar bone limits...',
    'Reviewing sagittal biomechanics...',
    'Consulting clinical orthodontic guidelines...',
    'Formulating therapeutic recommendations...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let index = 0;
      setLoadingStatus(loadingStatuses[0]);
      interval = setInterval(() => {
        index = (index + 1) % loadingStatuses.length;
        setLoadingStatus(loadingStatuses[index]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        text: m.text,
      }));
      
      const reply = await generateChatResponse(textToSend, history);
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '### Connection Offline\n\nI was unable to reach the OCI server. Please verify your connection or retry in a few moments.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={tw`flex-1 bg-[#050814]`}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={tw`p-5 pb-24`}
        style={tw`flex-1`}
      >
        {/* Upper Brand Card */}
        <View style={tw`bg-gradient-to-br from-teal-950/40 to-indigo-950/40 p-5 rounded-[28px] border border-teal-500/20 mb-6 shadow-2xl relative overflow-hidden`}>
          <View style={tw`absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-2xl`} />
          <View style={tw`flex-row items-center mb-2`}>
            <View style={tw`w-10 h-10 bg-teal-500/10 border border-teal-500/20 rounded-xl items-center justify-center mr-3 shadow-inner`}>
              <Brain size={20} color="#22D3EE" />
            </View>
            <View>
              <Text style={tw`text-sm font-black text-white tracking-wide uppercase`}>Clinical Co-Pilot</Text>
              <Text style={tw`text-[10px] font-bold text-teal-400 font-mono tracking-widest uppercase`}>Dr. Salman Consultation Suite</Text>
            </View>
          </View>
          <Text style={tw`text-xs text-slate-300 leading-relaxed mt-2`}>
            Advanced natural language interface trained to analyze underlying dentofacial discrepancies, periodontal alveolar limit risks, and surgical planning guides.
          </Text>
        </View>

        {/* Message stream */}
        <View style={tw`space-y-4`}>
          {messages.map((msg, index) => (
            <View
              key={index}
              style={tw`flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                style={[
                  tw`max-w-[88%] p-4 rounded-[24px] shadow-lg`,
                  msg.role === 'user'
                    ? tw`bg-teal-600/90 border border-teal-500/30 text-white rounded-tr-none`
                    : tw`bg-white/5 border border-white/10 rounded-tl-none`,
                ]}
              >
                {msg.role === 'user' ? (
                  <Text style={tw`text-xs font-semibold text-slate-100 leading-relaxed`}>
                    {msg.text}
                  </Text>
                ) : (
                  <MarkdownRenderer>{msg.text}</MarkdownRenderer>
                )}
              </View>
              <Text style={tw`text-[8px] text-slate-500 font-mono uppercase mt-1.5 px-2`}>
                {msg.role === 'user' ? 'Dr. Salman, MDS' : 'OrthoPilot AI'}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={tw`flex-row items-center bg-white/5 p-4 rounded-[24px] border border-white/10 self-start max-w-[80%] rounded-tl-none`}>
              <ActivityIndicator size="small" color="#00E5FF" style={tw`mr-3`} />
              <View>
                <Text style={tw`text-xs font-bold text-white font-mono uppercase tracking-wider`}>Thinking...</Text>
                <Text style={tw`text-[9px] text-slate-400 font-mono mt-0.5`}>{loadingStatus}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Preset tags block (Only show when not loading to encourage fast interactions) */}
        {!loading && (
          <View style={tw`mt-8 space-y-2.5`}>
            <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pl-1`}>
              Fast Consultant Prompts
            </Text>
            <View style={tw`flex-col gap-2`}>
              {presets.map((preset, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSend(preset.query)}
                  style={({ pressed }) => [
                    tw`bg-white/5 border border-white/10 p-3 rounded-2xl flex-row items-center shadow-md`,
                    pressed ? tw`bg-white/10 scale-99` : null,
                  ]}
                >
                  <BookOpen size={13} color="#22D3EE" style={tw`mr-2.5`} />
                  <Text style={tw`text-xs font-extrabold text-slate-200 flex-1`}>{preset.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={tw`absolute bottom-0 inset-x-0 bg-[#0B1020]/90 border-t border-white/10 p-3.5 flex-row items-center space-x-2`}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Consult clinical OCI guidelines..."
          placeholderTextColor="#64748b"
          onSubmitEditing={() => handleSend(input)}
          style={tw`flex-1 bg-black/40 text-white text-xs px-4 py-3 rounded-2xl border border-white/10`}
        />
        <Pressable
          onPress={() => handleSend(input)}
          disabled={loading || !input.trim()}
          style={({ pressed }) => [
            tw`w-11 h-11 rounded-2xl items-center justify-center shadow-lg`,
            input.trim() ? tw`bg-[#00E5FF]` : tw`bg-white/5 border border-white/10`,
            pressed ? tw`opacity-80` : null,
          ]}
        >
          <Send size={16} color={input.trim() ? '#ffffff' : '#64748b'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
