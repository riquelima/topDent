
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlusIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon, Squares2X2Icon, ListBulletIcon } from '../components/icons/HeroIcons';
import { Patient, NavigationPath } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { getPatients, deletePatientByCpf } from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ui/ConfirmationModal'; // Import ConfirmationModal

type ViewMode = 'card' | 'list';

interface PatientToDelete {
  cpf: string;
  name: string;
}

export const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast(); 
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // Specific loading state for delete
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // State for ConfirmationModal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientToDelete | null>(null);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await getPatients();
      if (supabaseError) {
        console.error("Error fetching patients:", supabaseError);
        setError("Falha ao carregar pacientes. Verifique o console para detalhes.");
        showToast("Falha ao carregar pacientes.", "error");
        setPatients([]);
      } else {
        setPatients(data || []);
      }
    } catch (e: any) {
      console.error("Unhandled exception in fetchPatients:", e);
      setError("Erro crítico ao buscar pacientes: " + (e.message || "Erro desconhecido"));
      showToast("Erro crítico ao buscar pacientes.", "error");
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]); 

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm)
  );

  const handleViewDetails = (patientId: string) => { 
    navigate(NavigationPath.PatientDetail.replace(':patientId', patientId));
  };

  const requestDeletePatient = (cpf: string, name: string) => {
    console.log(`[requestDeletePatient] Called for CPF: ${cpf}, Name: ${name}`);
    setPatientToDelete({ cpf, name });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setPatientToDelete(null);
  };

  const executeDeletePatient = async () => {
    if (!patientToDelete) return;

    console.log(`[executeDeletePatient] Confirmed deletion for CPF: ${patientToDelete.cpf}`);
    setIsDeleting(true); 
    try {
      const { data: deleteData, error: deleteError } = await deletePatientByCpf(patientToDelete.cpf);
      console.log("[executeDeletePatient] deletePatientByCpf returned. Error object:", deleteError, "Data object:", deleteData);

      if (deleteError) {
        console.error("[executeDeletePatient] Delete error received:", deleteError);
        let displayMessage = "Erro ao excluir paciente.";
        if (deleteError && typeof deleteError.message === 'string' && deleteError.message) {
          displayMessage = `Erro: ${deleteError.message}`;
        } else if (deleteError && typeof (deleteError as any).error_description === 'string' && (deleteError as any).error_description) {
          displayMessage = `Erro: ${(deleteError as any).error_description}`;
        }
        
        if (deleteError && typeof (deleteError as any).hint === 'string' && (deleteError as any).hint) {
          displayMessage += ` (Dica: ${(deleteError as any).hint})`;
        } else if (deleteError.message && deleteError.message.includes("violates foreign key constraint")) {
          displayMessage += " Verifique se o paciente possui agendamentos, planos de tratamento ou anamnese vinculados. Eles podem precisar ser removidos primeiro se a exclusão em cascata (ON DELETE CASCADE) não estiver configurada no banco de dados.";
        }

        showToast(displayMessage, "error");
        console.error("Delete patient error object (raw):", deleteError);
        if (typeof deleteError === 'object' && deleteError !== null) {
            console.error("Full delete error details (JSON):", JSON.stringify(deleteError, null, 2));
        }
      } else {
        // Check if deleteData actually indicates a successful deletion from Supabase
        if (deleteData && deleteData.length > 0) {
            console.log(`[executeDeletePatient] Supabase confirmed deletion of ${deleteData.length} record(s). Refreshing list.`);
            showToast(`Paciente ${patientToDelete.name} excluído com sucesso.`, 'success');
            fetchPatients(); // Refresh the list from the database
        } else if (deleteData && deleteData.length === 0) {
            console.warn(`[executeDeletePatient] Supabase reported 0 records deleted for CPF ${patientToDelete.cpf}. The patient might not exist, or RLS/constraints prevented deletion.`);
            showToast(`Nenhum paciente encontrado com CPF ${patientToDelete.cpf} para excluir, ou a exclusão foi impedida por regras do banco. Verifique o console para mais detalhes.`, 'warning');
            // Still fetch patients to ensure UI consistency if the record was already gone or RLS silently blocked.
            fetchPatients();
        } else {
            // This case means deleteError is null, but deleteData is also null or not an array as expected from .select().
            // This is an ambiguous "success" from Supabase.
            console.warn(`[executeDeletePatient] Deletion call for ${patientToDelete.name} returned no error from Supabase, but also no confirmation data. The record might not have existed or RLS/constraints prevented action. Refreshing list.`);
            showToast(`Tentativa de exclusão para ${patientToDelete.name} processada. Verifique a lista.`, 'warning');
            fetchPatients();
        }
      }
    } catch (catchedError: any) {
      console.error("[executeDeletePatient] CATCH BLOCK EXECUTED. Unexpected error during deletion process:", catchedError);
      showToast(`Erro inesperado ao tentar excluir paciente: ${catchedError.message || 'Verifique o console.'}`, "error");
    } finally {
      console.log("[executeDeletePatient] Finally block: Setting isDeleting to false.");
      setIsDeleting(false);
      closeConfirmModal();
    }
  };


  if (isLoading && patients.length === 0 && !error) { 
    return <div className="text-center py-10 text-gray-400">Carregando pacientes...</div>;
  }

  if (error && patients.length === 0) { 
    return (
      <div className="text-center py-10">
        <p className="text-red-400">{error}</p>
        <Button onClick={() => navigate(NavigationPath.Home)} className="mt-4">Voltar ao Início</Button>
      </div>
    );
  }

  const renderPatientActions = (patient: Patient) => (
    <div className="flex items-center space-x-2">
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => handleViewDetails(patient.id)} 
        leftIcon={<ClipboardDocumentListIcon className="w-4 h-4"/>}
        disabled={isLoading || isDeleting}
        className="p-1.5 sm:p-2"
        title="Ver Detalhes"
      >
        <span className="hidden sm:inline">Detalhes</span>
      </Button>
      <Link to={NavigationPath.EditPatient.replace(':patientId', patient.cpf)} title="Editar Paciente" className={`p-1.5 sm:p-2 rounded-md ${isLoading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}>
        <PencilIcon className="w-4 h-4 text-blue-400 hover:text-blue-300 transition-colors" />
      </Link>
      <button 
        onClick={() => {
          if (!isLoading && !isDeleting) requestDeletePatient(patient.cpf, patient.fullName);
        }} 
        title="Excluir Paciente" 
        disabled={isLoading || isDeleting}
        aria-label={`Excluir paciente ${patient.fullName}`}
        className={`p-1.5 sm:p-2 rounded-md ${isLoading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
      >
        <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-300 transition-colors" />
      </button>
    </div>
  );


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Lista de Pacientes</h1>
        <Button 
          onClick={() => navigate(NavigationPath.NewPatient)} 
          leftIcon={<UserPlusIcon className="w-5 h-5" />}
          disabled={isLoading || isDeleting}
        >
          Adicionar Novo Paciente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Input 
          placeholder="Buscar por nome ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="flex-grow sm:mb-0" 
          disabled={isLoading || isDeleting}
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


      {filteredPatients.length === 0 && !isLoading ? (
        <Card>
          <p className="text-center text-gray-400 py-8">
            {patients.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum paciente encontrado com o termo buscado."}
          </p>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map(patient => (
            <Card key={patient.id} className="flex flex-col justify-between relative" hoverEffect>
              <div className="absolute top-3 right-3 flex space-x-1 z-10"> 
                <Link to={NavigationPath.EditPatient.replace(':patientId', patient.cpf)} title="Editar Paciente" className={`p-1.5 rounded-md ${isLoading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}>
                  <PencilIcon className="w-5 h-5 text-blue-400 hover:text-blue-300 transition-colors" />
                </Link>
                <button 
                  onClick={() => {
                    console.log(`[TrashIcon onClick] Button clicked. Patient: ${patient.fullName}, CPF: ${patient.cpf}. Current isLoading state: ${isLoading}, isDeleting: ${isDeleting}`);
                    if (!isLoading && !isDeleting) {
                      requestDeletePatient(patient.cpf, patient.fullName);
                    } else {
                      console.warn(`[TrashIcon onClick] Action prevented: isLoading is ${isLoading}, isDeleting is ${isDeleting}. The button should be disabled.`);
                    }
                  }} 
                  title="Excluir Paciente" 
                  disabled={isLoading || isDeleting}
                  aria-label={`Excluir paciente ${patient.fullName}`}
                   className={`p-1.5 rounded-md ${isLoading || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                >
                  <TrashIcon className="w-5 h-5 text-red-400 hover:text-red-300 transition-colors" />
                </button>
              </div>
              <div className="pr-16"> 
                <h3 className="text-xl font-semibold text-teal-400 truncate" title={patient.fullName}>{patient.fullName}</h3>
                <p className="text-sm text-gray-300">CPF: {patient.cpf}</p>
                <p className="text-sm text-gray-300">Nascimento: {isoToDdMmYyyy(patient.dob)}</p>
                {patient.guardian && <p className="text-sm text-gray-400 italic">Responsável: {patient.guardian}</p>}
              </div>
              <div className="mt-6">
                <Button 
                  fullWidth 
                  variant="primary"
                  onClick={() => handleViewDetails(patient.id)} 
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
        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome Completo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CPF</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nascimento</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-100 font-medium">{patient.fullName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{patient.cpf}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{isoToDdMmYyyy(patient.dob)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
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
              <p>Tem certeza que deseja excluir o paciente <strong className="text-teal-400">{patientToDelete.name}</strong> (CPF: <strong className="text-teal-400">{patientToDelete.cpf}</strong>)?</p>
              <p className="mt-2 text-sm text-yellow-400">Atenção: Esta ação é irreversível. Se houver dados vinculados (agendamentos, anamnese, planos de tratamento) e a exclusão em cascata (<code className="bg-gray-700 px-1 rounded">ON DELETE CASCADE</code>) não estiver configurada no banco de dados, a exclusão poderá falhar ou deixar dados órfãos.</p>
            </>
          }
          confirmButtonText="Excluir Paciente"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
