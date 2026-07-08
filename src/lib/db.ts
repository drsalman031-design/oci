import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Assessment, 
  OciWeights, 
  UserProfile, 
  UserRole, 
  UserPermission, 
  PatientDetails, 
  CephalometricInput, 
  OciResult, 
  ClinicWorkspaceData, 
  CephWorkspaceData, 
  TurboWorkspaceData 
} from '../types';
import { sha256 } from './crypto';

export interface OciSettings {
  weights?: OciWeights;
  darkMode?: boolean;
  lastBackupDate?: string;
  autoBackupEnabled?: boolean;
}

// Active user tracking inside the database instance
let activeUserEmail: string | null = null;

export function dbSetActiveUser(email: string | null): void {
  activeUserEmail = email ? email.toLowerCase().trim() : null;
}

export function dbGetActiveUser(): string | null {
  return activeUserEmail;
}

// Helper to get active-user specific storage keys
function getAssessmentsKey(): string {
  return activeUserEmail 
    ? `oci_clinical_db_assessments_${activeUserEmail}` 
    : 'oci_clinical_db_assessments_guest';
}

function getSettingsKey(): string {
  return activeUserEmail 
    ? `oci_clinical_db_settings_${activeUserEmail}` 
    : 'oci_clinical_db_settings_guest';
}

// SEEDING AND USER DATABASE OPERATIONS
const USERS_TABLE_KEY = 'oci_users_table';

export function getRolePermissions(role: UserRole): UserPermission {
  switch (role) {
    case 'Developer':
      return {
        fullAccess: true,
        patientManagement: true,
        validationLab: true,
        cloudSync: true,
        reports: true,
        settings: true,
        databaseManagement: true,
        userManagement: true,
        import: true,
        export: true,
      };
    case 'Administrator':
      return {
        fullAccess: true,
        patientManagement: true,
        validationLab: false,
        cloudSync: true,
        reports: true,
        settings: true,
        databaseManagement: true,
        userManagement: true,
        import: true,
        export: true,
      };
    case 'Orthodontist':
      return {
        fullAccess: false,
        patientManagement: true,
        validationLab: false,
        cloudSync: true,
        reports: true,
        settings: true,
        databaseManagement: false,
        userManagement: false,
        import: true,
        export: true,
      };
    case 'Faculty':
      return {
        fullAccess: false,
        patientManagement: true,
        validationLab: false,
        cloudSync: false,
        reports: true,
        settings: true,
        databaseManagement: false,
        userManagement: false,
        import: false,
        export: false,
      };
    case 'Resident':
      return {
        fullAccess: false,
        patientManagement: true,
        validationLab: false,
        cloudSync: false,
        reports: true,
        settings: false,
        databaseManagement: false,
        userManagement: false,
        import: false,
        export: false,
      };
    case 'Staff':
      return {
        fullAccess: false,
        patientManagement: true,
        validationLab: false,
        cloudSync: false,
        reports: true,
        settings: false,
        databaseManagement: false,
        userManagement: false,
        import: false,
        export: false,
      };
  }
}

