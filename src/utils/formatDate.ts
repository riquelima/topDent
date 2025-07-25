// src/utils/formatDate.ts

/**
 * Converts a date string from YYYY-MM-DD (format from <input type="date">)
 * to DD/MM/YYYY for display or storage.
 * @param isoDateString Date string in YYYY-MM-DD format. Can be empty.
 * @returns Date string in DD/MM/YYYY format, or an empty string if input is empty.
 */
export const isoToDdMmYyyy = (isoDateString: string): string => {
  if (!isoDateString) {
    return '';
  }
  // Assuming isoDateString is always in 'YYYY-MM-DD' format when not empty
  const [year, month, day] = isoDateString.split('-');
  // Ensure all parts exist after split
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  // Fallback if split is not as expected, though unlikely for valid date input
  return isoDateString; 
};

/**
 * Converts a date string from DD/MM/YYYY
 * to YYYY-MM-DD (format for <input type="date"> value).
 * @param ddMmYyyyDateString Date string in DD/MM/YYYY format. Can be empty.
 * @returns Date string in YYYY-MM-DD format, or an empty string if input is empty.
 */
export const ddMmYyyyToIso = (ddMmYyyyDateString: string): string => {
  if (!ddMmYyyyDateString) {
    return '';
  }
  const [day, month, year] = ddMmYyyyDateString.split('/');
  // Ensure all parts exist after split
  if (day && month && year) {
    return `${year}-${month}-${day}`;
  }
  // Fallback if split is not as expected
  return ddMmYyyyDateString;
};

/**
 * Formats a time string (e.g., "HH:MM:SS" or "HH:MM") to "HH:MM".
 * @param timeString The time string to format.
 * @returns Time string in HH:MM format, or an empty string if input is invalid/empty.
 */
export const formatToHHMM = (timeString: string | null | undefined): string => {
  if (!timeString) {
    return '';
  }
  const parts = timeString.split(':');
  if (parts.length >= 2) {
    const hour = parts[0].padStart(2, '0');
    const minute = parts[1].padStart(2, '0');
    return `${hour}:${minute}`;
  }
  // Fallback for unexpected format, though less likely if source is consistent
  return timeString; 
};

/**
 * Formats an ISO 8601 timestamp string into HH:MM format for the 'America/Sao_Paulo' timezone.
 * @param isoTimestamp The full ISO timestamp string from Supabase (e.g., "2024-07-10T22:30:00+00:00").
 * @returns Time string in HH:MM format, or an empty string if input is invalid.
 */
export const formatIsoToSaoPauloTime = (isoTimestamp: string | null | undefined): string => {
  if (!isoTimestamp) {
    return '';
  }
  try {
    const date = new Date(isoTimestamp);
    // 'pt-BR' is used for locale, but timeZone dictates the offset.
    // 'hour12: false' ensures 24-hour format.
    return date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting date to São Paulo time:", error);
    // Fallback to simple HH:MM extraction if toLocaleTimeString fails, which will be in user's local time
    return formatToHHMM(isoTimestamp.split('T')[1]);
  }
};

/**
 * Gets the current date in 'America/Sao_Paulo' timezone and returns it as 'YYYY-MM-DD'.
 * This is crucial for correctly filtering "today's" appointments regardless of server/user timezone.
 * @returns The current date in Sao Paulo as a 'YYYY-MM-DD' string.
 */
export const getTodayInSaoPaulo = (): string => {
  const spTime = new Date().toLocaleString("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // toLocaleString with en-CA gives YYYY-MM-DD format, we just need the date part
  return spTime.split(',')[0]; 
};
