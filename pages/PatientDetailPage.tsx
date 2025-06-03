import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  if (!value && typeof value !== 'string') return null; // Allow empty string but not null/undefined
  return (
    <div>
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-base text-gray-100">{value || "Não informado"}</dd>
    </div>
  );
};


export const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>(); // patientId is CPF from the route
  const navigate = useNavigate();
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

  if (isLoading) {
    return <div className="text-center py-10 text-gray-400">Carregando detalhes do paciente...</div>;
  }

  if (error || !patient) {
    return (
      <Card title="Erro">
        <p className="text-center text-red-400 py-8">{error || 'Paciente não encontrado.'}</p>
        <div className="mt-6 text-center">
          <Button onClick={() => navigate(NavigationPath.PatientsList)} leftIcon={<ArrowUturnLeftIcon />}>
            Voltar para Lista de Pacientes
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card title={`Detalhes de: ${patient.fullName}`}>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4">Dados Pessoais</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Nome Completo" value={patient.fullName} />
              <DetailItem label="Data de Nascimento" value={isoToDdMmYyyy(patient.dob)} />
              <DetailItem label="CPF" value={patient.cpf} />
              <DetailItem label="RG" value={patient.rg} />
              <DetailItem label="Telefone" value={patient.phone} />
              <DetailItem label="Responsável" value={patient.guardian} />
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4">Endereço</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Rua/Avenida" value={patient.addressStreet} />
              <DetailItem label="Número" value={patient.addressNumber} />
              <DetailItem label="Bairro" value={patient.addressDistrict} />
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4">Contato de Emergência</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Nome" value={patient.emergencyContactName} />
              <DetailItem label="Telefone" value={patient.emergencyContactPhone} />
            </dl>
          </div>
          
          <div className="pt-4">
            <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4">Histórico do Paciente</h3>
             <div className="flex flex-wrap gap-4">
                 <Link to={NavigationPath.PatientAnamnesis.replace(':patientId', patient.cpf)}>
                    <Button variant="ghost">Ver/Preencher Anamnese</Button>
                 </Link>
                 <Link to={NavigationPath.PatientTreatmentPlans.replace(':patientId', patient.cpf)}>
                    <Button variant="ghost">Ver/Preencher Planos de Tratamento</Button>
                 </Link>
             </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <Button onClick={() => navigate(NavigationPath.PatientsList)} leftIcon={<ArrowUturnLeftIcon />}>
              Voltar para Lista de Pacientes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};