
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlusIcon, ClipboardDocumentListIcon } from '../components/icons/HeroIcons';
import { Patient, NavigationPath } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { getPatients } from '../services/supabaseService'; // Changed import

export const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: supabaseError } = await getPatients();
      if (supabaseError) {
        console.error("Error fetching patients:", supabaseError);
        setError("Falha ao carregar pacientes. Verifique o console para detalhes.");
        setPatients([]);
      } else {
        setPatients(data || []);
      }
      setIsLoading(false);
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm)
  );

  const handleViewDetails = (patientId: string) => { // patientId is CPF here
    navigate(NavigationPath.PatientDetail.replace(':patientId', patientId));
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-400">Carregando pacientes...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-400">{error}</p>
        <Button onClick={() => navigate(NavigationPath.Home)} className="mt-4">Voltar ao Início</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Lista de Pacientes</h1>
        <Button 
          onClick={() => navigate(NavigationPath.NewPatient)} 
          leftIcon={<UserPlusIcon className="w-5 h-5" />}
        >
          Adicionar Novo Paciente
        </Button>
      </div>

      <Input 
        placeholder="Buscar por nome ou CPF..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        containerClassName="mb-6"
      />

      {filteredPatients.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-8">
            {patients.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum paciente encontrado com o termo buscado."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <Card key={patient.id} className="flex flex-col justify-between" hoverEffect>
              <div>
                <h3 className="text-xl font-semibold text-teal-400 truncate" title={patient.fullName}>{patient.fullName}</h3>
                <p className="text-sm text-gray-300">CPF: {patient.cpf}</p>
                <p className="text-sm text-gray-300">Nascimento: {isoToDdMmYyyy(patient.dob)}</p>
                {patient.guardian && <p className="text-sm text-gray-400 italic">Responsável: {patient.guardian}</p>}
              </div>
              <div className="mt-6">
                <Button 
                  fullWidth 
                  variant="primary"
                  onClick={() => handleViewDetails(patient.id)} // patient.id is CPF
                  leftIcon={<ClipboardDocumentListIcon className="w-5 h-5"/>}
                >
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};