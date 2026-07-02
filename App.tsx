import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import { 
  PatientDetails, 
  CephalometricInput, 
  OciResult, 
  Assessment, 
  OciWeights 
} from './src/types';
import { calculateOCI, DEFAULT_WEIGHTS } from './src/scoringEngine';
import { DEMO_PATIENTS } from './src/lib/demoPatients';

// Async Storage DB Helpers
import {
  dbGetAssessments,
  dbSaveAssessment,
  dbDeleteAssessment,
  dbSaveSetting,
  dbGetSetting,
  dbExportBackup,
  dbImportBackup,
  dbClearAllData
} from './src/lib/db';

// Components
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/components/LoginScreen';
import Splash from './src/components/Splash';
import Home from './src/components/Home';
import PatientForm from './src/components/PatientForm';
import CephInput from './src/components/CephInput';
import ResultsDashboard from './src/components/ResultsDashboard';
import HistoryList from './src/components/HistoryList';
import SettingsPanel from './src/components/SettingsPanel';
import PdfReport from './src/components/PdfReport';
import TreatmentPlanning from './src/components/TreatmentPlanning';
import ReportsPanel from './src/components/ReportsPanel';
import GoogleDriveSync from './src/components/GoogleDriveSync';

// Icons
import { 
  Activity, 
  Home as HomeIcon, 
  PlusCircle, 
  FileText, 
  Settings as SettingsIcon, 
  Moon, 
  Sun,
  Users,
  Brain,
  Award
} from 'lucide-react-native';
import tw from 'twrnc';

