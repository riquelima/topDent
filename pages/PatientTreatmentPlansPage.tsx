
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
import { ImageModal } from '../components/ImageModal'; // Import the new modal

const isImageFile = (fileName: string | null | undefined): boolean => {
  if (!fileName) return false;
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.gif') || lowerName.endsWith('.webp');
};

export const PatientTreatmentPlansPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>(); 
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<SupabaseTreatmentPlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for ImageModal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

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

  const handleDeletePlan = async (planId: string | undefined) => {
    if (!planId) return;
    if (window.confirm("Tem certeza que deseja apagar este plano de tratamento? Esta ação não pode ser desfeita.")) {
      setIsLoading(true); 
      const { error: deleteError } = await deleteTreatmentPlan(planId);
      if (deleteError) {
        alert("Erro ao apagar o plano de tratamento: " + deleteError.message);
        console.error("Delete error:", deleteError);
      } else {
        alert("Plano de tratamento apagado com sucesso.");
        fetchPatientAndPlans(); 
      }
      setIsLoading(false);
    }
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
            <Button leftIcon={<PlusIcon className="w-5 h-5" />} disabled={isLoading}>
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
                            <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan.id)} className="p-1.5" disabled={isLoading} aria-label="Editar Plano">
                                <PencilIcon className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)} className="p-1.5" disabled={isLoading} aria-label="Apagar Plano">
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

                {plan.file_url && plan.file_names && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Arquivo Anexado:</h4>
                    {isImageFile(plan.file_names) ? (
                      <div className="mt-1">
                        <img 
                          src={plan.file_url} 
                          alt={plan.file_names} 
                          className="rounded-md max-w-[150px] max-h-24 cursor-pointer object-cover border border-gray-600 hover:opacity-80 transition-opacity"
                          onClick={() => openImageInModal(plan.file_url!)}
                          title={`Clique para ampliar: ${plan.file_names}`}
                        />
                        <p className="text-xs text-gray-400 mt-1">{plan.file_names}</p>
                      </div>
                    ) : (
                      <a 
                        href={plan.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300 hover:underline text-sm flex items-center"
                      >
                        {plan.file_names}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
                {!plan.file_url && plan.file_names && ( // Fallback if only file_names exists (old data)
                     <div>
                        <h4 className="text-sm font-medium text-gray-400">Arquivos Anexados (Nomes):</h4>
                        <p className="text-gray-300 text-xs">{plan.file_names}</p>
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
            <Button onClick={() => navigate(NavigationPath.PatientDetail.replace(':patientId', patient.cpf))} leftIcon={<ArrowUturnLeftIcon />} disabled={isLoading}>
              Voltar para Detalhes do Paciente
            </Button>
        </div>
        
        <ImageModal 
            isOpen={isImageModalOpen} 
            onClose={() => setIsImageModalOpen(false)} 
            imageUrl={selectedImageUrl} 
        /> 
    </div>
  );
};
