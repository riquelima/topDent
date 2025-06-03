
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input'; // Added import
import { ArrowUturnLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '../components/icons/HeroIcons';
import { NavigationPath, TreatmentPlanWithPatientInfo } from '../types'; // TreatmentPlanWithPatientInfo imported from types
import { 
    getAllTreatmentPlans, 
    deleteTreatmentPlan
} from '../services/supabaseService';
import { isoToDdMmYyyy } from '../src/utils/formatDate';

export const AllTreatmentPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [allPlans, setAllPlans] = useState<TreatmentPlanWithPatientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getAllTreatmentPlans();
      if (fetchError) {
        throw fetchError;
      }
      setAllPlans(data || []);
    } catch (err: any) {
      console.error("Error fetching all treatment plans:", err);
      setError("Falha ao carregar todos os planos de tratamento: " + err.message);
      setAllPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

  const handleEditPlan = (planId: string | undefined) => {
    if (!planId) return;
    navigate(NavigationPath.EditTreatmentPlan.replace(':planId', planId));
  };

  const handleDeletePlan = async (planId: string | undefined) => {
    if (!planId) return;
    if (window.confirm("Tem certeza que deseja apagar este plano de tratamento? Esta ação não pode ser desfeita.")) {
      // Consider adding a loading state specifically for delete if it takes time
      const { error: deleteError } = await deleteTreatmentPlan(planId);
      if (deleteError) {
        alert("Erro ao apagar o plano de tratamento: " + deleteError.message);
        console.error("Delete error:", deleteError);
      } else {
        alert("Plano de tratamento apagado com sucesso.");
        fetchAllPlans(); // Refresh the list
      }
    }
  };

  const filteredPlans = allPlans.filter(plan =>
    (plan.patient_full_name && plan.patient_full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    plan.patient_cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (isLoading) {
    return <div className="text-center py-10 text-gray-400">Carregando todos os planos de tratamento...</div>;
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
        <h1 className="text-3xl font-bold text-white">Todos os Planos de Tratamento</h1>
        <Link to={NavigationPath.TreatmentPlan}>
          <Button leftIcon={<PlusIcon />} disabled={isLoading}>
            Criar Novo Plano
          </Button>
        </Link>
      </div>
      
      <Input
        placeholder="Buscar por paciente, CPF ou descrição..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        containerClassName="mb-6"
      />

      {filteredPlans.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-8">
            {allPlans.length === 0 ? "Nenhum plano de tratamento cadastrado." : "Nenhum plano encontrado com o termo buscado."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredPlans.map((plan) => (
            <Card 
                key={plan.id}
                title={
                    <div className="flex justify-between items-center">
                        <span>Paciente: {plan.patient_full_name} (CPF: {plan.patient_cpf})</span>
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan.id)} className="p-1.5" aria-label="Editar Plano">
                                <PencilIcon className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)} className="p-1.5" aria-label="Apagar Plano">
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
            <Button onClick={() => navigate(NavigationPath.TreatmentPlan)} leftIcon={<ArrowUturnLeftIcon />}>
              Voltar para Criação de Planos
            </Button>
        </div>
    </div>
  );
};
