
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { ArrowUturnLeftIcon } from '../components/icons/HeroIcons';
import { NavigationPath, Patient } from '../types';
import { addPatient, getPatientByCpf, updatePatient } from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext'; // Import useToast

export const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId?: string }>(); // patientId is CPF for edit mode
  const isEditMode = !!patientId;
  const { showToast } = useToast(); // Initialize useToast

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Patient, 'id'>>({
    fullName: '',
    dob: '', // YYYY-MM-DD
    guardian: '',
    rg: '',
    cpf: '',
    phone: '',
    addressStreet: '',
    addressNumber: '',
    addressDistrict: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    if (isEditMode && patientId) {
      setIsLoading(true);
      setPageError(null);
      getPatientByCpf(patientId)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching patient for edit:", error);
            setPageError("Falha ao carregar dados do paciente para edição.");
            showToast("Falha ao carregar dados do paciente.", "error");
          } else if (data) {
            setFormData({
              fullName: data.fullName,
              dob: data.dob, 
              guardian: data.guardian || '',
              rg: data.rg || '',
              cpf: data.cpf, 
              phone: data.phone || '',
              addressStreet: data.addressStreet || '',
              addressNumber: data.addressNumber || '',
              addressDistrict: data.addressDistrict || '',
              emergencyContactName: data.emergencyContactName || '',
              emergencyContactPhone: data.emergencyContactPhone || '',
            });
          } else {
            setPageError("Paciente não encontrado para edição.");
            showToast("Paciente não encontrado para edição.", "error");
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [patientId, isEditMode, showToast]); // Added showToast to dependencies

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.cpf || !formData.dob) {
        showToast("Nome completo, CPF e Data de Nascimento são obrigatórios.", "error");
        return;
    }
    setIsLoading(true);

    const patientDataPayload = { ...formData };

    try {
      if (isEditMode && patientId) {
        const { cpf, ...updateData } = patientDataPayload; 
        const { data, error } = await updatePatient(patientId, updateData);
        if (error) {
          console.error('Supabase update error:', error);
          showToast('Erro ao atualizar paciente: ' + error.message, 'error');
        } else {
          showToast('Paciente atualizado com sucesso!', 'success');
          navigate(NavigationPath.PatientDetail.replace(':patientId', patientId));
        }
      } else {
        const { data, error } = await addPatient(patientDataPayload);
        if (error) {
          console.error('Supabase add error:', error);
          if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505') {
            showToast('Erro ao salvar paciente: CPF já cadastrado.', 'error');
          } else {
            showToast('Erro ao salvar paciente: ' + error.message, 'error');
          }
        } else {
          showToast('Paciente salvo com sucesso!', 'success');
          handleClear(); 
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      showToast('Erro inesperado: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (isEditMode) return; 
    setFormData({
      fullName: '',
      dob: '',
      guardian: '',
      rg: '',
      cpf: '',
      phone: '',
      addressStreet: '',
      addressNumber: '',
      addressDistrict: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
  };

  const pageTitle = isEditMode ? "Editar Paciente" : "Cadastro de Novo Paciente";
  const submitButtonText = isEditMode ? (isLoading ? 'Atualizando...' : 'Atualizar Paciente') : (isLoading ? 'Salvando...' : 'Salvar Paciente');

  if (isLoading && isEditMode && !formData.fullName) { 
    return <div className="text-center py-10">Carregando dados do paciente...</div>;
  }

  if (pageError) {
     return (
        <div className="max-w-4xl mx-auto">
            <Card title="Erro">
                <p className="text-red-500 text-center py-4">{pageError}</p>
                <div className="text-center mt-4">
                    <Button onClick={() => navigate(NavigationPath.PatientsList)} leftIcon={<ArrowUturnLeftIcon />}>Voltar para Lista</Button>
                </div>
            </Card>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card title={pageTitle}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4">Dados Pessoais</h3>
          <Input label="Nome Completo" name="fullName" value={formData.fullName} onChange={handleChange} required disabled={isLoading} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker 
              label="Data de Nascimento" 
              name="dob" 
              value={formData.dob} 
              onChange={handleChange} 
              required 
              disabled={isLoading}
              description="O navegador exibirá a data no formato dia/mês/ano (ex: 31/12/2000). Use o calendário para selecionar."
            />
            <Input label="Responsável (se menor)" name="guardian" value={formData.guardian} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="RG" name="rg" value={formData.rg} onChange={handleChange} disabled={isLoading} />
            <Input 
              label="CPF (Será usado como ID do Paciente)" 
              name="cpf" 
              value={formData.cpf} 
              onChange={handleChange} 
              required 
              disabled={isLoading || isEditMode} 
            />
            <Input label="Telefone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isLoading} />
          </div>
          
          <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4 pt-4">Endereço</h3>
          <Input label="Rua/Avenida" name="addressStreet" value={formData.addressStreet} onChange={handleChange} disabled={isLoading} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Número" name="addressNumber" value={formData.addressNumber} onChange={handleChange} disabled={isLoading} />
            <Input label="Bairro" name="addressDistrict" value={formData.addressDistrict} onChange={handleChange} disabled={isLoading} />
          </div>

          <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4 pt-4">Contato de Emergência</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nome (Contato Emergência)" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} disabled={isLoading} />
            <Input label="Telefone (Contato Emergência)" name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={handleChange} disabled={isLoading} />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate(isEditMode && patientId ? NavigationPath.PatientDetail.replace(':patientId', patientId) : NavigationPath.Home)} 
              leftIcon={<ArrowUturnLeftIcon />} 
              disabled={isLoading}
            >
              {isEditMode ? 'Voltar Detalhes Paciente' : 'Voltar ao Início'}
            </Button>
            {!isEditMode && (
              <Button type="button" variant="danger" onClick={handleClear} disabled={isLoading}>
                Limpar
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={isLoading}>
              {submitButtonText}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};