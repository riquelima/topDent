// services/googleSheetsService.ts

// Directly use the user-provided Google Apps Script Web App URL.
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxqFwfxZyUJcnGDCZ0_eNQ46Mifc63z_1T7rAf2-6Y5oLyyRM3ceYKszuUSUQJsyGx7vg/exec";

if (!APPS_SCRIPT_WEB_APP_URL) {
  // This condition is unlikely to be true now but kept as a fallback.
  console.warn(
    "WARNING: APPS_SCRIPT_WEB_APP_URL is somehow not set. " +
    "Google Sheets integration via Apps Script will be disabled. " +
    "Data will be logged to console instead. "
  );
}

export interface AppsScriptResponse {
  success: boolean;
  message: string;
  data?: any; 
  updates?: number;
}

/**
 * Sends data to the Google Apps Script Web App.
 * @param sheetName The name of the target sheet.
 * @param dataRows A 2D array of values to append. Each inner array represents a row.
 * @returns Promise<AppsScriptResponse>
 */
export async function saveDataToSheetViaAppsScript(
  sheetName: string,
  dataRows: (string | number | boolean | null | undefined)[][]
): Promise<AppsScriptResponse> {
  if (!APPS_SCRIPT_WEB_APP_URL) {
    console.log(`[SIMULATED] Sending to Apps Script for sheet ${sheetName}:`, dataRows);
    // For UI testing, simulate a successful response structure
    return {
      success: true,
      message: "SIMULATED: Data logged to console. APPS_SCRIPT_WEB_APP_URL is not configured.",
      updates: dataRows.length,
    };
  }

  try {
    // The payload sent to Apps Script
    const payload = {
      sheetName: sheetName,
      data: dataRows, // Ensure this key matches what Apps Script expects
    };

    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors', // Important for cross-origin requests to Apps Script
      headers: {
        // Apps Script usually expects text/plain for e.postData.contents
        // but we'll send JSON and parse it in the script.
        // If issues arise, 'text/plain' might be an alternative header with manual parsing.
         'Content-Type': 'application/json', 
      },
      body: JSON.stringify(payload),
      // Adding a redirect: 'follow' might be necessary if Apps Script issues a redirect
      // However, for POST requests returning JSON, 'follow' is usually not what we want.
      // If you see "opaque redirect" errors, this might be a point of investigation,
      // but typically Apps Script doPost returns directly.
    });

    // Apps Script returns JSON via ContentService, but sometimes wrapped.
    // Best to get as text first, then parse.
    const responseText = await response.text();
    let responseData: AppsScriptResponse;

    try {
        responseData = JSON.parse(responseText);
    } catch (parseError) {
        console.error("Failed to parse JSON response from Apps Script:", responseText, parseError);
        return { success: false, message: "Failed to parse response from Apps Script. Response was: " + responseText };
    }
    
    if (!response.ok || !responseData.success) {
      console.error('Error response from Apps Script:', responseData);
      const errorMessage = responseData.message || `Apps Script error: ${response.statusText || response.status}`;
      return { success: false, message: errorMessage, data: responseData };
    }

    console.log('Data sent to Apps Script successfully:', responseData);
    return { 
        success: true, 
        message: responseData.message || "Data sent to Apps Script successfully.", 
        updates: responseData.updates,
        data: responseData 
    };

  } catch (error: any) {
    console.error('Failed to send data to Apps Script:', error);
    let detailedMessage = "An unknown error occurred while sending data to Apps Script.";
    if (error.message) {
        detailedMessage = error.message;
    }
    if (error instanceof TypeError && error.message.toLowerCase().includes("failed to fetch")) {
        detailedMessage = "Network error or CORS issue: Failed to fetch. Ensure Apps Script is deployed correctly, accessible ('Anyone' or 'Anyone, even anonymous'), and the URL is correct.";
    }
    return { success: false, message: detailedMessage };
  }
}

// Sheet names (constants to avoid typos, used by calling pages)
export const SHEET_PATIENTS = "Patients";
export const SHEET_ANAMNESIS_FORMS = "AnamnesisForms";
export const SHEET_BLOOD_PRESSURE_READINGS = "BloodPressureReadings";
export const SHEET_TREATMENT_PLANS = "TreatmentPlans";