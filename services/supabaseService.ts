
// services/supabaseService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
    Patient, 
    Appointment, 
    BloodPressureReading, 
    // AnamnesisFormUIData, // Not used directly here for Supabase types
    SupabaseTreatmentPlanData, 
    TreatmentPlanWithPatientInfo,
    SupabaseAnamnesisData, // Imported from types.ts
    SupabaseBloodPressureReading // Imported from types.ts
} from '../types'; 

// IMPORTANT: Replace these with your actual Supabase Project URL and Anon Key
// You can find these in your Supabase project settings under "API"
const SUPABASE_URL: string = 'https://wbxjsqixqxdcagiorccx.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieGpzcWl4cXhkY2FnaW9yY2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDY2MTEsImV4cCI6MjA2NDUyMjYxMX0.k6XbupkpNarKbmIGKUPYnRFh9Fha5Li4gq5l5HvRe7w';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized.");
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
  }
} else {
  console.warn(
    "Supabase URL or Anon Key is not configured or is using placeholder values. " +
    "Supabase integration will be disabled. Please update SUPABASE_URL and SUPABASE_ANON_KEY in services/supabaseService.ts with your project's credentials."
  );
}

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabase) {
    console.error("Supabase client is not initialized. Check configuration in services/supabaseService.ts.");
  }
  return supabase;
};

