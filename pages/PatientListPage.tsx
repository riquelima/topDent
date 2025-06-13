


import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlusIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon } from '../components/icons/HeroIcons';
import { Patient, NavigationPath } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { getPatients, deletePatientByCpf } from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

type ViewMode = 'card' | 'list';

interface PatientToDelete {
  cpf: string;
  name: string;
}

export const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast(); 
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientToDelete | null>(null);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await getPatients();
      if (supabaseError) {
        console.error("Error fetching patients:", supabaseError);
        setError("Falha ao carregar pacientes.");
        showToast("Falha ao carregar pacientes.", "error");
        setAllPatients([]);
        setFilteredPatients([]);
      } else {
        setAllPatients(data || []);
        setFilteredPatients(data || []);
      }
    } catch (e: any) {
      console.error("Unhandled exception in fetchPatients:", e);
      setError("Erro crítico ao buscar pacientes: " + (e.message || "Erro desconhecido"));
      showToast("Erro crítico ao buscar pacientes.", "error");
      setAllPatients([]);
      setFilteredPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]); 

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = allPatients.filter(patient =>
      patient.fullName.toLowerCase().includes(lowerSearchTerm) ||
      patient.cpf.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, allPatients]);


  const handleViewDetails = (patientId: string) => { 
    navigate(NavigationPath.PatientDetail.replace(':patientId', patientId));
  };

  const requestDeletePatient = (cpf: string, name: string) => {
    setPatientToDelete({ cpf, name });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setPatientToDelete(null);
  };

  const executeDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true); 
    try {
      const { error: deleteError } = await deletePatientByCpf(patientToDelete.cpf);

      if (deleteError) {
        let displayMessage = "Erro ao excluir paciente.";
        if (deleteError.message?.includes("violates foreign key constraint")) {
          displayMessage += " Paciente possui dados vinculados (agendamentos, tratamentos, etc.) que impedem a exclusão.";
        } else if (deleteError.message) {
          displayMessage = `Erro: ${deleteError.message}`;
        }
        showToast(displayMessage, "error");
        console.error("Delete patient error:", deleteError);
      } else {
        showToast(`Paciente ${patientToDelete.name} excluído com sucesso.`, 'success');
        fetchPatients(); 
      }
    } catch (catchedError: any) {
      showToast(`Erro inesperado ao tentar excluir paciente: ${catchedError.message || 'Verifique o console.'}`, "error");
    } finally {
      setIsDeleting(false);
      closeConfirmModal();
    }
  };

  const renderPatientActions = (patient: Patient, isCardContext: boolean = false) => (
    <div className={`flex items-center ${isCardContext ? 'space-x-1 justify-end' : 'space-x-2'}`}>
      {!isCardContext && (
         <Button 
            size="sm" 
            variant="ghost"
            onClick={() => handleViewDetails(patient.cpf)} 
            leftIcon={<ClipboardDocumentListIcon className="w-4 h-4"/>}
            disabled={isLoading || isDeleting}
            className="p-1.5 sm:p-2"
            title="Ver Detalhes"
        >
            <span className="hidden sm:inline">Detalhes</span>
        </Button>
      )}
      <Link to={NavigationPath.EditPatient.replace(':patientId', patient.cpf)} title="Editar Paciente" className={`p-1.5 rounded-md ${isLoading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}>
        <PencilIcon className="w-5 h-5 text-[#00bcd4] hover:text-[#00a5b8] transition-colors" />
      </Link>
      <button 
        onClick={() => requestDeletePatient(patient.cpf, patient.fullName)} 
        title="Excluir Paciente" 
        disabled={isLoading || isDeleting}
        aria-label={`Excluir paciente ${patient.fullName}`}
        className={`p-1.5 rounded-md ${isLoading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
      >
        <TrashIcon className="w-5 h-5 text-[#f44336] hover:text-[#d32f2f] transition-colors" />
      </button>
    </div>
  );

  if (isLoading && allPatients.length === 0 && !error) { 
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando pacientes...</div>;
  }

  if (error && allPatients.length === 0) { 
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => navigate(NavigationPath.Home)} className="mt-4" variant="secondary">Voltar ao Início</Button>
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
          disabled={isLoading || isDeleting}
          variant="primary"
        >
          Adicionar Novo Paciente
        </Button>
      </div>

      <Card className="bg-[#1a1a1a] p-6" titleClassName="hidden"> {/* Filter Card */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input 
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="flex-grow w-full sm:w-auto sm:mb-0" 
            disabled={isLoading || isDeleting}
            prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
            className="bg-[#1f1f1f] border-gray-700 focus:border-[#00bcd4]"
          />
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'card' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('card')}
              disabled={isLoading || isDeleting}
              title="Visualizar em Cards"
              aria-pressed={viewMode === 'card'}
            >
              <Squares2X2Icon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
              disabled={isLoading || isDeleting}
              title="Visualizar em Lista"
              aria-pressed={viewMode === 'list'}
            >
              <ListBulletIcon className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Lista</span>
            </Button>
          </div>
        </div>
      </Card>

      {filteredPatients.length === 0 && !isLoading ? (
        <Card className="bg-[#1a1a1a]">
          <p className="text-center text-[#b0b0b0] py-8">
            {allPatients.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum paciente encontrado com o termo buscado."}
          </p>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <Card key={patient.cpf} className="flex flex-col justify-between bg-[#1a1a1a]" hoverEffect>
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-[#00bcd4] truncate pr-2" title={patient.fullName}>{patient.fullName}</h3>
                  {renderPatientActions(patient, true)}
                </div>
                <p className="text-sm text-[#b0b0b0]">CPF: {patient.cpf}</p>
                <p className="text-sm text-[#b0b0b0]">Nascimento: {isoToDdMmYyyy(patient.dob)}</p>
                {patient.guardian && <p className="text-sm text-gray-500 italic">Responsável: {patient.guardian}</p>}
              </div>
              <div className="mt-6">
                <Button 
                  fullWidth 
                  variant="primary"
                  onClick={() => handleViewDetails(patient.cpf)} 
                  leftIcon={<ClipboardDocumentListIcon className="w-5 h-5"/>}
                  disabled={isLoading || isDeleting}
                >
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : ( // List View
        <Card className="overflow-x-auto bg-[#1a1a1a]">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#1f1f1f]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Nome Completo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">CPF</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Nascimento</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
              {filteredPatients.map(patient => (
                <tr key={patient.cpf} className="hover:bg-[#1f1f1f] transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-medium">{patient.fullName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">{patient.cpf}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">{isoToDdMmYyyy(patient.dob)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">
                    {renderPatientActions(patient)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {patientToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={closeConfirmModal}
          onConfirm={executeDeletePatient}
          title="Confirmar Exclusão de Paciente"
          message={
            <>
              <p>Tem certeza que deseja excluir o paciente <strong className="text-[#00bcd4]">{patientToDelete.name}</strong> (CPF: <strong className="text-[#00bcd4]">{patientToDelete.cpf}</strong>)?</p>
              <p className="mt-2 text-sm text-yellow-500">Atenção: Esta ação é irreversível e removerá todos os dados associados ao paciente, caso a exclusão em cascata esteja configurada. Se não, a exclusão pode ser impedida se houver dados vinculados.</p>
            </>
          }
          confirmButtonText="Excluir Paciente"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};