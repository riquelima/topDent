
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowUturnLeftIcon, TrashIcon } from '../components/icons/HeroIcons';
import { NavigationPath } from '../types';
import { addTreatmentPlan, SupabaseTreatmentPlanData } from '../services/supabaseService'; // Changed import


export const TreatmentPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [patientCPF, setPatientCPF] = useState('');
  const [description, setDescription] = useState('');
  const [dentistSignature, setDentistSignature] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadedFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files as FileList)]);
      // Note: For actual file uploads to Supabase Storage, you'd do more here.
      // For now, we're just storing file names.
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const clearForm = () => {
    setPatientCPF('');
    setDescription('');
    setDentistSignature('');
    setUploadedFiles([]);
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
    
    const fileNamesString = uploadedFiles.map(file => file.name).join(', ') || null;

    const treatmentPlanDataToSave: SupabaseTreatmentPlanData = {
        patient_cpf: patientCPF,
        description: description,
        file_names: fileNamesString, 
        dentist_signature: dentistSignature || null,
    };

    try {
        const { data, error } = await addTreatmentPlan(treatmentPlanDataToSave);
        if (error) {
            alert('Erro ao salvar Plano de Tratamento: ' + error.message);
            console.error("Supabase error:", error);
        } else {
            alert('Plano de Tratamento salvo com sucesso no Supabase!');
            console.log("Saved treatment plan:", data);
            clearForm();
        }
    } catch (error: any) {
        alert('Erro inesperado ao salvar Plano de Tratamento: ' + error.message);
        console.error("Unexpected error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card title="Plano de Tratamento">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="CPF do Paciente (para vinculação)"
            name="patientCPF"
            value={patientCPF}
            onChange={(e) => setPatientCPF(e.target.value)}
            placeholder="Digite o CPF do paciente"
            required
            disabled={isLoading}
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Upload de Arquivos (Exames, Radiografias) - Nomes dos arquivos serão salvos</label>
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
                    <span>Carregar um arquivo</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} ref={fileInputRef} multiple disabled={isLoading} />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF até 10MB. (Apenas nomes dos arquivos são salvos no banco)</p>
              </div>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Arquivos selecionados:</h4>
                <ul className="divide-y divide-gray-700 rounded-md border border-gray-700">
                  {uploadedFiles.map(file => (
                    <li key={file.name} className="px-3 py-2 flex items-center justify-between text-sm text-gray-200 bg-gray-800 hover:bg-gray-700">
                      <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(file.name)} className="p-1" disabled={isLoading}>
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
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
            <Button type="button" variant="ghost" onClick={() => navigate(NavigationPath.Home)} leftIcon={<ArrowUturnLeftIcon />} disabled={isLoading}>
              Voltar ao Início
            </Button>
            <Button type="button" variant="danger" onClick={clearForm} disabled={isLoading}>
              Limpar Plano
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Plano de Tratamento'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};