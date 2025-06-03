// services/googleSheetsService.ts

// Directly use the user-provided Google Apps Script Web App URL.
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxqFwfxZyUJcnGDCZ0_eNQ46Mifc63z_1T7rAf2-6Y5oLyyRM3ceYKszuUSUQJsyGx7vg/exec";

if (!APPS_SCRIPT_WEB_APP_URL) {
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
  sheet?: string;
  errorDetails?: any; // For more detailed error info from script
  receivedPayload?: any; // For debugging request issues
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
    return {
      success: true,
      message: "SIMULATED: Data logged to console. APPS_SCRIPT_WEB_APP_URL is not configured.",
      updates: dataRows.length,
      sheet: sheetName
    };
  }

  try {
    const payload = {
      sheetName: sheetName,
      data: dataRows,
    };

    console.log(`Attempting to POST to Apps Script URL: ${APPS_SCRIPT_WEB_APP_URL}`);
    console.log('Payload:', payload);

    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      // mode: 'cors', // 'cors' is the default, so this line can be omitted.
      headers: {
         'Content-Type': 'application/json', 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Attempt to parse error response from Apps Script if available
      let errorData: AppsScriptResponse = { 
        success: false, 
        message: `HTTP error ${response.status}: ${response.statusText}` 
      };
      try {
        const errorJson = await response.json();
        errorData = { ...errorData, ...errorJson }; // Merge script error if present
      } catch (jsonError) {
        // If response is not JSON or another error occurs
        console.warn("Could not parse error response JSON from Apps Script:", jsonError);
      }
      console.error('Error response from Apps Script:', errorData);
      return errorData;
    }

    const responseData: AppsScriptResponse = await response.json();
    console.log('Response from Apps Script:', responseData);
    return responseData;

  } catch (error: any) {
    console.error('Failed to send data to Apps Script:', error);
    let detailedMessage = "An unknown network or client-side error occurred while sending data.";
    if (error.message) {
        detailedMessage = error.message;
    }
    if (error instanceof TypeError && error.message.toLowerCase().includes("failed to fetch")) {
        detailedMessage = "Network error: Failed to fetch. Check network connection, CORS setup on Apps Script, or Apps Script URL.";
    }
    return { 
        success: false, 
        message: detailedMessage,
        errorDetails: { name: error.name, message: error.message, stack: error.stack }
    };
  }
}

// Sheet names (constants to avoid typos, used by calling pages)
export const SHEET_PATIENTS = "Patients";
export const SHEET_ANAMNESIS_FORMS = "AnamnesisForms";
export const SHEET_BLOOD_PRESSURE_READINGS = "BloodPressureReadings";
export const SHEET_TREATMENT_PLANS = "TreatmentPlans";