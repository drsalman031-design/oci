import { Assessment, OciWeights } from '../types';

const DB_NAME = 'oci_clinical_db';
const DB_VERSION = 1;

export interface OciSettings {
  weights?: OciWeights;
  darkMode?: boolean;
  lastBackupDate?: string;
  autoBackupEnabled?: boolean;
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('assessments')) {
        db.createObjectStore('assessments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export function dbSaveAssessment(assessment: Assessment): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('assessments', 'readwrite');
      const store = transaction.objectStore(transaction.objectStoreNames[0]);
      const request = store.put(assessment);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  });
}

export function dbGetAssessments(): Promise<Assessment[]> {
  return initDB().then((db) => {
    return new Promise<Assessment[]>((resolve, reject) => {
      const transaction = db.transaction('assessments', 'readonly');
      const store = transaction.objectStore('assessments');
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort assessments by createdAt descending
        const data = request.result as Assessment[];
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(data);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  });
}

export function dbDeleteAssessment(id: string): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('assessments', 'readwrite');
      const store = transaction.objectStore('assessments');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  });
}

export function dbSaveSetting<T>(key: string, value: T): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('settings', 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  });
}

export function dbGetSetting<T>(key: string, defaultValue: T): Promise<T> {
  return initDB().then((db) => {
    return new Promise<T>((resolve) => {
      const transaction = db.transaction('settings', 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : defaultValue);
      };

      request.onerror = () => {
        resolve(defaultValue);
      };
    });
  });
}

export function dbClearAllData(): Promise<void> {
  return initDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['assessments', 'settings'], 'readwrite');
      const assessmentsStore = transaction.objectStore('assessments');
      const settingsStore = transaction.objectStore('settings');
      
      const req1 = assessmentsStore.clear();
      const req2 = settingsStore.clear();
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  });
}

// Automatic local backup and manual Export/Import helper
export function dbExportBackup(): Promise<string> {
  return Promise.all([dbGetAssessments(), dbGetAllSettings()]).then(([assessments, settings]) => {
    const backupObj = {
      version: 1,
      timestamp: new Date().toISOString(),
      assessments,
      settings,
    };
    return JSON.stringify(backupObj, null, 2);
  });
}

async function dbGetAllSettings(): Promise<Record<string, any>> {
  const db = await initDB();
  return new Promise<Record<string, any>>((resolve, reject) => {
    const transaction = db.transaction('settings', 'readonly');
    const store = transaction.objectStore('settings');
    const settings: Record<string, any> = {};
    
    // standard cursor to get keys and values
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        settings[cursor.primaryKey as string] = cursor.value;
        cursor.continue();
      } else {
        resolve(settings);
      }
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function dbImportBackup(backupJsonStr: string): Promise<boolean> {
  try {
    const backup = JSON.parse(backupJsonStr);
    if (!backup || typeof backup !== 'object') return false;
    
    const db = await initDB();
    
    // Validate assessments
    if (backup.assessments && Array.isArray(backup.assessments)) {
      const assessments = backup.assessments as Assessment[];
      const tx = db.transaction('assessments', 'readwrite');
      const store = tx.objectStore('assessments');
      for (const item of assessments) {
        if (item.id && item.patientDetails && item.ociResult) {
          await new Promise<void>((resolve, reject) => {
            const req = store.put(item);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        }
      }
    }
    
    // Import settings
    if (backup.settings && typeof backup.settings === 'object') {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      for (const key of Object.keys(backup.settings)) {
        await new Promise<void>((resolve, reject) => {
          const req = store.put(backup.settings[key], key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    }
    
    return true;
  } catch (err) {
    console.error('Failed to import OCI database backup:', err);
    return false;
  }
}
