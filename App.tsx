import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView, StatusBar, Alert, Image } from 'react-native';
import { 
  PatientDetails, 
  CephalometricInput, 
  OciResult, 
  Assessment, 
  OciWeights,
  UserRole
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
  dbClearAllData,
  dbGetProfile,
  dbSeedAdmin,
  dbSetActiveUser,
  dbGetActiveUser
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
import ReportsPanel from './src/components/ReportsPanel';
import GoogleDriveSync from './src/components/GoogleDriveSync';
import StressTestingPanel from './src/components/StressTestingPanel';
import DevPinVerificationScreen from './src/components/DevPinVerificationScreen';
import TreatmentPlanning from './src/components/TreatmentPlanning';

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
  Award,
  Lock,
  Bookmark
} from 'lucide-react-native';
import tw from 'twrnc';

function constructEstimatedCeph(details: PatientDetails): CephalometricInput {
  const isClass2 = details.diagnosis === 'Class II';
  const isClass3 = details.diagnosis === 'Class III';
  
  const anbVal = isClass2 ? 6.0 : isClass3 ? -2.0 : 2.0;
  const snaVal = isClass2 ? 84.0 : isClass3 ? 78.0 : 82.0;
  const snbVal = isClass2 ? 78.0 : isClass3 ? 80.0 : 80.0;
  const witsVal = isClass2 ? 5.0 : isClass3 ? -4.0 : 0.0;
  const fmaVal = details.facialProfile === 'Convex' ? 28.0 : details.facialProfile === 'Concave' ? 20.0 : 25.0;
  const snMpVal = details.facialProfile === 'Convex' ? 35.0 : details.facialProfile === 'Concave' ? 28.0 : 32.0;
  const u1SnVal = isClass2 ? 98.0 : isClass3 ? 112.0 : 104.0;
  const impaVal = isClass2 ? 98.0 : isClass3 ? 83.0 : 90.0;
  
  const ojVal = details.overjet !== undefined && details.overjet !== '' ? Number(details.overjet) : (isClass2 ? 5.5 : isClass3 ? -1.0 : 2.5);
  const obVal = details.overbite !== undefined && details.overbite !== '' ? Number(details.overbite) : 2.5;

  return {
    anb: anbVal,
    sna: snaVal,
    snb: snbVal,
    wits: witsVal,
    snMp: snMpVal,
    fma: fmaVal,
    u1Sn: u1SnVal,
    u1NaDeg: isClass2 ? 18 : isClass3 ? 28 : 22,
    u1NaMm: isClass2 ? 2.5 : isClass3 ? 6.0 : 4.0,
    impa: impaVal,
    l1NbDeg: isClass2 ? 30 : isClass3 ? 18 : 25,
    l1NbMm: isClass2 ? 5.5 : isClass3 ? 2.0 : 4.0,
    interincisalAngle: isClass2 ? 140 : isClass3 ? 125 : 135,
    overjet: ojVal,
    overbite: obVal,
    upperLipELine: isClass2 ? 1.0 : isClass3 ? -3.0 : -2.0,
    lowerLipELine: isClass2 ? 2.0 : isClass3 ? -1.0 : 0.0,
    nasolabialAngle: isClass2 ? 92 : isClass3 ? 108 : 102,
    facialConvexity: isClass2 ? 18 : isClass3 ? 6 : 12,
    molarRelation: details.molarRelationRight || 'Class I',
    canineRelation: details.canineRelationRight || 'Class I',
    crossbite: details.anteriorCrossbite === 'Single Tooth' || details.anteriorCrossbite === 'Multiple' ? 'Anterior' : 'None',
    deepBite: obVal > 3.5 ? obVal - 2.5 : 0,
    openBite: obVal < 0 ? Math.abs(obVal) : 0,
    curveOfSpee: details.crowdingSpacing === 'Crowding' ? 2.0 : 1.0,
    midlineDeviation: 0,
    posteriorCrossbite: details.posteriorCrossbite || 'None',
    archWidthDifference: details.posteriorCrossbite === 'Unilateral' ? -2.0 : details.posteriorCrossbite === 'Bilateral' ? -4.0 : 0,
    dentalMidlineDev: 0
  };
}

