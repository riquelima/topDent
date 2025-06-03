import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowUturnLeftIcon, TrashIcon } from '../components/icons/HeroIcons';
import { NavigationPath, SupabaseTreatmentPlanData } from '../types'; 
import { 
    addTreatmentPlan, 
    updateTreatmentPlan,
    getTreatmentPlanById,
    getSupabaseClient // Import Supabase client for storage operations
} from '../services/supabaseService';

const STORAGE_BUCKET_NAME = 'treatmentfiles'; // User's correct bucket name

export const TreatmentPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId?: string }>(); 
  const isEditMode = !!planId;

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  
  const [patientCPF, setPatientCPF] = useState('');
  const [description, setDescription] = useState('');
  const [dentistSignature, setDentistSignature] = useState('');
  
  // State for file handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null); // Stores existing file_url for edit mode
  const [fileNamesDisplay, setFileNamesDisplay] = useState(''); // For displaying name of selected or existing file

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalPatientCpf, setOriginalPatientCpf] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && planId) {
      setIsLoading(true);
      setPageError(null);
      getTreatmentPlanById(planId)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching treatment plan for edit:", error);
            setPageError("Falha ao carregar plano de tratamento para edição.");
          } else if (data) {
            setPatientCPF(data.patient_cpf);
            setOriginalPatientCpf(data.patient_cpf); 
            setDescription(data.description);
            setDentistSignature(data.dentist_signature || '');
            setFileNamesDisplay(data.file_names || '');
            setCurrentFileUrl(data.file_url || null);
            setSelectedFile(null); // Reset selected file on load
          } else {
            setPageError("Plano de tratamento não encontrado.");
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      // Reset for new plan
      clearForm(false); 
    }
  }, [planId, isEditMode]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientCPF.trim()) {
        alert("CPF do Paciente é obrigatório para vincular o plano.");
        return;
    }
    if (!description.trim()) {
        alert("A descrição do plano de tratamento é obrigatória.");
        return;
    }
    setIsLoading(true);
    
    let uploadedFileUrl: string | null = isEditMode ? currentFileUrl : null;
    let finalFileNames: string | null = isEditMode ? fileNamesDisplay : null;

    const supabase = getSupabaseClient();
    if (!supabase) {
        alert("Erro de configuração: cliente Supabase não inicializado.");
        setIsLoading(false);
        return;
    }

    if (selectedFile) {
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `public/${patientCPF}/${Date.now()}-${sanitizedFileName}`;
        
        console.log(`Uploading file: ${selectedFile.name}, type: ${selectedFile.type}, size: ${selectedFile.size}`);
        console.log(`Attempting to upload to Supabase Storage. Bucket: ${STORAGE_BUCKET_NAME}, Path: ${filePath}`);

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET_NAME)
            .upload(filePath, selectedFile, {
                cacheControl: '3600',
                upsert: true, 
            });

        if (uploadError) {
            alert('Erro ao fazer upload do arquivo. Verifique o console para detalhes.');
            console.error("Supabase Storage upload failed. Raw error object:", uploadError);
            if (uploadError.message) {
                console.error("Error message property:", uploadError.message);
                if (typeof uploadError.message === 'object') {
                    console.error("Error message property (stringified object):", JSON.stringify(uploadError.message, null, 2));
                }
            }
            // Attempt to log nested error properties common in Supabase errors
            const anyError = uploadError as any;
            if (anyError.error) { 
                console.error("Nested error property:", anyError.error);
                if (typeof anyError.error === 'object' && anyError.error.message) {
                     console.error("Nested error property message:", anyError.error.message);
                } else if (typeof anyError.error === 'object') {
                    console.error("Nested error property (stringified object):", JSON.stringify(anyError.error, null, 2));
                }
            }
            console.error("Full stringified error object from upload:", JSON.stringify(uploadError, null, 2));
            setIsLoading(false);
            return;
        }
        
        const { data: publicUrlData } = supabase.storage
            .from(STORAGE_BUCKET_NAME)
            .getPublicUrl(filePath);
        
        if (!publicUrlData || !publicUrlData.publicUrl) {
            alert('Erro ao obter URL pública do arquivo.');
            console.error("Error getting public URL from Supabase Storage. Response:", publicUrlData);
            setIsLoading(false);
            return;
        }
        uploadedFileUrl = publicUrlData.publicUrl;
        finalFileNames = selectedFile.name;
    } else if (isEditMode && fileNamesDisplay.trim() === '' && currentFileUrl) {
        // User cleared the file name display, wants to remove file association
        uploadedFileUrl = null;
        finalFileNames = null;
    }


    const planDataPayload: Partial<SupabaseTreatmentPlanData> = {
        patient_cpf: patientCPF, 
        description: description,
        file_names: finalFileNames ? finalFileNames.trim() : null,
        file_url: uploadedFileUrl,
        dentist_signature: dentistSignature.trim() || null,
    };

    try {
      if (isEditMode && planId) {
        // patient_cpf should not be updated directly in an existing plan record
        const { patient_cpf: cpfToExclude, ...updatePayload } = planDataPayload; 
        const { data, error } = await updateTreatmentPlan(planId, updatePayload);
        if (error) {
          alert('Erro ao atualizar Plano de Tratamento: ' + error.message);
          console.error("Supabase update error:", error.message, "Full Error:", JSON.stringify(error, null, 2));
        } else {
          alert('Plano de Tratamento atualizado com sucesso!');
          navigate(NavigationPath.PatientTreatmentPlans.replace(':patientId', originalPatientCpf || patientCPF));
        }
      } else {
        // Creating a new plan
        const { data, error } = await addTreatmentPlan(planDataPayload as Omit<SupabaseTreatmentPlanData, 'id' | 'created_at'>);
        if (error) {
          alert('Erro ao salvar Plano de Tratamento: ' + error.message);
          console.error("Supabase add error:", error.message, "Full Error:", JSON.stringify(error, null, 2));
        } else {
          alert('Plano de Tratamento salvo com sucesso!');
          clearForm();
        }
      }
    } catch (error: any) {
        alert('Erro inesperado: ' + error.message);
        console.error("Unexpected error:", error.message, "Full Error:", JSON.stringify(error, null, 2));
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading && isEditMode && !description && !currentFileUrl) { 
    return <div className="text-center py-10 text-gray-400">Carregando plano para edição...</div>;
  }

  if (pageError) {
    return (
        <div className="max-w-4xl mx-auto">
            <Card title="Erro">
                <p className="text-red-500 text-center py-4">{pageError}</p>
                <div className="text-center mt-4">
                    <Button onClick={() => navigate(-1)} leftIcon={<ArrowUturnLeftIcon />}>Voltar</Button>
                </div>
            </Card>
        </div>
    );
  }

  const pageTitle = isEditMode ? "Editar Plano de Tratamento" : "Novo Plano de Tratamento";

  return (
    <div className="max-w-4xl mx-auto">
      <Card 
        title={
          <div className="flex justify-between items-center w-full">
            <span className="text-xl font-semibold text-white">{pageTitle}</span>
            <Link to={NavigationPath.AllTreatmentPlans}>
              <Button variant="ghost" size="sm">
                Ver Todos os Planos
              </Button>
            </Link>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="CPF do Paciente"
            name="patientCPF"
            value={patientCPF}
            onChange={(e) => setPatientCPF(e.target.value)}
            placeholder="Digite o CPF do paciente"
            required
            disabled={isLoading || isEditMode} 
            containerClassName="mb-6"
          />
          <Textarea
            label="Descrição Detalhada do Plano de Tratamento e Observações"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder="Descreva o tratamento proposto, procedimentos, materiais, prognóstico, etc."
            required
            disabled={isLoading}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Upload de Arquivo (Exames, Radiografias - PDF, PNG, JPG)
            </label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md bg-gray-800 ${isLoading ? 'opacity-70' : ''}`}>
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className={`relative bg-gray-700 rounded-md font-medium text-teal-400 hover:text-teal-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-teal-500 px-2 py-1 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span>Carregar arquivo</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} ref={fileInputRef} accept=".png,.jpg,.jpeg,.pdf" disabled={isLoading} />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF. Um arquivo por vez.</p>
              </div>
            </div>

            {fileNamesDisplay && (
                <div className="mt-3 p-3 border border-gray-700 rounded-md bg-gray-750">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-300">
                                {selectedFile ? "Arquivo selecionado:" : (isEditMode && currentFileUrl ? "Arquivo atual:" : "Nome do arquivo:")}
                            </p>
                            <p className="text-sm text-teal-300 truncate" title={fileNamesDisplay}>{fileNamesDisplay}</p>
                            {isEditMode && currentFileUrl && !selectedFile && (
                                <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                                    Visualizar atual
                                </a>
                            )}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={removeSelectedFile} className="p-1" disabled={isLoading} aria-label="Remover arquivo selecionado">
                            <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </Button>
                    </div>
                </div>
            )}
            
             {isEditMode && ( 
                <Input
                    label="Nome do Arquivo (se desejar remover o arquivo existente e não adicionar novo, apague o nome abaixo e salve)"
                    type="text"
                    value={fileNamesDisplay}
                    onChange={(e) => {
                        setFileNamesDisplay(e.target.value);
                        // If user clears text and there was an existing file, mark for removal (no new selectedFile)
                        if(!e.target.value && !selectedFile && currentFileUrl) { 
                            // The submit logic will handle setting file_url to null if fileNamesDisplay is empty
                        }
                    }}
                    placeholder="Nome do arquivo anexo"
                    disabled={isLoading}
                    containerClassName='mt-3 mb-0'
                 />
            )}
          </div>
          
          <Input
            label="Assinatura do Dentista (Nome Digitado)"
            value={dentistSignature}
            onChange={(e) => setDentistSignature(e.target.value)}
            placeholder="Digite o nome completo do dentista responsável"
            disabled={isLoading}
          />

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate(isEditMode && originalPatientCpf ? NavigationPath.PatientTreatmentPlans.replace(':patientId', originalPatientCpf) : NavigationPath.Home)} 
                leftIcon={<ArrowUturnLeftIcon />} 
                disabled={isLoading}
            >
              {isEditMode ? 'Voltar aos Planos do Paciente' : 'Voltar ao Início'}
            </Button>
            {!isEditMode && (
                <Button type="button" variant="danger" onClick={() => clearForm(true)} disabled={isLoading}>
                    Limpar Plano
                </Button>
            )}
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (isEditMode ? 'Atualizar Plano' : 'Salvar Plano de Tratamento')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
