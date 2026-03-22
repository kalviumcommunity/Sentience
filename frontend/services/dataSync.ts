import { toast } from '../hooks/use-toast.js';
import { apiClient } from './apiClient.js';

export interface SyncData {
  tasks: unknown[];
  notes: unknown[];
  moodEntries: unknown[];
  focusSessions: unknown[];
  studySessions: unknown[];
  lastSync: number;
}

class DataSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.setupOnlineOfflineHandling();
  }

  private setupOnlineOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
      toast({
        title: "Back online",
        description: "Your data will be synced automatically",
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast({
        title: "You're offline",
        description: "Changes will be saved locally and synced when you're back online",
        variant: "destructive"
      });
    });
  }

  // Save data to localStorage with error handling
  saveData(key: string, data: unknown): boolean {
    try {
      const dataToSave = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error(`Failed to save data for key ${key}:`, error);
      toast({
        title: "Save failed",
        description: "Your data couldn't be saved. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Load data from localStorage with error handling
  loadData<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const parsed = JSON.parse(stored);
      
      // Handle legacy data format (without timestamp)
      if (parsed.data !== undefined) {
        return parsed.data;
      }
      
      // Handle old format
      return parsed;
    } catch (error) {
      console.error(`Failed to load data for key ${key}:`, error);
      return defaultValue;
    }
  }

  // Export all user data
  exportData(): SyncData {
    const data: SyncData = {
      tasks: this.loadData('tasks', []),
      notes: this.loadData('notes', []),
      moodEntries: this.loadData('moodEntries', []),
      focusSessions: this.loadData('focusSessions', []),
      studySessions: this.loadData('studySessions', []),
      lastSync: Date.now()
    };

    return data;
  }

  // Import user data
  importData(data: SyncData): boolean {
    try {
      this.saveData('tasks', data.tasks);
      this.saveData('notes', data.notes);
      this.saveData('moodEntries', data.moodEntries);
      this.saveData('focusSessions', data.focusSessions);
      this.saveData('studySessions', data.studySessions);
      
      toast({
        title: "Data imported",
        description: "Your data has been successfully imported",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      toast({
        title: "Import failed",
        description: "Failed to import data. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  // Download data as JSON file
  downloadData(): void {
    try {
      const data = this.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentience-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup downloaded",
        description: "Your data has been saved to a file",
      });
    } catch (error) {
      console.error('Failed to download data:', error);
      toast({
        title: "Download failed",
        description: "Failed to download backup. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Clear all data
  clearAllData(): void {
    try {
      const keys = ['tasks', 'notes', 'moodEntries', 'focusSessions', 'studySessions'];
      keys.forEach(key => {
        localStorage.removeItem(key);
        // Also clear form persistence data
        localStorage.removeItem(`form_${key}`);
      });
      
      toast({
        title: "Data cleared",
        description: "All your data has been cleared",
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast({
        title: "Clear failed",
        description: "Failed to clear data. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Start automatic sync with debouncing
  startAutoSync(intervalMs: number = 60000): void { // Increased to 60 seconds
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    let lastSync = 0;
    this.syncInterval = setInterval(() => {
      const now = Date.now();
      // Only sync if enough time has passed and user is active
      if (now - lastSync > intervalMs && this.isOnline) {
        lastSync = now;
        this.syncData();
      }
    }, intervalMs);
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sync data with backend
  private async syncData(): Promise<void> {
    if (!this.isOnline) return;
    
    try {
      const user = localStorage.getItem('currentUser');
      if (!user) return; // Only sync if user is logged in

      // Extract pending tasks and notes
      const localTasks = this.loadData<any[]>('tasks', []);
      const pendingTasks = localTasks.filter(item => item.syncStatus === 'pending' || !item._id || item._id.startsWith('local_') || item._id.length < 24);

      const localNotes = this.loadData<any[]>('notes', []);
      const pendingNotes = localNotes.filter(item => item.syncStatus === 'pending' || !item._id || item._id.startsWith('local_') || item._id.length < 24);

      // Only sync if there is pending data
      if (pendingTasks.length > 0 || pendingNotes.length > 0) {
        console.log(`Syncing ${pendingTasks.length} tasks and ${pendingNotes.length} notes...`);
        try {
          const result = await apiClient.post<{ tasks: any[], notes: any[] }>('/sync', {
            tasks: pendingTasks,
            notes: pendingNotes
          });

          // Server returns the reconciled source of truth
          if (result.tasks) {
            this.saveData('tasks', result.tasks.map(t => ({...t, syncStatus: 'synced'})));
          }
          if (result.notes) {
            this.saveData('notes', result.notes.map(n => ({...n, syncStatus: 'synced'})));
          }
          
          toast({
            title: "Sync complete",
            description: "Your offline changes have been saved to the server."
          });
        } catch (error) {
          console.error('API sync request failed:', error);
        }
      } else {
        console.log('No pending items to sync.');
        // Optionally fetch the latest data from server to keep local copy fresh
        try {
          const [serverTasks, serverNotes] = await Promise.all([
             apiClient.get<any[]>('/tasks').catch(() => null),
             apiClient.get<any[]>('/notes/my-notes').catch(() => null)
          ]);
          if (serverTasks) this.saveData('tasks', serverTasks.map(t => ({...t, syncStatus: 'synced'})));
          if (serverNotes) this.saveData('notes', serverNotes.map(n => ({...n, syncStatus: 'synced'})));
        } catch (e) {
          /* ignore background fetch errors */
        }
      }

      console.log('Data sync cycle completed');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  // Get storage usage
  getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        used += localStorage[key].length + key.length;
      }
      
      // Estimate total storage (varies by browser)
      const total = 5 * 1024 * 1024; // 5MB estimate
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

export const dataSyncService = new DataSyncService(); 