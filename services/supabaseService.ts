// services/supabaseService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Patient, Appointment, BloodPressureReading, AnamnesisFormUIData, SupabaseTreatmentPlanData, TreatmentPlanWithPatientInfo } from '../types'; // Added SupabaseTreatmentPlanData, TreatmentPlanWithPatientInfo

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
  } : null;
  return { data: transformedData, error: null };
};

// --- ANAMNESIS FORM FUNCTIONS ---
export interface SupabaseAnamnesisData {
    id?: string; 
    created_at?: string; 
    patient_cpf: string;
    medications_taken: 'Sim' | 'Não' | null;
    medications_details?: string | null;
    is_smoker: 'Sim' | 'Não' | null;
    is_pregnant: 'Sim' | 'Não' | null;
    allergies_exist: 'Sim' | 'Não' | 'Não sei' | null;
    allergies_details?: string | null;
    has_disease: 'Sim' | 'Não' | null;
    disease_cardiovascular?: boolean | null;
    disease_respiratory?: boolean | null;
    disease_vascular?: boolean | null;
    disease_diabetes?: boolean | null;
    disease_hypertension?: boolean | null;
    disease_renal?: boolean | null;
    disease_neoplasms?: boolean | null;
    disease_hereditary?: boolean | null;
    disease_other_details?: string | null;
    surgeries_had: 'Sim' | 'Não' | null;
    surgeries_details?: string | null;
}

export const addAnamnesisForm = async (anamnesisData: Omit<SupabaseAnamnesisData, 'id' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { id, created_at, ...insertData } = anamnesisData as SupabaseAnamnesisData;

  const { data, error: supabaseError } = await client.from('anamnesis_forms').insert([insertData]).select().single();
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
    return { data: null, error: supabaseError };
  }
  return { data: data as SupabaseAnamnesisData | null, error: null };
};


export interface SupabaseBloodPressureReading {
    id?: string; 
    created_at?: string; 
    patient_cpf: string;
    reading_date: string; // YYYY-MM-DD
    reading_value: string;
}

export const addBloodPressureReadings = async (bpReadings: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[]) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const insertData = bpReadings.map(bp => {
    const { id, created_at, ...reading } = bp as SupabaseBloodPressureReading;
    return reading;
  });

  const { data, error: supabaseError } = await client.from('blood_pressure_readings').insert(insertData).select();
  if (supabaseError) {
    console.error('Error adding blood pressure readings to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

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
  // Ensure id and created_at are not part of the insertData if they somehow sneak in
  const { id, created_at, ...insertData } = planData as SupabaseTreatmentPlanData;
  const { data, error: supabaseError } = await client.from('treatment_plans').insert([insertData]).select().single();
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

  const updateData = planData; // file_url should be part of this if provided

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
export type SupabaseAppointmentData = Omit<Appointment, 'id' | 'created_at'>;

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
  };

  const { data, error: supabaseError } = await client.from('appointments').insert([dataToInsert]).select().single();
  if (supabaseError) {
    console.error('Error adding appointment to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError }; 
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

export const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']): Promise<{ data: Appointment | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single();
  
  if (supabaseError) {
    console.error(`Error updating status for appointment ${appointmentId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError };
};