export async function dbSeedAdmin(): Promise<void> {
  try {
    const usersStr = await AsyncStorage.getItem(USERS_TABLE_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    let updated = false;
    
    const adminEmail = 'admin@ociclinic.ai';
    const adminChanged = await AsyncStorage.getItem('oci_admin_password_changed');
    
    if (!users[adminEmail]) {
      const adminProfile: UserProfile = {
        id: adminEmail,
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        mobile: '+1 (555) 019-2026',
        passwordHash: sha256('OCI@2026'),
        role: 'Administrator',
        createdDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'Active',
        googleAccountConnected: false,
        driveBackupEnabled: false,
      };
      users[adminEmail] = adminProfile;
      updated = true;
      console.log('Successfully pre-seeded default administrator account in OCI Database.');
    } else if (adminChanged !== 'true') {
      // Force reset default credentials if password was never changed to resolve stale local storage hashes
      users[adminEmail].passwordHash = sha256('OCI@2026');
      users[adminEmail].status = 'Active';
      users[adminEmail].role = 'Administrator';
      updated = true;
      console.log('Force reset administrator to default credentials due to unconfigured password.');
    }

    const devEmail = 'developer@ociclinic.ai';
    const devChanged = await AsyncStorage.getItem('oci_developer_password_changed');
    
    if (!users[devEmail]) {
      const devProfile: UserProfile = {
        id: devEmail,
        firstName: 'System',
        lastName: 'Developer',
        email: devEmail,
        mobile: '+1 (555) 019-2027',
        passwordHash: sha256('OCI_DEV@2026'),
        role: 'Developer',
        createdDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'Active',
        googleAccountConnected: false,
        driveBackupEnabled: false,
      };
      users[devEmail] = devProfile;
      updated = true;
      console.log('Successfully pre-seeded default developer account in OCI Database.');
    } else if (devChanged !== 'true') {
      // Force reset default credentials if password was never changed to resolve stale local storage hashes
      users[devEmail].passwordHash = sha256('OCI_DEV@2026');
      users[devEmail].status = 'Active';
      users[devEmail].role = 'Developer';
      updated = true;
      console.log('Force reset developer to default credentials due to unconfigured password.');
    }

    if (updated) {
      await AsyncStorage.setItem(USERS_TABLE_KEY, JSON.stringify(users));
    }
  } catch (err) {
    console.error('Failed to seed OCI accounts:', err);
  }
}

export async function initDB(): Promise<any> {
  await dbSeedAdmin();
  return Promise.resolve(true);
}

// Authenticate a user and update last login timestamp
export async function dbAuthenticateUser(email: string, passwordHash: string): Promise<UserProfile | null> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const usersStr = await AsyncStorage.getItem(USERS_TABLE_KEY);
    if (!usersStr) return null;
    
    const users = JSON.parse(usersStr);
    const user = users[cleanEmail] as UserProfile;
    
    if (user && user.passwordHash === passwordHash) {
      if (user.status === 'Disabled') {
        throw new Error('Account Disabled');
      }
      // Update last login
      user.lastLogin = new Date().toISOString();
      users[cleanEmail] = user;
      await AsyncStorage.setItem(USERS_TABLE_KEY, JSON.stringify(users));
      
      // Set active user context
      dbSetActiveUser(cleanEmail);
      return user;
    }
    return null;
  } catch (err: any) {
    console.error('Authentication helper error:', err);
    if (err.message === 'Account Disabled') {
      throw err;
    }
    return null;
  }
}

// Register a new clinician account
export async function dbRegisterUser(profile: Omit<UserProfile, 'createdDate' | 'lastLogin' | 'status' | 'googleAccountConnected' | 'driveBackupEnabled'>): Promise<boolean> {
  try {
    const cleanEmail = profile.email.toLowerCase().trim();
    const usersStr = await AsyncStorage.getItem(USERS_TABLE_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    if (users[cleanEmail]) {
      return false; // Duplicate Email Prevention
    }
    
    const fullProfile: UserProfile = {
      ...profile,
      id: cleanEmail,
      email: cleanEmail,
      createdDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'Active',
      googleAccountConnected: false,
      driveBackupEnabled: false,
    };
    
    users[cleanEmail] = fullProfile;
    await AsyncStorage.setItem(USERS_TABLE_KEY, JSON.stringify(users));
    return true;
  } catch (err) {
    console.error('Registration helper error:', err);
    return false;
  }
}

// Fetch single user profile
export async function dbGetProfile(email: string): Promise<UserProfile | null> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const usersStr = await AsyncStorage.getItem(USERS_TABLE_KEY);
    if (!usersStr) return null;
    const users = JSON.parse(usersStr);
    return users[cleanEmail] || null;
  } catch (err) {
    console.error('Get profile error:', err);
    return null;
  }
}

// Fetch lists of users (Administrator only)
export async function dbGetUserList(): Promise<UserProfile[]> {
  try {
    const usersStr = await AsyncStorage.getItem(USERS_TABLE_KEY);
    if (!usersStr) return [];
    const users = JSON.parse(usersStr);
    return Object.values(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    return [];
  }
}

// Update a user's profile info
export async function dbUpdateUserProfile(email: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const usersStr = await AsyncStorage.getItem(USERS_TABLE_KEY);
    if (!usersStr) return null;
    
    const users = JSON.parse(usersStr);
    const user = users[cleanEmail] as UserProfile;
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates };
    users[cleanEmail] = updatedUser;
    await AsyncStorage.setItem(USERS_TABLE_KEY, JSON.stringify(users));
    
    return updatedUser;
  } catch (err) {
    console.error('Update user error:', err);
    return null;
  }
}

