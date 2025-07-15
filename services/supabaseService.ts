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
    PaymentInput,
    DentistUser,
    DentistNote
} from '../types'; 

// The recursive type definition for Json can cause TypeScript to hit its recursion limit
// when used with the Supabase client's generics. Using 'any' directly avoids this.
export type Json = any;

export type Database = {
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
        }
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
          last_appointment_date: string | null // Added
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
          last_appointment_date?: string | null // Added
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
          last_appointment_date?: string | null // Added
          created_at?: string
          updated_at?: string | null
        }
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
        }
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
        }
      },
      treatment_plans: {
        Row: {
            id: string;
            created_at: string;
            patient_cpf: string;
            description: string;
            procedures_performed: string | null;
            files: any | null;
            dentist_signature: string | null;
            prescribed_medication: string | null;
            payments: any | null;
            updated_at?: string;
        },
        Insert: {
            id?: string;
            created_at?: string;
            patient_cpf: string;
            description: string;
            procedures_performed?: string | null;
            files?: any | null;
            dentist_signature?: string | null;
            prescribed_medication?: string | null;
            payments?: any | null;
            updated_at?: string;
        },
        Update: {
            id?: string;
            created_at?: string;
            patient_cpf?: string;
            description?: string;
            procedures_performed?: string | null;
            files?: any | null;
            dentist_signature?: string | null;
            prescribed_medication?: string | null;
            payments?: any | null;
            updated_at?: string;
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
      },
      configurations: {
        Row: { key: string; value: string; created_at: string },
        Insert: { key: string; value: string; created_at?: string },
        Update: { 
            key?: string; 
            value?: string; 
            created_at?: string 
        }
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
        }
      },
      dentist_notes: {
        Row: {
          id: string;
          dentist_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        },
        Insert: {
          id?: string;
          dentist_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        },
        Update: {
          id?: string;
          dentist_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        }
      }
    };
    Views: {};
    Functions: {
      mark_messages_as_read_by_recipient: {
        Args: {
          message_ids: string[];
          reader_id_param: string;
        };
        Returns: undefined;
      };
    };
    Enums: {};
    CompositeTypes: {};
  }
};


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

