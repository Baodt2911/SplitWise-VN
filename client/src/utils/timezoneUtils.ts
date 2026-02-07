/**
 * Timezone utilities for converting UTC to Vietnam timezone (UTC+7)
 */

const VIETNAM_TIMEZONE_OFFSET = 7 * 60; // 7 hours in minutes

/**
 * Convert UTC date string to Vietnam timezone
 * @param utcDateString - ISO date string in UTC
 * @returns Date object adjusted to Vietnam timezone
 */
export const convertUTCToVietnamTime = (utcDateString: string): Date => {
  const utcDate = new Date(utcDateString);
  
  // Get UTC time in milliseconds
  const utcTime = utcDate.getTime();
  
  // Add Vietnam timezone offset (7 hours)
  const vietnamTime = new Date(utcTime + VIETNAM_TIMEZONE_OFFSET * 60 * 1000);
  
  return vietnamTime;
};

/**
 * Format UTC date string to Vietnam timezone display
 * @param utcDateString - ISO date string in UTC
 * @param format - Optional format type: 'full', 'date', 'time', 'datetime'
 * @returns Formatted string in Vietnam timezone
 */
export const formatVietnamTime = (
  utcDateString: string,
  format: 'full' | 'date' | 'time' | 'datetime' = 'datetime'
): string => {
  const vietnamDate = convertUTCToVietnamTime(utcDateString);
  
  const day = vietnamDate.getDate().toString().padStart(2, '0');
  const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
  const year = vietnamDate.getFullYear();
  const hours = vietnamDate.getHours().toString().padStart(2, '0');
  const minutes = vietnamDate.getMinutes().toString().padStart(2, '0');
  const seconds = vietnamDate.getSeconds().toString().padStart(2, '0');
  
  switch (format) {
    case 'full':
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    case 'date':
      return `${day}/${month}/${year}`;
    case 'time':
      return `${hours}:${minutes}`;
    case 'datetime':
    default:
      return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
};

/**
 * Get Vietnam timezone date from UTC string (for comparisons)
 * @param utcDateString - ISO date string in UTC
 * @returns Object with date components in Vietnam timezone
 */
export const getVietnamDateComponents = (utcDateString: string) => {
  const vietnamDate = convertUTCToVietnamTime(utcDateString);
  
  return {
    year: vietnamDate.getFullYear(),
    month: vietnamDate.getMonth() + 1,
    day: vietnamDate.getDate(),
    hours: vietnamDate.getHours(),
    minutes: vietnamDate.getMinutes(),
    seconds: vietnamDate.getSeconds(),
    date: vietnamDate,
  };
};
