export interface ScanRecord {
  id: string;
  timestamp: Date;
  imageUrl: string;
  disease?: string;
  confidence?: string;
  plantName?: string;
  synced: boolean;
}

const STORAGE_KEY = 'plantiva_scan_history';

class ScanHistoryService {
  private getHistory(): ScanRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse scan history from localStorage', e);
    }
    return [];
  }

  private saveHistory(history: ScanRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("Storage quota exceeded in ScanHistory, removing oldest images...");
        let minimizedHistory = JSON.parse(JSON.stringify(history));
        
        for (let i = minimizedHistory.length - 1; i >= 0; i--) {
          if (minimizedHistory[i].imageUrl) {
            minimizedHistory[i].imageUrl = ''; // Clear image to save space
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(minimizedHistory));
              return; // Success!
            } catch (innerE) {
              continue; // Still too big, keep removing
            }
          }
        }
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimizedHistory.slice(0, 5)));
        } catch (finalE) {
          console.error("Could not save history even after minimization.", finalE);
        }
      } else {
        console.error('Failed to save scan history to localStorage', e);
      }
    }
  }

  async saveScan(scan: Omit<ScanRecord, 'id' | 'timestamp' | 'synced'>): Promise<ScanRecord> {
    const history = this.getHistory();
    const newScan: ScanRecord = {
      ...scan,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      synced: navigator.onLine // If online, mark as synced. Otherwise, it will be synced later.
    };
    
    history.unshift(newScan);
    // Keep only last 20 scans to prevent localStorage overflow
    if (history.length > 20) {
      history.pop();
    }
    
    this.saveHistory(history);
    return newScan;
  }

  async getRecentScans(): Promise<ScanRecord[]> {
    return this.getHistory();
  }

  async syncOfflineScans(): Promise<void> {
    const history = this.getHistory();
    let updated = false;

    for (let i = 0; i < history.length; i++) {
      if (!history[i].synced) {
        // Here you would upload to your actual backend API
        // For now, we simulate a successful sync
        console.log(`Syncing scan ${history[i].id} to backend...`);
        history[i].synced = true;
        updated = true;
      }
    }

    if (updated) {
      this.saveHistory(history);
    }
  }
}

export const scanHistoryService = new ScanHistoryService();

// Setup event listener to trigger sync when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    scanHistoryService.syncOfflineScans();
  });
}