const transformPatientData = (p: Database['public']['Tables']['patients']['Row']): Patient => ({
    id: p.cpf, 
    cpf: p.cpf,
    fullName: p.full_name,
    dob: p.dob,
    guardian: p.guardian ?? undefined,
    rg: p.rg ?? '',
    phone: p.phone ?? '',
    addressStreet: p.address_street ?? '',
    addressNumber: p.address_number ?? '',
    addressDistrict: p.address_district ?? '',
    emergencyContactName: p.emergency_contact_name ?? '',
    emergencyContactPhone: p.emergency_contact_phone ?? '',
    payment_type: p.payment_type,
    health_plan_code: p.health_plan_code,
    last_appointment_date: p.last_appointment_date, // Added
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

  const { data, error: supabaseError } = await (client.from('patients') as any).insert(dataToInsert).select();
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
  if (patientData.last_appointment_date !== undefined) dataToUpdate.last_appointment_date = patientData.last_appointment_date || null;
  dataToUpdate.updated_at = new Date().toISOString(); 

  if (Object.keys(dataToUpdate).length === 1 && dataToUpdate.updated_at) { 
    return { data: null, error: { message: "No data provided for update." } };
  }

  const { data, error: supabaseError } = await (client
    .from('patients') as any)
    .update(dataToUpdate)
    .eq('cpf', oldCpf)
    .select();
  
  if (supabaseError) {
    console.error(`Error updating patient CPF ${oldCpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const updatePatientLastAppointment = async (cpf: string, appointmentDate: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

    return await (client
        .from('patients') as any)
        .update({ last_appointment_date: appointmentDate, updated_at: new Date().toISOString() })
        .eq('cpf', cpf);
};


export const deletePatientByCpf = async (cpf: string): Promise<{ data: any[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await (client.from('patients') as any).delete().eq('cpf', cpf).select();

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

  const { data, error: supabaseError } = await (client.from('patients') as any).select('*').order('full_name', { ascending: true });
  
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
  const { data, error } = await (client.from('patients') as any).select('*').eq('cpf', cpf).single();
  if (error) return { data: null, error };
  return { data: transformPatientData(data), error: null };
};

// --- ANAMNESIS & BLOOD PRESSURE FUNCTIONS ---
export const addAnamnesisForm = async (anamnesisData: Omit<SupabaseAnamnesisData, 'id' | 'created_at'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('anamnesis_forms') as any).insert(anamnesisData).select();
};

export const addBloodPressureReadings = async (readings: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[]) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('blood_pressure_readings') as any).insert(readings).select();
};

export const getAnamnesisFormByPatientCpf = async (patientCpf: string): Promise<{ data: SupabaseAnamnesisData | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await (client.from('anamnesis_forms') as any).select('*').eq('patient_cpf', patientCpf).order('created_at', { ascending: false }).limit(1).single();
    return { data, error };
};

export const getBloodPressureReadingsByPatientCpf = async (patientCpf: string): Promise<{ data: BloodPressureReading[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await (client.from('blood_pressure_readings') as any).select('id, created_at, reading_date, reading_value').eq('patient_cpf', patientCpf).order('reading_date', { ascending: false });
    const transformed = data?.map(d => ({ ...d, date: d.reading_date, value: d.reading_value })) || [];
    return { data: transformed, error };
};

// --- TREATMENT PLAN FUNCTIONS ---
export const addTreatmentPlan = async (planData: Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('treatment_plans') as any).insert(planData).select();
};

export const updateTreatmentPlan = async (planId: string, planData: Partial<SupabaseTreatmentPlanData>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const updatePayload = { ...planData, updated_at: new Date().toISOString() };
    return (client.from('treatment_plans') as any).update(updatePayload).eq('id', planId).select().single();
};

export const getTreatmentPlanById = async (planId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('treatment_plans') as any).select('*').eq('id', planId).single();
};

export const deleteTreatmentPlan = async (planId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('treatment_plans') as any).delete().eq('id', planId);
};

export const getTreatmentPlansByPatientCpf = async (patientCpf: string): Promise<{ data: SupabaseTreatmentPlanData[] | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await (client.from('treatment_plans') as any).select('*').eq('patient_cpf', patientCpf).order('created_at', { ascending: false });
    return { data, error };
};

export const getAllTreatmentPlans = async (): Promise<{ data: TreatmentPlanWithPatientInfo[] | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

    const { data, error } = await (client
        .from('treatment_plans') as any)
        .select(`
            *,
            patient:patients ( full_name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching all treatment plans:", error);
        return { data: null, error };
    }

    const transformedData = data?.map(plan => {
        const { patient, ...rest } = plan;
        return {
            ...rest,
            patient_full_name: (patient as any)?.full_name || 'Paciente não encontrado'
        };
    }) || [];
    
    return { data: transformedData, error: null };
};

// --- APPOINTMENT FUNCTIONS ---
export type SupabaseAppointmentData = Database['public']['Tables']['appointments']['Insert'];

export const getAppointments = async (): Promise<{ data: Appointment[] | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).select('*').order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });
};

export const getAppointmentById = async (id: string): Promise<{ data: Appointment | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).select('*').eq('id', id).single();
};

export const addAppointment = async (appointmentData: SupabaseAppointmentData) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).insert(appointmentData).select().single();
};

export const updateAppointment = async (id: string, appointmentData: Partial<SupabaseAppointmentData>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).update({ ...appointmentData, updated_at: new Date().toISOString() }).eq('id', id).select().single();
};

export const deleteAppointment = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).delete().eq('id', id);
};

export const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
};

export const getAppointmentsByPatientCpf = async (cpf: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).select('*').eq('patient_cpf', cpf).order('appointment_date', { ascending: false });
};

export const getAppointmentsByDate = async (date: string, dentistId: string, dentistUsername: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    let query = (client.from('appointments') as any).select('*').eq('appointment_date', date);
    if (dentistId) {
       query = query.or(`dentist_id.eq.${dentistId},dentist_name.eq.${dentistUsername}`);
    }
    return query.order('appointment_time', { ascending: true });
};

export const getAppointmentsByDateRangeForDentist = async (startDate: string, endDate: string, dentistId: string, dentistUsername: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    let query = (client.from('appointments') as any).select('*').gte('appointment_date', startDate).lte('appointment_date', endDate);
    if (dentistId) {
      query = query.or(`dentist_id.eq.${dentistId},dentist_name.eq.${dentistUsername}`);
    }
    return query.order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true });
};

export const getAllAppointmentsForDentist = async (dentistId: string, limit: number, page: number, dentistUsername: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = (client.from('appointments') as any).select('*').range(from, to);
    if (dentistId) {
      query = query.or(`dentist_id.eq.${dentistId},dentist_name.eq.${dentistUsername}`);
    }
    return query.order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false });
};

