
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { ArrowUturnLeftIcon } from '../components/icons/HeroIcons';
import { NavigationPath, Patient } from '../types';
import { addPatient } from '../services/supabaseService'; // Changed import
import { isoToDdMmYyyy } from '../src/utils/formatDate'; 

export const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.cpf || !formData.dob) {
        alert("Nome completo, CPF e Data de Nascimento são obrigatórios.");
        return;
    }
    setIsLoading(true);

    // formData already matches Omit<Patient, 'id'> which addPatient expects
    // DOB is already in YYYY-MM-DD format from DatePicker
    const patientDataToSave: Omit<Patient, 'id'> = {
        ...formData
    };
    
    try {
      const { data, error } = await addPatient(patientDataToSave);
      if (error) {
        console.error('Supabase error:', error);
        alert('Erro ao salvar paciente: ' + error.message);
      } else {
        alert('Paciente salvo com sucesso no Supabase!');
        console.log('Saved patient data:', data);
        handleClear(); 
        // navigate(NavigationPath.PatientsList); // Optionally navigate
      }
    } catch (error: any) {
      // This catch block might be redundant if supabaseService handles errors well
      console.error('Unexpected error:', error);
      alert('Erro inesperado ao salvar paciente: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card title="Cadastro de Novo Paciente">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-medium text-teal-400 border-b border-gray-700 pb-2 mb-4">Dados Pessoais</h3>
          <Input label="Nome Completo" name="fullName" value={formData.fullName} onChange={handleChange} required disabled={isLoading} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker label="Data de Nascimento" name="dob" value={formData.dob} onChange={handleChange} required disabled={isLoading} />
            <Input label="Responsável (se menor)" name="guardian" value={formData.guardian} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="RG" name="rg" value={formData.rg} onChange={handleChange} disabled={isLoading} />
            <Input label="CPF (Será usado como ID do Paciente)" name="cpf" value={formData.cpf} onChange={handleChange} required disabled={isLoading} />
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
            <Button type="button" variant="ghost" onClick={() => navigate(NavigationPath.Home)} leftIcon={<ArrowUturnLeftIcon />} disabled={isLoading}>
              Voltar ao Início
            </Button>
            <Button type="button" variant="danger" onClick={handleClear} disabled={isLoading}>
              Limpar
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Paciente'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};