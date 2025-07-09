import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUturnLeftIcon, PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon } from '../components/icons/HeroIcons'; 
import { Patient, NavigationPath, SupabaseTreatmentPlanData } from '../types'; 
import { 
    getPatientByCpf, 
    getTreatmentPlansByPatientCpf,
    deleteTreatmentPlan 
} from '../services/supabaseService';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { ImageModal } from '../components/ImageModal'; 
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

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
    try {
        const { error: deleteError } = await deleteTreatmentPlan(planToDelete.id);
        if (deleteError) throw deleteError;
        showToast('Plano de tratamento apagado com sucesso.', 'success');
        fetchPatientAndPlans(); // Re-fetch data
    } catch (err: any) {
        showToast('Erro ao apagar o plano de tratamento: ' + err.message, 'error');
        console.error("Error deleting plan:", err);
    } finally {
        setIsDeleting(false);
        closeConfirmDeleteModal();
    }
  };

  const openImageInModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageInModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl(null);
  };
  
  if (isLoading) {
    return <div className="text-center py-10 text-gray-400">Carregando planos de tratamento...</div>;
  }
  
  if (error) {
    return (
      <Card title="Erro" className="bg-[#1a1a1a]">
        <p className="text-center text-red-400 py-8">{error}</p>
        <div className="mt-6 text-center">
            <Button onClick={() => navigate(NavigationPath.PatientsList)} leftIcon={<ArrowUturnLeftIcon />}>
                Voltar para Lista de Pacientes
            </Button>
        </div>
      </Card>
    );
  }
  
  if (!patient) {
      return (
        <Card title="Paciente não encontrado" className="bg-[#1a1a1a]">
            <p className="text-center text-red-400 py-8">Não foi possível encontrar o paciente. Verifique o CPF fornecido.</p>
            <div className="mt-6 text-center">
                <Button onClick={() => navigate(NavigationPath.PatientsList)} leftIcon={<ArrowUturnLeftIcon />}>
                    Voltar para Lista de Pacientes
                </Button>
            </div>
        </Card>
      );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span className="text-white">Planos de Tratamento de {patient?.fullName}</span>
            {patientId && (
              <Link to={NavigationPath.TreatmentPlan} state={{ patientCpf: patientId, patientFullName: patient.fullName }}>
                <Button leftIcon={<PlusIcon className="w-5 h-5"/>} disabled={isDeleting}>
                  Novo Plano
                </Button>
              </Link>
            )}
          </div>
        }
        className="bg-[#1a1a1a]"
      >
        {treatmentPlans.length === 0 ? (
          <p className="text-center text-[#b0b0b0] py-8">Nenhum plano de tratamento cadastrado para este paciente.</p>
        ) : (
          <div className="space-y-6">
            {treatmentPlans.map(plan => (
              <Card key={plan.id} className="bg-[#1f1f1f]">
                <div className="flex justify-between items-start">
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-semibold text-[#00bcd4]">Plano criado em {plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'N/A'}</h3>
                    <p className="mt-2 text-gray-200 whitespace-pre-wrap">{plan.description}</p>
                    {plan.procedures_performed && (
                        <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">
                            <strong className="text-gray-300">Procedimentos Realizados:</strong> {plan.procedures_performed}
                        </p>
                    )}
                    {plan.prescribed_medication && (
                        <p className="mt-2 text-sm text-gray-400">
                            <strong>Medicação Prescrita:</strong> {plan.prescribed_medication}
                        </p>
                    )}
                    {plan.payments && plan.payments.length > 0 && (
                        <div className="mt-2">
                            <h4 className="text-sm font-medium text-gray-300">Pagamentos Registrados:</h4>
                            <ul className="list-disc list-inside ml-4 text-xs text-gray-200">
                                {plan.payments.map((p, i) => <li key={i}>{p.payment_method}: R$ {p.value} em {isoToDdMmYyyy(p.payment_date)}</li>)}
                            </ul>
                        </div>
                    )}
                    {plan.dentist_signature && (
                        <p className="mt-2 text-xs text-gray-500 italic">Assinado por: {plan.dentist_signature}</p>
                    )}
                    {plan.files && plan.files.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Arquivos Anexados:</h4>
                        <div className="flex flex-wrap gap-2">
                          {plan.files.map((file, index) => (
                             <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" title={file.name}>
                                {isImageFile(file.name) ? (
                                    <img 
                                        src={file.url} alt={file.name || 'Anexo'} 
                                        className="rounded w-16 h-16 cursor-pointer border border-gray-600 hover:opacity-80 object-cover"
                                        onClick={(e) => { e.preventDefault(); openImageInModal(file.url!); }}
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded bg-gray-700 flex flex-col items-center justify-center p-1 text-center border border-gray-600 hover:bg-gray-600">
                                        <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                                        <span className="text-xs text-gray-400 mt-1 truncate w-full">{file.name}</span>
                                    </div>
                                )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-2">
                     <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan.id)} disabled={isDeleting} className="p-1.5" title="Editar Plano"><PencilIcon className="w-4 h-4 text-[#00bcd4]" /></Button>
                     <Button variant="ghost" size="sm" onClick={() => requestDeletePlan(plan)} disabled={isDeleting} className="p-1.5" title="Apagar Plano"><TrashIcon className="w-4 h-4 text-[#f44336]" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <Button onClick={() => navigate(`/patient/${patientId}`)} leftIcon={<ArrowUturnLeftIcon />}>
                Voltar para Detalhes do Paciente
            </Button>
        </div>
      </Card>
      
      <ImageModal isOpen={isImageModalOpen} onClose={closeImageInModal} imageUrl={selectedImageUrl} />
      
      <ConfirmationModal 
        isOpen={isConfirmDeleteModalOpen}
        onClose={closeConfirmDeleteModal}
        onConfirm={executeDeletePlan}
        title="Confirmar Exclusão de Plano"
        message={<>Tem certeza que deseja apagar o seguinte plano? <strong className="text-white">"{planToDelete?.description}"</strong>? Esta ação não pode ser desfeita.</>}
        confirmButtonText="Apagar Plano"
        isLoading={isDeleting}
      />
    </div>
  );
};