export const getUpcomingReturns = async (): Promise<{ data: AppointmentReturnInfo[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await (client
        .from('appointments') as any)
        .select('id, return_date, patient_cpf, patient_name, dentist_id, dentist_name')
        .gte('return_date', today)
        .not('return_date', 'is', null)
        .order('return_date', { ascending: true });
    
    if (error) return { data: null, error };
    
    const transformedData = data.map(d => ({...d, patient_phone: 'N/A'})); // Phone not in appointments table
    
    const patientCpfs = data.map(d => d.patient_cpf).filter(cpf => cpf) as string[];
    if (patientCpfs.length > 0) {
        const { data: patientsData, error: patientsError } = await (client.from('patients') as any).select('cpf, phone').in('cpf', patientCpfs);
        if (!patientsError && patientsData) {
            const phoneMap = new Map(patientsData.map(p => [p.cpf, p.phone]));
            transformedData.forEach(d => {
                if (d.patient_cpf) {
                    d.patient_phone = phoneMap.get(d.patient_cpf) || 'N/A';
                }
            });
        }
    }
    return { data: transformedData, error: null };
};

export const clearAppointmentReturnDate = async (appointmentId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('appointments') as any).update({ return_date: null }).eq('id', appointmentId);
};

// --- DENTIST FUNCTIONS ---
export const getDentists = async (): Promise<{ data: Dentist[] | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentists') as any).select('*').order('full_name', { ascending: true });
};

export const getDentistByUsername = async (username: string): Promise<{ data: Dentist | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentists') as any).select('*').eq('username', username).single();
};

export const addDentist = async (dentistData: Omit<Dentist, 'id' | 'created_at' | 'updated_at'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentists') as any).insert(dentistData).select().single();
};

export const updateDentist = async (id: string, dentistData: Partial<Omit<Dentist, 'id' | 'created_at'>>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentists') as any).update({ ...dentistData, updated_at: new Date().toISOString() }).eq('id', id);
};

export const deleteDentist = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentists') as any).delete().eq('id', id);
};

export const getAdminUserId = async (): Promise<{ data: Dentist | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentists') as any).select('id, full_name, username').eq('username', 'admin').single();
};

// --- REMINDER FUNCTIONS ---
export const getReminders = async (): Promise<{ data: Reminder[] | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('reminders') as any).select('*').order('created_at', { ascending: false });
};

export const getActiveReminders = async (): Promise<{ data: Reminder[] | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('reminders') as any).select('*').eq('is_active', true).order('created_at', { ascending: false });
};

export const addReminder = async (reminderData: Omit<Reminder, 'id' | 'created_at' | 'is_active'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('reminders') as any).insert({ ...reminderData, is_active: true });
};

export const updateReminder = async (id: string, reminderData: Partial<Omit<Reminder, 'id' | 'created_at'>>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('reminders') as any).update(reminderData).eq('id', id);
};

export const updateReminderIsActive = async (id: string, is_active: boolean) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('reminders') as any).update({ is_active }).eq('id', id);
};

export const deleteReminderById = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('reminders') as any).delete().eq('id', id);
};

// --- PROCEDURE FUNCTIONS ---
export const getProcedures = async (includeInactive = false): Promise<{ data: Procedure[] | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    let query = (client.from('procedures') as any).select('*');
    if (!includeInactive) {
        query = query.eq('is_active', true);
    }
    return query.order('name', { ascending: true });
};

export const addProcedure = async (procedureData: Pick<Procedure, 'name'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('procedures') as any).insert(procedureData);
};

export const updateProcedure = async (id: string, procedureData: Partial<Pick<Procedure, 'name' | 'is_active'>>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('procedures') as any).update({ ...procedureData, updated_at: new Date().toISOString() }).eq('id', id);
};

export const deleteProcedure = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('procedures') as any).delete().eq('id', id);
};

// --- CONSULTATION HISTORY FUNCTIONS ---
export const addConsultationHistoryEntry = async (entry: Omit<ConsultationHistoryEntry, 'id' | 'created_at' | 'completion_timestamp'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('consultation_history') as any).insert({ ...entry, completion_timestamp: new Date().toISOString() });
};

export const getConsultationHistory = async (filters: { patientSearchTerm?: string; dentistId?: string; startDate?: string; endDate?: string }) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    let query = (client.from('consultation_history') as any).select('*');
    if (filters.patientSearchTerm) {
        query = query.or(`patient_name.ilike.%${filters.patientSearchTerm}%,patient_cpf.eq.${filters.patientSearchTerm}`);
    }
    if (filters.dentistId) {
        query = query.eq('dentist_id', filters.dentistId);
    }
    if (filters.startDate) {
        query = query.gte('consultation_date', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('consultation_date', filters.endDate);
    }
    return query.order('completion_timestamp', { ascending: false });
};

