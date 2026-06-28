import AsyncStorage from '@react-native-async-storage/async-storage';
import { Assessment, OciWeights } from '../types';

export interface OciSettings {
  weights?: OciWeights;
  darkMode?: boolean;
  lastBackupDate?: string;
  autoBackupEnabled?: boolean;
}

const ASSESSMENTS_KEY = 'oci_clinical_db_assessments';
const SETTINGS_KEY = 'oci_clinical_db_settings';

export function initDB(): Promise<any> {
  // AsyncStorage does not require explicit initialization
  return Promise.resolve(true);
}

export async function dbSaveAssessment(assessment: Assessment): Promise<void> {
  try {
    const assessments = await dbGetAssessments();
    const index = assessments.findIndex((a) => a.id === assessment.id);
    if (index !== -1) {
      assessments[index] = assessment;
    } else {
      assessments.push(assessment);
    }
    await AsyncStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
  } catch (error) {
    console.error('Error saving assessment to AsyncStorage:', error);
    throw error;
  }
}

export async function dbGetAssessments(): Promise<Assessment[]> {
  try {
    const data = await AsyncStorage.getItem(ASSESSMENTS_KEY);
    if (!data) return [];
    const assessments = JSON.parse(data) as Assessment[];
    // Sort assessments by createdAt descending
    assessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return assessments;
  } catch (error) {
    console.error('Error getting assessments from AsyncStorage:', error);
    return [];
  }
}

export async function dbDeleteAssessment(id: string): Promise<void> {
  try {
    const assessments = await dbGetAssessments();
    const filtered = assessments.filter((a) => a.id !== id);
    await AsyncStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting assessment from AsyncStorage:', error);
    throw error;
  }
}

export async function dbSaveSetting<T>(key: string, value: T): Promise<void> {
  try {
    const settingsStr = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    settings[key] = value;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving setting to AsyncStorage:', error);
    throw error;
  }
}

export async function dbGetSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const settingsStr = await AsyncStorage.getItem(SETTINGS_KEY);
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
    await AsyncStorage.removeItem(ASSESSMENTS_KEY);
    await AsyncStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing data from AsyncStorage:', error);
    throw error;
  }
}

// Automatic local backup and manual Export/Import helper
export async function dbExportBackup(): Promise<string> {
  try {
    const assessments = await dbGetAssessments();
    const settingsStr = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    
    const backupObj = {
      version: 1,
      timestamp: new Date().toISOString(),
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
        if (item.id && item.patientDetails && item.ociResult) {
          mergedMap.set(item.id, item);
        }
      });
      
      const mergedList = Array.from(mergedMap.values());
      await AsyncStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(mergedList));
    }
    
    // Import settings
    if (backup.settings && typeof backup.settings === 'object') {
      const currentSettingsStr = await AsyncStorage.getItem(SETTINGS_KEY);
      const currentSettings = currentSettingsStr ? JSON.parse(currentSettingsStr) : {};
      
      const mergedSettings = { ...currentSettings, ...backup.settings };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
    }
    
    return true;
  } catch (err) {
    console.error('Failed to import OCI database backup:', err);
    return false;
  }
}
