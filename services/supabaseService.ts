// services/supabaseService.ts
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { 
    Patient, 
    Appointment, 
    BloodPressureReading, 
    SupabaseTreatmentPlanData, 
    TreatmentPlanWithPatientInfo,
    SupabaseAnamnesisData, 
    SupabaseBloodPressureReading,
    Dentist,
    Reminder,
    Procedure,
    ConsultationHistoryEntry,
    AppointmentReturnInfo,
    ChangelogEntry,
    Notification,
    ChatMessage,
    PaymentInput
} from '../types'; 

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
            id: string;
            patient_cpf: string | null;
            patient_name: string;
            appointment_date: string;
            appointment_time: string;
            procedure: string;
            notes: string | null;
            status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
            dentist_id: string | null; 
            dentist_name: string | null; 
            return_date: string | null;
            created_at: string;
            updated_at: string | null;
        },
        Insert: {
            id?: string;
            patient_cpf: string | null;
            patient_name: string;
            appointment_date: string;
            appointment_time: string;
            procedure: string;
            notes?: string | null;
            status?: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
            dentist_id?: string | null; 
            dentist_name?: string | null; 
            return_date?: string | null;
            created_at?: string;
            updated_at?: string | null;
        },
        Update: {
            id?: string;
            patient_cpf?: string | null;
            patient_name?: string;
            appointment_date?: string;
            appointment_time?: string;
            procedure?: string;
            notes?: string | null;
            status?: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
            dentist_id?: string | null; 
            dentist_name?: string | null; 
            return_date?: string | null;
            created_at?: string;
            updated_at?: string | null;
        },
        Relationships: []
      },
      patients: {
        Row: {
          cpf: string
          full_name: string
          dob: string
          guardian: string | null
          rg: string | null
          phone: string | null
          address_street: string | null
          address_number: string | null
          address_district: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          payment_type: "health_plan" | "private" | null
          health_plan_code: string | null
          created_at: string
          updated_at: string | null
        },
        Insert: {
          cpf: string
          full_name: string
          dob: string
          guardian?: string | null
          rg?: string | null
          phone?: string | null
          address_street?: string | null
          address_number?: string | null
          address_district?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          payment_type?: "health_plan" | "private" | null
          health_plan_code?: string | null
          created_at?: string
          updated_at?: string | null
        },
        Update: {
          cpf?: string
          full_name?: string
          dob?: string
          guardian?: string | null
          rg?: string | null
          phone?: string | null
          address_street?: string | null
          address_number?: string | null
          address_district?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          payment_type?: "health_plan" | "private" | null
          health_plan_code?: string | null
          created_at?: string
          updated_at?: string | null
        },
        Relationships: []
      },
      anamnesis_forms: {
        Row: {
            id: string;
            created_at: string;
            patient_cpf: string;
            medications_taken: 'Sim' | 'Não' | null;
            medications_details: string | null;
            is_smoker: 'Sim' | 'Não' | null;
            is_pregnant: 'Sim' | 'Não' | null;
            allergies_exist: 'Sim' | 'Não' | 'Não sei' | null;
            allergies_details: string | null;
            has_disease: 'Sim' | 'Não' | null;
            disease_cardiovascular: boolean | null;
            disease_respiratory: boolean | null;
            disease_vascular: boolean | null;
            disease_diabetes: boolean | null;
            disease_hypertension: boolean | null;
            disease_renal: boolean | null;
            disease_neoplasms: boolean | null;
            disease_hereditary: boolean | null;
            disease_other_details: string | null;
            surgeries_had: 'Sim' | 'Não' | null;
            surgeries_details: string | null;
        },
        Insert: {
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
        },
        Update: {
            id?: string;
            created_at?: string;
            patient_cpf?: string;
            medications_taken?: 'Sim' | 'Não' | null;
            medications_details?: string | null;
            is_smoker?: 'Sim' | 'Não' | null;
            is_pregnant?: 'Sim' | 'Não' | null;
            allergies_exist?: 'Sim' | 'Não' | 'Não sei' | null;
            allergies_details?: string | null;
            has_disease?: 'Sim' | 'Não' | null;
            disease_cardiovascular?: boolean | null;
            disease_respiratory?: boolean | null;
            disease_vascular?: boolean | null;
            disease_diabetes?: boolean | null;
            disease_hypertension?: boolean | null;
            disease_renal?: boolean | null;
            disease_neoplasms?: boolean | null;
            disease_hereditary?: boolean | null;
            disease_other_details?: string | null;
            surgeries_had?: 'Sim' | 'Não' | null;
            surgeries_details?: string | null;
        },
        Relationships: []
      },
      blood_pressure_readings: {
        Row: {
            id: string;
            created_at: string;
            patient_cpf: string;
            reading_date: string;
            reading_value: string;
        },
        Insert: {
            id?: string;
            created_at?: string;
            patient_cpf: string;
            reading_date: string;
            reading_value: string;
        },
        Update: {
            id?: string;
            created_at?: string;
            patient_cpf?: string;
            reading_date?: string;
            reading_value?: string;
        },
        Relationships: []
      },
      treatment_plans: {
        Row: {
            id: string;
            created_at: string;
            patient_cpf: string;
            description: string;
            procedures_performed: string | null;
            files: { name: string; url: string; }[] | null;
            dentist_signature: string | null;
            prescribed_medication: string | null;
            payments: PaymentInput[] | null;
            updated_at?: string;
        },
        Insert: {
            id?: string;
            created_at?: string;
            patient_cpf: string;
            description: string;
            procedures_performed?: string | null;
            files?: { name: string; url: string; }[] | null;
            dentist_signature?: string | null;
            prescribed_medication?: string | null;
            payments?: PaymentInput[] | null;
            updated_at?: string;
        },
        Update: {
            id?: string;
            created_at?: string;
            patient_cpf?: string;
            description?: string;
            procedures_performed?: string | null;
            files?: { name: string; url: string; }[] | null;
            dentist_signature?: string | null;
            prescribed_medication?: string | null;
            payments?: PaymentInput[] | null;
            updated_at?: string;
        },
        Relationships: []
      },
      dentists: {
        Row: {
            id: string;
            full_name: string;
            username: string;
            password?: string;
            created_at: string;
            updated_at: string | null;
        },
        Insert: {
            id?: string;
            full_name: string;
            username: string;
            password?: string;
            created_at?: string;
            updated_at?: string | null;
        },
        Update: {
            id?: string;
            full_name?: string;
            username?: string;
            password?: string;
            created_at?: string;
            updated_at?: string | null;
        },
        Relationships: []
      },
      reminders: {
        Row: {
            id: string;
            created_at: string;
            title: string;
            content: string;
            is_active: boolean;
        },
        Insert: {
            id?: string;
            created_at?: string;
            title: string;
            content: string;
            is_active?: boolean;
        },
        Update: {
            id?: string;
            created_at?: string;
            title?: string;
            content?: string;
            is_active?: boolean;
        },
        Relationships: []
      },
      procedures: {
        Row: {
            id: string;
            name: string;
            is_active: boolean;
            created_at: string;
            updated_at: string;
        },
        Insert: {
            id?: string;
            name: string;
            is_active?: boolean;
            created_at?: string;
            updated_at?: string;
        },
        Update: {
            id?: string;
            name?: string;
            is_active?: boolean;
            created_at?: string;
            updated_at?: string;
        },
        Relationships: []
      },
      consultation_history: {
        Row: {
            id: string;
            appointment_id: string | null;
            patient_cpf: string | null;
            dentist_id: string | null;
            dentist_name: string | null;
            patient_name: string;
            procedure_details: string;
            consultation_date: string;
            completion_timestamp: string;
            status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
            notes: string | null;
            created_at: string;
        },
        Insert: {
            id?: string;
            appointment_id: string | null;
            patient_cpf: string | null;
            dentist_id?: string | null;
            dentist_name?: string | null;
            patient_name: string;
            procedure_details: string;
            consultation_date: string;
            completion_timestamp?: string;
            status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
            notes?: string | null;
            created_at?: string;
        },
        Update: {
            id?: string;
            appointment_id?: string | null;
            patient_cpf?: string | null;
            dentist_id?: string | null;
            dentist_name?: string | null;
            patient_name?: string;
            procedure_details?: string;
            consultation_date?: string;
            completion_timestamp?: string;
            status?: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
            notes?: string | null;
            created_at?: string;
        },
        Relationships: []
      },
      notifications: {
        Row: {
            id: string;
            created_at: string;
            dentist_id: string;
            message: string;
            is_read: boolean;
            appointment_id: string | null;
        },
        Insert: {
            id?: string;
            created_at?: string;
            dentist_id: string;
            message: string;
            is_read?: boolean;
            appointment_id?: string | null;
        },
        Update: {
            id?: string;
            created_at?: string;
            dentist_id?: string;
            message?: string;
            is_read?: boolean;
            appointment_id?: string | null;
        },
        Relationships: []
      },
      chat_messages: {
        Row: {
            id: string;
            sender_id: string;
            recipient_id: string;
            content: string | null;
            created_at: string;
            is_read: boolean;
            file_url: string | null;
            file_name: string | null;
            file_type: string | null;
        },
        Insert: {
            id?: string;
            sender_id: string;
            recipient_id: string;
            content?: string | null;
            created_at?: string;
            is_read?: boolean;
            file_url?: string | null;
            file_name?: string | null;
            file_type?: string | null;
        },
        Update: {
            id?: string;
            sender_id?: string;
            recipient_id?: string;
            content?: string | null;
            created_at?: string;
            is_read?: boolean;
            file_url?: string | null;
            file_name?: string | null;
            file_type?: string | null;
        },
        Relationships: []
      },
      configurations: {
        Row: { key: string; value: string; created_at: string },
        Insert: { key: string; value: string; created_at?: string },
        Update: { 
            key?: string; 
            value?: string; 
            created_at?: string 
        },
        Relationships: []
      },
      changelog: {
        Row: {
          id: string;
          created_at: string;
          release_date: string;
          version: string;
          changes: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          release_date: string;
          version: string;
          changes: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          release_date?: string;
          version?: string;
          changes?: string[];
        };
        Relationships: []
      };
    }
  }
}