// --- CONFIGURATION FUNCTIONS ---
export const getConfigurationValue = async (key: string): Promise<{ data: string | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    const { data, error } = await (client.from('configurations') as any).select('value').eq('key', key).single();
    if (error) return { data: null, error };
    return { data: data?.value || null, error: null };
};

export const updateConfigurationValue = async (key: string, value: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('configurations') as any).upsert({ key, value });
};

// --- CHANGELOG FUNCTIONS ---
export const getChangelog = async (): Promise<{ data: ChangelogEntry[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('changelog') as any).select('*').order('release_date', { ascending: false });
};

// --- NOTIFICATION FUNCTIONS ---
export const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

    const { dentist_id, message, appointment_id } = notification;

    // Call the secure RPC function instead of a direct insert to bypass RLS issues
    const { data, error } = await client.rpc('create_notification' as any, {
        p_dentist_id: dentist_id,
        p_message: message,
        p_appointment_id: appointment_id || null
    });
    
    if (error) {
        // Log detailed error for debugging
        console.error("Error calling RPC create_notification:", JSON.stringify(error, null, 2));
    }
    
    return { data, error };
};

export const getUnreadNotificationsForDentist = async (dentistId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('notifications') as any).select('*').eq('dentist_id', dentistId).eq('is_read', false).order('created_at', { ascending: false });
};

export const markNotificationsAsRead = async (notificationIds: string[]) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('notifications') as any).update({ is_read: true }).in('id', notificationIds);
};

export const subscribeToNotificationsForDentist = (dentistId: string, callback: (payload: Notification) => void): RealtimeChannel | null => {
    const client = getSupabaseClient();
    if (!client) return null;
    return (client as any)
        .channel(`dentist-notifications-${dentistId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `dentist_id=eq.${dentistId}` }, (payload) => {
            callback(payload.new as Notification);
        })
        .subscribe();
};

// --- CHAT FUNCTIONS ---
export const getMessagesBetweenUsers = async (userId1: string, userId2: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client
      .from('chat_messages') as any)
      .select('*')
      .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .order('created_at', { ascending: true });
};

export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'created_at' | 'is_read'>) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    if (!message.sender_id || !message.recipient_id) {
        return { data: null, error: { message: "Sender and Recipient are required." } };
    }
    return (client.from('chat_messages') as any).insert(message).select().single();
};

export const markMessagesAsRead = async (messageIds: string[], readerId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    if (!readerId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return { data: null, error: { message: "Invalid parameters for marking messages as read." }};
    }

    const { data, error } = await client.rpc('mark_messages_as_read_by_recipient', {
        message_ids: messageIds,
        reader_id_param: readerId
    });

    if (error) {
        console.error('Error calling RPC mark_messages_as_read_by_recipient:', JSON.stringify(error, null, 2));
    }
    
    return { data, error };
};


export const getUnreadMessages = async (recipientId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client
      .from('chat_messages') as any)
      .select('*')
      .eq('recipient_id', recipientId)
      .eq('is_read', false);
};

export const subscribeToMessages = (userId: string, callback: (payload: ChatMessage) => void): RealtimeChannel | null => {
    const client = getSupabaseClient();
    if (!client) return null;
    return (client as any)
        .channel(`public:chat_messages:recipient_id=eq.${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `recipient_id=eq.${userId}` }, (payload) => {
            callback(payload.new as ChatMessage);
        });
};

export const uploadChatFile = async (file: File, uploaderId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = `public/${uploaderId}/${Date.now()}-${sanitizedFileName}`;

    const { error: uploadError } = await client.storage
        .from('chat-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
        return { data: null, error: uploadError };
    }

    const { data: publicUrlData } = client.storage.from('chat-files').getPublicUrl(filePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
        return { data: null, error: { message: "Failed to get public URL for uploaded file." } };
    }

    return { data: { publicUrl: publicUrlData.publicUrl }, error: null };
};

// --- DENTIST NOTES FUNCTIONS ---
export const getNotesByDentist = async (dentistId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client
      .from('dentist_notes') as any)
      .select('*')
      .eq('dentist_id', dentistId)
      .order('created_at', { ascending: false });
};

export const addDentistNote = async (noteData: { dentist_id: string; content: string; }) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentist_notes') as any).insert(noteData).select().single();
};

export const updateDentistNote = async (noteId: string, content: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client
      .from('dentist_notes') as any)
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .select()
      .single();
};

export const deleteDentistNote = async (noteId: string) => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
    return (client.from('dentist_notes') as any).delete().eq('id', noteId);
};