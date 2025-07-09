// services/supabaseService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
    Notification
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

// --- Helper for Plan Transformation ---
const transformDbPlanToUiPlan = (dbPlan: any) => {
    const { file_names, file_url, ...rest } = dbPlan;
    let files: { name: string, url: string }[] = [];

    // New multi-file format: file_url contains a JSON string
    if (file_url && file_url.startsWith('[') && file_url.endsWith(']')) {
        try {
            const parsed = JSON.parse(file_url);
            if (Array.isArray(parsed)) {
                files = parsed;
            }
        } catch (e) {
            console.warn(`Could not parse file_url as JSON for plan ${dbPlan.id}. It may be a single URL.`, e);
             if (file_names && file_url) {
                files = [{ name: file_names, url: file_url }];
            }
        }
    } else if (file_names && file_url) { // Fallback for old single-file format
        files = [{ name: file_names, url: file_url }];
    }

    return { ...rest, files: files.length > 0 ? files : null };
};


// --- PATIENT FUNCTIONS ---
export const addPatient = async (patientData: Omit<Patient, 'id'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { cpf, fullName, dob, guardian, rg, phone, addressStreet, addressNumber, addressDistrict, emergencyContactName, emergencyContactPhone } = patientData;
  
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
export const addTreatmentPlan = async (planData: Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const dataToInsert = {
      patient_cpf: planData.patient_cpf,
      description: planData.description,
      file_names: planData.files && planData.files.length > 0 ? planData.files[0].name : null,
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
  return { data, error: supabaseError };
};

export const getTreatmentPlanById = async (planId: string): Promise<{ data: SupabaseTreatmentPlanData | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const { data: dbData, error: supabaseError } = await client
    .from('treatment_plans')
    .select('id, created_at, patient_cpf, description, file_names, file_url, dentist_signature, prescribed_medication, payments') 
    .eq('id', planId)
    .single();

  if (supabaseError) {
    console.error(`Error fetching treatment plan by ID ${planId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }

  if (!dbData) {
    return { data: null, error: null };
  }
  
  const transformedData = transformDbPlanToUiPlan(dbData);
  return { data: transformedData, error: null };
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
    if (planData.files && planData.files.length > 0) {
        updatePayload.file_names = planData.files[0].name;
        updatePayload.file_url = JSON.stringify(planData.files);
    } else {
        updatePayload.file_names = null;
        updatePayload.file_url = null;
    }
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
  return { data, error: supabaseError };
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
    .select('id, created_at, patient_cpf, description, file_names, file_url, dentist_signature, prescribed_medication, payments') 
    .eq('patient_cpf', patientCpf)
    .order('created_at', { ascending: false });

  if (supabaseError) {
    console.error(`Error fetching treatment plans for CPF ${patientCpf} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }

  const transformedData = dbData ? dbData.map(transformDbPlanToUiPlan) : [];
  return { data: transformedData, error: null };
};

export const getAllTreatmentPlans = async (): Promise<{ data: TreatmentPlanWithPatientInfo[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .select(`
      id, created_at, patient_cpf, description, file_names, file_url, dentist_signature, prescribed_medication, payments,
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
    const planWithFiles = transformDbPlanToUiPlan(item);
    
    const patientsField = item.patients; 
    let patientFullName: string | null = null;

    if (Array.isArray(patientsField) && patientsField.length > 0) {
      patientFullName = patientsField[0]?.full_name || null;
    } else if (patientsField && typeof patientsField === 'object' && !Array.isArray(patientsField)) {
      patientFullName = (patientsField as { full_name: string })?.full_name || null;
    }
    
    const { patients, ...planFields } = planWithFiles;

    return {
      ...planFields, 
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

export const getAppointmentsByDate = async (
  date: string, 
  dentistId?: string, 
  excludeStatus?: Appointment['status'] // Kept for potential other uses, but DentistDashboard will filter client-side
): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  let query = client
    .from('appointments')
    .select('*') 
    .eq('appointment_date', date);

  if (dentistId) {
    query = query.eq('dentist_id', dentistId); 
  }
  if (excludeStatus) { // This will only exclude one status if provided.
    query = query.neq('status', excludeStatus); 
  }
  
  query = query.order('appointment_time', { ascending: true });

  const { data, error: supabaseError } = await query;

  if (supabaseError) {
    const dentistInfoString = dentistId ? `for dentist ${dentistId}` : '';
    console.error(`Error fetching appointments for date ${date} ${dentistInfoString} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};


export const getAppointmentsByDateRangeForDentist = async (
  startDate: string,
  endDate: string,
  dentistId?: string,
  excludeStatus?: Appointment['status'] // Kept for potential other uses
): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  let query = client
    .from('appointments')
    .select('*')
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate);

  if (dentistId) {
    query = query.eq('dentist_id', dentistId);
  }
  if (excludeStatus) {
    query = query.neq('status', excludeStatus); 
  }

  query = query.order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true });

  const { data, error: supabaseError } = await query;

  if (supabaseError) {
    const dentistInfoString = dentistId ? `for dentist ${dentistId}` : '';
    console.error(`Error fetching appointments for date range ${startDate}-${endDate} ${dentistInfoString}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as Appointment[] | null, error: null };
};

export const getAllAppointmentsForDentist = async (
  dentistId: string,
  limit: number = 50,
  excludeStatus?: Appointment['status'] // Kept for potential other uses
): Promise<{ data: Appointment[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  let query = client
    .from('appointments')
    .select('*')
    .eq('dentist_id', dentistId);

  if (excludeStatus) {
    query = query.neq('status', excludeStatus); 
  }
  
  query = query.order('appointment_date', { ascending: false }) 
    .order('appointment_time', { ascending: false })
    .limit(limit);

  const { data, error: supabaseError } = await query;

  if (supabaseError) {
    console.error(`Error fetching all appointments for dentist ${dentistId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
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

  const today = new Date().toISOString().split('T')[0]; 

  const { data, error: supabaseError } = await client
    .from('appointments')
    .select('*') 
    .gte('appointment_date', today) 
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
    .update({ status, updated_at: new Date().toISOString() }) 
    .eq('id', appointmentId)
    .select()
    .single();
  
  if (supabaseError) {
    console.error(`Error updating status for appointment ${appointmentId}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  }
  return { data: data as Appointment | null, error: supabaseError };
};

export const getUpcomingReturns = async (): Promise<{ data: AppointmentReturnInfo[] | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const today = new Date().toISOString().split('T')[0];

  const { data, error: supabaseError } = await client
    .from('appointments')
    .select(`
      id,
      return_date,
      patient_cpf,
      patients (
        full_name,
        phone
      )
    `)
    .not('return_date', 'is', null)
    .gte('return_date', today)
    .order('return_date', { ascending: true });

  if (supabaseError) {
    console.error('Error fetching upcoming returns:', supabaseError);
    return { data: null, error: supabaseError };
  }
  
  const transformedData: AppointmentReturnInfo[] = data.map(item => {
    const patientData = Array.isArray(item.patients) ? item.patients[0] : item.patients;
    return {
      id: item.id,
      return_date: item.return_date,
      patient_cpf: item.patient_cpf,
      patient_name: patientData?.full_name,
      patient_phone: patientData?.phone,
    };
  }).filter(item => item.patient_name && item.patient_phone);

  return { data: transformedData, error: null };
};

export const clearAppointmentReturnDate = async (appointmentId: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };

  const { error } = await client
    .from('appointments')
    .update({ return_date: null, updated_at: new Date().toISOString() })
    .eq('id', appointmentId);

  if (error) {
    console.error(`Error clearing return date for appointment ${appointmentId}:`, error);
  }
  return { error };
};


// --- DENTIST FUNCTIONS ---
export const addDentist = async (dentistData: Omit<Dentist, 'id' | 'created_at' | 'updated_at'>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const payload = { 
    ...dentistData, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString() 
  };
  
  const { data, error } = await client.from('dentists').insert([payload]).select().single();
  if (error) console.error('Error adding dentist:', error);
  return { data: data as Dentist | null, error };
};

export const getDentists = async (): Promise<{ data: Dentist[] | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('dentists').select('id, full_name, username, created_at').order('full_name', { ascending: true });
  if (error) console.error('Error fetching dentists:', error);
  return { data: data as Dentist[] | null, error };
};

export const getDentistByUsername = async (username: string): Promise<{ data: Dentist | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client.from('dentists').select('*').eq('username', username).single();
  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching dentist by username:', error);
  }
  return { data: data as Dentist | null, error: (error && error.code === 'PGRST116' ? null : error) }; 
};

export const updateDentist = async (dentistId: string, dentistData: Partial<Omit<Dentist, 'id' | 'created_at' | 'updated_at'>>) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const payload = { ...dentistData, updated_at: new Date().toISOString() };
  const { data, error } = await client.from('dentists').update(payload).eq('id', dentistId).select().single();
  if (error) console.error('Error updating dentist:', error);
  return { data: data as Dentist | null, error };
};

export const updateUserPreferences = async (dentistId: string, preferences: { show_changelog: boolean }): Promise<{ data: Dentist | null; error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

    const { data, error } = await client
        .from('dentists')
        .update(preferences)
        .eq('id', dentistId)
        .select()
        .single();
    
    if (error) {
        console.error(`Error updating preferences for dentist ${dentistId}:`, error);
    }
    return { data, error };
};

export const deleteDentist = async (dentistId: string) => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client.from('dentists').delete().eq('id', dentistId);
  if (error) console.error('Error deleting dentist:', error);
  return { error };
};

// --- REMINDER FUNCTIONS ---
export const addReminder = async (reminderData: Pick<Reminder, 'title' | 'content'>): Promise<{ data: Reminder | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client
    .from('reminders')
    .insert([{ ...reminderData, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) console.error('Error adding reminder:', error);
  return { data, error };
};

export const getReminders = async (): Promise<{ data: Reminder[] | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client
    .from('reminders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('Error fetching reminders:', error);
  return { data, error };
};

export const getActiveReminders = async (): Promise<{ data: Reminder[] | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client
    .from('reminders')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) console.error('Error fetching active reminders:', error);
  return { data, error };
};

export const updateReminder = async (id: string, updates: Partial<Pick<Reminder, 'title' | 'content'>>): Promise<{ data: Reminder | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const payload: { title?: string; content?: string; updated_at: string } = { 
      updated_at: new Date().toISOString() 
  };
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;

  const { data, error } = await client
    .from('reminders')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error updating reminder content/title:', error);
  return { data, error };
};


export const updateReminderIsActive = async (id: string, is_active: boolean): Promise<{ data: Reminder | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  const { data, error } = await client
    .from('reminders')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) console.error('Error updating reminder active status:', error);
  return { data, error };
};

export const deleteReminderById = async (id: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  const { error } = await client
    .from('reminders')
    .delete()
    .eq('id', id);
  if (error) console.error('Error deleting reminder:', error);
  return { error };
};

// --- NOTIFICATION FUNCTIONS ---
export const addNotification = async (
  notificationData: Pick<Notification, 'dentist_id' | 'message' | 'appointment_id'>
): Promise<{ data: Notification | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const payload = {
    ...notificationData,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('notifications')
    .insert([payload])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding notification:', error);
  }
  return { data: data as Notification | null, error };
};

export const getUnreadNotificationsForDentist = async (
  dentistId: string
): Promise<{ data: Notification[] | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('dentist_id', dentistId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching unread notifications for dentist ${dentistId}:`, error.message, JSON.stringify(error, null, 2));
  }
  return { data: data as Notification[] | null, error };
};

export const markNotificationsAsRead = async (
  notificationIds: string[]
): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };

  if (notificationIds.length === 0) {
    return { error: null };
  }

  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .in('id', notificationIds);
  
  if (error) {
    console.error('Error marking notifications as read:', error);
  }
  return { error };
};


// --- CUSTOM PROCEDURE FUNCTIONS ---
export const getProcedures = async (fetchInactive: boolean = false): Promise<{ data: Procedure[] | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  let query = client.from('procedures').select('*').order('name', { ascending: true });
  if (!fetchInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching procedures:', error);
  }
  return { data: data as Procedure[] | null, error };
};

export const addProcedure = async (procedureData: Pick<Procedure, 'name'>): Promise<{ data: Procedure | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const payload = { 
    name: procedureData.name, 
    is_active: true, 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await client.from('procedures').insert([payload]).select().single();
  if (error) {
    console.error('Error adding procedure:', error);
  }
  return { data: data as Procedure | null, error };
};

export const updateProcedure = async (id: string, updates: Partial<Pick<Procedure, 'name' | 'is_active'>>): Promise<{ data: Procedure | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const payload = { ...updates, updated_at: new Date().toISOString() };
  
  const { data, error } = await client.from('procedures').update(payload).eq('id', id).select().single();
  if (error) {
    console.error('Error updating procedure:', error);
  }
  return { data: data as Procedure | null, error };
};

export const deleteProcedure = async (id: string): Promise<{ error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { error: { message: "Supabase client not initialized." } };
  
  const { error } = await client.from('procedures').delete().eq('id', id);
  if (error) {
    console.error('Error deleting procedure:', error);
  }
  return { error };
};

// --- CONSULTATION HISTORY FUNCTIONS ---
export const addConsultationHistoryEntry = async (
  entryData: Omit<ConsultationHistoryEntry, 'id' | 'completion_timestamp' | 'created_at'>
): Promise<{ data: ConsultationHistoryEntry | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const payload = {
    ...entryData, // entryData now includes status from the caller
    completion_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('consultation_history')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error adding consultation history entry:', error.message, JSON.stringify(error, null, 2));
  }
  return { data: data as ConsultationHistoryEntry | null, error };
};

export const getConsultationHistory = async (filters?: {
  patientSearchTerm?: string;
  dentistId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: ConsultationHistoryEntry[] | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  let query = client
    .from('consultation_history')
    .select('*')
    .order('completion_timestamp', { ascending: false });

  if (filters?.patientSearchTerm) {
    const searchTerm = `%${filters.patientSearchTerm}%`;
    query = query.or(`patient_name.ilike.${searchTerm},patient_cpf.ilike.${searchTerm}`);
  }
  if (filters?.dentistId) {
    query = query.eq('dentist_id', filters.dentistId);
  }
  if (filters?.startDate) {
    query = query.gte('consultation_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('consultation_date', filters.endDate);
  }
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching consultation history:', error.message, JSON.stringify(error, null, 2));
  }
  return { data: data as ConsultationHistoryEntry[] | null, error };
};

// --- CONFIGURATION FUNCTIONS ---
export const getConfigurationValue = async (key: string): Promise<{ data: string | null, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };

  const { data, error } = await client
    .from('configurations')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    // Code 'PGRST116' means no rows found, which is not a critical error here.
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    console.error(`Error fetching configuration for key ${key}:`, error);
    return { data: null, error };
  }

  return { data: data?.value || null, error: null };
};

export const updateConfigurationValue = async (key: string, value: string): Promise<{ data: any, error: any }> => {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
  const { data, error } = await client
    .from('configurations')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error(`Error updating configuration for key ${key}:`, error);
  }

  return { data, error };
};

// --- CHANGELOG FUNCTIONS ---
export const getChangelog = async (): Promise<{ data: ChangelogEntry[] | null, error: any }> => {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: { message: "Supabase client not initialized." } };
  
    const { data, error } = await client
      .from('changelog')
      .select('*')
      .order('release_date', { ascending: false });
  
    if (error) {
      console.error('Error fetching changelog:', error);
    }
  
    return { data, error };
};