const SUPABASE_URL: string = 'https://wbxjsqixqxdcagiorccx.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieGpzcWl4cXhkY2FnaW9yY2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NDY2MTEsImV4cCI6MjA2NDUyMjYxMX0.k6XbupkpNarKbmIGKUPYnRFh9Fha5Li4gq5l5HvRe7w';

let supabase: SupabaseClient<Database> | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
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

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (!supabase) {
    console.error("Supabase client is not initialized. Check configuration in services/supabaseService.ts.");
  }
  return supabase;
};

const transformPatientData = (p: any): Patient => ({
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
    payment_type: p.payment_type,
    health_plan_code: p.health_plan_code,
    created_at: p.created_at,
    updated_at: p.updated_at,
});


// --- PATIENT FUNCTIONS ---
export const addPatient = async (patientData: Omit<Patient, 'id'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { cpf, fullName, dob, guardian, rg, phone, addressStreet, addressNumber, addressDistrict, emergencyContactName, emergencyContactPhone, payment_type, health_plan_code } = patientData;
  
  const dataToInsert: Database['public']['Tables']['patients']['Insert'] = {
    created_at: new Date().toISOString(), 
    cpf,
    full_name: fullName,
    dob: dob || '1900-01-01', // Use a default date to satisfy NOT NULL constraint
    guardian: guardian || null,
    rg: rg || null,
    phone: phone || null,
    address_street: addressStreet || null,
    address_number: addressNumber || null,
    address_district: addressDistrict || null,
    emergency_contact_name: emergencyContactName || null,
    emergency_contact_phone: emergencyContactPhone || null,
    payment_type: payment_type || null,
    health_plan_code: health_plan_code || null,
  };

  const { data, error: supabaseError } = await client.from('patients').insert(dataToInsert).select();
  if (supabaseError) {
    console.error('Error adding patient to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const updatePatient = async (oldCpf: string, patientData: Partial<Omit<Patient, 'id'>>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const dataToUpdate: Partial<Database['public']['Tables']['patients']['Update']> = {};
  if (patientData.cpf !== undefined) dataToUpdate.cpf = patientData.cpf;
  if (patientData.fullName !== undefined) dataToUpdate.full_name = patientData.fullName;
  if (patientData.dob !== undefined) dataToUpdate.dob = patientData.dob || '1900-01-01';
  if (patientData.guardian !== undefined) dataToUpdate.guardian = patientData.guardian || null;
  if (patientData.rg !== undefined) dataToUpdate.rg = patientData.rg || null;
  if (patientData.phone !== undefined) dataToUpdate.phone = patientData.phone || null;
  if (patientData.addressStreet !== undefined) dataToUpdate.address_street = patientData.addressStreet || null;
  if (patientData.addressNumber !== undefined) dataToUpdate.address_number = patientData.addressNumber || null;
  if (patientData.addressDistrict !== undefined) dataToUpdate.address_district = patientData.addressDistrict || null;
  if (patientData.emergencyContactName !== undefined) dataToUpdate.emergency_contact_name = patientData.emergencyContactName || null;
  if (patientData.emergencyContactPhone !== undefined) dataToUpdate.emergency_contact_phone = patientData.emergencyContactPhone || null;
  if (patientData.payment_type !== undefined) dataToUpdate.payment_type = patientData.payment_type || null;
  if (patientData.health_plan_code !== undefined) dataToUpdate.health_plan_code = patientData.health_plan_code || null;
  dataToUpdate.updated_at = new Date().toISOString(); 

  if (Object.keys(dataToUpdate).length === 1 && dataToUpdate.updated_at) { 
    return { data: null, error: { message: "No data provided for update." } };
  }

  const { data, error: supabaseError } = await client
    .from('patients')
    .update(dataToUpdate)
    .eq('cpf', oldCpf)
    .select();
  
  if (supabaseError) {
    console.error(`Error updating patient CPF ${oldCpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const deletePatientByCpf = async (cpf: string): Promise<{ data: any[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client.from('patients').delete().eq('cpf', cpf).select();

  if (supabaseError) {
    console.error(`[SupabaseService] Error deleting patient CPF ${cpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  } else {
    if (data && data.length > 0) {
        console.log(`[SupabaseService] Successfully deleted patient record for CPF ${cpf}. Response indicates ${data.length} record(s) affected.`);
    } else if (data && data.length === 0) {
        console.warn(`[SupabaseService] Supabase reported 0 records deleted for CPF ${cpf}. Patient might have been already deleted or CPF not found.`);
    } else {
        console.log(`[SupabaseService] Delete operation for CPF ${cpf} completed. Data received:`, data);
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

  const transformedData: Patient[] = data ? data.map(transformPatientData) : [];
  return { data: transformedData, error: null };
};

export const getPatientByCpf = async (cpf: string): Promise<{ data: Patient | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('patients').select('*').eq('cpf', cpf).single();
  if (error) return { data: null, error };
  return { data: transformPatientData(data), error: null };
};

// --- ANAMNESIS & BLOOD PRESSURE FUNCTIONS ---
export const addAnamnesisForm = async (anamnesisData: Omit<SupabaseAnamnesisData, 'id' | 'created_at'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('anamnesis_forms').insert(anamnesisData).select();
};

export const addBloodPressureReadings = async (readings: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[]) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('blood_pressure_readings').insert(readings).select();
};

export const getAnamnesisFormByPatientCpf = async (patientCpf: string): Promise<{ data: SupabaseAnamnesisData | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await client.from('anamnesis_forms').select('*').eq('patient_cpf', patientCpf).order('created_at', { ascending: false }).limit(1).single();
    return { data, error };
};

export const getBloodPressureReadingsByPatientCpf = async (patientCpf: string): Promise<{ data: BloodPressureReading[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await client.from('blood_pressure_readings').select('id, created_at, reading_date, reading_value').eq('patient_cpf', patientCpf).order('reading_date', { ascending: false });
    const transformed = data?.map(d => ({ ...d, date: d.reading_date, value: d.reading_value })) || [];
    return { data: transformed, error };
};

// --- TREATMENT PLAN FUNCTIONS ---
export const addTreatmentPlan = async (planData: Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('treatment_plans').insert(planData).select();
};

export const updateTreatmentPlan = async (planId: string, planData: Partial<SupabaseTreatmentPlanData>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const updatePayload = { ...planData, updated_at: new Date().toISOString() };
    return client.from('treatment_plans').update(updatePayload).eq('id', planId).select();
};

export const getTreatmentPlanById = async (planId: string): Promise<{ data: SupabaseTreatmentPlanData | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await client.from('treatment_plans').select('*').eq('id', planId).single();
    return { data, error };
};

export const getTreatmentPlansByPatientCpf = async (patientCpf: string): Promise<{ data: SupabaseTreatmentPlanData[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await client.from('treatment_plans').select('*').eq('patient_cpf', patientCpf).order('created_at', { ascending: false });
    return { data, error };
};

export const getAllTreatmentPlans = async (): Promise<{ data: TreatmentPlanWithPatientInfo[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await client.from('treatment_plans').select('*, patient:patients(full_name)').order('created_at', { ascending: false });
    const transformed = data?.map(d => ({ ...d, patient_full_name: (d.patient as any)?.full_name })) || [];
    return { data: transformed, error };
};

export const deleteTreatmentPlan = async (planId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('treatment_plans').delete().eq('id', planId);
};


// --- APPOINTMENT FUNCTIONS ---
export type SupabaseAppointmentData = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>;

export const addAppointment = async (appointmentData: SupabaseAppointmentData) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').insert(appointmentData).select();
};

export const updateAppointment = async (appointmentId: string, appointmentData: Partial<SupabaseAppointmentData>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const updatePayload = { ...appointmentData, updated_at: new Date().toISOString() };
    return client.from('appointments').update(updatePayload).eq('id', appointmentId).select();
};

export const getAppointmentById = async (appointmentId: string): Promise<{ data: Appointment | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').select('*').eq('id', appointmentId).single();
};

export const getAppointments = async (): Promise<{ data: Appointment[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').select('*').order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });
};

export const deleteAppointment = async (appointmentId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').delete().eq('id', appointmentId);
};

export const getUpcomingAppointments = async (limit: number = 4): Promise<{ data: Appointment[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const today = new Date().toISOString().split('T')[0];
    return client.from('appointments').select('*').gte('appointment_date', today).order('appointment_date').order('appointment_time').limit(limit);
};

export const getAppointmentsByPatientCpf = async (patientCpf: string): Promise<{ data: Appointment[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').select('*').eq('patient_cpf', patientCpf).order('appointment_date', { ascending: false });
};

export const getAppointmentsByDate = async (date: string, dentistId: string, dentistUsername: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').select('*').eq('appointment_date', date).or(`dentist_id.eq.${dentistId},dentist_id.eq.${dentistUsername}`).order('appointment_time');
};

export const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', appointmentId).select().single();
};

export const getAppointmentsByDateRangeForDentist = async (startDate: string, endDate: string, dentistId: string, dentistUsername: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').select('*').gte('appointment_date', startDate).lte('appointment_date', endDate).or(`dentist_id.eq.${dentistId},dentist_id.eq.${dentistUsername}`).order('appointment_date').order('appointment_time');
};

export const getAllAppointmentsForDentist = async (dentistId: string, limit: number, page: number = 1, dentistUsername: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').select('*').or(`dentist_id.eq.${dentistId},dentist_id.eq.${dentistUsername}`).order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false }).limit(limit);
};

export const getUpcomingReturns = async (): Promise<{ data: AppointmentReturnInfo[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await client.from('appointments')
      .select('id, return_date, patient_cpf, patient_name, patient_phone:patients(phone), dentist_id, dentist_name')
      .not('return_date', 'is', null)
      .gte('return_date', today)
      .order('return_date');
    
    const transformedData = data?.map(d => ({ ...d, patient_phone: (d.patient_phone as any)?.phone })) || [];
    return { data: transformedData, error };
};

export const clearAppointmentReturnDate = async (appointmentId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('appointments').update({ return_date: null }).eq('id', appointmentId);
};

export const clearReturnDatesForAppointments = async (appointmentIds: string[]) => {
    const client = getSupabaseClient();
    if (!client || appointmentIds.length === 0) return { data: null, error: { message: "Client not initialized or no IDs provided." } };
    return client.from('appointments').update({ return_date: null }).in('id', appointmentIds).select();
};


// --- DENTIST FUNCTIONS ---

export const getDentists = async (): Promise<{ data: Dentist[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('dentists').select('id, full_name, username, created_at, updated_at').order('full_name');
};

export const getDentistByUsername = async (username: string): Promise<{ data: Dentist | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    
    const { data, error } = await client
      .from('dentists')
      .select('id, full_name, username, password')
      .eq('username', username);
      
    if (error) {
      console.error(`Database error fetching user '${username}':`, error);
      return { data: null, error };
    }
    
    if (data && data.length > 1) {
      console.warn(`Data integrity issue: Multiple users found for username '${username}'. Using the first result to allow login.`);
      return { data: data[0], error: null };
    }

    return { data: data?.[0] || null, error: null };
};

export const addDentist = async (dentistData: Omit<Dentist, 'id' | 'created_at' | 'updated_at'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('dentists').insert(dentistData).select().single();
};

export const updateDentist = async (dentistId: string, dentistData: Partial<Omit<Dentist, 'id' | 'created_at' | 'updated_at'>>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const updatePayload = { ...dentistData, updated_at: new Date().toISOString() };
    return client.from('dentists').update(updatePayload).eq('id', dentistId);
};

export const deleteDentist = async (dentistId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('dentists').delete().eq('id', dentistId);
};


// --- REMINDER FUNCTIONS ---
export const getReminders = async (): Promise<{ data: Reminder[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('reminders').select('*').order('created_at', { ascending: false });
};

export const getActiveReminders = async (): Promise<{ data: Reminder[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('reminders').select('*').eq('is_active', true).order('created_at', { ascending: false });
};

export const addReminder = async (reminderData: Omit<Reminder, 'id' | 'created_at' | 'is_active'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('reminders').insert({ ...reminderData, is_active: true });
};

export const updateReminder = async (reminderId: string, reminderData: Partial<Omit<Reminder, 'id' | 'created_at' | 'is_active'>>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('reminders').update(reminderData).eq('id', reminderId);
};

export const updateReminderIsActive = async (reminderId: string, isActive: boolean) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('reminders').update({ is_active: isActive }).eq('id', reminderId);
};

export const deleteReminderById = async (reminderId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('reminders').delete().eq('id', reminderId);
};


// --- PROCEDURE FUNCTIONS ---
export const getProcedures = async (includeInactive: boolean = false): Promise<{ data: Procedure[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    let query = client.from('procedures').select('*');
    if (!includeInactive) {
        query = query.eq('is_active', true);
    }
    return query.order('name');
};

export const addProcedure = async (procedureData: Pick<Procedure, 'name'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('procedures').insert({ ...procedureData, is_active: true });
};

export const updateProcedure = async (procedureId: string, procedureData: Partial<Pick<Procedure, 'name' | 'is_active'>>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('procedures').update(procedureData).eq('id', procedureId);
};

export const deleteProcedure = async (procedureId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('procedures').delete().eq('id', procedureId);
};

// --- CONSULTATION HISTORY FUNCTIONS ---
export const addConsultationHistoryEntry = async (entry: Omit<ConsultationHistoryEntry, 'id' | 'created_at' | 'completion_timestamp'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const payload = { ...entry, completion_timestamp: new Date().toISOString() };
    return client.from('consultation_history').insert(payload);
};

export const getConsultationHistory = async (filters: { patientSearchTerm?: string, dentistId?: string, startDate?: string, endDate?: string }) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    let query = client.from('consultation_history').select('*').order('completion_timestamp', { ascending: false });
    if (filters.patientSearchTerm) {
        query = query.or(`patient_name.ilike.%${filters.patientSearchTerm}%,patient_cpf.eq.${filters.patientSearchTerm}`);
    }
    if (filters.dentistId) query = query.eq('dentist_id', filters.dentistId);
    if (filters.startDate) query = query.gte('consultation_date', filters.startDate);
    if (filters.endDate) query = query.lte('consultation_date', filters.endDate);
    return query;
};

// --- NOTIFICATION & CHAT FUNCTIONS ---
const CHAT_FILES_BUCKET = 'chat-files';

export const uploadChatFile = async (file: File, userId: string): Promise<{ data: { publicUrl: string } | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = `${userId}/${Date.now()}-${sanitizedFileName}`;

    const { error: uploadError } = await client.storage
        .from(CHAT_FILES_BUCKET)
        .upload(filePath, file);

    if (uploadError) {
        const errorDetails = typeof uploadError === 'object' && uploadError !== null ? JSON.stringify(uploadError, null, 2) : String(uploadError);
        console.error(`[SupabaseService] Error uploading chat file to bucket '${CHAT_FILES_BUCKET}'. Details: ${errorDetails}`);
        return { data: null, error: uploadError };
    }

    const { data: publicUrlData } = client.storage.from(CHAT_FILES_BUCKET).getPublicUrl(filePath);

    if (!publicUrlData) {
        return { data: null, error: { message: 'Could not get public URL for uploaded file.' } };
    }

    return { data: { publicUrl: publicUrlData.publicUrl }, error: null };
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('notifications').insert({ ...notification, is_read: false });
};

export const getUnreadNotificationsForDentist = async (dentistId: string): Promise<{ data: Notification[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('notifications').select('*').eq('dentist_id', dentistId).eq('is_read', false).order('created_at', { ascending: false });
};

export const markNotificationsAsRead = async (notificationIds: string[]) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('notifications').update({ is_read: true }).in('id', notificationIds);
};

export const subscribeToNotificationsForDentist = (dentistId: string, callback: (payload: Notification) => void): RealtimeChannel | null => {
    const client = getSupabaseClient();
    if (!client) return null;
    return client.channel(`notifications_for_${dentistId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `dentist_id=eq.${dentistId}` }, (payload) => {
            callback(payload.new as Notification);
        })
        .subscribe();
};

export const getAdminUserId = async (): Promise<{ data: Dentist | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('dentists').select('id, full_name').eq('username', 'admin').single();
};

export const getUnreadMessages = async (recipientId: string): Promise<{ data: ChatMessage[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('chat_messages').select('*').eq('recipient_id', recipientId).eq('is_read', false);
};

export const getMessagesBetweenUsers = async (userId1: string, userId2: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const filterString = `or(and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1}))`;
    return client.from('chat_messages')
        .select('*')
        .or(filterString)
        .order('created_at');
};

export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'created_at' | 'is_read'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('chat_messages').insert(message).select().single();
};

export const markMessagesAsRead = async (messageIds: string[], recipientId: string) => {
    const client = getSupabaseClient();
    if (!client || messageIds.length === 0) return { data: null, error: { message: "Client not initialized or no messages to mark." } };
    
    // Chaining .select() makes the query more explicit and can help with certain RLS policies.
    // This helps ensure that if the update is permitted, we also have permission to view the result,
    // which can resolve certain permission errors.
    return client.from('chat_messages')
        .update({ is_read: true })
        .in('id', messageIds)
        .eq('recipient_id', recipientId) // Security check
        .select();
};

export const subscribeToMessages = (userId: string, callback: (payload: ChatMessage) => void): RealtimeChannel | null => {
    const client = getSupabaseClient();
    if (!client) return null;
    // Returns the channel object without calling .subscribe()
    // This allows the caller to attach a status callback before subscribing.
    return client.channel(`chat_messages_for_${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `recipient_id=eq.${userId}` }, (payload) => {
            callback(payload.new as ChatMessage);
        });
};


// --- CONFIGURATION & CHANGELOG ---
export const getConfigurationValue = async (key: string): Promise<{ data: string | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await client.from('configurations').select('value').eq('key', key).single();
    return { data: data?.value || null, error };
};

export const updateConfigurationValue = async (key: string, value: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('configurations').upsert({ key, value });
};

export const getChangelog = async (): Promise<{ data: ChangelogEntry[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return client.from('changelog').select('*').order('release_date', { ascending: false });
};
