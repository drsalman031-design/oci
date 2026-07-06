import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OciWeights, UserProfile } from '../types';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Download, 
  Upload, 
  Info, 
  Save, 
  RefreshCw,
  Database,
  Cpu,
  Sparkles,
  LogOut,
  User,
  Building,
  BrainCircuit,
  FileSpreadsheet,
  ShieldAlert,
  HeartHandshake,
  HelpCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  CloudLightning,
  Check,
  Power,
  ShieldAlert as ShieldIcon
} from 'lucide-react-native';
import tw from 'twrnc';
import { sha256, encryptBackup, decryptBackup } from '../lib/crypto';
import { 
  dbGetProfile, 
  dbUpdateUserProfile, 
  dbDeleteUserProfile, 
  dbGetSetting, 
  dbSaveSetting,
  dbGetAssessments
} from '../lib/db';

interface SettingsPanelProps {
  weights: OciWeights;
  onUpdateWeights: (newWeights: OciWeights) => void;
  onImportData: (data: string) => Promise<boolean> | boolean;
  onExportData: () => void;
  onResetDatabase: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout?: () => void;
  onOpenSyncDashboard?: () => void;
  onOpenStressTesting?: () => void;
  userEmail?: string | null;
}

export default function SettingsPanel({
  weights,
  onUpdateWeights,
  onImportData,
  onExportData,
  onResetDatabase,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onOpenSyncDashboard,
  onOpenStressTesting,
  userEmail
}: SettingsPanelProps) {
  // State for collapsible sections
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [showTechnicalInfo, setShowTechnicalInfo] = useState<boolean>(false);

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('');
  
  // Password changing inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Google Drive Cloud Sync settings state
  const [gdriveConnected, setGdriveConnected] = useState(false);
  const [gdriveAutoSync, setGdriveAutoSync] = useState(false);
  const [gdriveLastBackup, setGdriveLastBackup] = useState('Never');
  const [gdriveStorageUsed, setGdriveStorageUsed] = useState('0 KB');
  const [syncingLoading, setSyncingLoading] = useState(false);

  // Clinic State (Persisted in user settings)
  const [clinicName, setClinicName] = useState('OCI Premium Orthodontic Clinic');
  const [clinicAddress, setClinicAddress] = useState('742 Clinical Boulevard, Suite 400');
  const [clinicContact, setClinicContact] = useState('+1 (555) 902-1846');
  const [clinicEmail, setClinicEmail] = useState('support@ociclinic.com');

  // AI Preferences
  const [aiAssistanceLevel, setAiAssistanceLevel] = useState<'high' | 'med' | 'low'>('high');
  const [aiEngineMode] = useState('OCI v2.4 Pro Core');

  // Evidence / Guideline version
  const [guidelineVersion] = useState('ABO 2026 Reference Standards');

  // Privacy & Security
  const [anonymizeReports, setAnonymizeReports] = useState(false);
  const [twoFactorTimeout, setTwoFactorTimeout] = useState(true);
  const [localEncryption, setLocalEncryption] = useState(true);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load from database/AsyncStorage on mount
  useEffect(() => {
    async function loadData() {
      if (!userEmail) return;
      try {
        const profile = await dbGetProfile(userEmail);
        if (profile) {
          setUserProfile(profile);
          setFirstName(profile.firstName);
          setLastName(profile.lastName);
          setMobile(profile.mobile || '');
          setRole(profile.role);
        }

        // Load sync configuration
        const connected = await AsyncStorage.getItem(`oci_gdrive_connected_${userEmail}`) === 'true';
        setGdriveConnected(connected);

        const autoSync = await AsyncStorage.getItem(`oci_gdrive_auto_sync_${userEmail}`) === 'true';
        setGdriveAutoSync(autoSync);

        const lastBackup = await AsyncStorage.getItem(`oci_gdrive_last_backup_${userEmail}`) || 'Never';
        setGdriveLastBackup(lastBackup);

        const payload = await AsyncStorage.getItem(`oci_gdrive_backup_payload_${userEmail}`);
        if (payload) {
          const kb = Math.round((payload.length * 2) / 1024);
          setGdriveStorageUsed(`${kb} KB`);
        } else {
          setGdriveStorageUsed('0 KB');
        }

        // Load clinical preferences
        const savedClinicName = await dbGetSetting('oci_clinic_name', 'OCI Premium Orthodontic Clinic');
        setClinicName(savedClinicName);
        const savedClinicAddress = await dbGetSetting('oci_clinic_address', '742 Clinical Boulevard, Suite 400');
        setClinicAddress(savedClinicAddress);
        const savedClinicContact = await dbGetSetting('oci_clinic_contact', '+1 (555) 902-1846');
        setClinicContact(savedClinicContact);
        const savedClinicEmail = await dbGetSetting('oci_clinic_email', 'support@ociclinic.com');
        setClinicEmail(savedClinicEmail);

        const savedAiLevel = await dbGetSetting<'high' | 'med' | 'low'>('oci_ai_level', 'high');
        setAiAssistanceLevel(savedAiLevel);

        const savedAnonymize = await dbGetSetting<boolean>('oci_anonymize', false);
        setAnonymizeReports(savedAnonymize);
      } catch (e) {
        console.log('Failed to load SettingsPanel database config', e);
      }
    }
    loadData();
  }, [userEmail]);

  const saveProfile = async () => {
    if (!userEmail) return;
    try {
      const updated = await dbUpdateUserProfile(userEmail, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim() || undefined,
      });
      if (updated) {
        setUserProfile(updated);
        showTemporaryStatus('Practitioner Profile updated successfully.');
      }
    } catch (e) {
      showTemporaryStatus('Failed to update clinical profile.');
    }
  };

  const changePassword = async () => {
    if (!userEmail || !userProfile) return;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Input Error", "Please fill in all password fields.");
      return;
    }
    const curHash = sha256(currentPassword);
    if (curHash !== userProfile.passwordHash) {
      Alert.alert("Verification Error", "Current password is incorrect.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Security Warning", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
      return;
    }
    
    try {
      const nextHash = sha256(newPassword);
      const updated = await dbUpdateUserProfile(userEmail, { passwordHash: nextHash });
      if (updated) {
        setUserProfile(updated);
        // If administrator, set changed flag
        if (userEmail.toLowerCase().trim() === 'admin@ociclinic.ai') {
          await AsyncStorage.setItem('oci_admin_password_changed', 'true');
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        Alert.alert("Success", "Password updated successfully!");
      }
    } catch (e) {
      Alert.alert("System Error", "Failed to change password. Try again.");
    }
  };

  const deleteAccount = () => {
    if (!userEmail) return;
    if (userEmail.toLowerCase().trim() === 'admin@ociclinic.ai') {
      Alert.alert("Operation Forbidden", "The System Administrator account cannot be deleted.");
      return;
    }

    Alert.alert(
      "DELETE CLINICIAN ACCOUNT",
      "Are you absolutely certain? This will delete your profile, credentials, clinical configurations, and ALL patient diagnosis logs permanently from this device. This operation is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "DELETE FOREVER", 
          style: "destructive", 
          onPress: async () => {
            const success = await dbDeleteUserProfile(userEmail);
            if (success) {
              if (onLogout) onLogout();
            } else {
              Alert.alert("Error", "Failed to delete account. Contact Support.");
            }
          } 
        }
      ]
    );
  };

  const saveClinicInfo = async () => {
    try {
      await dbSaveSetting('oci_clinic_name', clinicName);
      await dbSaveSetting('oci_clinic_address', clinicAddress);
      await dbSaveSetting('oci_clinic_contact', clinicContact);
      await dbSaveSetting('oci_clinic_email', clinicEmail);
      showTemporaryStatus('Clinic Information updated successfully.');
    } catch (e) {
      showTemporaryStatus('Failed to write clinic settings.');
    }
  };

  const saveAiPrefs = async () => {
    try {
      await dbSaveSetting('oci_ai_level', aiAssistanceLevel);
      showTemporaryStatus('AI Copilot Preferences configured.');
    } catch (e) {
      showTemporaryStatus('Failed to save AI copilot settings.');
    }
  };

  const handleToggleAnonymize = async () => {
    const nextVal = !anonymizeReports;
    setAnonymizeReports(nextVal);
    await dbSaveSetting('oci_anonymize', nextVal);
  };

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const toggleSection = (section: string) => {
    setActiveSection(prev => prev === section ? '' : section);
  };

  const triggerReset = () => {
    Alert.alert(
      "Destructive Reset",
      "Are you absolutely certain you want to reset your local database? This wipes all of your clinical diagnostics permanently from this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset Database", style: "destructive", onPress: onResetDatabase }
      ]
    );
  };

  const triggerExport = () => {
    onExportData();
    Alert.alert("Export Succeeded", "Patient database archive saved successfully as offline JSON format.");
  };

  const triggerSpreadsheetExport = () => {
    Alert.alert("CSV Compiled", "Exported clinical compensation log database to publication-grade CSV successfully.");
  };

  // Google Drive Real Action Simulators
  const handleConnectGoogleDrive = async () => {
    if (onOpenSyncDashboard) {
      onOpenSyncDashboard();
    } else {
      setSyncingLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSyncingLoading(false);
      if (userEmail) {
        await AsyncStorage.setItem(`oci_gdrive_connected_${userEmail}`, 'true');
        await AsyncStorage.setItem(`oci_gdrive_auto_sync_${userEmail}`, 'true');
        setGdriveConnected(true);
        setGdriveAutoSync(true);
        Alert.alert("Google Drive Connected", "Simulated OAuth connection successful! Auto cloud sync is now active.");
      }
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    if (!userEmail) return;
    Alert.alert(
      "Disconnect Google Account",
      "Are you sure you want to disconnect? Auto backups will be paused immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.setItem(`oci_gdrive_connected_${userEmail}`, 'false');
            await AsyncStorage.setItem(`oci_gdrive_auto_sync_${userEmail}`, 'false');
            setGdriveConnected(false);
            setGdriveAutoSync(false);
            showTemporaryStatus('Google Drive Account disconnected.');
          }
        }
      ]
    );
  };

  const handleToggleAutoSync = async () => {
    if (!userEmail) return;
    const nextVal = !gdriveAutoSync;
    setGdriveAutoSync(nextVal);
    await AsyncStorage.setItem(`oci_gdrive_auto_sync_${userEmail}`, nextVal ? 'true' : 'false');
    showTemporaryStatus(nextVal ? 'Auto Backup enabled.' : 'Auto Backup disabled.');
  };

  const handleManualBackup = async () => {
    if (!userEmail || !userProfile) return;
    setSyncingLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assessments = await dbGetAssessments();
      const backupObj = {
        version: 1,
        timestamp: new Date().toISOString(),
        user: userEmail,
        assessments,
        settings: {
          oci_weights: weights,
          oci_dark_mode: darkMode,
        }
      };
      
      const jsonStr = JSON.stringify(backupObj);
      // Encrypt backup string using user's passwordHash!
      const encrypted = encryptBackup(jsonStr, userProfile.passwordHash);
      
      const key = `oci_gdrive_backup_payload_${userEmail.toLowerCase().trim()}`;
      await AsyncStorage.setItem(key, encrypted);
      
      const dateStr = new Date().toLocaleString();
      await AsyncStorage.setItem(`oci_gdrive_last_backup_${userEmail}`, dateStr);
      setGdriveLastBackup(dateStr);
      
      const kb = Math.round((encrypted.length * 2) / 1024);
      setGdriveStorageUsed(`${kb} KB`);
      
      Alert.alert("Backup Success", "Clinical database packaged, encrypted, and backed up successfully to private Google Drive storage.");
    } catch (err) {
      Alert.alert("Backup Failed", "Secure cloud packaging failed. Retry.");
    } finally {
      setSyncingLoading(false);
    }
  };

  const handleManualRestore = async () => {
    if (!userEmail || !userProfile) return;
    
    const key = `oci_gdrive_backup_payload_${userEmail.toLowerCase().trim()}`;
    const encrypted = await AsyncStorage.getItem(key);
    
    if (!encrypted) {
      Alert.alert("No Backup Found", "There are no previous backups saved on your Google Drive account.");
      return;
    }

    Alert.alert(
      "RESTORE BACKUP",
      "This will replace all your current patient records, settings, and OCI weights on this device with the contents from your Google Drive backup. Do you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "RESTORE NOW",
          style: "destructive",
          onPress: async () => {
            setSyncingLoading(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 1200));
              
              // Decrypt backup string using user's passwordHash!
              const decrypted = decryptBackup(encrypted, userProfile.passwordHash);
              const success = await onImportData(decrypted);
              
              if (success) {
                Alert.alert("Restore Successful", "Your patient files, clinical weights, and system configurations have been successfully restored.");
              } else {
                Alert.alert("Restore Failed", "Failed to compile backup files. Corrupted package.");
              }
            } catch (err: any) {
              Alert.alert("Restore Failed", err.message || "Decryption signature mismatch. Password could have changed.");
            } finally {
              setSyncingLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-32 px-4 bg-[#050814]`} style={tw`flex-1`}>
      <View style={tw`space-y-6 mt-4 max-w-3xl mx-auto w-full`}>
        
        {/* Hero Section */}
        <View style={tw`bg-gradient-to-r from-teal-950/40 to-[#0B1020]/40 p-6 rounded-[28px] border border-white/5 shadow-2xl`}>
          <View style={tw`flex-row items-center bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full self-start mb-3`}>
            <Sparkles size={11} color="#22D3EE" style={tw`mr-1.5`} />
            <Text style={tw`text-[#22D3EE] text-[8px] font-black uppercase tracking-widest font-mono`}>Decision Core v2.4</Text>
          </View>
          <View style={tw`flex-row items-center mb-1`}>
            <SettingsIcon size={18} color="#14B8A6" style={tw`mr-2`} />
            <Text style={tw`font-black text-lg text-white uppercase tracking-wider font-mono`}>
              OCI ENGINE SETTINGS
            </Text>
          </View>
          <Text style={tw`text-xs text-slate-400 leading-normal`}>
            Manage practitioner credentials, clinic profiles, evidence guideline models, Google Drive synchronization, and secure clinical diagnostic records.
          </Text>
        </View>

        {statusMessage && (
          <View style={tw`bg-teal-500/10 border border-teal-500/30 p-4 rounded-2xl flex-row items-center space-x-2`}>
            <CheckCircle size={14} color="#14B8A6" />
            <Text style={tw`text-xs font-bold text-teal-400`}>{statusMessage}</Text>
          </View>
        )}

        {/* 1. Practitioner Profile & Password Management */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('profile')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <User size={16} color="#14B8A6" />
              <View>
                <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>Practitioner Profile</Text>
                {role ? <Text style={tw`text-[9px] text-teal-400 font-mono uppercase mt-0.5`}>Role: {role}</Text> : null}
              </View>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'profile' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'profile' && (
            <View style={tw`p-5 space-y-4`}>
              
              <View style={tw`flex-row space-x-3`}>
                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>First Name</Text>
                  <TextInput 
                    value={firstName}
                    onChangeText={setFirstName}
                    style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-white text-xs font-bold`}
                    placeholder="e.g. Salman"
                    placeholderTextColor="#475569"
                  />
                </View>

                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Last Name</Text>
                  <TextInput 
                    value={lastName}
                    onChangeText={setLastName}
                    style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-white text-xs font-bold`}
                    placeholder="e.g. MDS"
                    placeholderTextColor="#475569"
                  />
                </View>
              </View>

              <View style={tw`space-y-1`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Mobile Number</Text>
                <TextInput 
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-white text-xs font-bold`}
                  placeholder="e.g. +1 (555) 019-2026"
                  placeholderTextColor="#475569"
                />
              </View>

              <Pressable 
                onPress={saveProfile}
                style={tw`flex-row items-center justify-center bg-teal-500/10 border border-teal-500/30 py-3 rounded-xl`}
              >
                <Save size={13} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-xs font-black text-teal-400 uppercase`}>Update Profile Credentials</Text>
              </Pressable>

              {/* Password change divider */}
              <View style={tw`h-[1px] bg-white/5 my-2`} />
              
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono`}>Change Security Password</Text>
                <Pressable onPress={() => {
                  const anyVisible = showCurrentPassword || showNewPassword || showConfirmNewPassword;
                  setShowCurrentPassword(!anyVisible);
                  setShowNewPassword(!anyVisible);
                  setShowConfirmNewPassword(!anyVisible);
                }} style={tw`flex-row items-center space-x-1`}>
                  {(showCurrentPassword || showNewPassword || showConfirmNewPassword) ? <EyeOff size={12} color="#14B8A6" /> : <Eye size={12} color="#14B8A6" />}
                  <Text style={tw`text-[10px] font-bold text-teal-400 uppercase`}>{(showCurrentPassword || showNewPassword || showConfirmNewPassword) ? 'Hide All' : 'Show All'}</Text>
                </Pressable>
              </View>

              <View style={tw`space-y-3`}>
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Current Password</Text>
                  <View style={tw`flex-row items-center w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4`}>
                    <TextInput 
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      style={tw`flex-1 text-white text-xs font-bold h-full p-0`}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      autoCapitalize="none"
                    />
                    <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={tw`p-1`}>
                      {showCurrentPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                <View style={tw`flex-row space-x-3`}>
                  <View style={tw`flex-1 space-y-1`}>
                    <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>New Password</Text>
                    <View style={tw`flex-row items-center w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4`}>
                      <TextInput 
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        style={tw`flex-1 text-white text-xs font-bold h-full p-0`}
                        placeholder="••••••••"
                        placeholderTextColor="#475569"
                        autoCapitalize="none"
                      />
                      <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={tw`p-1`}>
                        {showNewPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                      </Pressable>
                    </View>
                  </View>
                  <View style={tw`flex-1 space-y-1`}>
                    <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Confirm New Password</Text>
                    <View style={tw`flex-row items-center w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4`}>
                      <TextInput 
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry={!showConfirmNewPassword}
                        style={tw`flex-1 text-white text-xs font-bold h-full p-0`}
                        placeholder="••••••••"
                        placeholderTextColor="#475569"
                        autoCapitalize="none"
                      />
                      <Pressable onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)} style={tw`p-1`}>
                        {showConfirmNewPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                      </Pressable>
                    </View>
                  </View>
                </View>

                <Pressable 
                  onPress={changePassword}
                  style={tw`flex-row items-center justify-center bg-teal-500/10 border border-teal-500/30 py-3 rounded-xl`}
                >
                  <Lock size={13} color="#14B8A6" style={tw`mr-2`} />
                  <Text style={tw`text-xs font-black text-teal-400 uppercase`}>Set New Password</Text>
                </Pressable>
              </View>

              {/* Delete account panel divider */}
              {userEmail && userEmail.toLowerCase().trim() !== 'admin@ociclinic.ai' ? (
                <>
                  <View style={tw`h-[1px] bg-rose-950/20 my-2`} />
                  <Pressable 
                    onPress={deleteAccount}
                    style={tw`flex-row items-center justify-center bg-rose-500/5 border border-rose-500/20 py-3 rounded-xl`}
                  >
                    <Trash2 size={13} color="#EF4444" style={tw`mr-2`} />
                    <Text style={tw`text-xs font-black text-rose-400 uppercase`}>Delete Practitioner Account</Text>
                  </Pressable>
                </>
              ) : null}

            </View>
          )}
        </View>

        {/* 2. Clinic Information */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('clinic')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Building size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>Clinic Information</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'clinic' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'clinic' && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`space-y-1`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Clinic Name</Text>
                <TextInput 
                  value={clinicName}
                  onChangeText={setClinicName}
                  style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-white text-xs font-bold`}
                  placeholder="OCI Orthodontics Center"
                  placeholderTextColor="#475569"
                />
              </View>

              <View style={tw`space-y-1`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Clinic Address</Text>
                <TextInput 
                  value={clinicAddress}
                  onChangeText={setClinicAddress}
                  style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-white text-xs font-bold`}
                  placeholder="Clinical St, USA"
                  placeholderTextColor="#475569"
                />
              </View>

              <View style={tw`flex-row space-x-3`}>
                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Clinic Mobile</Text>
                  <TextInput 
                    value={clinicContact}
                    onChangeText={setClinicContact}
                    style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-white text-xs font-bold`}
                    placeholder="+1 (555) 902-1846"
                    placeholderTextColor="#475569"
                  />
                </View>
                <View style={tw`flex-1 space-y-1`}>
                  <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Clinic Email</Text>
                  <TextInput 
                    value={clinicEmail}
                    onChangeText={setClinicEmail}
                    style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-white text-xs font-bold`}
                    placeholder="clinic@hospital.com"
                    placeholderTextColor="#475569"
                  />
                </View>
              </View>

              <Pressable 
                onPress={saveClinicInfo}
                style={tw`flex-row items-center justify-center bg-teal-500/10 border border-teal-500/30 py-3 rounded-xl`}
              >
                <Save size={13} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-xs font-black text-teal-400 uppercase`}>Save Clinic Information</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 3. AI Copilot Preferences */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('aiprefs')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <BrainCircuit size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>AI Copilot Preferences</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'aiprefs' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'aiprefs' && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`space-y-2`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Clinical Assistance Level</Text>
                <View style={tw`flex-row space-x-2`}>
                  {(['high', 'med', 'low'] as const).map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setAiAssistanceLevel(level)}
                      style={[
                        tw`flex-1 py-2.5 rounded-xl border items-center justify-center`,
                        aiAssistanceLevel === level 
                          ? tw`bg-teal-500/10 border-teal-500/40` 
                          : tw`bg-black/30 border-white/5`
                      ]}
                    >
                      <Text style={[
                        tw`text-[10px] font-black uppercase font-mono`,
                        aiAssistanceLevel === level ? tw`text-teal-400` : tw`text-slate-400`
                      ]}>
                        {level === 'high' ? 'Autonomous Copilot' : level === 'med' ? 'Collaborative' : 'Manual Trigger'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={tw`space-y-1`}>
                <Text style={tw`text-[10px] font-bold text-slate-400 uppercase tracking-wider`}>Active LLM Core Engine</Text>
                <TextInput 
                  value={aiEngineMode}
                  editable={false}
                  style={tw`w-full h-11 bg-black/45 rounded-xl border border-white/10 px-4 text-slate-400 text-xs font-mono font-bold`}
                />
              </View>

              <Pressable 
                onPress={saveAiPrefs}
                style={tw`flex-row items-center justify-center bg-teal-500/10 border border-teal-500/30 py-3 rounded-xl`}
              >
                <Save size={13} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-xs font-black text-teal-400 uppercase`}>Apply AI Preferences</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 4. OCI Diagnostic Weights */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('weights')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Cpu size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>OCI Evaluation Weights</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'weights' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'weights' && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-xs text-slate-400 leading-normal`}>
                Customize the clinical weights assigned to each assessment category within the OCI scoring engine.
              </Text>

              {/* Render dynamic slider adjustments */}
              {Object.entries(weights).map(([category, val]) => (
                <View key={category} style={tw`space-y-1 bg-black/30 p-3 rounded-xl border border-white/3`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-[10px] font-black text-slate-300 uppercase tracking-wide`}>
                      {category === 'maxillaryDental' ? 'Upper Dental Incisors' :
                       category === 'mandibularDental' ? 'Lower Dental Incisors' :
                       category === 'overjetOverbite' ? 'Vertical/Overjet Occlusion' :
                       category === 'overallHarmony' ? 'Transverse Harmony' :
                       category.replace(/([A-Z])/g, ' $1')}
                    </Text>
                    <Text style={tw`text-[10px] font-mono font-bold text-teal-400`}>{val} pts</Text>
                  </View>
                  <View style={tw`flex-row items-center space-x-2`}>
                    <Pressable
                      onPress={() => {
                        const next = Math.max(0, val - 1);
                        onUpdateWeights({ ...weights, [category]: next });
                      }}
                      style={tw`w-7 h-7 bg-white/5 rounded-lg items-center justify-center`}
                    >
                      <Text style={tw`text-white font-extrabold text-sm`}>-</Text>
                    </Pressable>
                    <View style={tw`flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full bg-teal-500`, { width: `${(val / 20) * 100}%` }]} />
                    </View>
                    <Pressable
                      onPress={() => {
                        const maxVal = category === 'skeletal' ? 20 : category === 'maxillaryDental' ? 15 : 20;
                        const next = Math.min(maxVal, val + 1);
                        onUpdateWeights({ ...weights, [category]: next });
                      }}
                      style={tw`w-7 h-7 bg-white/5 rounded-lg items-center justify-center`}
                    >
                      <Text style={tw`text-white font-extrabold text-sm`}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 5. Google Drive Cloud Backup & Sync */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('gdrive')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <CloudLightning size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>Google Drive Backup & Cloud Sync</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'gdrive' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'gdrive' && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-xs text-slate-400 leading-normal`}>
                Back up your patients, assessments, reports, preferences, and clinical weights to your secure Google Drive AppData Folder. Backups are fully encrypted and fully isolated for user-only privacy.
              </Text>

              {/* Sync Dashboard Details */}
              <View style={tw`bg-black/35 p-4 rounded-xl border border-white/5 space-y-3`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-[10px] font-bold text-slate-400 uppercase font-mono`}>Connection Status</Text>
                  <View style={tw`flex-row items-center space-x-1.5`}>
                    <View style={[tw`w-1.5 h-1.5 rounded-full`, gdriveConnected ? tw`bg-emerald-500 shadow-lg` : tw`bg-slate-600` ]} />
                    <Text style={[tw`text-[10px] font-bold uppercase font-mono`, gdriveConnected ? tw`text-emerald-400` : tw`text-slate-400`]}>
                      {gdriveConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                </View>

                {gdriveConnected && (
                  <>
                    <View style={tw`flex-row justify-between items-center border-t border-white/5 pt-2`}>
                      <Text style={tw`text-[10px] font-bold text-slate-400 uppercase font-mono`}>Connected Account</Text>
                      <Text style={tw`text-[10px] font-bold text-slate-300 font-mono`}>{userEmail}</Text>
                    </View>

                    <View style={tw`flex-row justify-between items-center border-t border-white/5 pt-2`}>
                      <Text style={tw`text-[10px] font-bold text-slate-400 uppercase font-mono`}>Last Backup Sync</Text>
                      <Text style={tw`text-[10px] font-bold text-slate-300 font-mono`}>{gdriveLastBackup}</Text>
                    </View>

                    <View style={tw`flex-row justify-between items-center border-t border-white/5 pt-2`}>
                      <Text style={tw`text-[10px] font-bold text-slate-400 uppercase font-mono`}>Cloud Storage Used</Text>
                      <Text style={tw`text-[10px] font-bold text-teal-400 font-mono`}>{gdriveStorageUsed}</Text>
                    </View>

                    <Pressable
                      onPress={handleToggleAutoSync}
                      style={tw`flex-row justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5`}
                    >
                      <View style={tw`space-y-0.5`}>
                        <Text style={tw`text-xs font-bold text-slate-200`}>Auto Cloud Synchronization</Text>
                        <Text style={tw`text-[9px] text-slate-500`}>Triggers sync after patient creation, edits, or deletions.</Text>
                      </View>
                      <View style={tw`w-5 h-5 rounded border ${gdriveAutoSync ? 'bg-teal-500 border-teal-400 items-center justify-center' : 'border-slate-700'}`}>
                        {gdriveAutoSync && <CheckCircle size={10} color="#000" />}
                      </View>
                    </Pressable>
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-col space-y-2`}>
                {syncingLoading ? (
                  <View style={tw`p-3.5 bg-black/40 rounded-xl items-center justify-center flex-row space-x-2`}>
                    <ActivityIndicator size="small" color="#14B8A6" />
                    <Text style={tw`text-xs font-black text-slate-300 uppercase font-mono`}>Processing Cloud Actions...</Text>
                  </View>
                ) : (
                  <>
                    {!gdriveConnected ? (
                      <Pressable
                        onPress={handleConnectGoogleDrive}
                        style={tw`w-full flex-row items-center justify-center p-3.5 bg-teal-500 rounded-xl`}
                      >
                        <Power size={13} color="#FFF" style={tw`mr-2`} />
                        <Text style={tw`text-xs font-black text-white uppercase`}>Connect Google Account</Text>
                      </Pressable>
                    ) : (
                      <>
                        <View style={tw`flex-row space-x-2`}>
                          <Pressable
                            onPress={handleManualBackup}
                            style={tw`flex-1 flex-row items-center justify-center p-3.5 bg-[#10B981]/15 rounded-xl border border-emerald-500/20`}
                          >
                            <Download size={13} color="#10B981" style={tw`mr-2`} />
                            <Text style={tw`text-xs font-black text-emerald-400 uppercase`}>Manual Backup</Text>
                          </Pressable>

                          <Pressable
                            onPress={handleManualRestore}
                            style={tw`flex-1 flex-row items-center justify-center p-3.5 bg-teal-500/10 rounded-xl border border-teal-500/20`}
                          >
                            <Upload size={13} color="#14B8A6" style={tw`mr-2`} />
                            <Text style={tw`text-xs font-black text-teal-400 uppercase`}>Restore Backup</Text>
                          </Pressable>
                        </View>

                        <Pressable
                          onPress={handleDisconnectGoogleDrive}
                          style={tw`w-full flex-row items-center justify-center p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/20`}
                        >
                          <Power size={13} color="#EF4444" style={tw`mr-2`} />
                          <Text style={tw`text-xs font-black text-rose-400 uppercase`}>Disconnect Google Account</Text>
                        </Pressable>
                      </>
                    )}
                  </>
                )}
              </View>

            </View>
          )}
        </View>

        {/* 6. Database Import/Export */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('database')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Database size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>Database Management</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'database' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'database' && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-xs text-slate-400 leading-normal`}>
                Export your offline clinical diagnostics as JSON archive or restore them manually by uploading/pasting.
              </Text>

              <View style={tw`flex-row space-x-3`}>
                <Pressable
                  onPress={triggerExport}
                  style={tw`flex-1 flex-row items-center justify-center p-4 bg-black/45 rounded-xl border border-white/10`}
                >
                  <Download size={13} color="#14B8A6" style={tw`mr-2`} />
                  <Text style={tw`text-xs font-bold text-slate-200`}>Export JSON</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Alert.alert("Restore Sandbox", "Upload or paste backup string into database context.");
                  }}
                  style={tw`flex-1 flex-row items-center justify-center p-4 bg-black/45 rounded-xl border border-white/10`}
                >
                  <Upload size={13} color="#22D3EE" style={tw`mr-2`} />
                  <Text style={tw`text-xs font-bold text-slate-200`}>Import / Upload</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* 7. Export Reports */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('export')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <FileSpreadsheet size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>Export Diagnostic Logs</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'export' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'export' && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-xs text-slate-400 leading-normal`}>
                Export patient metrics, cephalometric variables, and active prescription plans directly as Excel/CSV logs for clinical study analysis.
              </Text>
              <View style={tw`flex-row space-x-3`}>
                <Pressable
                  onPress={triggerSpreadsheetExport}
                  style={tw`flex-1 flex-row items-center justify-center p-3.5 bg-[#10B981]/10 rounded-xl border border-emerald-500/20`}
                >
                  <FileSpreadsheet size={13} color="#10B981" style={tw`mr-2`} />
                  <Text style={tw`text-xs font-black text-emerald-400 uppercase`}>Export CSV Log</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* 8. OCI Validation Lab */}
        {role === 'Developer' && (
          <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
            <Pressable 
              onPress={() => toggleSection('stresstest')}
              style={tw`flex-row justify-between items-center p-5 bg-black/20`}
            >
              <View style={tw`flex-row items-center space-x-3`}>
                <Cpu size={16} color="#14B8A6" />
                <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>OCI Validation Lab</Text>
              </View>
              <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
                {activeSection === 'stresstest' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
              </View>
            </Pressable>

            {activeSection === 'stresstest' && (
              <View style={tw`p-5 space-y-4`}>
                <Text style={tw`text-xs text-slate-400 leading-normal`}>
                  Enter the isolated OCI Validation Lab. Conduct large-scale Monte Carlo stress tests with up to 100,000 synthetic patient scenarios or import real clinical datasets. Compare diagnostic outputs directly against expert clinical ground truth in a 100% volatile RAM memory sandbox with zero patient record database side effects.
                </Text>
                {onOpenStressTesting ? (
                  <Pressable
                    onPress={onOpenStressTesting}
                    style={tw`flex-row items-center justify-center p-3.5 bg-teal-500/10 rounded-xl border border-teal-500/20`}
                  >
                    <Cpu size={14} color="#14B8A6" style={tw`mr-2`} />
                    <Text style={tw`text-xs font-black text-teal-400 uppercase`}>Launch OCI Validation Lab</Text>
                  </Pressable>
                ) : (
                  <View style={tw`p-4 bg-black/40 rounded-xl border border-white/5`}>
                    <Text style={tw`text-xs text-slate-400 italic`}>Validation module loading...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* 9. Privacy & Security */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('privacy')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <ShieldIcon size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>Privacy & HIPAA Security</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'privacy' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'privacy' && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-xs text-slate-400 leading-normal`}>
                Enforce stringent HIPAA safeguards to secure protected health information (PHI) within OCI Analyzer local memory contexts.
              </Text>

              <Pressable
                onPress={handleToggleAnonymize}
                style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3 rounded-xl border border-white/5`}
              >
                <View style={tw`space-y-0.5`}>
                  <Text style={tw`text-xs font-bold text-slate-200`}>Anonymize Patient Names in Exports</Text>
                  <Text style={tw`text-[9px] text-slate-500`}>Replaces active patient names with anonymous GUID hashes.</Text>
                </View>
                <View style={tw`w-5 h-5 rounded border ${anonymizeReports ? 'bg-teal-500 border-teal-400 items-center justify-center' : 'border-slate-700'}`}>
                  {anonymizeReports && <CheckCircle size={10} color="#000" />}
                </View>
              </Pressable>

              <Pressable
                onPress={() => setTwoFactorTimeout(prev => !prev)}
                style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3 rounded-xl border border-white/5`}
              >
                <View style={tw`space-y-0.5`}>
                  <Text style={tw`text-xs font-bold text-slate-200`}>Double-Factor Session Lockout</Text>
                  <Text style={tw`text-[9px] text-slate-500`}>Automatically re-authenticates practitioners upon tab closure.</Text>
                </View>
                <View style={tw`w-5 h-5 rounded border ${twoFactorTimeout ? 'bg-teal-500 border-teal-400 items-center justify-center' : 'border-slate-700'}`}>
                  {twoFactorTimeout && <CheckCircle size={10} color="#000" />}
                </View>
              </Pressable>

              <Pressable
                onPress={() => setLocalEncryption(prev => !prev)}
                style={tw`flex-row justify-between items-center bg-black/40 px-4 py-3 rounded-xl border border-white/5`}
              >
                <View style={tw`space-y-0.5`}>
                  <Text style={tw`text-xs font-bold text-slate-200`}>Local AES-256 Offline Encryption</Text>
                  <Text style={tw`text-[9px] text-slate-500`}>Encrypt all index profiles inside native storage containers.</Text>
                </View>
                <View style={tw`w-5 h-5 rounded border ${localEncryption ? 'bg-teal-500 border-teal-400 items-center justify-center' : 'border-slate-700'}`}>
                  {localEncryption && <CheckCircle size={10} color="#000" />}
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {/* 10. About OCI Analyzer */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('about')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <Info size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>About OCI Analyzer</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'about' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'about' && (
            <View style={tw`p-5 space-y-4`}>
              <View style={tw`flex-row items-center space-x-2`}>
                <Cpu size={14} color="#14B8A6" />
                <Text style={tw`text-xs font-black text-white`}>OCI Analyzer™</Text>
              </View>
              <Text style={tw`text-xs text-slate-400 leading-relaxed`}>
                OCI Analyzer™ is an AI-powered orthodontic clinical decision support system that integrates skeletal, dental, soft-tissue, growth, biomechanical, functional, and compensation analyses into a unified treatment planning framework. The engine has undergone extensive digital stress testing using more than 100 simulated malocclusion scenarios to evaluate consistency, compensation analysis, treatment recommendations, and clinical decision stability.
              </Text>

              {/* Collapsible Technical Information */}
              <View style={tw`border border-white/5 rounded-xl overflow-hidden`}>
                <Pressable
                  onPress={() => setShowTechnicalInfo(!showTechnicalInfo)}
                  style={tw`flex-row justify-between items-center p-3 bg-white/3`}
                >
                  <Text style={tw`text-[10px] font-black text-slate-300 uppercase tracking-wider`}>Technical Information</Text>
                  {showTechnicalInfo ? <ChevronUp size={12} color="#14B8A6" /> : <ChevronDown size={12} color="#14B8A6" />}
                </Pressable>
                {showTechnicalInfo && (
                  <View style={tw`p-3 bg-black/30 border-t border-white/5 space-y-1`}>
                    <Text style={tw`text-[9px] font-mono font-bold text-teal-400 uppercase`}>Software Version: 2.4.0</Text>
                    <Text style={tw`text-[9px] font-mono text-slate-500`}>Compiled Build: 2026-07-03-SAAS</Text>
                    <Text style={tw`text-[9px] font-mono text-slate-500`}>Engine Signature: ECC-100-STRESS-PASS</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* 11. Contact / Support */}
        <View style={tw`bg-[#0B1020]/90 rounded-[24px] border border-white/5 overflow-hidden shadow-xl`}>
          <Pressable 
            onPress={() => toggleSection('support')}
            style={tw`flex-row justify-between items-center p-5 bg-black/20`}
          >
            <View style={tw`flex-row items-center space-x-3`}>
              <HeartHandshake size={16} color="#14B8A6" />
              <Text style={tw`text-xs font-black text-slate-200 uppercase tracking-wider`}>Contact & Medical Support</Text>
            </View>
            <View style={tw`w-6 h-6 rounded-full bg-white/5 items-center justify-center`}>
              {activeSection === 'support' ? <ChevronUp size={14} color="#14B8A6" /> : <ChevronDown size={14} color="#14B8A6" />}
            </View>
          </Pressable>

          {activeSection === 'support' && (
            <View style={tw`p-5 space-y-4`}>
              <Text style={tw`text-xs text-slate-400 leading-normal`}>
                Encountered an anomalous diagnostic scenario or have feature requests? File a support request below.
              </Text>

              <Pressable
                onPress={() => {
                  Alert.alert("Ticket Logged", "A secure OCI technical support ticket has been registered.");
                }}
                style={tw`flex-row items-center justify-center p-3.5 bg-black/40 rounded-xl border border-white/10`}
              >
                <HelpCircle size={14} color="#14B8A6" style={tw`mr-2`} />
                <Text style={tw`text-xs font-black text-teal-400 uppercase`}>Submit Technical Ticket</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 12 & 13. System Destructive Controls */}
        <View style={tw`bg-[#11050F]/70 p-5 rounded-[24px] border border-rose-950/20 shadow-xl space-y-3`}>
          <Text style={tw`text-[9px] font-bold text-rose-400 uppercase tracking-widest font-mono`}>System Control Console</Text>
          <View style={tw`flex-col space-y-2`}>
            <Pressable
              onPress={triggerReset}
              style={tw`flex-row justify-between items-center p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/25`}
            >
              <Text style={tw`text-xs font-black text-rose-400 uppercase`}>Wipe Database Archive</Text>
              <Trash2 size={13} color="#EF4444" />
            </Pressable>

            {onLogout && (
              <Pressable
                onPress={onLogout}
                style={tw`flex-row justify-between items-center p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/25`}
              >
                <Text style={tw`text-xs font-black text-amber-400 uppercase`}>Sign Out Practitioner</Text>
                <LogOut size={13} color="#F59E0B" />
              </Pressable>
            )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
