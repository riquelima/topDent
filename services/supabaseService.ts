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
    ChatMessage
} from '../types'; 

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

  const { cpf, fullName, dob, guardian, rg, phone, addressStreet, addressNumber, addressDistrict, emergencyContactName, emergencyContactPhone, payment_type, health_plan_code } = patientData;
  
  const dataToInsert = {
    created_at: new Date().toISOString(), 
    cpf,
    full_name: fullName,
    dob, 
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

  const { data, error: supabaseError } = await client.from('patients').insert([dataToInsert]).select();
  if (supabaseError) {
    console.error('Error adding patient to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data, error: supabaseError };
};

export const updatePatient = async (cpf: string, patientData: Partial<Omit<Patient, 'id' | 'cpf'>>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

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
  if (patientData.payment_type !== undefined) dataToUpdate.payment_type = patientData.payment_type || null;
  if (patientData.health_plan_code !== undefined) dataToUpdate.health_plan_code = patientData.health_plan_code || null;
  dataToUpdate.updated_at = new Date().toISOString(); 

  if (Object.keys(dataToUpdate).length === 1 && dataToUpdate.updated_at) { 
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
    payment_type: p.payment_type,
    health_plan_code: p.health_plan_code,
    created_at: p.created_at, 
    updated_at: p.updated_at, 
  })) : [];
  return { data: transformedData, error: null };
};

