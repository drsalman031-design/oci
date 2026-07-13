import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView, StatusBar, Alert, Image, Platform, LayoutAnimation } from 'react-native';
import { 
  PatientDetails, 
  CephalometricInput, 
  OciResult, 
  Assessment, 
  OciWeights,
  UserRole,
  ClinicWorkspaceData,
  CephWorkspaceData,
  TurboWorkspaceData,
  AdvancedClinicalIntelligence
} from './src/types';
import { calculateOCI, calculateClinicalOCI, DEFAULT_WEIGHTS } from './src/scoringEngine';
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
  dbSetActiveSessionKey,
  dbGetActiveUser,
  sanitizeAssessment
} from './src/lib/db';

// Components
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/components/LoginScreen';
import Splash from './src/components/Splash';
import Home from './src/components/Home';
import PatientForm from './src/components/PatientForm';
import ResultsDashboard from './src/components/ResultsDashboard';
import HistoryList from './src/components/HistoryList';
import SettingsPanel from './src/components/SettingsPanel';
import PdfReport from './src/components/PdfReport';
import ReportsPanel from './src/components/ReportsPanel';
import GoogleDriveSync from './src/components/GoogleDriveSync';
import TreatmentPlanning from './src/components/TreatmentPlanning';
import ClinicPhotoWorkstation from './src/components/ClinicPhotoWorkstation';
import AiProcessingScreen from './src/components/AiProcessingScreen';
import { setDynamicApiKey } from './src/lib/gemini';

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
  const [screen, setScreen] = useState<'splash' | 'home' | 'patient-form' | 'results' | 'history' | 'settings' | 'about' | 'reports' | 'treatment-planning' | 'clinic-photo-upload' | 'ai-processing'>('splash');
  
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

        const savedKey = await AsyncStorage.getItem('oci_gemini_api_key');
        if (savedKey) {
          setDynamicApiKey(savedKey);
        }

        // Pre-seed default OCI Administrator and Developer credentials
        await dbSeedAdmin();

        // Reset active user and session key on startup to force fresh login credentials check
        dbSetActiveUser(null);
        dbSetActiveSessionKey(null);
        setUserEmail(null);

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

        // State Restoration
        try {
          const savedScreen = await AsyncStorage.getItem('oci_persistence_screen');
          const savedMode = await AsyncStorage.getItem('oci_persistence_mode') as 'clinic' | 'ceph' | 'turbo' | null;
          const savedEditingId = await AsyncStorage.getItem('oci_persistence_editing_id');
          const savedPatientStr = await AsyncStorage.getItem('oci_persistence_active_patient');
          const savedCephStr = await AsyncStorage.getItem('oci_persistence_active_ceph');
          const savedResultStr = await AsyncStorage.getItem('oci_persistence_active_result');

          if (savedScreen && savedScreen !== 'splash') {
            setScreen(savedScreen as any);
          } else {
            setScreen('home');
          }
          if (savedMode) setActiveMode(savedMode);
          if (savedEditingId) setEditingAssessmentId(savedEditingId);
          if (savedPatientStr) setActivePatient(JSON.parse(savedPatientStr));
          if (savedCephStr) setActiveCeph(JSON.parse(savedCephStr));
          if (savedResultStr) setActiveResult(JSON.parse(savedResultStr));
        } catch (restoreErr) {
          console.log('Error restoring workspace states:', restoreErr);
          setScreen('home');
        }
      } catch (e) {
        console.error('Error loading clinical AsyncStorage database:', e);
      }
    }
    loadIndexedData();
  }, []);

  // Save navigation states on change
  useEffect(() => {
    if (screen !== 'splash') {
      try {
        AsyncStorage.setItem('oci_persistence_screen', screen);
      } catch (err) {
        console.log('Error persisting screen:', err);
      }
    }
  }, [screen]);

  useEffect(() => {
    try {
      AsyncStorage.setItem('oci_persistence_mode', activeMode);
    } catch (err) {
      console.log('Error persisting mode:', err);
    }
  }, [activeMode]);

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
    dbSetActiveSessionKey(null);
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

  // Session inactivity auto-logout (15 minutes of inactivity triggers logout)
  useEffect(() => {
    if (!userEmail) return;

    let timeoutId: any;
    const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        try {
          Alert.alert('Session Expired', 'You have been automatically logged out due to inactivity.');
        } catch (e) {
          console.log('Session Expired alert triggered.');
        }
      }, INACTIVITY_TIME);
    };

    if (Platform.OS === 'web') {
      const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
      events.forEach(ev => window.addEventListener(ev, resetTimer));
      
      resetTimer();
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach(ev => window.removeEventListener(ev, resetTimer));
      };
    } else {
      resetTimer();
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [userEmail]);


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

  const saveActiveWorkspace = async (
    patientVal: PatientDetails | null,
    cephVal: CephalometricInput | null,
    resultVal: OciResult | null,
    summaryVal?: string,
    advVal?: AdvancedClinicalIntelligence
  ) => {
    const uuid = editingAssessmentId || `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    if (!editingAssessmentId) {
      setEditingAssessmentId(uuid);
      await AsyncStorage.setItem('oci_persistence_editing_id', uuid);
    }

    const existing = savedAssessments.find(a => a.id === uuid);
    
    const defaultSharedDetails: PatientDetails = {
      name: patientVal?.name || existing?.patientDetails?.name || '',
      age: patientVal?.age !== undefined ? patientVal.age : (existing?.patientDetails?.age || ''),
      gender: patientVal?.gender || existing?.patientDetails?.gender || '',
      caseNumber: patientVal?.caseNumber || existing?.patientDetails?.caseNumber || '',
      date: patientVal?.date || existing?.patientDetails?.date || new Date().toISOString(),
      diagnosis: patientVal?.diagnosis || existing?.patientDetails?.diagnosis || '',
      clinicalNotes: patientVal?.clinicalNotes || existing?.patientDetails?.clinicalNotes || '',
      analysisMode: activeMode
    };

    const emptyCeph: CephalometricInput = {
      anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
      u1Sn: '', u1NaDeg: '', u1NaMm: '', impa: '', l1NbDeg: '', l1NbMm: '',
      interincisalAngle: '', overjet: '', overbite: '', upperLipELine: '', lowerLipELine: '',
      nasolabialAngle: '', facialConvexity: '', molarRelation: '', canineRelation: '',
      crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
      posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
    };

    const emptyPatient: PatientDetails = {
      name: defaultSharedDetails.name,
      age: defaultSharedDetails.age,
      gender: defaultSharedDetails.gender,
      caseNumber: defaultSharedDetails.caseNumber,
      date: defaultSharedDetails.date,
      diagnosis: '',
      clinicalNotes: '',
      facialProfile: '',
      smileAnalysis: '',
      crowdingSpacing: '',
      dentitionPhase: '',
      chiefComplaint: '',
      facialAsymmetry: '',
      lips: '',
      molarRelationRight: '',
      molarRelationLeft: '',
      canineRelationRight: '',
      canineRelationLeft: '',
      overjet: '',
      overbite: '',
      anteriorCrossbite: '',
      posteriorCrossbite: '',
      functionalAirway: '',
      tmjStatus: '',
      habits: [],
      cvmStage: '',
      growthStatus: '',
      analysisMode: 'clinic'
    };

    const clinicWorkspace: ClinicWorkspaceData = existing?.clinicWorkspace ? { ...existing.clinicWorkspace } : {
      patientDetails: emptyPatient, ociResult: null, aiSummary: '', status: 'Not Started'
    };
    const cephWorkspace: CephWorkspaceData = existing?.cephWorkspace ? { ...existing.cephWorkspace } : {
      cephalometricInput: emptyCeph, ociResult: null, aiSummary: '', status: 'Not Started'
    };
    const turboWorkspace: TurboWorkspaceData = existing?.turboWorkspace ? { ...existing.turboWorkspace } : {
      patientDetails: emptyPatient, cephalometricInput: emptyCeph, ociResult: null, aiSummary: '', status: 'Not Started'
    };

    if (activeMode === 'clinic') {
      if (patientVal) {
        clinicWorkspace.patientDetails = { ...clinicWorkspace.patientDetails, ...patientVal };
        clinicWorkspace.status = resultVal ? 'Completed' : (patientVal.diagnosis ? 'In Progress' : 'Not Started');
      }
      if (resultVal) clinicWorkspace.ociResult = resultVal;
      if (summaryVal !== undefined) clinicWorkspace.aiSummary = summaryVal;
      if (advVal !== undefined) clinicWorkspace.advanced = advVal;
    } else if (activeMode === 'ceph') {
      if (cephVal) {
        cephWorkspace.cephalometricInput = { ...cephWorkspace.cephalometricInput, ...cephVal };
        cephWorkspace.status = resultVal ? 'Completed' : (cephVal.anb !== '' ? 'In Progress' : 'Not Started');
      }
      if (resultVal) cephWorkspace.ociResult = resultVal;
      if (summaryVal !== undefined) cephWorkspace.aiSummary = summaryVal;
      if (advVal !== undefined) cephWorkspace.advanced = advVal;
    } else if (activeMode === 'turbo') {
      if (patientVal) {
        turboWorkspace.patientDetails = { ...turboWorkspace.patientDetails, ...patientVal };
      }
      if (cephVal) {
        turboWorkspace.cephalometricInput = { ...turboWorkspace.cephalometricInput, ...cephVal };
      }
      const hasClinical = patientVal?.diagnosis || turboWorkspace.patientDetails.diagnosis;
      const hasCeph = cephVal?.anb !== '' || turboWorkspace.cephalometricInput.anb !== '';
      
      turboWorkspace.status = resultVal ? 'Completed' : ((hasClinical || hasCeph) ? 'In Progress' : 'Not Started');
      if (resultVal) turboWorkspace.ociResult = resultVal;
      if (summaryVal !== undefined) turboWorkspace.aiSummary = summaryVal;
      if (advVal !== undefined) turboWorkspace.advanced = advVal;
    }

    const updatedAssessment: Assessment = {
      id: uuid,
      createdAt: existing?.createdAt || new Date().toISOString(),
      patientDetails: defaultSharedDetails,
      clinicWorkspace,
      cephWorkspace,
      turboWorkspace
    };

    const nextAssessments = savedAssessments.some(a => a.id === uuid)
      ? savedAssessments.map(a => a.id === uuid ? updatedAssessment : a)
      : [updatedAssessment, ...savedAssessments];

    setSavedAssessments(nextAssessments);
    await dbSaveAssessment(updatedAssessment);

    // Save persistence states
    await AsyncStorage.setItem('oci_persistence_active_patient', JSON.stringify(patientVal || activePatient));
    await AsyncStorage.setItem('oci_persistence_active_ceph', JSON.stringify(cephVal || activeCeph));
    await AsyncStorage.setItem('oci_persistence_active_result', JSON.stringify(resultVal || activeResult));
  };

  const handleDraftUpdate = async (details: PatientDetails) => {
    setActivePatient(details);
    let result: OciResult | null = null;
    if (activeMode === 'clinic') {
      result = calculateClinicalOCI(details, weights);
      setActiveResult(result);
    }
    await saveActiveWorkspace(details, null, result);
  };

  const handleCephUpdate = async (input: CephalometricInput) => {
    setActiveCeph(input);
    let result: OciResult | null = null;
    if (activeMode === 'ceph') {
      result = calculateOCI(input, weights);
      setActiveResult(result);
    }
    await saveActiveWorkspace(null, input, result);
  };

  const handlePatientSubmit = async (details: PatientDetails) => {
    setActivePatient(details);
    setScreen('clinic-photo-upload');
  };

  const handleClinicPhotoComplete = async (photos: Record<string, string>, findings: string[]) => {
    if (activePatient) {
      const updatedPatient: PatientDetails = {
        ...activePatient,
        clinicalPhotos: photos,
        clinicalPhotoFindings: findings
      };
      setActivePatient(updatedPatient);
      setScreen('ai-processing');
    }
  };

  const handleAiProcessingComplete = async () => {
    if (activePatient) {
      // Auto-generate orthodontic cephalometric tracing values
      const automaticCephInput: CephalometricInput = {
        anb: 5.2,
        sna: 81.4,
        snb: 76.2,
        wits: 3.4,
        snMp: 32,
        fma: 24.1,
        u1Sn: 107.5,
        u1NaDeg: 22,
        u1NaMm: 4,
        impa: 97.2,
        l1NbDeg: 28.1,
        l1NbMm: 4,
        interincisalAngle: 121.2,
        overjet: 6.2,
        overbite: 2,
        upperLipELine: -2,
        lowerLipELine: 0,
        nasolabialAngle: 102,
        facialConvexity: 12,
        yAxis: 61.4,
        coA: 85,
        coGn: 110,
        molarRelation: 'Class II',
        canineRelation: 'Class II',
        crossbite: 'None',
        deepBite: 0,
        openBite: 0,
        curveOfSpee: 1.5,
        midlineDeviation: 0,
        posteriorCrossbite: 'None',
        archWidthDifference: 0,
        dentalMidlineDev: 0
      };

      setActiveCeph(automaticCephInput);

      // Run OCI calculations
      const calculatedResult = calculateOCI(automaticCephInput, weights);
      setActiveResult(calculatedResult);

      // Save complete record structures to database
      await saveActiveWorkspace(activePatient, automaticCephInput, calculatedResult, "Autonomous OCI report synthesis completed.");
      setScreen('results');
    }
  };

  const handleCephSubmit = async (input: CephalometricInput) => {
    setActiveCeph(input);
    const result = calculateOCI(input, weights);
    setActiveResult(result);
    
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

    await saveActiveWorkspace(updatedPatient, input, result, "Synthesizing orthodontic report...");
    setScreen('results');
  };

  const handleSaveAssessment = async (aiSummaryText: string) => {
    await saveActiveWorkspace(activePatient, activeCeph, activeResult, aiSummaryText);
    setEditingAssessmentId(null);
    await AsyncStorage.removeItem('oci_persistence_editing_id');
    await AsyncStorage.removeItem('oci_persistence_active_patient');
    await AsyncStorage.removeItem('oci_persistence_active_ceph');
    await AsyncStorage.removeItem('oci_persistence_active_result');
    safeAlert("Assessment Saved", "The patient record has been compiled and saved locally.");
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
    const rawDuplicated = {
      ...assessment,
      id: uuid,
      patientDetails: {
        ...assessment.patientDetails,
        name: `${assessment.patientDetails.name} (Copy)`,
        caseNumber: `${assessment.patientDetails.caseNumber}-DUP`,
        date: new Date().toISOString().split('T')[0]
      },
      createdAt: new Date().toISOString()
    };
    const duplicatedAssessment = sanitizeAssessment(rawDuplicated);

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

  const loadWorkspaceForMode = (assessment: Assessment, mode: 'clinic' | 'ceph' | 'turbo') => {
    setActiveMode(mode);
    setEditingAssessmentId(assessment.id);
    AsyncStorage.setItem('oci_persistence_editing_id', assessment.id);
    AsyncStorage.setItem('oci_persistence_mode', mode);
    
    const emptyCeph: CephalometricInput = {
      anb: '', sna: '', snb: '', wits: '', snMp: '', fma: '',
      u1Sn: '', u1NaDeg: '', u1NaMm: '', impa: '', l1NbDeg: '', l1NbMm: '',
      interincisalAngle: '', overjet: '', overbite: '', upperLipELine: '', lowerLipELine: '',
      nasolabialAngle: '', facialConvexity: '', molarRelation: '', canineRelation: '',
      crossbite: '', deepBite: '', openBite: '', curveOfSpee: '', midlineDeviation: '',
      posteriorCrossbite: '', archWidthDifference: '', dentalMidlineDev: ''
    };

    const emptyPatient: PatientDetails = {
      name: assessment.patientDetails.name,
      age: assessment.patientDetails.age,
      gender: assessment.patientDetails.gender,
      caseNumber: assessment.patientDetails.caseNumber,
      date: assessment.patientDetails.date,
      diagnosis: '',
      clinicalNotes: '',
      facialProfile: '',
      smileAnalysis: '',
      crowdingSpacing: '',
      dentitionPhase: '',
      chiefComplaint: '',
      facialAsymmetry: '',
      lips: '',
      molarRelationRight: '',
      molarRelationLeft: '',
      canineRelationRight: '',
      canineRelationLeft: '',
      overjet: '',
      overbite: '',
      anteriorCrossbite: '',
      posteriorCrossbite: '',
      functionalAirway: '',
      tmjStatus: '',
      habits: [],
      cvmStage: '',
      growthStatus: '',
      analysisMode: 'clinic'
    };

    let pat = emptyPatient;
    let ceph = emptyCeph;
    let res: OciResult | null = null;

    if (mode === 'clinic') {
      pat = assessment.clinicWorkspace?.patientDetails || emptyPatient;
      ceph = emptyCeph;
      res = assessment.clinicWorkspace?.ociResult || null;
    } else if (mode === 'ceph') {
      pat = emptyPatient;
      ceph = assessment.cephWorkspace?.cephalometricInput || emptyCeph;
      res = assessment.cephWorkspace?.ociResult || null;
    } else if (mode === 'turbo') {
      pat = assessment.turboWorkspace?.patientDetails || emptyPatient;
      ceph = assessment.turboWorkspace?.cephalometricInput || emptyCeph;
      res = assessment.turboWorkspace?.ociResult || null;
    }

    setActivePatient(pat);
    setActiveCeph(ceph);
    setActiveResult(res);

    AsyncStorage.setItem('oci_persistence_active_patient', JSON.stringify(pat));
    AsyncStorage.setItem('oci_persistence_active_ceph', JSON.stringify(ceph));
    AsyncStorage.setItem('oci_persistence_active_result', JSON.stringify(res));
  };

  const handleEditAssessment = (assessment: Assessment) => {
    loadWorkspaceForMode(assessment, activeMode);
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
          <View style={tw`bg-[#111827]/80 border-b border-white/10 px-4 py-3 flex-row items-center justify-between`}>
            <Pressable onPress={() => setScreen('home')} style={tw`flex-row items-center space-x-2`}>
              <View>
                <Text style={tw`font-extrabold text-xs text-white tracking-wide`}>
                  OCI ANALYZER
                </Text>
                <Text style={tw`text-[7px] font-bold uppercase text-[#22D3EE] tracking-wider`}>AI DECISION SYSTEM</Text>
              </View>
            </Pressable>

            {/* Mode-specific Unique Workspace Header and Color Accent */}
            {['patient-form', 'ai-processing', 'results', 'treatment-planning', 'reports', 'clinic-photo-upload'].includes(screen) && (
              <View style={tw`flex-row items-center space-x-2`}>
                <View style={[
                  tw`px-2.5 py-1 rounded-full border flex-row items-center space-x-1.5`,
                  activeMode === 'clinic' ? tw`bg-emerald-500/10 border-emerald-500/30` :
                  activeMode === 'ceph' ? tw`bg-blue-500/10 border-blue-500/30` :
                  tw`bg-amber-500/10 border-amber-500/30`
                ]}>
                  <View style={[
                    tw`w-1.5 h-1.5 rounded-full`,
                    activeMode === 'clinic' ? tw`bg-emerald-400` :
                    activeMode === 'ceph' ? tw`bg-blue-400` :
                    tw`bg-amber-400`
                  ]} />
                  <View>
                    <Text style={[
                      tw`text-[8px] font-black uppercase tracking-wider font-mono`,
                      activeMode === 'clinic' ? tw`text-emerald-400` :
                      activeMode === 'ceph' ? tw`text-blue-400` :
                      tw`text-amber-400`
                    ]}>
                      {activeMode === 'clinic' ? '🩺 CLINIC MODE' :
                       activeMode === 'ceph' ? '📐 CEPH MODE' :
                       '🚀 OCI TURBO MODE'}
                    </Text>
                    <Text style={tw`text-[6px] text-slate-400 font-mono`}>
                      {activeMode === 'clinic' ? 'Clinical Intelligence Engine • Chairside Decision Support' :
                       activeMode === 'ceph' ? 'Cephalometric Intelligence Engine • Quantitative Orthodontic Analysis' :
                       'Integrated Intelligence Engine • Clinical + Cephalometric Fusion'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
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

              {screen === 'clinic-photo-upload' && activePatient && (
                <ClinicPhotoWorkstation
                  patientDetails={activePatient}
                  onComplete={handleClinicPhotoComplete}
                  onBack={() => setScreen('patient-form')}
                />
              )}

              {screen === 'ai-processing' && activePatient && (
                <AiProcessingScreen
                  patientName={activePatient.name}
                  onComplete={handleAiProcessingComplete}
                />
              )}

              {screen === 'results' && activePatient && activeCeph && activeResult && (
                <ResultsDashboard
                  patientDetails={activePatient}
                  cephalometricInput={activeCeph}
                  ociResult={activeResult}
                  mode={activeMode}
                  onSaveAssessment={handleSaveAssessment}
                  onOpenPdf={(editedSummaryText) => {
                    const rawPreview = {
                      id: 'preview',
                      createdAt: new Date().toISOString(),
                      patientDetails: {
                        ...activePatient,
                        analysisMode: activeMode
                      },
                      cephalometricInput: activeCeph,
                      ociResult: activeResult,
                      aiSummary: editedSummaryText
                    };
                    const previewAssessment = sanitizeAssessment(rawPreview);
                    setPdfReportAssessment(previewAssessment);
                  }}
                  onBack={() => setScreen('home')}
                />
              )}

              {screen === 'history' && (
                <HistoryList
                  assessments={savedAssessments}
                  onSelect={(item) => {
                    loadWorkspaceForMode(item, activeMode);
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
                  onClose={() => setScreen('home')}
                  onLogout={handleLogout}
                />
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
          <View style={[
            tw`absolute bottom-4 left-4 right-4 bg-[#071B49] rounded-3xl flex-row justify-around items-center px-2`,
            { 
              height: 76,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 10,
              zIndex: 9999
            }
          ]}>
            {[
              { id: 'home', label: 'Dashboard', icon: HomeIcon },
              { id: 'patient-form', label: 'Analysis', icon: Activity, action: handleStartNewAssessment },
              { id: 'treatment-planning', label: 'Treatment', icon: Bookmark },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'settings', label: 'Settings', icon: SettingsIcon }
            ].map((item) => {
              const isActive = screen === item.id || 
                (item.id === 'patient-form' && (screen === 'patient-form' || screen === 'ai-processing' || screen === 'results'));
              
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    if (item.action) {
                      item.action();
                    } else {
                      setScreen(item.id as any);
                    }
                  }}
                  style={tw`items-center justify-center py-2 px-3 rounded-2xl flex-1`}
                >
                  <View style={tw`items-center justify-center`}>
                    <item.icon 
                      size={20} 
                      color={isActive ? '#10B7A8' : '#A8B3C7'} 
                      style={tw`mb-1`}
                    />
                    <Text style={[
                      tw`text-[9px] uppercase tracking-wider font-mono`,
                      isActive ? tw`text-[#10B7A8] font-extrabold` : tw`text-[#A8B3C7] font-bold`
                    ]}>
                      {item.label}
                    </Text>
                    {isActive && (
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-[#10B7A8] mt-1 shadow-md`} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}
