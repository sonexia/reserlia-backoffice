/**
 * Utility functions for timezone detection and mapping
 */

/**
 * Detects the user's timezone from the browser and maps it to Spanish timezones when possible
 * @returns Spanish timezone string (Europe/Madrid or Atlantic/Canary) or detected timezone
 */
export const detectAndMapTimezone = (): string => {
  try {
    // Get the user's timezone from the browser
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map common Spanish timezones or regions to our Spanish options
    const timezoneMapping: { [key: string]: string } = {
      // Spanish mainland timezones
      'Europe/Madrid': 'Europe/Madrid',
      'Europe/Barcelona': 'Europe/Madrid', // Sometimes detected separately but same zone
      'Europe/Bilbao': 'Europe/Madrid',
      'Europe/Valencia': 'Europe/Madrid',
      'Europe/Seville': 'Europe/Madrid',
      
      // Canary Islands
      'Atlantic/Canary': 'Atlantic/Canary',
      'Atlantic/Las_Palmas': 'Atlantic/Canary',
      'Atlantic/Tenerife': 'Atlantic/Canary',
      
      // Other European timezones that might indicate Spanish user
      'Europe/Paris': 'Europe/Madrid',  // Same timezone as Spanish mainland
      'Europe/Berlin': 'Europe/Madrid',
      'Europe/Rome': 'Europe/Madrid',
      'Europe/Brussels': 'Europe/Madrid',
      'Europe/Amsterdam': 'Europe/Madrid',
    };

    // Return mapped timezone or default to Madrid if not found
    return timezoneMapping[detectedTimezone] || 'Europe/Madrid';
    
  } catch (error) {
    console.warn('Error detecting timezone:', error);
    // Default to Spanish mainland timezone
    return 'Europe/Madrid';
  }
};

/**
 * Gets a human-readable name for Spanish timezones
 * @param timezone - The timezone string
 * @returns Human-readable timezone name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const displayNames: { [key: string]: string } = {
    'Europe/Madrid': 'España peninsular (CET/CEST)',
    'Atlantic/Canary': 'España Canarias (WET/WEST)',
  };

  return displayNames[timezone] || timezone;
};

/**
 * Validates if a timezone is one of the supported Spanish timezones
 * @param timezone - The timezone to validate
 * @returns true if it's a supported Spanish timezone
 */
export const isSpanishTimezone = (timezone: string): boolean => {
  return timezone === 'Europe/Madrid' || timezone === 'Atlantic/Canary';
};
