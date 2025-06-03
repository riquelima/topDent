
// services/supabaseService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Patient } from '../types';

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

  const { data, error } = await client.from('patients').insert([dataToInsert]).select();
  if (error) console.error('Error adding patient to Supabase:', error);
  return { data, error };
};

export const getPatients = async (): Promise<{ data: Patient[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error } = await client.from('patients').select('*').order('full_name', { ascending: true });
  
  if (error) {
    console.error('Error fetching patients from Supabase:', error);
    return { data: null, error };
  }

  const transformedData: Patient[] = data ? data.map(p => ({
    id: p.cpf, // Using CPF as main ID for consistency with current app structure
    cpf: p.cpf,
    fullName: p.full_name,
    dob: p.dob, // Supabase returns date as YYYY-MM-DD
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

  const { data, error } = await client.from('patients').select('*').eq('cpf', cpf).single();

  if (error) {
    console.error(`Error fetching patient by CPF ${cpf} from Supabase:`, error);
    return { data: null, error };
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

export const addAnamnesisForm = async (anamnesisData: SupabaseAnamnesisData) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('anamnesis_forms').insert([anamnesisData]).select();
  if (error) console.error('Error adding anamnesis form to Supabase:', error);
  return { data, error };
};

export interface SupabaseBloodPressureReading {
    patient_cpf: string;
    reading_date: string; // YYYY-MM-DD
    reading_value: string;
}

export const addBloodPressureReadings = async (bpReadings: SupabaseBloodPressureReading[]) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('blood_pressure_readings').insert(bpReadings).select();
  if (error) console.error('Error adding blood pressure readings to Supabase:', error);
  return { data, error };
};

// --- TREATMENT PLAN FUNCTIONS ---
export interface SupabaseTreatmentPlanData {
    patient_cpf: string;
    description: string;
    file_names?: string | null;
    dentist_signature?: string | null;
}

export const addTreatmentPlan = async (planData: SupabaseTreatmentPlanData) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('treatment_plans').insert([planData]).select();
  if (error) console.error('Error adding treatment plan to Supabase:', error);
  return { data, error };
};

// TODO: Add functions for fetching Anamnesis, BP Readings, Treatment Plans associated with a patient.
// Example:
// export const getAnamnesisFormsForPatient = async (patientCpf: string) => {
//   const client = getSupabaseClient();
//   if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
//   const { data, error } = await client.from('anamnesis_forms').select('*').eq('patient_cpf', patientCpf);
//   // Transform data if necessary
//   return { data, error };
// };
