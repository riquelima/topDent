

import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { ArrowUturnLeftIcon, TrashIcon, ChevronUpDownIcon, PlusIcon, MagnifyingGlassIcon, DocumentTextIcon } from '../components/icons/HeroIcons';
import { NavigationPath, SupabaseTreatmentPlanData, Patient, PaymentInput, PaymentMethod } from '../types'; 
import { 
    addTreatmentPlan, 
    updateTreatmentPlan,
    getTreatmentPlanById,
    getSupabaseClient,
    getPatients 
} from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import type { UserRole } from '../App';

const STORAGE_BUCKET_NAME = 'treatmentfiles'; 

const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "Cartão de Crédito", label: "Cartão de Crédito" },
  { value: "Cartão de Débito", label: "Cartão de Débito" },
  { value: "PIX", label: "PIX" },
  { value: "Transferência Bancária", label: "Transferência Bancária" },
  { value: "Boleto", label: "Boleto" },
  { value: "Outro", label: "Outro" },
];

const isImageFile = (fileName: string | null | undefined): boolean => {
  if (!fileName) return false;
  const lowerName = fileName.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff'].some(ext => lowerName.endsWith(ext));
};

export const TreatmentPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams<{ planId?: string }>(); 
  const isEditMode = !!planId;
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  
  const [patientCPF, setPatientCPF] = useState('');
  const [description, setDescription] = useState('');
  const [proceduresPerformed, setProceduresPerformed] = useState('');
  const [dentistSignature, setDentistSignature] = useState('');
  
  const [currentFiles, setCurrentFiles] = useState<{ name: string; url: string; }[]>([]);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalPatientCpf, setOriginalPatientCpf] = useState<string | null>(null);

  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchTermDropdown, setPatientSearchTermDropdown] = useState('');
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  const [prescribedMedication, setPrescribedMedication] = useState('');
  const [payments, setPayments] = useState<PaymentInput[]>([{ value: '', payment_method: '', payment_date: '', description: '' }]);

  const cameFromDentistDashboard = location.state?.fromDentistDashboard;
  const [userRole, setUserRole] = useState<UserRole>(null);
  
  const [localImagePreviews, setLocalImagePreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    // This effect runs once to get the user role for robust navigation
    try {
      const persistedSession = localStorage.getItem('topDentUserSession_v1');
      if (persistedSession) {
        const sessionData = JSON.parse(persistedSession);
        setUserRole(sessionData.userRole || null);
      }
    } catch (error) {
      console.error("Could not parse user session from localStorage.", error);
    }
  }, []);

  const fetchPatientsForDropdown = useCallback(async () => {
    if (isEditMode) return; 
    setIsLoadingPatients(true);
    const { data, error } = await getPatients();
    if (error) {
      showToast('Erro ao carregar lista de pacientes.', 'error');
      console.error("Error fetching patients for dropdown:", error);
    } else {
      setAllPatientsList(data || []);
    }
    setIsLoadingPatients(false);
  }, [showToast, isEditMode]);

  useEffect(() => {
    fetchPatientsForDropdown();
  }, [fetchPatientsForDropdown]);

  useEffect(() => {
    if (isEditMode && planId) {
      setIsLoading(true);
      setPageError(null);
      getTreatmentPlanById(planId)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching treatment plan for edit:", error);
            setPageError("Falha ao carregar plano de tratamento para edição.");
            showToast("Falha ao carregar plano de tratamento.", "error");
          } else if (data) {
            setPatientCPF(data.patient_cpf);
            setOriginalPatientCpf(data.patient_cpf); 
            setDescription(data.description);
            setProceduresPerformed(data.procedures_performed || '');
            setDentistSignature(data.dentist_signature || '');
            setCurrentFiles(data.files || []);
            setNewlySelectedFiles([]); 
            setPrescribedMedication(data.prescribed_medication || '');
            setPayments(data.payments?.map(p => ({...p, description: p.description || ''})) || [{ value: '', payment_method: '', payment_date: '', description: '' }]);
          } else {
            setPageError("Plano de tratamento não encontrado.");
            showToast("Plano de tratamento não encontrado.", "error");
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      clearForm(false); 
    }
  }, [planId, isEditMode, showToast]);
  
  useEffect(() => {
    const newPreviews: Record<string, string> = {};
    newlySelectedFiles.forEach(file => {
      if (isImageFile(file.name)) {
        newPreviews[file.name] = URL.createObjectURL(file);
      }
    });
    setLocalImagePreviews(newPreviews);

    return () => {
      Object.values(newPreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [newlySelectedFiles]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewlySelectedFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files)]);
    }
  };

  const removeCurrentFile = (index: number) => {
    setCurrentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewlySelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const clearForm = (clearCpf = true) => {
    if (clearCpf || !isEditMode) setPatientCPF(''); 
    setDescription('');
    setProceduresPerformed('');
    setDentistSignature('');
    setNewlySelectedFiles([]);
    setCurrentFiles([]);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setPatientSearchTermDropdown('');
    setIsPatientDropdownOpen(false);
    setPrescribedMedication('');
    setPayments([{ value: '', payment_method: '', payment_date: '', description: '' }]);
  };

  const handlePatientSelect = (patient: Patient) => {
    setPatientCPF(patient.cpf);
    setPatientSearchTermDropdown(''); 
    setIsPatientDropdownOpen(false);
  };

  const handlePaymentChange = (index: number, field: keyof PaymentInput, value: string | PaymentMethod) => {
    const newPayments = payments.map((payment, i) => {
      if (i === index) {
        return { ...payment, [field]: value };
      }
      return payment;
    });
    setPayments(newPayments);
  };

  const addPaymentRow = () => {
    if (payments.length < 4) {
      setPayments([...payments, { value: '', payment_method: '', payment_date: '', description: '' }]);
    } else {
      showToast("Máximo de 4 entradas de pagamento atingido.", "warning");
    }
  };

  const removePaymentRow = (index: number) => {
    if (payments.length > 1) {
      const newPayments = payments.filter((_, i) => i !== index);
      setPayments(newPayments);
    } else { 
      setPayments([{ value: '', payment_method: '', payment_date: '', description: '' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientCPF || !patientCPF.trim()) {
        showToast("É necessário selecionar um paciente para o plano de tratamento.", "error");
        return;
    }
    if(!description.trim()){
        showToast("Descrição é obrigatória.", "error");
        return;
    }

    setIsLoading(true);
    
    let uploadedFilesData: { name: string; url: string; }[] = [];

    const supabase = getSupabaseClient();
    if (!supabase) {
        showToast("Erro de configuração: cliente Supabase não inicializado.", "error");
        setIsLoading(false);
        return;
    }

    const cpfForFilePath = patientCPF || (userRole === 'dentist' ? location.state?.dentistUsernameContext || 'geral' : 'unknown_patient');

    if (newlySelectedFiles.length > 0) {
      const uploadPromises = newlySelectedFiles.map(async (file) => {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `public/${cpfForFilePath}/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET_NAME)
            .upload(filePath, file, { cacheControl: '3600', upsert: true });
        
        if (uploadError) {
          throw new Error(`Falha no upload do arquivo ${file.name}: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePath);
        if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error(`Falha ao obter URL pública para ${file.name}.`);
        }
        return { name: file.name, url: publicUrlData.publicUrl };
      });

      try {
        uploadedFilesData = await Promise.all(uploadPromises);
      } catch (uploadError: any) {
        showToast(uploadError.message, 'error');
        console.error("Supabase Storage upload error:", uploadError);
        setIsLoading(false);
        return;
      }
    }

    const finalFiles = [...currentFiles, ...uploadedFilesData];

    const validPayments = payments
      .filter(p => p.value.trim() !== '' && p.payment_method !== '' && p.payment_date.trim() !== '')
      .map(p => {
        const stringValue = p.value.trim().replace(',', '.');
        return {...p, value: stringValue, description: p.description?.trim() || undefined };
      })
      .filter(p => p.value && !isNaN(parseFloat(p.value)));

    const planDataPayload: { [key: string]: any } = {
        patient_cpf: patientCPF, 
        description: description,
        procedures_performed: proceduresPerformed.trim() || null,
        dentist_signature: dentistSignature.trim() || null,
        prescribed_medication: prescribedMedication.trim() || null,
    };

    if (finalFiles.length > 0) {
        planDataPayload.files = finalFiles;
    }

    if (validPayments.length > 0) {
        planDataPayload.payments = validPayments;
    }

    try {
      if (isEditMode && planId) {
        const { patient_cpf: cpfToExclude, ...updatePayload } = planDataPayload; 
        const { error } = await updateTreatmentPlan(planId, updatePayload);
        if (error) throw error;
        showToast('Plano de Tratamento atualizado com sucesso!', 'success');
        if (userRole === 'dentist') {
          navigate(NavigationPath.Home);
        } else {
          navigate(NavigationPath.PatientTreatmentPlans.replace(':patientId', originalPatientCpf || patientCPF));
        }
      } else {
        const { error } = await addTreatmentPlan(planDataPayload as Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>);
        if (error) throw error;
        showToast('Plano de Tratamento salvo com sucesso!', 'success');
        clearForm();
        if (userRole === 'dentist') {
          navigate(NavigationPath.Home);
        } else if (patientCPF) {
          navigate(NavigationPath.PatientTreatmentPlans.replace(':patientId', patientCPF));
        } else {
          navigate(NavigationPath.AllTreatmentPlans); 
        }
      }
    } catch (err: unknown) {
        let errorMessage = "Ocorreu uma falha inesperada.";
        let hint = "";

        if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string') {
            errorMessage = (err as { message: string }).message;
            if ('hint' in err && typeof (err as any).hint === 'string') {
                 hint = (err as any).hint;
            }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        if (errorMessage.includes("violates foreign key constraint")) {
            errorMessage = "Erro de integridade de dados.";
            hint = "Verifique se o CPF do paciente está correto e se o paciente já está cadastrado no sistema.";
        } else if (errorMessage.includes("Could not find the 'files' column")) {
            errorMessage = "A coluna 'files' para salvar anexos não foi encontrada no banco de dados.";
            hint = "Por favor, aplique a atualização de banco de dados pendente que foi fornecida.";
        } else if (errorMessage.includes("Could not find the 'payments' column")) {
             errorMessage = "A coluna 'payments' para salvar pagamentos não foi encontrada no banco de dados.";
             hint = "Por favor, aplique a atualização de banco de dados pendente que foi fornecida.";
        }

        const finalMessage = `Erro ao salvar: ${errorMessage}${hint ? ` (Dica: ${hint})` : ''}`;
        
        showToast(finalMessage, 'error', 12000);
        console.error("Error saving treatment plan:", err);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading && isEditMode && !description) { 
    return <div className="text-center py-10 text-[var(--text-secondary)]">Carregando plano para edição...</div>;
  }
  if (pageError) {
    return (
        <div><Card title="Erro">
            <p className="text-red-500 text-center py-4">{pageError}</p>
            <div className="text-center mt-4"><Button onClick={() => navigate(-1)} leftIcon={<ArrowUturnLeftIcon />} variant="secondary">Voltar</Button></div>
        </Card></div>
    );
  }

  const filteredDropdownPatients = allPatientsList.filter(p => 
    p.fullName.toLowerCase().includes(patientSearchTermDropdown.toLowerCase()) ||
    p.cpf.includes(patientSearchTermDropdown)
  );
  const pageTitle = isEditMode ? "Editar Plano de Tratamento" : "Novo Plano de Tratamento";

  return (
    <div>
      <Card title={ <div className="flex justify-between items-center w-full"> <span className="text-xl font-semibold text-white">{pageTitle}</span> <Link to={NavigationPath.AllTreatmentPlans}><Button variant="ghost" size="sm">Ver Todos os Planos</Button></Link> </div> }>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="relative" ref={patientDropdownRef}>
            <label htmlFor="patientCPF" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">CPF do Paciente *</label>
            <div className="flex">
                <Input 
                    id="patientCPF" name="patientCPF" 
                    value={patientSearchTermDropdown || patientCPF} 
                    onChange={(e) => {
                        setPatientSearchTermDropdown(e.target.value);
                        setPatientCPF(e.target.value); 
                        if(e.target.value.trim() !== '') setIsPatientDropdownOpen(true); else setIsPatientDropdownOpen(false);
                    }}
                    placeholder="Buscar por Nome ou CPF" 
                    required={userRole !== 'dentist'}
                    disabled={isLoading || isEditMode || (userRole === 'dentist' && isEditMode)} 
                    containerClassName="mb-0 flex-grow" 
                    className="rounded-r-none h-[46px]" 
                    prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400"/>}
                />
              <Button type="button" onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)} className="px-3 bg-[var(--background-light)] hover:bg-[var(--background-dark)] border border-l-0 border-[var(--border-color)] rounded-l-none rounded-r-2xl h-[46px]" aria-expanded={isPatientDropdownOpen} aria-haspopup="listbox" title="Selecionar Paciente" disabled={isLoading || isEditMode || isLoadingPatients || (userRole === 'dentist' && isEditMode)}><ChevronUpDownIcon className="w-5 h-5 text-gray-400" /></Button>
            </div>
            {isPatientDropdownOpen && !(isEditMode || (userRole === 'dentist' && isEditMode)) && (<div className="absolute top-full left-0 right-0 mt-1 w-full bg-[var(--background-light)] border border-[var(--border-color)] rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                {isLoadingPatients ? <p className="text-sm text-gray-400 text-center py-2">Carregando pacientes...</p> : filteredDropdownPatients.length > 0 ? <ul>{filteredDropdownPatients.map(p => (<li key={p.id} onClick={() => handlePatientSelect(p)} className="px-3 py-2 text-sm text-white hover:bg-[var(--accent-cyan)] hover:text-black cursor-pointer" role="option" aria-selected={patientCPF === p.cpf}>{p.fullName} <span className="text-xs text-gray-400">({p.cpf})</span></li>))}</ul> : <p className="text-sm text-gray-400 text-center py-2">Nenhum paciente encontrado.</p>}
            </div>)}
          </div>

          <Textarea label="Descrição Detalhada do Plano de Tratamento e Observações *" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Descreva o tratamento proposto, observações, etc." required disabled={isLoading} />
          
          <Textarea label="Procedimentos Realizados" value={proceduresPerformed} onChange={(e) => setProceduresPerformed(e.target.value)} rows={4} placeholder="Liste os procedimentos que já foram concluídos para este plano." disabled={isLoading} />

          <Textarea label="Medicação Prescrita" value={prescribedMedication} onChange={(e) => setPrescribedMedication(e.target.value)} rows={3} placeholder="Liste as medicações prescritas, dosagens e instruções." disabled={isLoading} />

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-2">Pagamentos Realizados</h3>
            {payments.map((payment, index) => (
              <div key={index} className="p-4 border border-[var(--border-color)] rounded-xl bg-[var(--background-light)] space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-md font-semibold text-white">Pagamento {index + 1}</p>
                  {payments.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removePaymentRow(index)} className="p-1 text-[var(--accent-red)] hover:text-red-400" disabled={isLoading}><TrashIcon className="w-4 h-4" /></Button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Valor (R$)" type="text" placeholder="Ex: 150,00" value={payment.value} onChange={(e) => handlePaymentChange(index, 'value', e.target.value)} disabled={isLoading} containerClassName="mb-0" />
                  <Select label="Forma de Pagamento" value={payment.payment_method} onChange={(e) => handlePaymentChange(index, 'payment_method', e.target.value as PaymentMethod)} options={paymentMethodOptions} placeholder="Selecione..." disabled={isLoading} containerClassName="mb-0" />
                  <DatePicker label="Data do Pagamento" value={payment.payment_date} onChange={(e) => handlePaymentChange(index, 'payment_date', e.target.value)} disabled={isLoading} containerClassName="mb-0" />
                </div>
                <Input 
                  label="Descrição do Pagamento (Opcional)" 
                  type="text" 
                  placeholder="Ex: Referente à consulta inicial" 
                  value={payment.description || ''}
                  onChange={(e) => handlePaymentChange(index, 'description', e.target.value)} 
                  disabled={isLoading} 
                  containerClassName="mb-0" 
                />
              </div>
            ))}
            {payments.length < 4 && <Button type="button" variant="secondary" size="sm" onClick={addPaymentRow} leftIcon={<PlusIcon />} disabled={isLoading}>Adicionar Pagamento</Button>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Upload de Arquivos (Exames, Radiografias, etc.)</label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[var(--border-color)] border-dashed rounded-2xl bg-[var(--background-light)] ${isLoading ? 'opacity-70' : ''}`}>
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="flex text-sm text-[var(--text-secondary)]">
                  <label htmlFor="file-upload" className={`relative bg-[var(--background-dark)] rounded-md font-medium text-[var(--accent-cyan)] hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-[var(--background-light)] focus-within:ring-[var(--accent-cyan)] px-2 py-1 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}><span>Carregar arquivos</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} ref={fileInputRef} disabled={isLoading} multiple /></label>
                  <p className="pl-1">ou arraste e solte</p>
                </div><p className="text-xs text-gray-500">Qualquer tipo de arquivo é aceito.</p>
              </div>
            </div>
            
            {(currentFiles.length > 0 || newlySelectedFiles.length > 0) && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-[var(--text-secondary)]">Arquivos Anexados:</h4>
                {currentFiles.map((file, index) => (
                    <div key={file.url} className="flex items-center justify-between p-2 bg-[var(--background-light)] rounded-xl border border-[var(--border-color)]">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isImageFile(file.name) ? <img src={file.url} alt={`Preview of ${file.name}`} className="w-10 h-10 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center flex-shrink-0"><DocumentTextIcon className="w-6 h-6 text-gray-400" /></div>}
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent-cyan)] hover:underline truncate" title={file.name}>{file.name}</a>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCurrentFile(index)} className="p-1 ml-2" disabled={isLoading} aria-label={`Remover ${file.name}`}><TrashIcon className="w-4 h-4 text-[var(--accent-red)] hover:text-red-400" /></Button>
                    </div>
                ))}
                 {newlySelectedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-[var(--background-light)] rounded-xl border border-teal-800">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                             {isImageFile(file.name) ? <img src={localImagePreviews[file.name]} alt={`Preview of ${file.name}`} className="w-10 h-10 rounded object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center flex-shrink-0"><DocumentTextIcon className="w-6 h-6 text-gray-400" /></div>}
                            <span className="text-sm text-white truncate" title={file.name}>{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeNewFile(index)} className="p-1 ml-2" disabled={isLoading} aria-label={`Remover ${file.name}`}><TrashIcon className="w-4 h-4 text-[var(--accent-red)] hover:text-red-400" /></Button>
                    </div>
                ))}
              </div>
            )}
          </div>
          
          <Input label="Assinatura do Dentista (Nome Digitado)" value={dentistSignature} onChange={(e) => setDentistSignature(e.target.value)} placeholder="Digite o nome completo do dentista responsável" disabled={isLoading} />

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate(-1)} 
              leftIcon={<ArrowUturnLeftIcon />} 
              disabled={isLoading}
            >
              Voltar
            </Button>
            {cameFromDentistDashboard && (
              <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => navigate(NavigationPath.Home)} 
                  leftIcon={<ArrowUturnLeftIcon />} 
                  disabled={isLoading}
              >
                  Voltar para Dashboard
              </Button>
            )}
            {!isEditMode && (<Button type="button" variant="danger" onClick={() => clearForm(true)} disabled={isLoading}>Limpar Plano</Button>)}
            <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Salvando...' : (isEditMode ? 'Atualizar Plano' : 'Salvar Plano de Tratamento')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};