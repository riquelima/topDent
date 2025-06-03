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
