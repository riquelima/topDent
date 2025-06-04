
// services/supabaseService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
    Patient, 
    Appointment, 
    BloodPressureReading, 
    SupabaseTreatmentPlanData, 
    TreatmentPlanWithPatientInfo,
    SupabaseAnamnesisData, 
    SupabaseBloodPressureReading 
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

  const { data, error: supabaseError } = await client.from('patients').delete().eq('cpf', cpf).select();

  if (supabaseError) {
    console.error(`[SupabaseService] Error deleting patient CPF ${cpf}:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
  } else {
    if (data && data.length > 0) {
        console.log(`[SupabaseService] Supabase confirmed deletion of ${data.length} record(s).`);
    } else if (data && data.length === 0) {
        console.warn(`[SupabaseService] Supabase reported 0 records deleted for CPF ${cpf}.`);
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
    if (supabaseError.code === 'PGRST116' || supabaseError.message.includes('JSON object requested, multiple (or no) rows returned')) {
        console.log(`Patient with CPF ${cpf} not found or multiple results where single expected.`);
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
      file_names: planData.file_names ? planData.file_names.trim() : null,
      file_url: planData.file_url,
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
  
  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .select('id, created_at, patient_cpf, description, file_names, file_url, dentist_signature, prescribed_medication, payments') 
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

  const updatePayload: { [key: string]: any } = {
      updated_at: new Date().toISOString(),
  };

  if (planData.description !== undefined) updatePayload.description = planData.description;
  if (planData.file_names !== undefined) updatePayload.file_names = planData.file_names ? planData.file_names.trim() : null;
  if (planData.file_url !== undefined) updatePayload.file_url = planData.file_url;
  if (planData.dentist_signature !== undefined) updatePayload.dentist_signature = planData.dentist_signature ? planData.dentist_signature.trim() : null;
  
  if (planData.prescribed_medication !== undefined) updatePayload.prescribed_medication = planData.prescribed_medication ? planData.prescribed_medication.trim() : null;
  if (planData.payments !== undefined) updatePayload.payments = planData.payments && planData.payments.length > 0 ? planData.payments : null;


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

  const { data, error: supabaseError } = await client
    .from('treatment_plans')
    .select('id, created_at, patient_cpf, description, file_names, file_url, dentist_signature, prescribed_medication, payments') 
    .eq('patient_cpf', patientCpf)
    .order('created_at', { ascending: false });

  if (supabaseError) {
    console.error(`Error fetching treatment plans for CPF ${patientCpf} from Supabase:`, supabaseError.message, 'Details:', JSON.stringify(supabaseError, null, 2));
    return { data: null, error: supabaseError };
  }
  return { data: data as SupabaseTreatmentPlanData[] | null, error: null };
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
    const patientsArray = item.patients as Array<{ full_name: string; cpf: string; }> | { full_name: string; cpf: string; } | null | undefined;
    let patientFullName: string | null = null;

    if (Array.isArray(patientsArray) && patientsArray.length > 0) {
      const patientRecord = patientsArray[0]; 
      if (patientRecord && typeof patientRecord.full_name === 'string') {
        patientFullName = patientRecord.full_name;
      }
    } else if (patientsArray && !Array.isArray(patientsArray) && typeof (patientsArray as { full_name: string }).full_name === 'string') {
      patientFullName = (patientsArray as { full_name: string }).full_name;
    }
    
    const { patients, ...planFields } = item;

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
    dentist_id: appointmentData.dentist_id || null, // Novo campo
    dentist_name: appointmentData.dentist_name || null, // Novo campo
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(),
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

  // Omit patient_cpf and patient_name from direct update payload as they are usually for linking, not direct edit here.
  // dentist_id and dentist_name CAN be updated.
  const { patient_cpf, patient_name, ...editablePayload } = appointmentData;
  const updatePayload: Record<string, any> = { ...editablePayload, updated_at: new Date().toISOString() };

  if (appointmentData.dentist_id !== undefined) updatePayload.dentist_id = appointmentData.dentist_id || null;
  if (appointmentData.dentist_name !== undefined) updatePayload.dentist_name = appointmentData.dentist_name || null;


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
  
  // Assuming SELECT * will get the new dentist_id and dentist_name columns
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
