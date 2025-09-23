import { useCallback } from 'react';

// Default system settings
const DEFAULT_SETTINGS = {
  order_open_time: '06:00',
  order_cutoff_time: '02:00',
  // Add more default settings as needed
};

// In-memory settings store (can be replaced with database/API calls later)
let systemSettings: Record<string, string> = { ...DEFAULT_SETTINGS };

export function useSystemSettings() {
  // Function to get a setting with a default value
  const getSetting = useCallback((key: string, defaultValue?: string): string => {
    return systemSettings[key] || defaultValue || '';
  }, []);

  // Function to update a setting (for future use)
  const updateSetting = useCallback((key: string, value: string) => {
    systemSettings[key] = value;
  }, []);

  // Function to initialize settings (can be extended to fetch from database)
  const initializeSettings = useCallback(() => {
    // TODO: Implement database/API call to fetch system settings
    // For now, using default settings
    console.log('System settings initialized with defaults');
  }, []);

  return {
    getSetting,
    updateSetting,
    initializeSettings,
  };
}
