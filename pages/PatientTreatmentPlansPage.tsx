
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUturnLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '../components/icons/HeroIcons'; 
import { Patient, NavigationPath, SupabaseTreatmentPlanData } from '../types'; 
import { 
    getPatientByCpf, 
    getTreatmentPlansByPatientCpf,
    deleteTreatmentPlan 
} from '../services/supabaseService';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { ImageModal } from '../components/ImageModal'; 
import { ConfirmationModal } from '../components/ui/ConfirmationModal'; // Import ConfirmationModal
import { useToast } from '../contexts/ToastContext'; // Import useToast

const isImageFile = (fileName: string | null | undefined): boolean => {
  if (!fileName) return false;
  const lowerName = fileName.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff'].some(ext => lowerName.endsWith(ext));
};

interface PlanToDelete {
    id: string;
    description: string; // Or some identifier for the message
}

export const PatientTreatmentPlansPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>(); 
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<SupabaseTreatmentPlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // State for ConfirmationModal
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanToDelete | null>(null);


  const fetchPatientAndPlans = useCallback(async () => {
    if (!patientId) {
      setError("CPF do paciente não fornecido.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const patientRes = await getPatientByCpf(patientId);
      if (patientRes.error || !patientRes.data) {
        setError("Paciente não encontrado ou erro ao buscar paciente.");
        setPatient(null);
        setTreatmentPlans([]);
        setIsLoading(false);
        return;
      }
      setPatient(patientRes.data);

      const plansRes = await getTreatmentPlansByPatientCpf(patientId);
      if (plansRes.error) {
        console.error("Erro ao buscar planos de tratamento:", plansRes.error.message);
        setError("Falha ao carregar planos de tratamento.");
        setTreatmentPlans([]);
      } else {
        setTreatmentPlans(plansRes.data || []);
      }
    } catch (e: any) {
      setError("Erro ao carregar dados: " + e.message);
      console.error(e);
      setTreatmentPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientAndPlans();
  }, [fetchPatientAndPlans]);

  const handleEditPlan = (planId: string | undefined) => {
    if (!planId) return;
    navigate(NavigationPath.EditTreatmentPlan.replace(':planId', planId));
  };

  const requestDeletePlan = (plan: SupabaseTreatmentPlanData) => {
    if (!plan.id) return;
    setPlanToDelete({ 
        id: plan.id, 
        description: `Plano criado em ${plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'data desconhecida'}` 
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
      fetchPatientAndPlans(); 
    }
    setIsDeleting(false);
    closeConfirmDeleteModal();
  };

  const openImageInModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  if (isLoading && treatmentPlans.length === 0 && !error) { 
     return <div className="text-center py-10 text-gray-400">Carregando planos de tratamento...</div>;
  }
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!patient) return <div className="text-center py-10 text-red-500">Paciente não encontrado.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">
          Planos de Tratamento de {patient.fullName}
        </h1>
        <Link to={NavigationPath.TreatmentPlan}>
            <Button leftIcon={<PlusIcon className="w-5 h-5" />} disabled={isLoading || isDeleting}>
                Adicionar Novo Plano
            </Button>
        </Link>
      </div>

      {treatmentPlans.length === 0 && !isLoading ? ( 
        <Card>
          <p className="text-center text-gray-400 py-8">Nenhum plano de tratamento encontrado para este paciente.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {treatmentPlans.map((plan) => (
            <Card 
                key={plan.id} 
                title={
                    <div className="flex justify-between items-center">
                        <span>Plano Criado em: {plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'Data Indisponível'}</span>
                        <div className="flex items-center space-x-2"> 
                            <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan.id)} className="p-1.5" disabled={isLoading || isDeleting} aria-label="Editar Plano">
                                <PencilIcon className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => requestDeletePlan(plan)} className="p-1.5" disabled={isLoading || isDeleting} aria-label="Apagar Plano">
                                <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-300" />
                            </Button>
                        </div>
                    </div>
                }
            >
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Descrição:</h4>
                  <p className="text-gray-200 whitespace-pre-wrap">{plan.description}</p>
                </div>
                
                {plan.files && plan.files.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Arquivos Anexados:</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {plan.files.map((file, index) => (
                        <div key={index} className="flex flex-col items-center">
                          {isImageFile(file.name) ? (
                            <img 
                              src={file.url} 
                              alt={file.name} 
                              className="rounded-md w-24 h-24 cursor-pointer object-cover border border-gray-600 hover:opacity-80 transition-opacity"
                              onClick={() => openImageInModal(file.url)}
                              title={`Clique para ampliar: ${file.name}`}
                            />
                          ) : (
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-teal-400 hover:text-teal-300 hover:underline text-sm flex items-center justify-center w-24 h-24 bg-gray-700 rounded-md border border-gray-600"
                              title={`Baixar: ${file.name}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.165 12.165L10.5 16.5m0 0l2.165-2.165M10.5 16.5V7.875" />
                              </svg>
                            </a>
                          )}
                           <p className="text-xs text-gray-400 mt-1 w-24 truncate text-center" title={file.name}>{file.name}</p>
                        </div>
                      ))}
                    </div>
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
       <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <Button onClick={() => navigate(NavigationPath.PatientDetail.replace(':patientId', patient.cpf))} leftIcon={<ArrowUturnLeftIcon />} disabled={isLoading || isDeleting}>
              Voltar para Detalhes do Paciente
            </Button>
        </div>
        
        <ImageModal 
            isOpen={isImageModalOpen} 
            onClose={() => setIsImageModalOpen(false)} 
            imageUrl={selectedImageUrl} 
        />
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
