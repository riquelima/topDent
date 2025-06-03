
export interface Patient {
  id: string;
  fullName: string;
  dob: string;
  guardian?: string;
  rg: string;
  cpf: string;
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
  patientId: string;
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
  patientId: string;
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
  Anamnesis = "/anamnesis", // Simplified for now, ideally /patient/:id/anamnesis
  TreatmentPlan = "/treatment-plan", // Simplified for now, ideally /patient/:id/treatment-plan
  Appointments = "/appointments", // Placeholder for future
  ViewRecord = "/view-record", // Placeholder for future
}