export const getPatientByCpf = async (cpf: string): Promise<{ data: Patient | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client.from('patients').select('*').eq('cpf', cpf).single();

  if (supabaseError) {
    if (supabaseError.code === 'PGRST116') { 
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
    payment_type: data.payment_type,
    health_plan_code: data.health_plan_code,
    created_at: data.created_at, 
    updated_at: data.updated_at, 
  } : null;
  return { data: transformedData, error: null };
};

// --- ANAMNESIS FORM FUNCTIONS ---
export const addAnamnesisForm = async (anamnesisData: Omit<SupabaseAnamnesisData, 'id' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const dataToInsert = {
      ...anamnesisData,
      created_at: new Date().toISOString(), 
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

export const addBloodPressureReadings = async (bpReadings: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[]) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const insertData = bpReadings.map(bp => ({
    ...bp,
    created_at: new Date().toISOString(), 
  }));

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

// Helper to transform a DB record into a UI object with a 'files' array
const transformPlanFiles = (dbPlan: any): any => {
    if (!dbPlan) return dbPlan;

    // Destructure `file_url` (could be JSON string or single URL) and `file_names` (legacy)
    const { file_url, file_names, ...rest } = dbPlan;
    let files: { name: string; url: string; }[] | null = null;

    if (file_url && typeof file_url === 'string') {
        // Case 1: It's a JSON array string
        if (file_url.trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(file_url);
                if (Array.isArray(parsed)) {
                    files = parsed;
                }
            } catch (e) {
                console.warn("Failed to parse file_url that looked like JSON:", file_url, e);
                // The string starts with '[' but is not valid JSON. Treat as error.
                files = null;
            }
        }
        // Case 2: It's a single URL string (legacy data)
        else {
            const name = file_names || file_url.substring(file_url.lastIndexOf('/') + 1);
            files = [{ name: name, url: file_url }];
        }
    } else if (dbPlan.files && Array.isArray(dbPlan.files)) {
        // For future compatibility if the column is ever named `files` and is an array
        return dbPlan;
    }
    
    // Ensure we return the 'files' property, even if it's null
    return { ...rest, files };
};


export const addTreatmentPlan = async (planData: Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const dataToInsert = {
      patient_cpf: planData.patient_cpf,
      description: planData.description,
      // Stringify the files array and save to file_url column
      file_url: planData.files && planData.files.length > 0 ? JSON.stringify(planData.files) : null,
      dentist_signature: planData.dentist_signature ? planData.dentist_signature.trim() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), 
      prescribed_medication: planData.prescribed_medication ? planData.prescribed_medication.trim() : null,
      payments: planData.payments && planData.payments.length > 0 ? planData.payments : null,
  };
  
  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .insert([dataToInsert])
    .select() 
    .single();

  if (supabaseError) {
    console.error('Error adding treatment plan to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: transformPlanFiles(data), error: supabaseError };
};

export const getTreatmentPlanById = async (planId: string): Promise<{ data: SupabaseTreatmentPlanData | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const { data: dbData, error: supabaseError } = await client
    .from('treatment_plans')
    .select('id, created_at, patient_cpf, description, file_url, file_names, dentist_signature, prescribed_medication, payments') 
    .eq('id', planId)
    .single();

  if (supabaseError) {
    console.error(`Error fetching treatment plan by ID ${planId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }

  return { data: transformPlanFiles(dbData), error: null };
};

export const updateTreatmentPlan = async (planId: string, planData: Partial<Omit<SupabaseTreatmentPlanData, 'id' | 'created_at' | 'patient_cpf'>>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const updatePayload: { [key: string]: any } = {
      updated_at: new Date().toISOString(),
  };

  if (planData.description !== undefined) updatePayload.description = planData.description;
  if (planData.dentist_signature !== undefined) updatePayload.dentist_signature = planData.dentist_signature ? planData.dentist_signature.trim() : null;
  if (planData.prescribed_medication !== undefined) updatePayload.prescribed_medication = planData.prescribed_medication ? planData.prescribed_medication.trim() : null;
  if (planData.payments !== undefined) updatePayload.payments = planData.payments && planData.payments.length > 0 ? planData.payments : null;
  
  if (planData.files !== undefined) {
    // Stringify files array and save to file_url
    updatePayload.file_url = planData.files && planData.files.length > 0 ? JSON.stringify(planData.files) : null;
  }

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .update(updatePayload)
    .eq('id', planId)
    .select() 
    .single();

  if (supabaseError) {
    console.error(`Error updating treatment plan ID ${planId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: transformPlanFiles(data), error: supabaseError };
};

export const deleteTreatmentPlan = async (planId: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };

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

  const { data: dbData, error: supabaseError } = await client
    .from('treatment_plans')
    .select('id, created_at, patient_cpf, description, file_url, file_names, dentist_signature, prescribed_medication, payments') 
    .eq('patient_cpf', patientCpf)
    .order('created_at', { ascending: false });

  if (supabaseError) {
    console.error(`Error fetching treatment plans for CPF ${patientCpf} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  
  const transformedData = dbData ? dbData.map(transformPlanFiles) : [];
  return { data: transformedData, error: null };
};

export const getAllTreatmentPlans = async (): Promise<{ data: TreatmentPlanWithPatientInfo[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .select(`
      id, created_at, patient_cpf, description, file_url, file_names, dentist_signature, prescribed_medication, payments,
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

  const transformedData: TreatmentPlanWithPatientInfo[] = data ? data.map(item => {
    const patientsField = item.patients; 
    let patientFullName: string | null = null;
    if (patientsField && typeof patientsField === 'object' && !Array.isArray(patientsField)) {
      patientFullName = (patientsField as { full_name: string })?.full_name || null;
    }
    const { patients, ...planFields } = item;
    const transformedPlan = transformPlanFiles(planFields);
    return {
      ...transformedPlan, 
      patient_full_name: patientFullName || 'Paciente Desconhecido',
    } as TreatmentPlanWithPatientInfo; 
  }) : [];
  
  return { data: transformedData, error: null };
};

// --- APPOINTMENT FUNCTIONS ---
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
    dentist_id: appointmentData.dentist_id || null, 
    dentist_name: appointmentData.dentist_name || null, 
    return_date: appointmentData.return_date || null,
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(),
  };

  const { data, error: supabaseError } = await client.from('appointments').insert([dataToInsert]).select().single();
  if (supabaseError) {
    console.error('Error adding appointment to Supabase:', supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError }; 
};

export const getAppointmentById = async (appointmentId: string): Promise<{ data: Appointment | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (supabaseError) {
    if (supabaseError.code === 'PGRST116') { 
        console.log(`Appointment with ID ${appointmentId} not found.`);
        return { data: null, error: null }; 
    }
    console.error(`Error fetching appointment by ID ${appointmentId} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  
  return { data: data as Appointment | null, error: null };
};

export const updateAppointment = async (appointmentId: string, appointmentData: Partial<SupabaseAppointmentData>): Promise<{ data: Appointment | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const updatePayload: Record<string, any> = { ...appointmentData, updated_at: new Date().toISOString() };
  
  if (appointmentData.dentist_id !== undefined) updatePayload.dentist_id = appointmentData.dentist_id || null;
  if (appointmentData.dentist_name !== undefined) updatePayload.dentist_name = appointmentData.dentist_name || null;
  if (appointmentData.notes !== undefined) updatePayload.notes = appointmentData.notes || null;
  if (appointmentData.return_date !== undefined) updatePayload.return_date = appointmentData.return_date || null;

  const { data, error: supabaseError } = await client
    .from('appointments')
    .update(updatePayload) 
    .eq('id', appointmentId)
    .select()
    .single();
  
  if (supabaseError) {
    console.error(`Error updating appointment ${appointmentId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError };
};

export const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']): Promise<{ data: Appointment | null, error: any }> => {
  return updateAppointment(appointmentId, { status });
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

export const getAppointmentsByDate = async (date: string, dentistId?: string, dentistUsername?: string): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  let query = client.from('appointments').select('*').eq('appointment_date', date);
  if (dentistId) {
    query = query.or(`dentist_id.eq.${dentistId}${dentistUsername ? `,dentist_id.eq.${dentistUsername}` : ''}`);
  }
  query = query.order('appointment_time', { ascending: true });
  const { data, error: supabaseError } = await query;

  if (supabaseError) {
    console.error(`Error fetching appointments for date ${date}:`, supabaseError.message);
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};

export const getUpcomingAppointments = async (limit: number = 5): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const today = new Date().toISOString().split('T')[0];
  const { data, error: supabaseError } = await client
    .from('appointments')
    .select('*')
    .gte('appointment_date', today)
    .in('status', ['Scheduled', 'Confirmed'])
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(limit);
  if (supabaseError) {
    console.error('Error fetching upcoming appointments:', supabaseError.message);
  }
  return { data, error: supabaseError };
};

export const getAppointmentsByDateRangeForDentist = async (startDate: string, endDate: string, dentistId?: string, dentistUsername?: string): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  let query = client.from('appointments').select('*').gte('appointment_date', startDate).lte('appointment_date', endDate);
  if (dentistId) {
    query = query.or(`dentist_id.eq.${dentistId}${dentistUsername ? `,dentist_id.eq.${dentistUsername}` : ''}`);
  }
  query = query.order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true });
  const { data, error: supabaseError } = await query;

  if (supabaseError) {
    console.error(`Error fetching appointments for date range ${startDate}-${endDate}:`, supabaseError.message);
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};

export const getAllAppointmentsForDentist = async (dentistId: string, limit: number = 50, excludeStatus?: Appointment['status'], dentistUsername?: string): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  let query = client.from('appointments').select('*');
  query = query.or(`dentist_id.eq.${dentistId}${dentistUsername ? `,dentist_id.eq.${dentistUsername}` : ''}`);
  if (excludeStatus) {
    query = query.neq('status', excludeStatus); 
  }
  query = query.order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false }).limit(limit);
  const { data, error: supabaseError } = await query;
  if (supabaseError) {
    console.error(`Error fetching appointments for dentist ${dentistId}:`, supabaseError.message);
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
    console.error(`Error fetching appointments for patient ${patientCpf}:`, supabaseError.message);
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};

// --- DENTIST FUNCTIONS ---
export const getDentists = async (): Promise<{ data: Dentist[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('dentists').select('*').order('full_name');
  return { data, error };
};

export const getDentistByUsername = async (username: string): Promise<{ data: Dentist | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('dentists').select('*').eq('username', username).single();
  return { data, error };
};

export const addDentist = async (dentist: Omit<Dentist, 'id' | 'created_at' | 'updated_at' | 'show_changelog'>): Promise<{ data: Dentist | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('dentists').insert(dentist).select().single();
  return { data, error };
};

export const updateDentist = async (id: string, dentist: Partial<Omit<Dentist, 'id' | 'created_at' | 'updated_at'>>): Promise<{ data: Dentist | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('dentists').update(dentist).eq('id', id).select().single();
  return { data, error };
};

export const updateUserPreferences = async (userId: string, preferences: { show_changelog: boolean }): Promise<{ data: Dentist | null, error: any }> => {
  return updateDentist(userId, preferences);
};

export const deleteDentist = async (id: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client.from('dentists').delete().eq('id', id);
  return { error };
};

export const getAdminUserId = async (): Promise<{ data: Dentist | null, error: any }> => {
  return getDentistByUsername('admin');
};

// --- REMINDER FUNCTIONS ---
export const getReminders = async (): Promise<{ data: Reminder[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('reminders').select('*').order('created_at', { ascending: false });
  return { data, error };
};

export const getActiveReminders = async (): Promise<{ data: Reminder[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('reminders').select('*').eq('is_active', true).order('created_at', { ascending: false });
  return { data, error };
};

export const addReminder = async (reminder: Omit<Reminder, 'id' | 'created_at' | 'is_active'>): Promise<{ data: Reminder | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('reminders').insert(reminder).select().single();
  return { data, error };
};

export const updateReminder = async (id: string, reminder: Partial<Omit<Reminder, 'id' | 'created_at'>>): Promise<{ data: Reminder | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('reminders').update(reminder).eq('id', id).select().single();
  return { data, error };
};

export const updateReminderIsActive = async (id: string, isActive: boolean): Promise<{ data: Reminder | null, error: any }> => {
  return updateReminder(id, { is_active: isActive });
};

export const deleteReminderById = async (id: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client.from('reminders').delete().eq('id', id);
  return { error };
};

// --- PROCEDURE FUNCTIONS ---
export const getProcedures = async (includeInactive = false): Promise<{ data: Procedure[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  let query = client.from('procedures').select('*');
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query.order('name', { ascending: true });
  return { data, error };
};

export const addProcedure = async (procedure: { name: string }): Promise<{ data: Procedure | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('procedures').insert(procedure).select().single();
  return { data, error };
};

export const updateProcedure = async (id: string, procedure: Partial<{ name: string, is_active: boolean }>): Promise<{ data: Procedure | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('procedures').update(procedure).eq('id', id).select().single();
  return { data, error };
};

export const deleteProcedure = async (id: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client.from('procedures').delete().eq('id', id);
  return { error };
};

// --- CONSULTATION HISTORY FUNCTIONS ---
export const getConsultationHistory = async (filters: { patientSearchTerm?: string, dentistId?: string, startDate?: string, endDate?: string }): Promise<{ data: ConsultationHistoryEntry[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  let query = client.from('consultation_history').select('*');
  if (filters.patientSearchTerm) {
    query = query.ilike('patient_name', `%${filters.patientSearchTerm}%`);
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
  const { data, error } = await query.order('completion_timestamp', { ascending: false });
  return { data, error };
};

export const addConsultationHistoryEntry = async (entry: Omit<ConsultationHistoryEntry, 'id' | 'completion_timestamp' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('consultation_history').insert({ ...entry, completion_timestamp: new Date().toISOString() }).select().single();
  return { data, error };
};

// --- NOTIFICATION FUNCTIONS ---
export const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('notifications').insert(notification).select().single();
  return { data, error };
};

export const getUnreadNotificationsForDentist = async (dentistId: string): Promise<{ data: Notification[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('notifications').select('*').eq('dentist_id', dentistId).eq('is_read', false).order('created_at', { ascending: false });
  return { data, error };
};

export const markNotificationsAsRead = async (notificationIds: string[]): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client.from('notifications').update({ is_read: true }).in('id', notificationIds);
  return { error };
};

export const subscribeToNotificationsForDentist = (dentistId: string, callback: (payload: Notification) => void): RealtimeChannel | null => {
  const client = getSupabaseClient();
  if (!client) return null;
  const channel = client.channel(`dentist-notifications-${dentistId}`);
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `dentist_id=eq.${dentistId}` }, (payload) => {
    callback(payload.new as Notification);
  }).subscribe();
  return channel;
};

// --- CHAT FUNCTIONS ---
export const getMessagesBetweenUsers = async (userId1: string, userId2: string): Promise<{ data: ChatMessage[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('chat_messages')
    .select('*')
    .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
    .order('created_at', { ascending: true });
  if (error) {
    console.error("Error fetching chat messages", { message: error.message, details: error.details, code: error.code });
  }
  return { data, error };
};

export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('chat_messages').insert(message).select().single();
  if (error) {
    console.error("Error sending message:", { message: error.message, details: error.details, code: error.code });
  }
  return { data, error };
};

export const subscribeToMessages = (userId: string, callback: (payload: ChatMessage) => void): RealtimeChannel | null => {
  const client = getSupabaseClient();
  if (!client) return null;
  const channel = client.channel(`chat-${userId}`);
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `recipient_id=eq.${userId}` }, (payload) => {
    callback(payload.new as ChatMessage);
  }).subscribe();
  return channel;
};

// --- RETURNS & CONFIGS FUNCTIONS ---
export const getUpcomingReturns = async (): Promise<{ data: AppointmentReturnInfo[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await client.from('appointments').select(`id, return_date, patient_cpf, patient_name, patients ( phone )`).not('return_date', 'is', null).gte('return_date', today).order('return_date', { ascending: true });
  if (error) return { data: null, error };
  const transformedData: AppointmentReturnInfo[] = data.map((item: any) => ({
    id: item.id,
    return_date: item.return_date,
    patient_cpf: item.patient_cpf,
    patient_name: item.patient_name,
    patient_phone: item.patients?.phone || '',
  }));
  return { data: transformedData, error: null };
};

export const getConfigurationValue = async (key: string): Promise<{ data: string | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('configurations').select('value').eq('key', key).single();
  return { data: data?.value || null, error };
};

export const updateConfigurationValue = async (key: string, value: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client.from('configurations').upsert({ key, value });
  return { error };
};

export const clearAppointmentReturnDate = async (appointmentId: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client.from('appointments').update({ return_date: null }).eq('id', appointmentId);
  return { error };
};

// --- CHANGELOG ---
export const getChangelog = async (): Promise<{ data: ChangelogEntry[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('changelog').select('*').order('release_date', { ascending: false });
  return { data, error };
};