// --- PATIENT FUNCTIONS ---
export const addPatient = async (patientData: Omit<Patient, 'id'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { cpf, fullName, dob, guardian, rg, phone, addressStreet, addressNumber, addressDistrict, emergencyContactName, emergencyContactPhone } = patientData;
  
  const dataToInsert = {
    // id is likely auto-generated UUID by Supabase, so we don't include it here.
    created_at: new Date().toISOString(), // Ensure created_at is provided
    cpf,
    full_name: fullName,
    dob, // Expected in YYYY-MM-DD format
    guardian: guardian || null,
    rg: rg || null,
    phone: phone || null,
    address_street: addressStreet || null,
    address_number: addressNumber || null,
    address_district: addressDistrict || null,
    emergency_contact_name: emergencyContactName || null,
    emergency_contact_phone: emergencyContactPhone || null,
  };

  const { data, error: supabaseError } = await client.from('patients').insert([dataToInsert]).select();
  if (supabaseError) {
    console.error('Error adding patient to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const updatePatient = async (cpf: string, patientData: Partial<Omit<Patient, 'id' | 'cpf'>>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  // Map Patient interface fields to Supabase column names
  const dataToUpdate: Record<string, any> = {};
  if (patientData.fullName !== undefined) dataToUpdate.full_name = patientData.fullName;
  if (patientData.dob !== undefined) dataToUpdate.dob = patientData.dob;
  if (patientData.guardian !== undefined) dataToUpdate.guardian = patientData.guardian || null;
  if (patientData.rg !== undefined) dataToUpdate.rg = patientData.rg || null;
  if (patientData.phone !== undefined) dataToUpdate.phone = patientData.phone || null;
  if (patientData.addressStreet !== undefined) dataToUpdate.address_street = patientData.addressStreet || null;
  if (patientData.addressNumber !== undefined) dataToUpdate.address_number = patientData.addressNumber || null;
  if (patientData.addressDistrict !== undefined) dataToUpdate.address_district = patientData.addressDistrict || null;
  if (patientData.emergencyContactName !== undefined) dataToUpdate.emergency_contact_name = patientData.emergencyContactName || null;
  if (patientData.emergencyContactPhone !== undefined) dataToUpdate.emergency_contact_phone = patientData.emergencyContactPhone || null;
  dataToUpdate.updated_at = new Date().toISOString(); // Also update 'updated_at' on every update

  if (Object.keys(dataToUpdate).length === 0) {
    return { data: null, error: { message: "No data provided for update." } };
  }

  const { data, error: supabaseError } = await client
    .from('patients')
    .update(dataToUpdate)
    .eq('cpf', cpf)
    .select();
  
  if (supabaseError) {
    console.error(`Error updating patient CPF ${cpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const deletePatientByCpf = async (cpf: string): Promise<{ data: any[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  console.log(`[SupabaseService] Attempting to delete patient with CPF: ${cpf}`);
  // Add .select() to get the deleted rows back, which helps confirm the operation.
  const { data, error: supabaseError } = await client.from('patients').delete().eq('cpf', cpf).select();

  if (supabaseError) {
    console.error(`[SupabaseService] Error deleting patient CPF ${cpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  } else {
    console.log(`[SupabaseService] Delete call for CPF ${cpf} successful. Supabase response data:`, data);
    if (data && data.length > 0) {
        console.log(`[SupabaseService] Supabase confirmed deletion of ${data.length} record(s).`);
    } else if (data && data.length === 0) {
        console.warn(`[SupabaseService] Supabase reported 0 records deleted for CPF ${cpf}. Patient might not have existed or RLS/constraint prevented deletion without an explicit error.`);
    } else {
        console.warn(`[SupabaseService] Supabase delete call for CPF ${cpf} returned no error, but data is unexpected or null:`, data);
    }
  }
  return { data, error: supabaseError };
};


export const getPatients = async (): Promise<{ data: Patient[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client.from('patients').select('*').order('full_name', { ascending: true });
  
  if (supabaseError) {
    console.error('Error fetching patients from Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }

  const transformedData: Patient[] = data ? data.map(p => ({
    id: p.cpf, 
    cpf: p.cpf,
    fullName: p.full_name,
    dob: p.dob, 
    guardian: p.guardian,
    rg: p.rg,
    phone: p.phone,
    addressStreet: p.address_street,
    addressNumber: p.address_number,
    addressDistrict: p.address_district,
    emergencyContactName: p.emergency_contact_name,
    emergencyContactPhone: p.emergency_contact_phone,
    created_at: p.created_at, // Ensure this is mapped
    updated_at: p.updated_at, // Ensure this is mapped
  })) : [];
  return { data: transformedData, error: null };
};

export const getPatientByCpf = async (cpf: string): Promise<{ data: Patient | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client.from('patients').select('*').eq('cpf', cpf).single();

  if (supabaseError) {
    if (supabaseError.code === 'PGRST204' || supabaseError.message.includes('query returned no rows')) {
        console.log(`Patient with CPF ${cpf} not found.`);
        return { data: null, error: null }; 
    }
    console.error(`Error fetching patient by CPF ${cpf} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  
  const transformedData: Patient | null = data ? {
    id: data.cpf,
    cpf: data.cpf,
    fullName: data.full_name,
    dob: data.dob,
    guardian: data.guardian,
    rg: data.rg,
    phone: data.phone,
    addressStreet: data.address_street,
    addressNumber: data.address_number,
    addressDistrict: data.address_district,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    created_at: data.created_at, // Ensure this is mapped
    updated_at: data.updated_at, // Ensure this is mapped
  } : null;
  return { data: transformedData, error: null };
};

// --- ANAMNESIS FORM FUNCTIONS ---
// SupabaseAnamnesisData is now imported from types.ts

export const addAnamnesisForm = async (anamnesisData: Omit<SupabaseAnamnesisData, 'id' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const dataToInsert = {
      ...anamnesisData,
      created_at: new Date().toISOString(), // Ensure created_at is provided
  };

  const { data, error: supabaseError } = await client.from('anamnesis_forms').insert([dataToInsert]).select().single();
  if (supabaseError) {
    console.error('Error adding anamnesis form to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const getAnamnesisFormByPatientCpf = async (patientCpf: string): Promise<{ data: SupabaseAnamnesisData | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('anamnesis_forms')
    .select('*')
    .eq('patient_cpf', patientCpf)
    .order('created_at', { ascending: false }) 
    .limit(1)
    .maybeSingle(); 

  if (supabaseError) {
    console.error(`Error fetching anamnesis form for CPF ${patientCpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: data as SupabaseAnamnesisData | null, error: supabaseError };
  }
  return { data: data as SupabaseAnamnesisData | null, error: null };
};

// SupabaseBloodPressureReading is now imported from types.ts

export const addBloodPressureReadings = async (bpReadings: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[]) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const insertData = bpReadings.map(bp => ({
    ...bp,
    created_at: new Date().toISOString(), // Ensure created_at is provided
  }));

  const { data, error: supabaseError } = await client.from('blood_pressure_readings').insert(insertData).select();
  if (supabaseError) {
    console.error('Error adding blood pressure readings to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

// Returns the UI-friendly BloodPressureReading type
export const getBloodPressureReadingsByPatientCpf = async (patientCpf: string): Promise<{ data: BloodPressureReading[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('blood_pressure_readings')
    .select('id, created_at, reading_date, reading_value') 
    .eq('patient_cpf', patientCpf)
    .order('reading_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (supabaseError) {
    console.error(`Error fetching blood pressure readings for CPF ${patientCpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }

  const transformedData: BloodPressureReading[] = data ? data.map(bp => ({
    id: bp.id,
    created_at: bp.created_at,
    date: bp.reading_date, 
    value: bp.reading_value, 
  })) : [];
  
  return { data: transformedData, error: null };
};


// --- TREATMENT PLAN FUNCTIONS ---
// SupabaseTreatmentPlanData is now imported from types.ts

export const addTreatmentPlan = async (planData: Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const dataToInsert = {
      ...planData,
      created_at: new Date().toISOString(), // Ensure created_at is provided
  };
  
  const { data, error: supabaseError } = await client.from('treatment_plans').insert([dataToInsert]).select().single();
  if (supabaseError) {
    console.error('Error adding treatment plan to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const getTreatmentPlanById = async (planId: string): Promise<{ data: SupabaseTreatmentPlanData | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .select('*') // Ensure file_url is selected if the column exists
    .eq('id', planId)
    .single();

  if (supabaseError) {
    console.error(`Error fetching treatment plan by ID ${planId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as SupabaseTreatmentPlanData | null, error: null };
};

export const updateTreatmentPlan = async (planId: string, planData: Partial<Omit<SupabaseTreatmentPlanData, 'id' | 'created_at' | 'patient_cpf'>>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const updateData = {
      ...planData,
      updated_at: new Date().toISOString(), // Also update 'updated_at' on every update
  };

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .update(updateData)
    .eq('id', planId)
    .select() // Ensure file_url is selected
    .single();

  if (supabaseError) {
    console.error(`Error updating treatment plan ID ${planId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const deleteTreatmentPlan = async (planId: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };

  // Note: This does not delete files from Supabase Storage.
  // If you need to delete files from storage, you must do that separately.
  const { error: supabaseError } = await client
    .from('treatment_plans')
    .delete()
    .eq('id', planId);

  if (supabaseError) {
    console.error(`Error deleting treatment plan ID ${planId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { error: supabaseError };
};


export const getTreatmentPlansByPatientCpf = async (patientCpf: string): Promise<{ data: SupabaseTreatmentPlanData[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .select('*') // Ensure file_url is selected
    .eq('patient_cpf', patientCpf)
    .order('created_at', { ascending: false });

  if (supabaseError) {
    console.error(`Error fetching treatment plans for CPF ${patientCpf} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as SupabaseTreatmentPlanData[] | null, error: null };
};

// TreatmentPlanWithPatientInfo is now imported from types.ts
export const getAllTreatmentPlans = async (): Promise<{ data: TreatmentPlanWithPatientInfo[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .select(`
      *,
      file_url, 
      patients (
        full_name,
        cpf
      )
    `)
    .order('created_at', { ascending: false });

  if (supabaseError) {
    console.error('Error fetching all treatment plans from Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }

  const transformedData: TreatmentPlanWithPatientInfo[] = data ? data.map(plan => {
    const patientInfo = plan.patients as { full_name: string, cpf: string } | null; 
    return {
      ...plan,
      patient_full_name: patientInfo ? patientInfo.full_name : 'Paciente Desconhecido',
      patients: undefined, 
    } as TreatmentPlanWithPatientInfo;
  }) : [];
  
  return { data: transformedData, error: null };
};


// --- APPOINTMENT FUNCTIONS ---
// Define SupabaseAppointmentData based on the Appointment type, excluding id and created_at for inserts
export type SupabaseAppointmentData = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;

export const addAppointment = async (appointmentData: SupabaseAppointmentData) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const dataToInsert = {
    patient_cpf: appointmentData.patient_cpf,
    patient_name: appointmentData.patient_name,
    appointment_date: appointmentData.appointment_date,
    appointment_time: appointmentData.appointment_time,
    procedure: appointmentData.procedure,
    notes: appointmentData.notes,
    status: appointmentData.status,
    created_at: new Date().toISOString(), // Ensure created_at is provided
  };

  const { data, error: supabaseError } = await client.from('appointments').insert([dataToInsert]).select().single();
  if (supabaseError) {
    console.error('Error adding appointment to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError }; 
};

export const updateAppointment = async (appointmentId: string, appointmentData: Partial<SupabaseAppointmentData>): Promise<{ data: Appointment | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  // Ensure we don't try to update patient_cpf if it's part of appointmentData for some reason during edit
  const { patient_cpf, patient_name, ...editablePayload } = appointmentData;

  const updatePayload = {
      ...editablePayload,
      updated_at: new Date().toISOString(), // Also update 'updated_at' on every update
  };


  const { data, error: supabaseError } = await client
    .from('appointments')
    .update(updatePayload) // Use the payload that excludes patient_cpf and patient_name
    .eq('id', appointmentId)
    .select()
    .single();
  
  if (supabaseError) {
    console.error(`Error updating appointment ${appointmentId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError };
};

export const deleteAppointment = async (appointmentId: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };

  const { error: supabaseError } = await client
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (supabaseError) {
    console.error(`Error deleting appointment ${appointmentId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { error: supabaseError };
};

export const getAppointments = async (): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const { data, error: supabaseError } = await client
    .from('appointments')
    .select('*')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (supabaseError) {
    console.error('Error fetching appointments from Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};

export const getAppointmentsByDate = async (date: string): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const { data, error: supabaseError } = await client
    .from('appointments')
    .select('*')
    .eq('appointment_date', date)
    .order('appointment_time', { ascending: true });

  if (supabaseError) {
    console.error(`Error fetching appointments for date ${date} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};

export const getAppointmentsByPatientCpf = async (patientCpf: string): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('appointments')
    .select('*')
    .eq('patient_cpf', patientCpf)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (supabaseError) {
    console.error(`Error fetching appointments for patient CPF ${patientCpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};


export const getUpcomingAppointments = async (limit: number = 5): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const { data, error: supabaseError } = await client
    .from('appointments')
    .select('*')
    .gte('appointment_date', today) // Greater than or equal to today
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(limit);

  if (supabaseError) {
    console.error('Error fetching upcoming appointments from Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};


export const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']): Promise<{ data: Appointment | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() }) // Add updated_at here
    .eq('id', appointmentId)
    .select()
    .single();
  
  if (supabaseError) {
    console.error(`Error updating status for appointment ${appointmentId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError };
};