// Delete user profile and all associated data
export async function dbDeleteUserProfile(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const usersStr = await AsyncStorage.getItem(USERS_TABLE_KEY);
    if (!usersStr) return false;
    
    const users = JSON.parse(usersStr);
    if (!users[cleanEmail]) return false;
    
    delete users[cleanEmail];
    await AsyncStorage.setItem(USERS_TABLE_KEY, JSON.stringify(users));
    
    // Clear user's patient data and settings
    await AsyncStorage.removeItem(`oci_clinical_db_assessments_${cleanEmail}`);
    await AsyncStorage.removeItem(`oci_clinical_db_settings_${cleanEmail}`);
    await AsyncStorage.removeItem(`oci_gdrive_connected_${cleanEmail}`);
    await AsyncStorage.removeItem(`oci_gdrive_auto_sync_${cleanEmail}`);
    await AsyncStorage.removeItem(`oci_gdrive_last_backup_${cleanEmail}`);
    await AsyncStorage.removeItem(`oci_gdrive_backed_count_${cleanEmail}`);
    await AsyncStorage.removeItem(`oci_gdrive_backup_payload_${cleanEmail}`);
    
    return true;
  } catch (err) {
    console.error('Delete user error:', err);
    return false;
  }
}


// ASSESSMENTS (PATIENT DISCOVERY RECORDS) - MULTI-USER SECURE SANDBOX
export function sanitizeAssessment(assessment: any): Assessment {
  if (!assessment) return {} as any;
  const sharedDetails: PatientDetails = {
    name: assessment.patientDetails?.name || '',
    age: assessment.patientDetails?.age || '',
    gender: assessment.patientDetails?.gender || '',
    caseNumber: assessment.patientDetails?.caseNumber || '',
    date: assessment.patientDetails?.date || new Date().toISOString(),
    diagnosis: assessment.patientDetails?.diagnosis || '',
    clinicalNotes: assessment.patientDetails?.clinicalNotes || '',
    analysisMode: assessment.patientDetails?.analysisMode || 'turbo'
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
    name: sharedDetails.name,
    age: sharedDetails.age,
    gender: sharedDetails.gender,
    caseNumber: sharedDetails.caseNumber,
    date: sharedDetails.date,
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

  const clinicWorkspace: ClinicWorkspaceData = assessment.clinicWorkspace || {
    patientDetails: assessment.patientDetails?.analysisMode === 'clinic' 
      ? { ...assessment.patientDetails, ...sharedDetails }
      : { ...emptyPatient, ...sharedDetails },
    ociResult: assessment.patientDetails?.analysisMode === 'clinic' ? (assessment.ociResult || null) : null,
    aiSummary: assessment.patientDetails?.analysisMode === 'clinic' ? (assessment.aiSummary || '') : '',
    advanced: assessment.patientDetails?.analysisMode === 'clinic' ? assessment.advanced : undefined,
    status: assessment.patientDetails?.analysisMode === 'clinic' ? 'Completed' : 'Not Started'
  };

  const cephWorkspace: CephWorkspaceData = assessment.cephWorkspace || {
    cephalometricInput: assessment.patientDetails?.analysisMode === 'ceph' 
      ? { ...emptyCeph, ...assessment.cephalometricInput }
      : { ...emptyCeph },
    ociResult: assessment.patientDetails?.analysisMode === 'ceph' ? (assessment.ociResult || null) : null,
    aiSummary: assessment.patientDetails?.analysisMode === 'ceph' ? (assessment.aiSummary || '') : '',
    advanced: assessment.patientDetails?.analysisMode === 'ceph' ? assessment.advanced : undefined,
    status: assessment.patientDetails?.analysisMode === 'ceph' ? 'Completed' : 'Not Started'
  };

  const turboWorkspace: TurboWorkspaceData = assessment.turboWorkspace || {
    patientDetails: assessment.patientDetails?.analysisMode === 'turbo' 
      ? { ...assessment.patientDetails, ...sharedDetails }
      : { ...emptyPatient, ...sharedDetails },
    cephalometricInput: assessment.patientDetails?.analysisMode === 'turbo' 
      ? { ...emptyCeph, ...assessment.cephalometricInput }
      : { ...emptyCeph },
    ociResult: assessment.patientDetails?.analysisMode === 'turbo' ? (assessment.ociResult || null) : null,
    aiSummary: assessment.patientDetails?.analysisMode === 'turbo' ? (assessment.aiSummary || '') : '',
    advanced: assessment.patientDetails?.analysisMode === 'turbo' ? assessment.advanced : undefined,
    status: assessment.patientDetails?.analysisMode === 'turbo' ? 'Completed' : 'Not Started'
  };

  return {
    id: assessment.id,
    createdAt: assessment.createdAt || new Date().toISOString(),
    patientDetails: sharedDetails,
    clinicWorkspace,
    cephWorkspace,
    turboWorkspace
  };
}

export async function dbSaveAssessment(assessment: Assessment): Promise<void> {
  try {
    const key = getAssessmentsKey();
    const assessments = await dbGetAssessments();
    const sanitized = sanitizeAssessment(assessment);
    const index = assessments.findIndex((a) => a.id === sanitized.id);
    if (index !== -1) {
      assessments[index] = sanitized;
    } else {
      assessments.push(sanitized);
    }
    await AsyncStorage.setItem(key, JSON.stringify(assessments));
  } catch (error) {
    console.error('Error saving assessment to AsyncStorage:', error);
    throw error;
  }
}

export async function dbGetAssessments(): Promise<Assessment[]> {
  try {
    const key = getAssessmentsKey();
    const data = await AsyncStorage.getItem(key);
    if (!data) return [];
    const assessments = JSON.parse(data) as any[];
    // Sort assessments by createdAt descending
    assessments.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    return assessments.map(sanitizeAssessment);
  } catch (error) {
    console.error('Error getting assessments from AsyncStorage:', error);
    return [];
  }
}

export async function dbDeleteAssessment(id: string): Promise<void> {
  try {
    const key = getAssessmentsKey();
    const assessments = await dbGetAssessments();
    const filtered = assessments.filter((a) => a.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting assessment from AsyncStorage:', error);
    throw error;
  }
}

// GENERAL USER SETTINGS / PREFERENCES
export async function dbSaveSetting<T>(key: string, value: T): Promise<void> {
  try {
    const settingsKey = getSettingsKey();
    const settingsStr = await AsyncStorage.getItem(settingsKey);
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    settings[key] = value;
    await AsyncStorage.setItem(settingsKey, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving setting to AsyncStorage:', error);
    throw error;
  }
}

export async function dbGetSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const settingsKey = getSettingsKey();
    const settingsStr = await AsyncStorage.getItem(settingsKey);
    if (!settingsStr) return defaultValue;
    const settings = JSON.parse(settingsStr);
    return settings[key] !== undefined ? settings[key] : defaultValue;
  } catch (error) {
    console.error('Error getting setting from AsyncStorage:', error);
    return defaultValue;
  }
}

export async function dbClearAllData(): Promise<void> {
  try {
    const assessmentsKey = getAssessmentsKey();
    const settingsKey = getSettingsKey();
    await AsyncStorage.removeItem(assessmentsKey);
    await AsyncStorage.removeItem(settingsKey);
  } catch (error) {
    console.error('Error clearing data from AsyncStorage:', error);
    throw error;
  }
}

// Backup manual export/import
export async function dbExportBackup(): Promise<string> {
  try {
    const assessments = await dbGetAssessments();
    const settingsKey = getSettingsKey();
    const settingsStr = await AsyncStorage.getItem(settingsKey);
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    
    const backupObj = {
      version: 1,
      timestamp: new Date().toISOString(),
      user: activeUserEmail,
      assessments,
      settings,
    };
    return JSON.stringify(backupObj, null, 2);
  } catch (error) {
    console.error('Error exporting backup:', error);
    throw error;
  }
}

export async function dbImportBackup(backupJsonStr: string): Promise<boolean> {
  try {
    const backup = JSON.parse(backupJsonStr);
    if (!backup || typeof backup !== 'object') return false;
    
    // Import assessments
    if (backup.assessments && Array.isArray(backup.assessments)) {
      const newAssessments = backup.assessments as Assessment[];
      const currentAssessments = await dbGetAssessments();
      
      // Merge by ID, new assessments overwrite old ones
      const mergedMap = new Map<string, Assessment>();
      currentAssessments.forEach(item => mergedMap.set(item.id, item));
      newAssessments.forEach(item => {
        if (item.id && item.patientDetails) {
          mergedMap.set(item.id, sanitizeAssessment(item));
        }
      });
      
      const mergedList = Array.from(mergedMap.values());
      const assessmentsKey = getAssessmentsKey();
      await AsyncStorage.setItem(assessmentsKey, JSON.stringify(mergedList));
    }
    
    // Import settings
    if (backup.settings && typeof backup.settings === 'object') {
      const settingsKey = getSettingsKey();
      const currentSettingsStr = await AsyncStorage.getItem(settingsKey);
      const currentSettings = currentSettingsStr ? JSON.parse(currentSettingsStr) : {};
      
      const mergedSettings = { ...currentSettings, ...backup.settings };
      await AsyncStorage.setItem(settingsKey, JSON.stringify(mergedSettings));
    }
    
    return true;
  } catch (err) {
    console.error('Failed to import OCI database backup:', err);
    return false;
  }
}