export default function App() {
  const safeAlert = (title: string, message: string) => {
    try {
      Alert.alert(title, message);
    } catch (e) {
      console.log(`Alert blocked [${title}]: ${message}`, e);
    }
  };

  // Core Navigation
  const [screen, setScreen] = useState<'splash' | 'home' | 'patient-form' | 'ceph-input' | 'results' | 'history' | 'settings' | 'about' | 'reports' | 'stress-testing' | 'treatment-planning'>('splash');
  
  // Authentication states
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isDevPinVerified, setIsDevPinVerified] = useState<boolean>(false);

  const fetchUserRole = async (email: string) => {
    try {
      const profile = await dbGetProfile(email);
      if (profile) {
        setUserRole(profile.role);
      } else {
        setUserRole('Orthodontist');
      }
    } catch (e) {
      console.log('Failed to fetch user role', e);
      setUserRole('Orthodontist');
    }
  };

  // Local states
  const [savedAssessments, setSavedAssessments] = useState<Assessment[]>([]);
  const [weights, setWeights] = useState<OciWeights>(DEFAULT_WEIGHTS);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Active Assessment State Flow
  const [activePatient, setActivePatient] = useState<PatientDetails | null>(null);
  const [activeCeph, setActiveCeph] = useState<CephalometricInput | null>(null);
  const [activeResult, setActiveResult] = useState<OciResult | null>(null);
  const [activeMode, setActiveMode] = useState<'clinic' | 'ceph' | 'turbo'>('turbo');

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

        // Pre-seed default OCI Administrator and Developer credentials
        await dbSeedAdmin();

        // Restore user session if present
        const savedEmail = await AsyncStorage.getItem('oci_user_email');
        const savedIsGoogle = await AsyncStorage.getItem('oci_is_google');
        if (savedEmail) {
          dbSetActiveUser(savedEmail);
          setUserEmail(savedEmail);
          setIsGoogleUser(savedIsGoogle === 'true');
          await fetchUserRole(savedEmail);
        } else {
          dbSetActiveUser(null);
        }

        let assessments = await dbGetAssessments();
        const activeEmail = dbGetActiveUser();
        const key = activeEmail ? `oci_clinical_db_assessments_${activeEmail}` : 'oci_clinical_db_assessments_guest';

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
          await AsyncStorage.setItem(key, JSON.stringify(migratedList));
          assessments = migratedList;
          console.log(`Migration complete. Active cases count: ${assessments.length}`);
        }

        if (!assessments || assessments.length === 0) {
          try {
            console.log('Seeding OCI Database with 3 professional cases...');
            await AsyncStorage.setItem(key, JSON.stringify(DEMO_PATIENTS));
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
    dbSetActiveUser(email);
    setUserEmail(email);
    setIsGoogleUser(isGoogle);
    await AsyncStorage.setItem('oci_user_email', email);
    await AsyncStorage.setItem('oci_is_google', isGoogle ? 'true' : 'false');
    await fetchUserRole(email);
    const loaded = await dbGetAssessments();
    setSavedAssessments(loaded);
  };

  const handleLogout = async () => {
    dbSetActiveUser(null);
    setUserEmail(null);
    setIsGoogleUser(false);
    setUserRole(null);
    setIsDevPinVerified(false);
    await AsyncStorage.removeItem('oci_user_email');
    await AsyncStorage.removeItem('oci_is_google');
    const guestData = await dbGetAssessments();
    setSavedAssessments(guestData);
    setScreen('home'); // Reset screen stack
  };

  const toggleDarkMode = async () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    await dbSaveSetting('oci_dark_mode', nextDark);
  };

  const handleStartNewAssessment = (mode: 'clinic' | 'ceph' | 'turbo' = 'turbo') => {
    setActiveMode(mode);
    const uuid = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    setEditingAssessmentId(uuid);

    const defaultPatient: PatientDetails = {
      name: '',
      age: '',
      gender: '',
      caseNumber: `OCI-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`,
      diagnosis: 'Class I',
      date: new Date().toISOString().split('T')[0],
      clinicalNotes: '',
      analysisMode: mode
    };

    const defaultCeph: CephalometricInput = {
      anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
      u1Sn: '', u1NaDeg: '', u1NaMm: '',
      impa: '', l1NbDeg: '', l1NbMm: '',
      interincisalAngle: '', overjet: '', overbite: '',
      upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '',
      molarRelation: '', canineRelation: '', crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
      posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
    };

    setActivePatient(defaultPatient);
    setActiveCeph(defaultCeph);
    setActiveResult(null);
    setScreen('patient-form');
  };

  const handleDraftUpdate = async (details: PatientDetails) => {
    setActivePatient(details);
    const uuid = editingAssessmentId || `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    if (!editingAssessmentId) {
      setEditingAssessmentId(uuid);
    }

    const currentCeph = activeCeph || {
      anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
      u1Sn: '', u1NaDeg: '', u1NaMm: '',
      impa: '', l1NbDeg: '', l1NbMm: '',
      interincisalAngle: '', overjet: '', overbite: '',
      upperLipELine: '', lowerLipELine: '', nasolabialAngle: '', facialConvexity: '',
      molarRelation: '', canineRelation: '', crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
      posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
    };

    let currentResult = activeResult;
    if (activeMode === 'clinic') {
      const estimatedCeph = constructEstimatedCeph(details);
      currentResult = calculateOCI(estimatedCeph, weights);
    } else if (activeCeph) {
      currentResult = calculateOCI(activeCeph, weights);
    }

    const draftAssessment: Assessment = {
      id: uuid,
      patientDetails: details,
      cephalometricInput: activeMode === 'clinic' ? constructEstimatedCeph(details) : currentCeph,
      ociResult: currentResult || {
        totalScore: 0,
        interpretation: 'Normal',
        recommendation: '',
        categoryScores: [],
        severityMap: {
          upperIncisors: 'green',
          lowerIncisors: 'green',
          softTissue: 'green',
          occlusion: 'green',
          transverse: 'green'
        }
      },
      aiSummary: 'Draft in progress...',
      createdAt: new Date().toISOString()
    };

    const exists = savedAssessments.some(a => a.id === uuid);
    let nextAssessments: Assessment[];
    if (exists) {
      nextAssessments = savedAssessments.map(a => a.id === uuid ? draftAssessment : a);
    } else {
      nextAssessments = [draftAssessment, ...savedAssessments];
    }
    setSavedAssessments(nextAssessments);

    try {
      await dbSaveAssessment(draftAssessment);
    } catch (err) {
      console.log('Failed to background auto-save details draft:', err);
    }
  };

  const handleCephUpdate = async (input: CephalometricInput) => {
    setActiveCeph(input);
    if (!activePatient) return;
    const uuid = editingAssessmentId;
    if (!uuid) return;

    const result = calculateOCI(input, weights);
    setActiveResult(result);

    const draftAssessment: Assessment = {
      id: uuid,
      patientDetails: activePatient,
      cephalometricInput: input,
      ociResult: result,
      aiSummary: 'Draft in progress...',
      createdAt: new Date().toISOString()
    };

    const nextAssessments = savedAssessments.map(a => a.id === uuid ? draftAssessment : a);
    setSavedAssessments(nextAssessments);

    try {
      await dbSaveAssessment(draftAssessment);
    } catch (err) {
      console.log('Failed to background auto-save ceph draft:', err);
    }
  };

  const handlePatientSubmit = async (details: PatientDetails) => {
    setActivePatient(details);
    
    if (activeMode === 'clinic') {
      const estimatedCeph = constructEstimatedCeph(details);
      setActiveCeph(estimatedCeph);
      
      const result = calculateOCI(estimatedCeph, weights);
      setActiveResult(result);
      
      const uuid = editingAssessmentId || `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const finalAssessment: Assessment = {
        id: uuid,
        patientDetails: details,
        cephalometricInput: estimatedCeph,
        ociResult: result,
        aiSummary: "Synthesizing orthodontic report...",
        createdAt: new Date().toISOString()
      };
      
      const nextAssessments = savedAssessments.map(a => a.id === uuid ? finalAssessment : a);
      setSavedAssessments(nextAssessments);
      
      try {
        await dbSaveAssessment(finalAssessment);
      } catch (err) {
        console.error("Failed to auto-save clinical assessment:", err);
      }
      setEditingAssessmentId(uuid);
      setScreen('results');
    } else {
      setScreen('ceph-input');
    }
  };

  const handleCephSubmit = async (input: CephalometricInput) => {
    setActiveCeph(input);
    const result = calculateOCI(input, weights);
    
    let derivedDiagnosis: 'Class I' | 'Class II' | 'Class III' = 'Class I';
    if (input.anb !== '') {
      const anbVal = Number(input.anb);
      if (anbVal < 0) derivedDiagnosis = 'Class III';
      else if (anbVal > 4.5) derivedDiagnosis = 'Class II';
      else derivedDiagnosis = 'Class I';
    }

    let updatedPatient = activePatient;
    if (activePatient) {
      updatedPatient = {
        ...activePatient,
        diagnosis: derivedDiagnosis
      };
      setActivePatient(updatedPatient);
    }

    setActiveResult(result);

    if (updatedPatient) {
      const uuid = editingAssessmentId || `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      
      const newAssessment: Assessment = {
        id: uuid,
        patientDetails: updatedPatient,
        cephalometricInput: input,
        ociResult: result,
        aiSummary: "Synthesizing orthodontic report...",
        createdAt: new Date().toISOString()
      };

      const exists = savedAssessments.some(a => a.id === uuid);
      let nextAssessments: Assessment[];
      if (exists) {
        nextAssessments = savedAssessments.map(a => a.id === uuid ? newAssessment : a);
      } else {
        nextAssessments = [newAssessment, ...savedAssessments];
      }
      setSavedAssessments(nextAssessments);
      
      try {
        await dbSaveAssessment(newAssessment);
      } catch (err) {
        console.error("Failed to auto-save assessment:", err);
      }
      setEditingAssessmentId(uuid);
    }

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
              <View>
                <Text style={tw`font-extrabold text-sm text-white tracking-wide`}>
                  OCI ANALYZER
                </Text>
                <Text style={tw`text-[8px] font-bold uppercase text-[#22D3EE] tracking-wider`}>AI DECISION SYSTEM</Text>
              </View>
            </Pressable>
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
                  onViewTreatmentPlanning={() => setScreen('treatment-planning')}
                  onViewReports={() => setScreen('reports')}
                  savedAssessments={savedAssessments}
                />
              )}

              {screen === 'patient-form' && (
                <PatientForm
                  initialDetails={activePatient || undefined}
                  mode={activeMode}
                  onNext={handlePatientSubmit}
                  onCancel={() => setScreen('home')}
                  onUpdate={handleDraftUpdate}
                />
              )}

              {screen === 'ceph-input' && activePatient && (
                <CephInput
                  initialInput={activeCeph || undefined}
                  patientDetails={activePatient}
                  diagnosis={activePatient.diagnosis}
                  onCalculate={handleCephSubmit}
                  onBack={() => setScreen('patient-form')}
                  onUpdate={handleCephUpdate}
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
                  onOpenStressTesting={() => setScreen('stress-testing')}
                  userEmail={userEmail}
                />
              )}

              {screen === 'stress-testing' && (
                userRole !== 'Developer' ? (
                  <View style={tw`flex-1 justify-center items-center p-6 bg-[#050814]`}>
                    <View style={tw`bg-[#1C0F17] p-8 rounded-[32px] border border-rose-500/25 max-w-sm items-center space-y-4 shadow-2xl`}>
                      <View style={tw`w-14 h-14 bg-rose-500/10 rounded-full items-center justify-center border border-rose-500/20`}>
                        <Lock size={24} color="#EF4444" />
                      </View>
                      <Text style={tw`text-base font-black text-white text-center uppercase tracking-wider`}>Access Denied</Text>
                      <Text style={tw`text-xs text-rose-300 text-center leading-relaxed font-bold`}>
                        The OCI Validation Lab and stress-testing diagnostic modules are restricted solely to certified OCI Developer accounts. This unauthorized access attempt has been logged under HIPAA protocol.
                      </Text>
                      <Pressable 
                        onPress={() => setScreen('settings')}
                        style={tw`bg-[#EF4444]/15 border border-rose-500/30 px-6 py-2.5 rounded-xl`}
                      >
                        <Text style={tw`text-xs font-bold text-rose-400 uppercase font-mono`}>Back to Settings</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : !isDevPinVerified ? (
                  <DevPinVerificationScreen 
                    onSuccess={() => setIsDevPinVerified(true)}
                    onBack={() => setScreen('settings')}
                  />
                ) : (
                  <StressTestingPanel
                    onBack={() => setScreen('settings')}
                  />
                )
              )}

              {screen === 'reports' && (
                <ReportsPanel
                  savedAssessments={savedAssessments}
                  onOpenPdf={(assessment) => setPdfReportAssessment(assessment)}
                />
              )}

              {screen === 'treatment-planning' && (
                <TreatmentPlanning
                  savedAssessments={savedAssessments}
                  onUpdateAssessment={async (updated) => {
                    const nextAssessments = savedAssessments.map(a => a.id === updated.id ? updated : a);
                    setSavedAssessments(nextAssessments);
                    await dbSaveAssessment(updated);
                  }}
                  activeAssessmentId={editingAssessmentId || (savedAssessments.length > 0 ? savedAssessments[0].id : null)}
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
          userEmail={userEmail}
        />

        {/* 5. Floating Bottom Navigation for Mobile Devices */}
        {screen !== 'splash' && userEmail && (
          <View style={tw`bg-[#0B0F19]/95 border-t border-white/10 flex-row justify-around py-3 px-2 shadow-2xl items-center`}>
            {[
              { id: 'home', label: 'Dashboard', icon: HomeIcon },
              { id: 'patient-form', label: 'Analysis', icon: Activity, action: handleStartNewAssessment },
              { id: 'treatment-planning', label: 'Treatment', icon: Bookmark },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: SettingsIcon }
            ].map((item) => {
              const isActive = screen === item.id || 
                (item.id === 'patient-form' && (screen === 'patient-form' || screen === 'ceph-input' || screen === 'results'));
              return (
                <Pressable
                  key={item.id}
                  onPress={item.action ? () => item.action() : () => setScreen(item.id as any)}
                  style={[
                    isActive 
                      ? tw`bg-teal-500/10 border border-teal-500/20 px-3.5 py-2 rounded-2xl flex-row items-center justify-center space-x-1.5 shadow-lg shadow-teal-500/5` 
                      : tw`items-center justify-center py-1.5 px-2 rounded-xl border border-transparent`
                  ]}
                >
                  <item.icon size={15} color={isActive ? '#14B8A6' : '#64748B'} />
                  {isActive ? (
                    <Text style={tw`text-[9px] font-black tracking-wide text-teal-400 uppercase font-mono`}>
                      {item.label}
                    </Text>
                  ) : (
                    <Text style={tw`text-[8px] font-bold mt-1 tracking-wide text-slate-500 uppercase font-mono`}>
                      {item.label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}
