
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
  date: string;
  value: string;
}

export interface Anamnesis {
  patientId: string; // CPF of the patient
  medications: AnamnesisQuestion;
  isSmoker: AnamnesisQuestion;
  isPregnant: AnamnesisQuestion;
  allergies: AnamnesisQuestion;
  hasDisease: AnamnesisQuestion;
  diseases?: DiseaseOptions;
  surgeries: AnamnesisQuestion;
  bloodPressureReadings: BloodPressureReading[];
}

export interface TreatmentPlan {
  patientId: string; // CPF of the patient
  description: string;
  files?: File[];
  dentistSignature: string; // Could be text or image data if advanced
}

export interface Appointment {
  id: string;
  time: string;
  patientName: string;
  procedure: string;
}

export enum NavigationPath {
  Home = "/",
  NewPatient = "/new-patient",
  PatientsList = "/patients", // New: For listing patients
  PatientDetail = "/patient/:patientId", // New: For patient details, :patientId will be CPF
  Anamnesis = "/anamnesis", 
  TreatmentPlan = "/treatment-plan", 
  Appointments = "/appointments", 
  ViewRecord = "/view-record", 
}
