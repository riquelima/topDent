

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUturnLeftIcon, PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon, PrinterIcon } from '../components/icons/HeroIcons'; 
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
  const location = useLocation();
  const cameFromDentistDashboard = location.state?.fromDentistDashboard;

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
    navigate(NavigationPath.EditTreatmentPlan.replace(':planId', planId), { state: location.state });
  };

  const handlePrintPlan = (plan: SupabaseTreatmentPlanData) => {
    if (!patient) return;

    const printContent = `
        <html>
        <head>
            <title>Plano de Tratamento - ${patient.fullName}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; }
                @page { size: A4; margin: 20mm; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 25px; }
                .header img { height: 40px; }
                h1 { font-size: 26px; font-weight: 600; color: #111; margin: 0; }
                h2 { font-size: 20px; font-weight: 600; color: #222; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 25px; margin-bottom: 15px; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin-bottom: 20px; }
                .detail-item strong { display: block; font-size: 13px; color: #555; margin-bottom: 2px; text-transform: uppercase; }
                .detail-item span { font-size: 15px; }
                .description, .procedures { white-space: pre-wrap; background-color: #f9f9f9; padding: 12px; border-radius: 6px; border: 1px solid #eee; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
                th { background-color: #f2f2f2; font-weight: 600; }
                .signature-area { margin-top: 80px; text-align: center; }
                .signature-line { margin: 0 auto; border-top: 1px solid #000; width: 60%; }
                footer { position: fixed; bottom: 10mm; left: 20mm; right: 20mm; text-align: center; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="https://raw.githubusercontent.com/riquelima/topDentTest/refs/heads/main/logoSite.png" alt="Top Dent Logo" />
                <h1>Plano de Tratamento</h1>
            </div>

            <h2>Dados do Paciente</h2>
            <div class="details-grid">
                <div class="detail-item"><strong>Nome Completo:</strong> <span>${patient.fullName}</span></div>
                <div class="detail-item"><strong>CPF:</strong> <span>${patient.cpf}</span></div>
                <div class="detail-item"><strong>Data de Nascimento:</strong> <span>${isoToDdMmYyyy(patient.dob)}</span></div>
                <div class="detail-item"><strong>Telefone:</strong> <span>${patient.phone || 'Não informado'}</span></div>
            </div>

            <h2>Detalhes do Plano</h2>
            <div class="details-grid">
                <div class="detail-item"><strong>Data de Criação:</strong> <span>${plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'Não informado'}</span></div>
            </div>

            <h2>Descrição</h2>
            <p class="description">${plan.description}</p>

            ${plan.procedures_performed ? `<h2>Procedimentos Realizados</h2><p class="procedures">${plan.procedures_performed}</p>` : ''}
            ${plan.prescribed_medication ? `<h2>Medicação Prescrita</h2><p class="description">${plan.prescribed_medication}</p>` : ''}

            ${plan.payments && plan.payments.length > 0 ? `
                <h2>Pagamentos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Valor (R$)</th>
                            <th>Método</th>
                            <th>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${plan.payments.map(p => `
                            <tr>
                                <td>${isoToDdMmYyyy(p.payment_date)}</td>
                                <td>${parseFloat(p.value).toFixed(2).replace('.', ',')}</td>
                                <td>${p.payment_method}</td>
                                <td>${p.description || ''}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            ` : ''}
            
            ${plan.files && plan.files.length > 0 ? `
                <h2>Arquivos Anexados</h2>
                <ul>
                    ${plan.files.map(f => `<li>${f.name}</li>`).join('')}
                </ul>
            ` : ''}

            ${plan.dentist_signature ? `
                <div class="signature-area">
                    <div class="signature-line"></div>
                    <p style="margin-top: 8px;">${plan.dentist_signature}</p>
                    <p style="font-size: 13px; color: #555;">Assinatura do Dentista</p>
                </div>`
             : `
                <div class="signature-area">
                    <div class="signature-line"></div>
                    <p style="margin-top: 8px; font-size: 13px; color: #555;">Assinatura do Responsável</p>
                </div>
             `}
             
             <footer>
                <p>&copy; ${new Date().getFullYear()} Top Dent. Todos os direitos reservados.</p>
             </footer>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            } catch (e) {
                showToast('Impressão falhou ou foi cancelada.', 'warning');
                console.error("Print error:", e);
                printWindow.close();
            }
        }, 500);
    } else {
        showToast('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.', 'error');
    }
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
    return <div className="text-center py-10 text-[var(--text-secondary)]">Carregando planos de tratamento...</div>;
  }
  
  if (error) {
    return (
      <Card title="Erro">
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
        <Card title="Paciente não encontrado">
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
    <div>
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span className="text-white">Planos de Tratamento de {patient?.fullName}</span>
            {patientId && (
              <Link to={NavigationPath.TreatmentPlan} state={{ ...location.state, patientCpf: patientId, patientFullName: patient.fullName }}>
                <Button leftIcon={<PlusIcon className="w-5 h-5"/>} disabled={isDeleting}>
                  Novo Plano
                </Button>
              </Link>
            )}
          </div>
        }
      >
        {treatmentPlans.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">Nenhum plano de tratamento cadastrado para este paciente.</p>
        ) : (
          <div className="space-y-6">
            {treatmentPlans.map(plan => (
              <Card key={plan.id} className="bg-[var(--background-light)]">
                <div className="flex justify-between items-start">
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-semibold text-[var(--accent-cyan)]">Plano criado em {plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'N/A'}</h3>
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
                                        className="rounded w-16 h-16 cursor-pointer border border-[var(--border-color)] hover:opacity-80 object-cover"
                                        onClick={(e) => { e.preventDefault(); openImageInModal(file.url!); }}
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded bg-gray-700 flex flex-col items-center justify-center p-1 text-center border border-[var(--border-color)] hover:bg-gray-600">
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
                     <Button variant="ghost" size="sm" onClick={() => handlePrintPlan(plan)} disabled={isDeleting} className="p-1.5" title="Imprimir Plano"><PrinterIcon className="w-4 h-4 text-gray-300 hover:text-white" /></Button>
                     <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan.id)} disabled={isDeleting} className="p-1.5" title="Editar Plano"><PencilIcon className="w-4 h-4 text-[var(--accent-cyan)]" /></Button>
                     <Button variant="ghost" size="sm" onClick={() => requestDeletePlan(plan)} disabled={isDeleting} className="p-1.5" title="Apagar Plano"><TrashIcon className="w-4 h-4 text-[var(--accent-red)]" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center flex justify-center items-center space-x-4">
            <Button onClick={() => navigate(`/patient/${patientId}`)} leftIcon={<ArrowUturnLeftIcon />}>
                Voltar para Detalhes do Paciente
            </Button>
            {cameFromDentistDashboard && (
                <Button onClick={() => navigate(NavigationPath.Home)} leftIcon={<ArrowUturnLeftIcon />} variant="secondary">
                    Voltar para Dashboard
                </Button>
            )}
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