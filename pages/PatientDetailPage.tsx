

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'; // Adicionado useLocation
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUturnLeftIcon } from '../components/icons/HeroIcons';
import { Patient, NavigationPath } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { getPatientByCpf } from '../services/supabaseService'; 


interface DetailItemProps {
  label: string;
  value?: string | null;
}
const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
  if (!value && typeof value !== 'string') return null; 
  return (
    <div>
      <dt className="text-sm font-medium text-[var(--text-secondary)]">{label}</dt>
      <dd className="mt-1 text-base text-[var(--text-primary)]">{value || "Não informado"}</dd>
    </div>
  );
};


export const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>(); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setError('ID do paciente não fornecido na rota.');
      setIsLoading(false);
      return;
    }

    const fetchPatientDetails = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: supabaseError } = await getPatientByCpf(patientId);
      if (supabaseError) {
        console.error("Error fetching patient details:", supabaseError);
        setError(`Falha ao carregar detalhes do paciente: ${supabaseError.message}`);
        setPatient(null);
      } else if (data) {
        setPatient(data);
      } else {
        setError('Paciente não encontrado.');
        setPatient(null);
      }
      setIsLoading(false);
    };

    fetchPatientDetails();
  }, [patientId]);

  // Determine back navigation based on location state or default
  const cameFromDentistDashboard = location.state?.fromDentistDashboard;
  const backButtonPath = cameFromDentistDashboard ? NavigationPath.Home : NavigationPath.PatientsList;
  const backButtonText = cameFromDentistDashboard ? "Voltar ao Dashboard Dentista" : "Voltar para Lista de Pacientes";

  const getPaymentTypeDisplay = (patient: Patient | null): string | null => {
    if (!patient || !patient.payment_type) return "Não informado";
    return patient.payment_type === 'health_plan' ? 'Plano de Saúde' : 'Particular';
  };


  if (isLoading) {
    return <div className="text-center py-10 text-[var(--text-secondary)]">Carregando detalhes do paciente...</div>;
  }

  if (error || !patient) {
    return (
      <Card title="Erro">
        <p className="text-center text-red-400 py-8">{error || 'Paciente não encontrado.'}</p>
        <div className="mt-6 text-center">
          <Button onClick={() => navigate(backButtonPath)} leftIcon={<ArrowUturnLeftIcon />}>
            {backButtonText}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card title={`Detalhes de: ${patient.fullName}`}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-2 mb-4">Dados Pessoais</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Nome Completo" value={patient.fullName} />
              <DetailItem label="Data de Nascimento" value={isoToDdMmYyyy(patient.dob)} />
              <DetailItem label="CPF" value={patient.cpf} />
              <DetailItem label="RG" value={patient.rg} />
              <DetailItem label="Telefone" value={patient.phone} />
              <DetailItem label="Responsável" value={patient.guardian} />
              <DetailItem label="Tipo de Pagamento" value={getPaymentTypeDisplay(patient)} />
              {patient.payment_type === 'health_plan' && (
                <DetailItem label="Código do Plano" value={patient.health_plan_code} />
              )}
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-2 mb-4">Endereço</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Rua/Avenida" value={patient.addressStreet} />
              <DetailItem label="Número" value={patient.addressNumber} />
              <DetailItem label="Bairro" value={patient.addressDistrict} />
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-2 mb-4">Contato de Emergência</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Nome" value={patient.emergencyContactName} />
              <DetailItem label="Telefone" value={patient.emergencyContactPhone} />
            </dl>
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-2 mb-4">Histórico do Paciente</h3>
             <div className="flex flex-wrap gap-4">
                 <Link to={NavigationPath.PatientAnamnesis.replace(':patientId', patient.cpf)} state={location.state}>
                    <Button variant="ghost">Ver/Preencher Anamnese</Button>
                 </Link>
                 <Link to={NavigationPath.PatientTreatmentPlans.replace(':patientId', patient.cpf)} state={location.state}>
                    <Button variant="ghost">Ver/Preencher Planos de Tratamento</Button>
                 </Link>
             </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
            <Button onClick={() => navigate(backButtonPath, { state: location.state })} leftIcon={<ArrowUturnLeftIcon />}>
              {backButtonText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};