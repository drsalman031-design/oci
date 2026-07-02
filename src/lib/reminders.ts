import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClinicalReminder {
  id: string;
  patientId: string;
  patientName: string;
  caseNumber: string;
  type: 'daily' | 'monthly';
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string | null;
}

const REMINDERS_KEY = 'oci_clinical_db_reminders';

export async function dbGetReminders(): Promise<ClinicalReminder[]> {
  try {
    const data = await AsyncStorage.getItem(REMINDERS_KEY);
    if (!data) {
      // Seed initial mock reminders based on existing cases to populate the UI elegantly
      return [];
    }
    return JSON.parse(data) as ClinicalReminder[];
  } catch (error) {
    console.error('Error fetching clinical reminders:', error);
    return [];
  }
}

export async function dbSaveReminders(reminders: ClinicalReminder[]): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error saving clinical reminders:', error);
  }
}

export async function dbAddReminder(reminder: Omit<ClinicalReminder, 'id' | 'completed'>): Promise<ClinicalReminder> {
  const reminders = await dbGetReminders();
  const newReminder: ClinicalReminder = {
    ...reminder,
    id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    completed: false,
  };
  reminders.push(newReminder);
  await dbSaveReminders(reminders);
  return newReminder;
}

export async function dbToggleReminder(id: string): Promise<ClinicalReminder[]> {
  const reminders = await dbGetReminders();
  const updated = reminders.map(r => {
    if (r.id === id) {
      const completed = !r.completed;
      return {
        ...r,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      };
    }
    return r;
  });
  await dbSaveReminders(updated);
  return updated;
}

export async function dbDeleteReminder(id: string): Promise<ClinicalReminder[]> {
  const reminders = await dbGetReminders();
  const filtered = reminders.filter(r => r.id !== id);
  await dbSaveReminders(filtered);
  return filtered;
}

/**
 * Automatically creates standard clinical follow-ups for a new patient based on their clinical requirements.
 */
export async function autoGenerateFollowupsForPatient(
  patientId: string,
  patientName: string,
  caseNumber: string,
  diagnosis: string,
  isGrowing: boolean
): Promise<void> {
  try {
    const reminders = await dbGetReminders();
    const today = new Date();

    // Helper to format date
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // 1. Daily follow-up reminder (e.g. hygiene & compliance)
    const dailyDate = new Date(today);
    dailyDate.setDate(today.getDate() + 1); // tomorrow

    // 2. Monthly follow-up reminder (e.g. first wire activation / aligner check)
    const monthlyDate = new Date(today);
    monthlyDate.setMonth(today.getMonth() + 1); // 1 month from now

    const newReminders: ClinicalReminder[] = [
      {
        id: `rem_auto_daily_${Date.now()}_1`,
        patientId,
        patientName,
        caseNumber,
        type: 'daily',
        title: diagnosis === 'Class II' ? 'Check Class II elastic compliance & hygiene' : 'Check hygiene & general aligner fit',
        dueDate: formatDate(dailyDate),
        completed: false,
      },
      {
        id: `rem_auto_monthly_${Date.now()}_2`,
        patientId,
        patientName,
        caseNumber,
        type: 'monthly',
        title: isGrowing ? 'Growth modification & functional appliance activation' : 'Archwire alignment tracking & slot engagement check',
        dueDate: formatDate(monthlyDate),
        completed: false,
      }
    ];

    const merged = [...reminders, ...newReminders];
    await dbSaveReminders(merged);
  } catch (error) {
    console.error('Error auto generating reminders:', error);
  }
}
