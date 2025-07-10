import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input'; 
import { ArrowUturnLeftIcon, PencilIcon, TrashIcon, PlusIcon, ChevronUpDownIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon, DocumentTextIcon } from '../components/icons/HeroIcons'; 
import { NavigationPath, TreatmentPlanWithPatientInfo, Patient } from '../types'; 
import { 
    getAllTreatmentPlans, 
    deleteTreatmentPlan,
    getPatients 
} from '../services/supabaseService';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { ImageModal } from '../components/ImageModal';

interface PlanToDelete {
    id: string;
    description: string; 
}

type ViewMode = 'card' | 'list'; 

const isImageFile = (fileName: string | null | undefined): boolean => {
  if (!fileName) return false;
  const lowerName = fileName.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff'].some(ext => lowerName.endsWith(ext));
};

export const AllTreatmentPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [allPlansFromServer, setAllPlansFromServer] = useState<TreatmentPlanWithPatientInfo[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<TreatmentPlanWithPatientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);
  const [selectedPatientForFilter, setSelectedPatientForFilter] = useState<Patient | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchTermDropdown, setPatientSearchTermDropdown] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanToDelete | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list'); 

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
      setAllPlansFromServer(plansRes.data || []);
      setFilteredPlans(plansRes.data || []); 

      if (patientsRes.error) {
        showToast('Erro ao carregar lista de pacientes para filtro.', 'error');
      } else {
        setAllPatientsList(patientsRes.data || []);
      }

    } catch (err: any) {
      setError("Falha ao carregar dados: " + (err.message || JSON.stringify(err)));
      setAllPlansFromServer([]);
      setFilteredPlans([]);
      setAllPatientsList([]);
    } finally {
      setIsLoading(false);
      setIsLoadingPatients(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedPatientForFilter) {
      setFilteredPlans(allPlansFromServer.filter(plan => plan.patient_cpf === selectedPatientForFilter.cpf));
    } else {
      setFilteredPlans(allPlansFromServer);
    }
  }, [selectedPatientForFilter, allPlansFromServer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePatientSelectForFilter = (patient: Patient) => {
    setSelectedPatientForFilter(patient);
    setPatientSearchTermDropdown(patient.fullName);
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
    } else {
      showToast("Plano de tratamento apagado com sucesso.", 'success');
      fetchData(); 
    }
    setIsDeleting(false);
    closeConfirmDeleteModal();
  };
  
  const openImageInModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const filteredDropdownPatients = allPatientsList.filter(p =>
    p.fullName.toLowerCase().includes(patientSearchTermDropdown.toLowerCase()) ||
    p.cpf.includes(patientSearchTermDropdown)
  );

  if (isLoading && allPlansFromServer.length === 0) {
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando planos de tratamento...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card title="Erro" className="bg-[#1a1a1a]"><p className="text-red-500 text-center py-4">{error}</p>
          <div className="text-center mt-4"><Button onClick={() => navigate(NavigationPath.Home)} leftIcon={<ArrowUturnLeftIcon />} variant="secondary">Voltar ao Início</Button></div>
        </Card>
      </div>
    );
  }

  const renderPlanActions = (plan: TreatmentPlanWithPatientInfo, isCardContext: boolean = false) => (
    <div className={`flex items-center ${isCardContext ? 'space-x-1 justify-end' : 'space-x-2'}`}>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleEditPlan(plan.id)} 
            className="p-1.5" 
            aria-label="Editar Plano" 
            disabled={isLoading || isDeleting}
            title="Editar Plano"
        >
            <PencilIcon className="w-4 h-4 text-[#00bcd4] hover:text-[#00a5b8]" />
        </Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => requestDeletePlan(plan)} 
            className="p-1.5" 
            aria-label="Apagar Plano" 
            disabled={isLoading || isDeleting}
            title="Apagar Plano"
        >
            <TrashIcon className="w-4 h-4 text-[#f44336] hover:text-[#d32f2f]" />
        </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Planos de Tratamento</h1>
        <div className="flex items-center gap-2">
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
            <Link to={NavigationPath.TreatmentPlan}>
            <Button leftIcon={<PlusIcon />} variant="primary" disabled={isLoading || isDeleting}>Criar Novo Plano</Button>
            </Link>
        </div>
      </div>
      
      <Card title="Buscar Planos por Paciente" className="bg-[#1a1a1a] overflow-visible" titleClassName="text-white">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="relative flex-grow w-full sm:w-auto" ref={patientDropdownRef}>
            <label htmlFor="patientFilterInput" className="block text-sm font-medium text-[#b0b0b0] mb-1">Selecionar Paciente</label>
            <div className="flex">
              <Input
                id="patientFilterInput"
                placeholder={selectedPatientForFilter ? selectedPatientForFilter.fullName : "Selecione ou digite para buscar..."}
                value={patientSearchTermDropdown}
                onChange={(e) => {
                  setPatientSearchTermDropdown(e.target.value);
                  if(e.target.value.trim() !== '') setIsPatientDropdownOpen(true); else setIsPatientDropdownOpen(false);
                  if(!e.target.value.trim()) setSelectedPatientForFilter(null);
                }}
                onFocus={() => {if (allPatientsList.length > 0) setIsPatientDropdownOpen(true);}}
                containerClassName="flex-grow mb-0"
                className="rounded-r-none h-[46px] bg-[#1f1f1f] border-gray-700 focus:border-[#00bcd4]"
                disabled={isLoadingPatients || isLoading}
                prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              />
              <Button type="button" onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                className="px-3 bg-[#1f1f1f] hover:bg-gray-700 border border-l-0 border-gray-700 rounded-l-none rounded-r-md h-[46px]"
                aria-expanded={isPatientDropdownOpen} aria-haspopup="listbox" title="Selecionar Paciente"
                disabled={isLoadingPatients || isLoading}>
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            {isPatientDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 w-full bg-[#1f1f1f] border border-gray-700 rounded-md shadow-lg z-20 max-h-72 overflow-y-auto">
                {isLoadingPatients && allPatientsList.length === 0 ? (
                  <p className="text-center py-3 text-sm text-[#b0b0b0]">Carregando pacientes...</p>
                ) : filteredDropdownPatients.length > 0 ? (
                  <ul>{filteredDropdownPatients.map(p => (
                      <li key={p.cpf} onClick={() => handlePatientSelectForFilter(p)}
                        className="cursor-pointer px-4 py-3 text-sm text-white hover:bg-[#00bcd4] hover:text-black"
                        role="option" aria-selected={selectedPatientForFilter?.cpf === p.cpf}>
                        {p.fullName} <span className="text-xs text-gray-400">({p.cpf})</span>
                      </li>))}
                  </ul>
                ) : (
                  <p className="text-center py-3 text-sm text-[#b0b0b0]">
                    {patientSearchTermDropdown ? `Nenhum paciente encontrado.` : 'Nenhum paciente cadastrado.'}
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
        <Card className="bg-[#1a1a1a]"><p className="text-center text-[#b0b0b0] py-8">
            {selectedPatientForFilter 
                ? `Nenhum plano de tratamento encontrado para ${selectedPatientForFilter.fullName}.` 
                : (allPlansFromServer.length === 0 ? "Nenhum plano de tratamento cadastrado." : "Nenhum plano encontrado.")
            }
        </p></Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between bg-[#1a1a1a]" hoverEffect>
              <div>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <Link to={`/patient/${plan.patient_cpf}`} className="hover:text-[#00bcd4] transition-colors text-lg font-semibold text-white">
                            {plan.patient_full_name || 'Paciente Desconhecido'}
                        </Link>
                        <p className="text-xs text-gray-500">CPF: {plan.patient_cpf}</p>
                    </div>
                    {renderPlanActions(plan, true)}
                </div>
                <DetailItem label="Criado em" value={plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'N/A'} />
                <DetailItem label="Descrição" value={plan.description} />
                <DetailItem label="Procedimentos Realizados" value={plan.procedures_performed} />
                <DetailItem label="Medicação Prescrita" value={plan.prescribed_medication} />
                {plan.payments && plan.payments.length > 0 ? (
                  <div className="mt-2"><h4 className="text-sm font-medium text-[#b0b0b0]">Pagamentos:</h4>
                    <ul className="list-disc list-inside ml-4 text-xs text-white">{plan.payments.map((p, i) => <li key={i}>{p.payment_method}: R$ {p.value} em {isoToDdMmYyyy(p.payment_date)}</li>)}</ul>
                  </div>
                ) : <DetailItem label="Pagamentos" value="Nenhum registrado" />}
                {plan.files && plan.files.length > 0 && (
                  <div className="mt-2"><h4 className="text-sm font-medium text-[#b0b0b0]">Arquivos Anexados:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {plan.files.map((file, index) => (
                          <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" title={file.name}>
                          {isImageFile(file.name) ? (
                              <img src={file.url} alt={file.name} className="w-12 h-12 rounded object-cover border border-gray-700 hover:opacity-80"/>
                          ) : (
                              <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center border border-gray-700 hover:bg-gray-600">
                                  <DocumentTextIcon className="w-6 h-6 text-gray-400"/>
                              </div>
                          )}
                          </a>
                      ))}
                    </div>
                  </div>
                )}
                <DetailItem label="Assinatura do Dentista" value={plan.dentist_signature} />
              </div>
            </Card>
          ))}
        </div>
      ) : ( 
        <div className="bg-[#1a1a1a] shadow-lg rounded-lg overflow-x-auto border border-gray-700/50">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#1f1f1f]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Data Criação</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Procedimentos Realizados</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Arquivos</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Dentista</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
              {filteredPlans.map(plan => (
                <tr key={plan.id} className="hover:bg-[#1f1f1f] transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-medium">
                    <Link to={`/patient/${plan.patient_cpf}`} className="hover:text-[#00bcd4]">
                        {plan.patient_full_name || 'Desconhecido'} ({plan.patient_cpf})
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">{plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-[#b0b0b0] max-w-xs truncate" title={plan.description}>{plan.description}</td>
                  <td className="px-4 py-3 text-sm text-[#b0b0b0] max-w-xs truncate" title={plan.procedures_performed || undefined}>{plan.procedures_performed || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {plan.files && plan.files.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {plan.files.slice(0, 2).map((file, index) => (
                            <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" title={file.name}>
                                {isImageFile(file.name) ? (
                                    <img src={file.url} alt={file.name} className="w-8 h-8 rounded object-cover border border-gray-700" />
                                ) : (
                                    <DocumentTextIcon className="w-6 h-6 text-gray-400 hover:text-white" />
                                )}
                            </a>
                        ))}
                        {plan.files.length > 2 && <span className="text-xs text-gray-500">+{plan.files.length - 2}</span>}
                      </div>
                    ) : (
                        <span className="text-gray-500">Nenhum</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">{plan.dentist_signature || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">
                    {renderPlanActions(plan)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmationModal isOpen={isConfirmDeleteModalOpen} onClose={closeConfirmDeleteModal} onConfirm={executeDeletePlan}
        title="Confirmar Exclusão de Plano"
        message={`Tem certeza que deseja apagar o plano de tratamento: "${planToDelete?.description}"? Esta ação não pode ser desfeita.`}
        confirmButtonText="Apagar Plano" isLoading={isDeleting} />
      <ImageModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} imageUrl={selectedImageUrl} />
    </div>
  );
};

interface DetailItemProps { label: string; value?: string | null; }
const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => (
  <div className="mt-1">
    <h4 className="text-sm font-medium text-[#b0b0b0]">{label}:</h4>
    <p className="text-white whitespace-pre-wrap text-sm">{value || 'Não informado'}</p>
  </div>
);
