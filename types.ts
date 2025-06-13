
export interface Patient {
  id: string; // Should be unique, CPF can serve this role for now
  fullName: string;
  dob: string; // Expected in YYYY-MM-DD for input, but can be DD/MM/YYYY for display
  guardian?: string;
  rg: string;
  cpf: string; // Can be used as ID
  phone: string;
  addressStreet: string;
  addressNumber: string;
  addressDistrict: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  created_at?: string; // ISO timestamp string
  updated_at?: string; // ISO timestamp string
}

export interface AnamnesisQuestion {
  question: string;
  answer: 'Sim' | 'Não' | 'Não sei' | null;
  details?: string;
}

export interface DiseaseOptions {
  cardiovascular: boolean;
  respiratory: boolean;
  vascular: boolean;
  diabetes: boolean;
  hypertension: boolean;
  renal: boolean;
  neoplasms: boolean;
  hereditary: boolean;
  other: string;
}

export interface BloodPressureReading {
  id?: string; // Optional, for existing records from DB
  created_at?: string; // Optional, for existing records from DB
  date: string; // YYYY-MM-DD
  value: string;
}

// This is the shape for the UI and for what we might fetch initially
export interface AnamnesisFormUIData {
  medications_taken: 'Sim' | 'Não' | null;
  medications_details: string;
  is_smoker: 'Sim' | 'Não' | null;
  is_pregnant: 'Sim' | 'Não' | null;
  allergies_exist: 'Sim' | 'Não' | 'Não sei' | null;
  allergies_details: string;
  has_disease: 'Sim' | 'Não' | null;
  disease_cardiovascular: boolean;
  disease_respiratory: boolean;
  disease_vascular: boolean;
  disease_diabetes: boolean;
  disease_hypertension: boolean;
  disease_renal: boolean;
  disease_neoplasms: boolean;
  disease_hereditary: boolean;
  disease_other_details: string;
  surgeries_had: 'Sim' | 'Não' | null;
  surgeries_details: string;
}


export interface Appointment {
  id: string; // UUID from Supabase
  patient_cpf: string;
  patient_name?: string; // Denormalized for easier display
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  procedure: string;
  notes?: string | null;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  dentist_id?: string | null; 
  dentist_name?: string | null; 
  created_at?: string; // ISO timestamp string
  updated_at?: string; // ISO timestamp string
}

export type PaymentMethod = "Dinheiro" | "Cartão de Crédito" | "Cartão de Débito" | "PIX" | "Transferência Bancária" | "Boleto" | "Outro";

export interface PaymentInput {
  id?: string; 
  value: string; 
  payment_method: PaymentMethod | "";
  payment_date: string; // YYYY-MM-DD
}
export interface SupabaseTreatmentPlanData {
    id?: string;
    created_at?: string;
    patient_cpf: string;
    description: string;
    file_names?: string | null; 
    dentist_signature?: string | null;
    file_url?: string | null;
    prescribed_medication?: string | null;
    payments?: PaymentInput[] | null; 
}

export interface TreatmentPlanWithPatientInfo extends SupabaseTreatmentPlanData {
  patient_full_name?: string | null;
}

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

export interface SupabaseBloodPressureReading {
  id?: string; 
  created_at?: string; 
  patient_cpf: string;
  reading_date: string; // YYYY-MM-DD
  reading_value: string;
}

// New Dentist interface for CRUD operations
export interface Dentist {
  id?: string; // UUID from Supabase, optional for creation
  full_name: string;
  username: string;
  password?: string; // Optional for reads/updates if not changing
  created_at?: string;
  updated_at?: string;
}

export enum NavigationPath {
  Home = "/",
  NewPatient = "/new-patient",
  EditPatient = "/patient/edit/:patientId", 
  PatientsList = "/patients", 
  PatientDetail = "/patient/:patientId", 
  PatientAnamnesis = "/patient/:patientId/anamnesis",
  PatientTreatmentPlans = "/patient/:patientId/treatment-plans",
  Anamnesis = "/anamnesis", 
  TreatmentPlan = "/treatment-plan", 
  EditTreatmentPlan = "/treatment-plan/edit/:planId",
  AllTreatmentPlans = "/all-treatment-plans", 
  Appointments = "/appointments", 
  NewAppointment = "/new-appointment", // New path for creating appointments
  EditAppointment = "/edit-appointment/:appointmentId", // New path for editing appointments
  ViewRecord = "/view-record",
  Configurations = "/configurations", 
}

// Updated DentistUser for dropdowns, aligns with 'dentists' table structure
export interface DentistUser {
  id: string; // Corresponds to dentist's username (which is unique and used as ID in dentist_id column)
  full_name: string; // Display name, e.g., 'Dr. Fulano'
}