export default function App() {
  const safeAlert = (title: string, message: string) => {
    try {
      Alert.alert(title, message);
    } catch (e) {
      console.log(`Alert blocked [${title}]: ${message}`, e);
    }
  };

  // Core Navigation
  const [screen, setScreen] = useState<'splash' | 'home' | 'patient-form' | 'ceph-input' | 'results' | 'history' | 'settings' | 'about' | 'treatment-planning' | 'reports'>('splash');
  
  // Authentication states
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState<boolean>(false);

  // Local states
  const [savedAssessments, setSavedAssessments] = useState<Assessment[]>([]);
  const [weights, setWeights] = useState<OciWeights>(DEFAULT_WEIGHTS);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Active Assessment State Flow
  const [activePatient, setActivePatient] = useState<PatientDetails | null>(null);
  const [activeCeph, setActiveCeph] = useState<CephalometricInput | null>(null);
  const [activeResult, setActiveResult] = useState<OciResult | null>(null);

  // PDF Overlay State
  const [pdfReportAssessment, setPdfReportAssessment] = useState<Assessment | null>(null);

  // Edit & Cloud Backup dashboard states
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [syncDashboardVisible, setSyncDashboardVisible] = useState<boolean>(false);

  // Load persistence on mount from AsyncStorage
  useEffect(() => {
    async function loadIndexedData() {
      try {
        // Clear all database records exactly once on v5 reset to seed correct gold-standard cases
        const v5Cleared = await AsyncStorage.getItem('has_wiped_demo_patients_v5');
        if (!v5Cleared) {
          await dbClearAllData();
          await AsyncStorage.setItem('has_wiped_demo_patients_v5', 'true');
        }

        // Restore user session if present
        const savedEmail = await AsyncStorage.getItem('oci_user_email');
        const savedIsGoogle = await AsyncStorage.getItem('oci_is_google');
        if (savedEmail) {
          setUserEmail(savedEmail);
          setIsGoogleUser(savedIsGoogle === 'true');
        }

        let assessments = await dbGetAssessments();

        // Database Migration: Automatically detect and clean up the old 100 synthetic dataset cases
        const hasOldSeededCases = assessments.some(a => 
          a.id.startsWith('seeded_') || 
          (a.patientDetails.caseNumber && a.patientDetails.caseNumber.startsWith('OCI-C-')) || 
          (a.patientDetails.caseNumber && a.patientDetails.caseNumber.startsWith('OCI-') && !a.patientDetails.caseNumber.startsWith('OCI-DEMO-'))
        );

        if (hasOldSeededCases) {
          console.log('Migration: Detected old synthetic/seeded database cases. Filtering them out automatically...');
          const filtered = assessments.filter(a => {
            const isOldSeeded = a.id.startsWith('seeded_') || 
              (a.patientDetails.caseNumber && a.patientDetails.caseNumber.startsWith('OCI-C-')) || 
              (a.patientDetails.caseNumber && a.patientDetails.caseNumber.startsWith('OCI-') && !a.patientDetails.caseNumber.startsWith('OCI-DEMO-'));
            return !isOldSeeded;
          });

          // Ensure exactly the 3 correct demo patients exist in the list
          const existingMap = new Map<string, Assessment>();
          filtered.forEach(a => existingMap.set(a.id, a));
          
          DEMO_PATIENTS.forEach(dp => {
            if (!existingMap.has(dp.id)) {
              existingMap.set(dp.id, dp);
            }
          });

          const migratedList = Array.from(existingMap.values());
          await AsyncStorage.setItem('oci_clinical_db_assessments', JSON.stringify(migratedList));
          assessments = migratedList;
          console.log(`Migration complete. Active cases count: ${assessments.length}`);
        }

        if (!assessments || assessments.length === 0) {
          try {
            console.log('Seeding OCI Database with 3 professional cases...');
            await AsyncStorage.setItem('oci_clinical_db_assessments', JSON.stringify(DEMO_PATIENTS));
            assessments = DEMO_PATIENTS;
            console.log(`Seeded ${DEMO_PATIENTS.length} professional cases successfully.`);
          } catch (seedErr) {
            console.error('Seeding error:', seedErr);
          }
        }

        if (assessments && assessments.length > 0) {
          setSavedAssessments(assessments);
        } else {
          setSavedAssessments([]);
        }

        const storedWeights = await dbGetSetting<OciWeights>('oci_weights', DEFAULT_WEIGHTS);
        setWeights(storedWeights);

        const storedTheme = await dbGetSetting<boolean>('oci_dark_mode', true);
        setDarkMode(storedTheme);
      } catch (e) {
        console.error('Error loading clinical AsyncStorage database:', e);
      }
    }
    loadIndexedData();
  }, []);

  const handleLoginSuccess = async (email: string, isGoogle: boolean) => {
    setUserEmail(email);
    setIsGoogleUser(isGoogle);
    await AsyncStorage.setItem('oci_user_email', email);
    await AsyncStorage.setItem('oci_is_google', isGoogle ? 'true' : 'false');
  };

  const handleLogout = async () => {
    setUserEmail(null);
    setIsGoogleUser(false);
    await AsyncStorage.removeItem('oci_user_email');
    await AsyncStorage.removeItem('oci_is_google');
    setScreen('home'); // Reset screen stack
  };

  const toggleDarkMode = async () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    await dbSaveSetting('oci_dark_mode', nextDark);
  };

  const handleStartNewAssessment = () => {
    setEditingAssessmentId(null);
    setActivePatient(null);
    setActiveCeph(null);
    setActiveResult(null);
    setScreen('patient-form');
  };

  const handlePatientSubmit = (details: PatientDetails) => {
    setActivePatient(details);
    setScreen('ceph-input');
  };

  const handleCephSubmit = (input: CephalometricInput) => {
    setActiveCeph(input);
    const result = calculateOCI(input, weights);
    
    let derivedDiagnosis: 'Class I' | 'Class II' | 'Class III' = 'Class I';
    if (input.anb !== '') {
      const anbVal = Number(input.anb);
      if (anbVal < 0) derivedDiagnosis = 'Class III';
      else if (anbVal > 4.5) derivedDiagnosis = 'Class II';
      else derivedDiagnosis = 'Class I';
    }

    if (activePatient) {
      setActivePatient({
        ...activePatient,
        diagnosis: derivedDiagnosis
      });
    }

    setActiveResult(result);
    setScreen('results');
  };

  const handleSaveAssessment = async (aiSummaryText: string) => {
    if (!activePatient || !activeCeph || !activeResult) return;

    if (editingAssessmentId) {
      // Update existing record
      const updatedAssessment: Assessment = {
        id: editingAssessmentId,
        patientDetails: activePatient,
        cephalometricInput: activeCeph,
        ociResult: activeResult,
        aiSummary: aiSummaryText,
        createdAt: new Date().toISOString()
      };

      const nextAssessments = savedAssessments.map(a => a.id === editingAssessmentId ? updatedAssessment : a);
      setSavedAssessments(nextAssessments);
      await dbSaveAssessment(updatedAssessment);
      setEditingAssessmentId(null);
      
      // Also automatically update Google Drive backup if connected
      const connected = await AsyncStorage.getItem('oci_gdrive_connected') === 'true';
      if (connected) {
        const payloadStr = await AsyncStorage.getItem('oci_gdrive_backup_payload');
        if (payloadStr) {
          const payload = JSON.parse(payloadStr);
          const updatedCloud = (payload.assessments as Assessment[]).map(a => a.id === editingAssessmentId ? updatedAssessment : a);
          payload.assessments = updatedCloud;
          await AsyncStorage.setItem('oci_gdrive_backup_payload', JSON.stringify(payload));
        }
      }

      safeAlert("Assessment Updated", "The patient record has been successfully updated in-place.");
    } else {
      // Create a robust GUID
      const uuid = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

      const newAssessment: Assessment = {
        id: uuid,
        patientDetails: activePatient,
        cephalometricInput: activeCeph,
        ociResult: activeResult,
        aiSummary: aiSummaryText,
        createdAt: new Date().toISOString()
      };

      const nextAssessments = [newAssessment, ...savedAssessments];
      setSavedAssessments(nextAssessments);
      await dbSaveAssessment(newAssessment);

      safeAlert("Assessment Saved", "The patient record has been compiled and saved locally.");
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    const nextAssessments = savedAssessments.filter(a => a.id !== id);
    setSavedAssessments(nextAssessments);
    await dbDeleteAssessment(id);

    // Also automatically update Google Drive backup if connected
    const connected = await AsyncStorage.getItem('oci_gdrive_connected') === 'true';
    if (connected) {
      const payloadStr = await AsyncStorage.getItem('oci_gdrive_backup_payload');
      if (payloadStr) {
        const payload = JSON.parse(payloadStr);
        const filteredCloud = (payload.assessments as Assessment[]).filter(a => a.id !== id);
        payload.assessments = filteredCloud;
        await AsyncStorage.setItem('oci_gdrive_backup_payload', JSON.stringify(payload));
        await AsyncStorage.setItem('oci_gdrive_backed_count', String(filteredCloud.length));
      }
    }
  };

  const handleDuplicateAssessment = async (assessment: Assessment) => {
    const uuid = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const duplicatedAssessment: Assessment = {
      id: uuid,
      patientDetails: {
        ...assessment.patientDetails,
        name: `${assessment.patientDetails.name} (Copy)`,
        caseNumber: `${assessment.patientDetails.caseNumber}-DUP`,
        date: new Date().toISOString().split('T')[0]
      },
      cephalometricInput: { ...assessment.cephalometricInput },
      ociResult: { ...assessment.ociResult },
      aiSummary: assessment.aiSummary,
      advanced: assessment.advanced ? { ...assessment.advanced } : undefined,
      createdAt: new Date().toISOString()
    };

    const nextAssessments = [duplicatedAssessment, ...savedAssessments];
    setSavedAssessments(nextAssessments);
    await dbSaveAssessment(duplicatedAssessment);

    // Also automatically update Google Drive backup if connected
    const connected = await AsyncStorage.getItem('oci_gdrive_connected') === 'true';
    if (connected) {
      const payloadStr = await AsyncStorage.getItem('oci_gdrive_backup_payload');
      if (payloadStr) {
        const payload = JSON.parse(payloadStr);
        const updatedCloud = [duplicatedAssessment, ...payload.assessments];
        payload.assessments = updatedCloud;
        await AsyncStorage.setItem('oci_gdrive_backup_payload', JSON.stringify(payload));
        await AsyncStorage.setItem('oci_gdrive_backed_count', String(updatedCloud.length));
      }
    }

    safeAlert("Record Duplicated", `Successfully created copy: ${duplicatedAssessment.patientDetails.name}`);
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessmentId(assessment.id);
    setActivePatient(assessment.patientDetails);
    setActiveCeph(assessment.cephalometricInput);
    setActiveResult(assessment.ociResult);
    setScreen('patient-form');
  };

  const handleUpdateWeights = async (newWeights: OciWeights) => {
    setWeights(newWeights);
    await dbSaveSetting('oci_weights', newWeights);
  };

  const handleImportDatabase = async (jsonStr: string): Promise<boolean> => {
    try {
      const success = await dbImportBackup(jsonStr);
      if (success) {
        const loaded = await dbGetAssessments();
        setSavedAssessments(loaded);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failure:', e);
      return false;
    }
  };

  const handleExportDatabase = async () => {
    try {
      const backupJson = await dbExportBackup();
      safeAlert("Backup Exported", "Save this JSON backup secure key locally.");
    } catch (e) {
      console.error('Failed to export OCI index backup:', e);
    }
  };

  const handleResetDatabase = async () => {
    await dbClearAllData();
    await AsyncStorage.setItem('oci_clinical_db_assessments', JSON.stringify(DEMO_PATIENTS));
    setSavedAssessments(DEMO_PATIENTS);
    safeAlert("Database Reset", "All local clinical history has been successfully reset to the 3 professional demo cases.");
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#050814] justify-center items-center`}>
      <StatusBar barStyle="light-content" />

      {/* Main mobile viewport container */}
      <View style={[tw`w-full max-w-[480px] bg-[#0B1020] border-x border-white/10 shadow-2xl relative overflow-hidden`, { height: '100%', flex: 1 }]}>
        
        {/* 1. Splash Screen Overlay */}
        {screen === 'splash' && (
          <Splash onFinish={() => setScreen('home')} />
        )}

        {/* 2. Top Navigation Bar (Hidden during Splash or if Not Authenticated) */}
        {screen !== 'splash' && userEmail && (
          <View style={tw`bg-[#111827]/80 border-b border-white/10 px-4 py-3.5 flex-row items-center justify-between`}>
            <Pressable onPress={() => setScreen('home')} style={tw`flex-row items-center`}>
              <View style={tw`w-9 h-9 bg-[#14B8A6] rounded-xl items-center justify-center mr-2.5 shadow-md`}>
                <Activity size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={tw`font-extrabold text-sm text-white tracking-wide`}>
                  OCI CLINIC
                </Text>
                <Text style={tw`text-[8px] font-bold uppercase text-teal-400 tracking-wider`}>AI Decision System</Text>
              </View>
            </Pressable>

            <View style={tw`flex-row items-center space-x-3`}>
              <View style={tw`flex-row items-center bg-white/5 px-2.5 py-1 rounded-full border border-white/5`}>
                <View style={tw`w-1.5 h-1.5 bg-[#10B981] rounded-full mr-1.5`} />
                <Text style={tw`text-[9px] text-[#14B8A6] font-bold uppercase tracking-wider`}>Core Active</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. Screen Switch Board */}
        {screen !== 'splash' && (
          !userEmail ? (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          ) : (
            <View style={tw`flex-1`}>
              
              {screen === 'home' && (
                <Home 
                  onNewAssessment={handleStartNewAssessment}
                  onViewHistory={() => setScreen('history')}
                  onViewSettings={() => setScreen('settings')}
                  onViewAbout={() => setScreen('about')}
                  savedAssessments={savedAssessments}
                />
              )}

              {screen === 'patient-form' && (
                <PatientForm
                  initialDetails={activePatient || undefined}
                  onNext={handlePatientSubmit}
                  onCancel={() => setScreen('home')}
                />
              )}

              {screen === 'ceph-input' && activePatient && (
                <CephInput
                  initialInput={activeCeph || undefined}
                  patientDetails={activePatient}
                  diagnosis={activePatient.diagnosis}
                  onCalculate={handleCephSubmit}
                  onBack={() => setScreen('patient-form')}
                />
              )}

              {screen === 'results' && activePatient && activeCeph && activeResult && (
                <ResultsDashboard
                  patientDetails={activePatient}
                  cephalometricInput={activeCeph}
                  ociResult={activeResult}
                  onSaveAssessment={handleSaveAssessment}
                  onOpenPdf={(editedSummaryText) => {
                    setPdfReportAssessment({
                      id: 'preview',
                      patientDetails: activePatient,
                      cephalometricInput: activeCeph,
                      ociResult: activeResult,
                      aiSummary: editedSummaryText,
                      createdAt: new Date().toISOString()
                    });
                  }}
                  onBack={() => setScreen('ceph-input')}
                />
              )}

              {screen === 'history' && (
                <HistoryList
                  assessments={savedAssessments}
                  onSelect={(item) => {
                    setActivePatient(item.patientDetails);
                    setActiveCeph(item.cephalometricInput);
                    setActiveResult(item.ociResult);
                    setScreen('results');
                  }}
                  onDuplicate={handleDuplicateAssessment}
                  onDelete={handleDeleteAssessment}
                  onEdit={handleEditAssessment}
                  onOpenSyncDashboard={() => setSyncDashboardVisible(true)}
                  onNewAssessment={handleStartNewAssessment}
                />
              )}

              {screen === 'settings' && (
                <SettingsPanel
                  weights={weights}
                  onUpdateWeights={handleUpdateWeights}
                  onImportData={handleImportDatabase}
                  onExportData={handleExportDatabase}
                  onResetDatabase={handleResetDatabase}
                  darkMode={darkMode}
                  onToggleDarkMode={toggleDarkMode}
                  onLogout={handleLogout}
                  onOpenSyncDashboard={() => setSyncDashboardVisible(true)}
                />
              )}

              {screen === 'treatment-planning' && (
                <TreatmentPlanning
                  savedAssessments={savedAssessments}
                />
              )}

              {screen === 'reports' && (
                <ReportsPanel
                  savedAssessments={savedAssessments}
                />
              )}

              {screen === 'about' && (
                <ScrollView contentContainerStyle={tw`p-5 pb-24 max-w-4xl w-full mx-auto`}>
                  <View style={tw`bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-4`}>
                    <Text style={tw`text-lg font-black text-slate-900 dark:text-white`}>
                      Orthodontic Compensation Index (OCI) Guidelines
                    </Text>
                    
                    <Text style={tw`text-xs text-slate-600 dark:text-slate-300 leading-normal`}>
                      Dentoalveolar compensation is the physiological system's natural reaction to skeletal sagittal discrepancies. In individuals with Class II or Class III jaw mismatches, teeth tip and glide to establish stable occlusal contacts, masking the true severity of the skeletal pattern.
                    </Text>
                    
                    <View style={tw`p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10`}>
                      <Text style={tw`font-bold text-amber-700 dark:text-amber-300 text-xs`}>Class II Compensatory Archetype</Text>
                      <Text style={tw`text-[11px] text-slate-500 mt-1 leading-normal`}>
                        • Retroclined maxillary incisors (U1-SN tipped backward)
                        {"\n"}• Proclined mandibular incisors (IMPA flared forward)
                        {"\n"}• Increased Curve of Spee in lower arch
                      </Text>
                    </View>

                    <View style={tw`p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10`}>
                      <Text style={tw`font-bold text-teal-700 dark:text-teal-300 text-xs`}>Class III Compensatory Archetype</Text>
                      <Text style={tw`text-[11px] text-slate-500 mt-1 leading-normal`}>
                        • Proclined maxillary incisors (U1-SN flared forward)
                        {"\n"}• Retroclined mandibular incisors (IMPA uprighted/backward)
                        {"\n"}• Flattened lower Curve of Spee
                      </Text>
                    </View>

                    <Text style={tw`font-bold text-slate-800 dark:text-slate-100 text-sm mt-2`}>Clinical Index Severity Ranges</Text>
                    <View style={tw`space-y-1.5`}>
                      <Text style={tw`text-[11px] text-slate-500`}>• 0–20: Minimal Compensation. Teeth aligned naturally over skeletal base.</Text>
                      <Text style={tw`text-[11px] text-slate-500`}>• 21–40: Mild Compensation. Camouflage orthodontic alignment is highly predictable.</Text>
                      <Text style={tw`text-[11px] text-slate-500`}>• 41–60: Moderate Compensation. Dental limits are stretched. Careful examination of periodontal bone plate is required.</Text>
                      <Text style={tw`text-[11px] text-slate-500`}>• 61–80: Severe Compensation. Camouflage carries substantial periodontal risks. Surgical options indicated.</Text>
                      <Text style={tw`text-[11px] text-slate-500`}>• 81–100: Extreme Compensation. Surgical decompensation is highly recommended.</Text>
                    </View>

                    <View style={tw`mt-4 pt-4 border-t border-slate-150 dark:border-slate-800 flex-row justify-between items-center`}>
                      <View>
                        <Text style={tw`text-[8px] text-slate-400 font-mono uppercase`}>Clinical Supervisor</Text>
                        <Text style={tw`text-xs font-extrabold text-slate-800 dark:text-slate-100`}>Dr. Salman MDS Orthodontist</Text>
                      </View>
                      <View style={tw`px-2.5 py-1.5 bg-teal-500/10 rounded-xl`}>
                        <Text style={tw`text-[9px] font-black text-teal-600 uppercase`}>Research Edition</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}

            </View>
          )
        )}

        {/* 4. PDF Fullscreen Overlay Modal (Placed inside mobile container for ideal viewport alignment) */}
        {pdfReportAssessment && (
          <PdfReport
            assessment={pdfReportAssessment}
            onClose={() => setPdfReportAssessment(null)}
          />
        )}

        {/* Google Drive Synchronization Dashboard Modal */}
        <GoogleDriveSync
          visible={syncDashboardVisible}
          onClose={() => setSyncDashboardVisible(false)}
          assessments={savedAssessments}
          onRefreshList={async () => {
            const loaded = await dbGetAssessments();
            setSavedAssessments(loaded);
          }}
        />

        {/* 5. Floating Bottom Navigation for Mobile Devices */}
        {screen !== 'splash' && userEmail && (
          <View style={tw`bg-[#111827]/95 border-t border-white/10 flex-row justify-around py-3 px-2`}>
            {[
              { id: 'home', label: 'Dashboard', icon: HomeIcon },
              { id: 'history', label: 'Patients', icon: Users },
              { id: 'patient-form', label: 'Analysis', icon: Activity, action: handleStartNewAssessment },
              { id: 'treatment-planning', label: 'Treatment', icon: Brain },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: SettingsIcon }
            ].map((item) => {
              const isActive = screen === item.id || 
                (item.id === 'patient-form' && (screen === 'patient-form' || screen === 'ceph-input' || screen === 'results'));
              return (
                <Pressable
                  key={item.id}
                  onPress={item.action ? item.action : () => setScreen(item.id as any)}
                  style={tw`items-center justify-center px-2.5 py-1.5 rounded-xl ${isActive ? 'bg-white/5' : ''}`}
                >
                  <item.icon size={18} color={isActive ? '#14B8A6' : '#94a3b8'} />
                  <Text style={tw`text-[9px] font-bold mt-1 tracking-wide ${isActive ? 'text-teal-400' : 'text-slate-400'}`}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}
