


import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { ArrowUturnLeftIcon, TrashIcon, ChevronUpDownIcon, PlusIcon, MagnifyingGlassIcon } from '../components/icons/HeroIcons';
import { NavigationPath, SupabaseTreatmentPlanData, Patient, PaymentInput, PaymentMethod } from '../types'; 
import { 
    addTreatmentPlan, 
    updateTreatmentPlan,
    getTreatmentPlanById,
    getSupabaseClient,
    getPatients 
} from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';

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
  const [dentistSignature, setDentistSignature] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null); 
  const [fileNamesDisplay, setFileNamesDisplay] = useState(''); 

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
            setDentistSignature(data.dentist_signature || '');
            setFileNamesDisplay(data.file_names || '');
            setCurrentFileUrl(data.file_url || null);
            setSelectedFile(null); 
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
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setFileNamesDisplay(event.target.files[0].name);
    } else {
      setSelectedFile(null);
      if (!isEditMode) setFileNamesDisplay(''); 
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileNamesDisplay(isEditMode ? (currentFileUrl ? "Arquivo existente será mantido se não selecionar novo" : "") : ""); 
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const clearForm = (clearCpf = true) => {
    if (clearCpf || !isEditMode) setPatientCPF(''); 
    setDescription('');
    setDentistSignature('');
    setFileNamesDisplay('');
    setSelectedFile(null);
    setCurrentFileUrl(null);
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
    if (!patientCPF.trim() && !cameFromDentistDashboard) { 
        showToast("CPF do Paciente é obrigatório se não estiver criando um plano geral a partir do dashboard do dentista.", "error");
        return;
    }
    if(!description.trim()){
        showToast("Descrição é obrigatória.", "error");
        return;
    }

    setIsLoading(true);
    
    let uploadedFileUrl: string | null = isEditMode ? currentFileUrl : null;
    let finalFileNames: string | null = isEditMode ? fileNamesDisplay : null;

    const supabase = getSupabaseClient();
    if (!supabase) {
        showToast("Erro de configuração: cliente Supabase não inicializado.", "error");
        setIsLoading(false);
        return;
    }

    const cpfForFilePath = patientCPF || (cameFromDentistDashboard ? location.state?.dentistUsernameContext || 'geral' : 'unknown_patient');

    if (selectedFile) {
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `public/${cpfForFilePath}/${Date.now()}-${sanitizedFileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET_NAME)
            .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });

        if (uploadError) {
            showToast('Erro ao fazer upload do arquivo. Verifique o console.', 'error');
            console.error("Supabase Storage upload error:", uploadError);
            setIsLoading(false);
            return;
        }
        
        const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePath);
        if (!publicUrlData || !publicUrlData.publicUrl) {
            showToast('Erro ao obter URL pública do arquivo.', 'error');
            setIsLoading(false);
            return;
        }
        uploadedFileUrl = publicUrlData.publicUrl;
        finalFileNames = selectedFile.name;
    } else if (isEditMode && fileNamesDisplay.trim() === '' && currentFileUrl) {
        uploadedFileUrl = null;
        finalFileNames = null;
    }


    const validPayments = payments
      .filter(p => p.value.trim() !== '' && p.payment_method !== '' && p.payment_date.trim() !== '')
      .map(p => {
        const stringValue = p.value.trim().replace(',', '.');
        return {...p, value: stringValue, description: p.description?.trim() || undefined };
      })
      .filter(p => p.value && !isNaN(parseFloat(p.value)));

    const planDataPayload: Partial<SupabaseTreatmentPlanData> = {
        patient_cpf: patientCPF, 
        description: description,
        file_names: finalFileNames ? finalFileNames.trim() : null,
        file_url: uploadedFileUrl,
        dentist_signature: dentistSignature.trim() || null,
        prescribed_medication: prescribedMedication.trim() || null,
        payments: validPayments.length > 0 ? validPayments : null,
    };

    try {
      if (isEditMode && planId) {
        const { patient_cpf: cpfToExclude, ...updatePayload } = planDataPayload; 
        const { error } = await updateTreatmentPlan(planId, updatePayload);
        if (error) throw error;
        showToast('Plano de Tratamento atualizado com sucesso!', 'success');
        if (cameFromDentistDashboard) {
          navigate(NavigationPath.Home);
        } else {
          navigate(NavigationPath.PatientTreatmentPlans.replace(':patientId', originalPatientCpf || patientCPF));
        }
      } else {
        if (!planDataPayload.patient_cpf && !cameFromDentistDashboard) {
            showToast('CPF do Paciente é obrigatório para novo plano.', 'error');
            setIsLoading(false);
            return;
        }
        const { error } = await addTreatmentPlan(planDataPayload as Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>);
        if (error) throw error;
        showToast('Plano de Tratamento salvo com sucesso!', 'success');
        clearForm();
        if (cameFromDentistDashboard) {
          navigate(NavigationPath.Home);
        } else if (patientCPF) {
          navigate(NavigationPath.PatientTreatmentPlans.replace(':patientId', patientCPF));
        } else {
          navigate(NavigationPath.AllTreatmentPlans); 
        }
      }
    } catch (error: any) {
        showToast('Erro ao salvar Plano de Tratamento: ' + error.message, 'error');
        console.error("Error saving treatment plan:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (cameFromDentistDashboard) {
        navigate(NavigationPath.Home); 
        return;
    }
    if (isEditMode && originalPatientCpf) {
      navigate(NavigationPath.PatientTreatmentPlans.replace(':patientId', originalPatientCpf));
    } else if (!isEditMode && patientCPF) {
      navigate(NavigationPath.PatientTreatmentPlans.replace(':patientId', patientCPF));
    } else {
      navigate(NavigationPath.AllTreatmentPlans);
    }
  };
  
  let backButtonText = "Voltar";
  if (cameFromDentistDashboard) {
      backButtonText = "Voltar para Dashboard";
  } else if (isEditMode && originalPatientCpf) {
      backButtonText = "Voltar para Planos do Paciente";
  } else if (!isEditMode && patientCPF) {
      backButtonText = "Voltar para Planos do Paciente";
  } else {
      backButtonText = "Voltar para Lista de Planos";
  }


  if (isLoading && isEditMode && !description && !currentFileUrl) { 
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando plano para edição...</div>;
  }
  if (pageError) {
    return (
        <div className="max-w-6xl mx-auto"><Card title="Erro" className="bg-[#1a1a1a]" titleClassName="text-white">
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
    <div className="max-w-6xl mx-auto">
      <Card title={ <div className="flex justify-between items-center w-full"> <span className="text-xl font-semibold text-white">{pageTitle}</span> <Link to={NavigationPath.AllTreatmentPlans}><Button variant="ghost" size="sm">Ver Todos os Planos</Button></Link> </div> } className="bg-[#1a1a1a]">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="relative" ref={patientDropdownRef}>
            <label htmlFor="patientCPF" className="block text-sm font-medium text-[#b0b0b0] mb-1">CPF do Paciente {!cameFromDentistDashboard && '*'}</label>
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
                    required={!cameFromDentistDashboard} 
                    disabled={isLoading || isEditMode || cameFromDentistDashboard && isEditMode} 
                    containerClassName="mb-0 flex-grow" 
                    className="rounded-r-none h-[46px]" 
                    prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400"/>}
                />
              <Button type="button" onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)} className="px-3 bg-[#1f1f1f] hover:bg-gray-700 border border-l-0 border-gray-700 rounded-l-none rounded-r-md h-[46px]" aria-expanded={isPatientDropdownOpen} aria-haspopup="listbox" title="Selecionar Paciente" disabled={isLoading || isEditMode || isLoadingPatients || (cameFromDentistDashboard && isEditMode)}><ChevronUpDownIcon className="w-5 h-5 text-gray-400" /></Button>
            </div>
            {isPatientDropdownOpen && !(isEditMode || (cameFromDentistDashboard && isEditMode)) && (<div className="absolute top-full left-0 right-0 mt-1 w-full bg-[#1f1f1f] border border-gray-700 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {isLoadingPatients ? <p className="text-sm text-gray-400 text-center py-2">Carregando pacientes...</p> : filteredDropdownPatients.length > 0 ? <ul>{filteredDropdownPatients.map(p => (<li key={p.id} onClick={() => handlePatientSelect(p)} className="px-3 py-2 text-sm text-white hover:bg-[#00bcd4] hover:text-black cursor-pointer" role="option" aria-selected={patientCPF === p.cpf}>{p.fullName} <span className="text-xs text-gray-400">({p.cpf})</span></li>))}</ul> : <p className="text-sm text-gray-400 text-center py-2">Nenhum paciente encontrado.</p>}
            </div>)}
          </div>

          <Textarea label="Descrição Detalhada do Plano de Tratamento e Observações *" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Descreva o tratamento proposto, observações, etc." required disabled={isLoading} />
          
          <Textarea label="Medicação Prescrita" value={prescribedMedication} onChange={(e) => setPrescribedMedication(e.target.value)} rows={3} placeholder="Liste as medicações prescritas, dosagens e instruções." disabled={isLoading} />

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#00bcd4] border-b border-gray-700 pb-2">Pagamentos Realizados</h3>
            {payments.map((payment, index) => (
              <div key={index} className="p-4 border border-gray-700 rounded-lg bg-[#1f1f1f] space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-md font-semibold text-white">Pagamento {index + 1}</p>
                  {payments.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removePaymentRow(index)} className="p-1 text-[#f44336] hover:text-red-400" disabled={isLoading}><TrashIcon className="w-4 h-4" /></Button>}
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
            {payments.length < 4 && <Button type="button" variant="ghost" size="sm" onClick={addPaymentRow} leftIcon={<PlusIcon />} disabled={isLoading}>Adicionar Pagamento</Button>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#b0b0b0] mb-1">Upload de Arquivo (Exames, Radiografias - PDF, PNG, JPG)</label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg bg-[#1f1f1f] ${isLoading ? 'opacity-70' : ''}`}>
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="flex text-sm text-gray-400">
                  <label htmlFor="file-upload" className={`relative bg-gray-700 rounded-md font-medium text-[#00bcd4] hover:text-[#00a5b8] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-[#1f1f1f] focus-within:ring-[#00bcd4] px-2 py-1 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}><span>Carregar arquivo</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} ref={fileInputRef} accept=".png,.jpg,.jpeg,.pdf" disabled={isLoading} /></label>
                  <p className="pl-1">ou arraste e solte</p>
                </div><p className="text-xs text-gray-500">PNG, JPG, PDF. Um arquivo por vez.</p>
              </div>
            </div>
            {fileNamesDisplay && (<div className="mt-3 p-3 border border-gray-700 rounded-lg bg-[#1f1f1f]"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-[#b0b0b0]">{selectedFile ? "Arquivo selecionado:" : (isEditMode && currentFileUrl ? "Arquivo atual:" : "Nome do arquivo:")}</p><p className="text-sm text-[#00bcd4] truncate" title={fileNamesDisplay}>{fileNamesDisplay}</p>{isEditMode && currentFileUrl && !selectedFile && (<a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Visualizar atual</a>)}</div><Button type="button" variant="ghost" size="sm" onClick={removeSelectedFile} className="p-1" disabled={isLoading} aria-label="Remover arquivo selecionado"><TrashIcon className="w-4 h-4 text-[#f44336] hover:text-red-400" /></Button></div></div>)}
            {isEditMode && (<Input label="Nome do Arquivo (se desejar remover o arquivo existente e não adicionar novo, apague o nome abaixo e salve)" type="text" value={fileNamesDisplay} onChange={(e) => setFileNamesDisplay(e.target.value)} placeholder="Nome do arquivo anexo" disabled={isLoading} containerClassName='mt-3 mb-0' />)}
          </div>
          
          <Input label="Assinatura do Dentista (Nome Digitado)" value={dentistSignature} onChange={(e) => setDentistSignature(e.target.value)} placeholder="Digite o nome completo do dentista responsável" disabled={isLoading} />

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleBackNavigation} 
              leftIcon={<ArrowUturnLeftIcon />} 
              disabled={isLoading}
            >
              {backButtonText}
            </Button>
            {!isEditMode && (<Button type="button" variant="danger" onClick={() => clearForm(true)} disabled={isLoading}>Limpar Plano</Button>)}
            <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Salvando...' : (isEditMode ? 'Atualizar Plano' : 'Salvar Plano de Tratamento')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};