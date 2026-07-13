import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Settings as SettingsIcon,
  Sun,
  Bell,
  Globe,
  Lock,
  Database,
  Info,
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import tw from 'twrnc';

interface SettingsPanelProps {
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsPanel({ onClose, onLogout }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const toggleSection = (sec: string) => {
    setActiveSection(prev => prev === sec ? null : sec);
  };

  const handleClearData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to permanently delete all patient archives? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Data Reset', 'All local databases have been cleared successfully.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-28 px-6 w-full bg-[#071B49]`} 
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`space-y-6 mt-6 max-w-xl mx-auto w-full`}>
        
        {/* Header */}
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center space-x-2`}>
            <SettingsIcon size={20} color="#10B7A8" />
            <Text style={tw`text-2xl font-black text-white tracking-tight`}>Settings</Text>
          </View>
          <Pressable 
            onPress={onClose}
            style={tw`bg-[#0E234D] border border-[rgba(255,255,255,0.08)] px-4 py-2 rounded-xl shadow-sm`}
          >
            <Text style={tw`text-white font-bold text-xs uppercase tracking-wider`}>Close</Text>
          </Pressable>
        </View>

        {/* 1. Profile Settings */}
        <View style={tw`bg-[#102B5C] rounded-[20px] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm`}>
          <Pressable 
            onPress={() => toggleSection('profile')}
            style={tw`flex-row justify-between items-center p-5 bg-[#0E234D]`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <User size={16} color="#10B7A8" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Profile Settings</Text>
            </View>
            {activeSection === 'profile' ? <ChevronUp size={14} color="#A8B3C7" /> : <ChevronDown size={14} color="#A8B3C7" />}
          </Pressable>
          {activeSection === 'profile' && (
            <View style={tw`p-5 border-t border-[rgba(255,255,255,0.08)] space-y-2`}>
              <Text style={tw`text-xs text-white font-bold`}>Practitioner: Dr. Salman MDS</Text>
              <Text style={tw`text-[10px] text-[#C7D2E6] font-mono`}>Role: Orthodontic Director • Clinical Administrator</Text>
            </View>
          )}
        </View>

        {/* 2. Theme Settings */}
        <View style={tw`bg-[#102B5C] rounded-[20px] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm`}>
          <Pressable 
            onPress={() => toggleSection('theme')}
            style={tw`flex-row justify-between items-center p-5 bg-[#0E234D]`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Sun size={16} color="#10B7A8" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Theme Mode</Text>
            </View>
            {activeSection === 'theme' ? <ChevronUp size={14} color="#A8B3C7" /> : <ChevronDown size={14} color="#A8B3C7" />}
          </Pressable>
          {activeSection === 'theme' && (
            <View style={tw`p-5 border-t border-[rgba(255,255,255,0.08)] flex-row justify-between items-center`}>
              <Text style={tw`text-xs text-[#C7D2E6] font-bold`}>Dark Mode Enabled</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} thumbColor="#FFFFFF" trackColor={{ true: '#10B7A8' }} />
            </View>
          )}
        </View>

        {/* 3. Notifications */}
        <View style={tw`bg-[#102B5C] rounded-[20px] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm`}>
          <Pressable 
            onPress={() => toggleSection('notifications')}
            style={tw`flex-row justify-between items-center p-5 bg-[#0E234D]`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Bell size={16} color="#10B7A8" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Notifications</Text>
            </View>
            {activeSection === 'notifications' ? <ChevronUp size={14} color="#A8B3C7" /> : <ChevronDown size={14} color="#A8B3C7" />}
          </Pressable>
          {activeSection === 'notifications' && (
            <View style={tw`p-5 border-t border-[rgba(255,255,255,0.08)] flex-row justify-between items-center`}>
              <Text style={tw`text-xs text-[#C7D2E6] font-bold`}>Enable system push notifications</Text>
              <Switch value={notifications} onValueChange={setNotifications} thumbColor="#FFFFFF" trackColor={{ true: '#10B7A8' }} />
            </View>
          )}
        </View>

        {/* 4. Language */}
        <View style={tw`bg-[#102B5C] rounded-[20px] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm`}>
          <Pressable 
            onPress={() => toggleSection('language')}
            style={tw`flex-row justify-between items-center p-5 bg-[#0E234D]`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Globe size={16} color="#10B7A8" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Language</Text>
            </View>
            {activeSection === 'language' ? <ChevronUp size={14} color="#A8B3C7" /> : <ChevronDown size={14} color="#A8B3C7" />}
          </Pressable>
          {activeSection === 'language' && (
            <View style={tw`p-5 border-t border-[rgba(255,255,255,0.08)]`}>
              <Text style={tw`text-xs text-white font-bold`}>Default Language: English (US)</Text>
            </View>
          )}
        </View>

        {/* 5. Security & Privacy */}
        <View style={tw`bg-[#102B5C] rounded-[20px] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm`}>
          <Pressable 
            onPress={() => toggleSection('security')}
            style={tw`flex-row justify-between items-center p-5 bg-[#0E234D]`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Lock size={16} color="#10B7A8" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Security & Privacy</Text>
            </View>
            {activeSection === 'security' ? <ChevronUp size={14} color="#A8B3C7" /> : <ChevronDown size={14} color="#A8B3C7" />}
          </Pressable>
          {activeSection === 'security' && (
            <View style={tw`p-5 border-t border-[rgba(255,255,255,0.08)] space-y-2`}>
              <Text style={tw`text-xs text-white font-bold`}>HIPAA Security Standard: Enabled</Text>
              <Text style={tw`text-[10px] text-[#C7D2E6] leading-normal`}>All patient data uploaded and saved locally is encrypted using AES-256-CBC with keys derived via PBKDF2 stretching.</Text>
            </View>
          )}
        </View>

        {/* 6. Database & Backup */}
        <View style={tw`bg-[#102B5C] rounded-[20px] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm`}>
          <Pressable 
            onPress={() => toggleSection('backup')}
            style={tw`flex-row justify-between items-center p-5 bg-[#0E234D]`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Database size={16} color="#10B7A8" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Database & Backup</Text>
            </View>
            {activeSection === 'backup' ? <ChevronUp size={14} color="#A8B3C7" /> : <ChevronDown size={14} color="#A8B3C7" />}
          </Pressable>
          {activeSection === 'backup' && (
            <View style={tw`p-5 border-t border-[rgba(255,255,255,0.08)] space-y-4`}>
              <Pressable 
                onPress={handleClearData}
                style={tw`w-full py-3 bg-red-950/40 border border-red-900/50 rounded-xl items-center`}
              >
                <Text style={tw`text-red-400 font-black text-xs uppercase`}>Clear local database</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 7. About OCI Analyzer */}
        <View style={tw`bg-[#102B5C] rounded-[20px] border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-sm`}>
          <Pressable 
            onPress={() => toggleSection('about')}
            style={tw`flex-row justify-between items-center p-5 bg-[#0E234D]`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Info size={16} color="#10B7A8" />
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>About OCI Analyzer</Text>
            </View>
            {activeSection === 'about' ? <ChevronUp size={14} color="#A8B3C7" /> : <ChevronDown size={14} color="#A8B3C7" />}
          </Pressable>
          {activeSection === 'about' && (
            <View style={tw`p-5 border-t border-[rgba(255,255,255,0.08)] space-y-2`}>
              <Text style={tw`text-xs text-white font-bold`}>OCI Analyzer v4.0</Text>
              <Text style={tw`text-[10px] text-[#C7D2E6] leading-normal`}>The Orthodontic Compensation Index (OCI) is a specialized diagnostic indicator calculated from skeletal, dental, and soft tissue patterns. All rights reserved.</Text>
            </View>
          )}
        </View>

        {/* LOGOUT ACTION */}
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            tw`flex-row items-center justify-center bg-red-600 py-4 rounded-2xl shadow-sm mt-4`,
            pressed ? tw`opacity-90` : null
          ]}
        >
          <LogOut size={16} color="#FFF" style={tw`mr-2`} />
          <Text style={tw`text-white font-black text-xs uppercase tracking-wider`}>Log Out Session</Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}
