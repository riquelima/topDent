
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
  payment_type?: 'health_plan' | 'private' | null;
  health_plan_code?: string | null;
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
  patient_cpf: string | null;
  patient_name: string; // Denormalized for easier display, now required
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  procedure: string;
  notes?: string | null;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
  dentist_id?: string | null; 
  dentist_name?: string | null; 
  return_date?: string | null; // Date for follow-up
  created_at?: string; // ISO timestamp string
  updated_at?: string; // ISO timestamp string
}

export type PaymentMethod = "Dinheiro" | "Cartão de Crédito" | "Cartão de Débito" | "PIX" | "Transferência Bancária" | "Boleto" | "Outro";

export interface PaymentInput {
  id?: string; 
  value: string; 
  payment_method: PaymentMethod | "";
  payment_date: string; // YYYY-MM-DD
  description?: string; // Optional description for the payment
}
export interface SupabaseTreatmentPlanData {
    id?: string;
    created_at?: string;
    patient_cpf: string;
    description: string;
    files?: { name: string; url: string; }[] | null;
    dentist_signature?: string | null;
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
  show_changelog?: boolean; // For "What's New" modal preference
  created_at?: string;
  updated_at?: string;
}

export interface Reminder {
  id: string;
  created_at: string;
  title: string;
  content: string;
  is_active: boolean;
}

export interface ConsultationHistoryEntry {
  id: string; // UUID from Supabase
  appointment_id: string | null; // UUID of the original appointment
  patient_cpf: string | null;
  dentist_id?: string | null; // Username of the dentist
  dentist_name?: string | null; // Denormalized
  patient_name: string;
  procedure_details: string; // The procedure string from appointment
  consultation_date: string; // YYYY-MM-DD from appointment
  completion_timestamp: string; // ISO timestamp string for when it was marked complete/cancelled
  status: Appointment['status']; // Changed from 'Completed' to support various final statuses
  notes?: string | null; // Notes from the original appointment
  created_at?: string; // ISO timestamp string
}

export interface Notification {
  id: string;
  created_at: string;
  dentist_id: string;
  message: string;
  is_read: boolean;
  appointment_id?: string | null;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
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
  NewAppointment = "/new-appointment", 
  EditAppointment = "/edit-appointment/:appointmentId", 
  ViewRecord = "/view-record",
  ConsultationHistory = "/consultation-history",
  Configurations = "/configurations", 
  Return = "/returns",
  Chat = "/chat",
}

// Updated DentistUser for dropdowns, aligns with 'dentists' table structure
export interface DentistUser {
  id: string; // MUST be the dentist's UUID from the 'id' column in the dentists table.
  full_name: string; // Display name, e.g., 'Dr. Fulano'
}

// Interface for custom procedures
export interface Procedure {
  id: string; // UUID from Supabase
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentReturnInfo {
  id: string; // appointment id
  return_date: string;
  patient_cpf: string | null;
  patient_name: string;
  patient_phone: string;
}

// Interface for Changelog
export interface ChangelogEntry {
  id: string;
  created_at: string;
  release_date: string;
  version: string;
  changes: string[];
}
