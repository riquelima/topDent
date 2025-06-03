
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input'; 
import { ArrowUturnLeftIcon, PencilIcon, TrashIcon, PlusIcon, ChevronUpDownIcon } from '../components/icons/HeroIcons';
import { NavigationPath, TreatmentPlanWithPatientInfo, Patient } from '../types'; 
import { 
    getAllTreatmentPlans, 
    deleteTreatmentPlan,
    getPatients // Added to fetch patients for dropdown
} from '../services/supabaseService';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

interface PlanToDelete {
    id: string;
    description: string; 
}

export const AllTreatmentPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [allPlans, setAllPlans] = useState<TreatmentPlanWithPatientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for patient selection dropdown
  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);
  const [selectedPatientForFilter, setSelectedPatientForFilter] = useState<Patient | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchTermDropdown, setPatientSearchTermDropdown] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);


  // State for ConfirmationModal
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanToDelete | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingPatients(true);
    setError(null);
    try {
      const [plansRes, patientsRes] = await Promise.all([
        getAllTreatmentPlans(),
        getPatients()
      ]);

      if (plansRes.error) {
        throw plansRes.error;
      }
      setAllPlans(plansRes.data || []);

      if (patientsRes.error) {
        showToast('Erro ao carregar lista de pacientes para filtro.', 'error');
        console.error("Error fetching patients for dropdown:", patientsRes.error);
      } else {
        setAllPatientsList(patientsRes.data || []);
      }

    } catch (err: any) {
      console.error("Error fetching data for AllTreatmentPlansPage:", err);
      setError("Falha ao carregar dados: " + err.message);
      setAllPlans([]);
      setAllPatientsList([]);
    } finally {
      setIsLoading(false);
      setIsLoadingPatients(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle click outside patient dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePatientSelectForFilter = (patient: Patient) => {
    setSelectedPatientForFilter(patient);
    setPatientSearchTermDropdown(patient.fullName); // Display selected patient's name
    setIsPatientDropdownOpen(false);
  };

  const handleClearPatientFilter = () => {
    setSelectedPatientForFilter(null);
    setPatientSearchTermDropdown('');
    setIsPatientDropdownOpen(false);
  };

  const handleEditPlan = (planId: string | undefined) => {
    if (!planId) return;
    navigate(NavigationPath.EditTreatmentPlan.replace(':planId', planId));
  };

  const requestDeletePlan = (plan: TreatmentPlanWithPatientInfo) => {
    if (!plan.id) return;
    setPlanToDelete({
      id: plan.id,
      description: `Plano para ${plan.patient_full_name || 'Paciente Desconhecido'} (CPF: ${plan.patient_cpf}), criado em ${plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'data desconhecida'}`
    });
    setIsConfirmDeleteModalOpen(true);
  };

  const closeConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  const executeDeletePlan = async () => {
    if (!planToDelete) return;
    
    setIsDeleting(true);
    const { error: deleteError } = await deleteTreatmentPlan(planToDelete.id);
    if (deleteError) {
      showToast("Erro ao apagar o plano de tratamento: " + deleteError.message, 'error');
      console.error("Delete error:", deleteError);
    } else {
      showToast("Plano de tratamento apagado com sucesso.", 'success');
      fetchData(); 
    }
    setIsDeleting(false);
    closeConfirmDeleteModal();
  };

  const filteredDropdownPatients = allPatientsList.filter(p =>
    p.fullName.toLowerCase().includes(patientSearchTermDropdown.toLowerCase()) ||
    p.cpf.includes(patientSearchTermDropdown)
  );
  
  const filteredPlans = selectedPatientForFilter
    ? allPlans.filter(plan => plan.patient_cpf === selectedPatientForFilter.cpf)
    : allPlans;


  if (isLoading && allPlans.length === 0 && allPatientsList.length === 0) {
    return <div className="text-center py-10 text-gray-400">Carregando dados...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card title="Erro">
            <p className="text-red-500 text-center py-4">{error}</p>
            <div className="text-center mt-4">
                <Button onClick={() => navigate(NavigationPath.Home)} leftIcon={<ArrowUturnLeftIcon />}>Voltar ao Início</Button>
            </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Planos de Tratamento</h1>
        <Link to={NavigationPath.TreatmentPlan}>
          <Button leftIcon={<PlusIcon />} disabled={isLoading || isDeleting}>
            Criar Novo Plano
          </Button>
        </Link>
      </div>
      
      {/* Patient Filter Dropdown Section */}
      <Card title="Buscar Planos por Paciente" className="overflow-visible">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="relative flex-grow w-full sm:w-auto" ref={patientDropdownRef}>
            <label htmlFor="patientFilterInput" className="block text-sm font-medium text-gray-300 mb-1">Selecionar Paciente</label>
            <div className="flex">
              <Input
                id="patientFilterInput"
                placeholder={selectedPatientForFilter ? selectedPatientForFilter.fullName : "Selecione ou digite para buscar..."}
                value={patientSearchTermDropdown}
                onChange={(e) => {
                  setPatientSearchTermDropdown(e.target.value);
                  if(e.target.value.trim() !== '') setIsPatientDropdownOpen(true); else setIsPatientDropdownOpen(false);
                  if(!e.target.value.trim()) setSelectedPatientForFilter(null); // Clear selection if input is cleared
                }}
                onFocus={() => {if (allPatientsList.length > 0) setIsPatientDropdownOpen(true);}}
                containerClassName="flex-grow mb-0"
                className="rounded-r-none h-[46px]"
                disabled={isLoadingPatients || isLoading}
              />
              <Button
                type="button"
                onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                className="px-3 bg-gray-700 hover:bg-gray-600 border border-l-0 border-gray-700 rounded-l-none rounded-r-md h-[46px]"
                aria-expanded={isPatientDropdownOpen}
                aria-haspopup="listbox"
                title="Selecionar Paciente"
                disabled={isLoadingPatients || isLoading}
              >
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            {isPatientDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20 max-h-72 overflow-y-auto">
                {isLoadingPatients && allPatientsList.length === 0 ? (
                  <p className="text-center py-3 text-sm text-gray-400">Carregando pacientes...</p>
                ) : filteredDropdownPatients.length > 0 ? (
                  <ul>
                    {filteredDropdownPatients.map(p => (
                      <li
                        key={p.id}
                        onClick={() => handlePatientSelectForFilter(p)}
                        className="cursor-pointer px-4 py-3 text-sm text-gray-200 hover:bg-teal-600 hover:text-white"
                        role="option"
                        aria-selected={selectedPatientForFilter?.cpf === p.cpf}
                      >
                        {p.fullName} <span className="text-xs text-gray-400">({p.cpf})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center py-3 text-sm text-gray-400">
                    {patientSearchTermDropdown ? `Nenhum paciente encontrado com "${patientSearchTermDropdown}".` : 'Nenhum paciente cadastrado.'}
                  </p>
                )}
              </div>
            )}
          </div>
          {selectedPatientForFilter && (
            <Button variant="ghost" onClick={handleClearPatientFilter} disabled={isLoading} className="w-full sm:w-auto h-[46px]">
              Limpar Seleção / Ver Todos
            </Button>
          )}
        </div>
      </Card>

      {filteredPlans.length === 0 && !isLoading ? (
        <Card>
          <p className="text-center text-gray-400 py-8">
            {selectedPatientForFilter 
                ? `Nenhum plano de tratamento encontrado para ${selectedPatientForFilter.fullName}.` 
                : (allPlans.length === 0 ? "Nenhum plano de tratamento cadastrado." : "Nenhum plano encontrado.")
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredPlans.map((plan) => (
            <Card 
                key={plan.id}
                title={
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <Link to={`/patient/${plan.patient_cpf}`} className="hover:text-teal-400 transition-colors text-lg font-semibold">
                                Paciente: {plan.patient_full_name || 'Desconhecido'}
                            </Link>
                            <p className="text-xs text-gray-400">CPF: {plan.patient_cpf}</p>
                        </div>
                        <div className="flex items-center space-x-2 self-start sm:self-center">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan.id)} className="p-1.5" aria-label="Editar Plano" disabled={isLoading || isDeleting}>
                                <PencilIcon className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => requestDeletePlan(plan)} className="p-1.5" aria-label="Apagar Plano" disabled={isLoading || isDeleting}>
                                <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-300" />
                            </Button>
                        </div>
                    </div>
                }
            >
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Criado em:</h4>
                  <p className="text-gray-200">{plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'Data Indisponível'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Descrição:</h4>
                  <p className="text-gray-200 whitespace-pre-wrap">{plan.description}</p>
                </div>
                {plan.file_names && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Arquivos Anexados (Nomes):</h4>
                    <p className="text-gray-300 text-xs">{plan.file_names}</p>
                    {plan.file_url && (
                        <a href={plan.file_url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline text-xs">
                            Visualizar Arquivo
                        </a>
                    )}
                  </div>
                )}
                {plan.dentist_signature && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Assinatura do Dentista:</h4>
                    <p className="text-gray-200">{plan.dentist_signature}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
        {planToDelete && (
            <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={closeConfirmDeleteModal}
            onConfirm={executeDeletePlan}
            title="Confirmar Exclusão de Plano"
            message={`Tem certeza que deseja apagar o plano de tratamento: "${planToDelete.description}"? Esta ação não pode ser desfeita.`}
            confirmButtonText="Apagar Plano"
            isLoading={isDeleting}
            />
        )}
    </div>
  );
};
