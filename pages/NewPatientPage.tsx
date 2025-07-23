
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { ArrowUturnLeftIcon, PlusIcon, TrashIcon } from '../components/icons/HeroIcons';
import { 
    NavigationPath, 
    Patient, 
    BloodPressureReading, 
    AnamnesisFormUIData, 
    SupabaseAnamnesisData, 
    SupabaseBloodPressureReading 
} from '../types';
import { 
    addPatient, 
    getPatientByCpf, 
    updatePatient,
    addAnamnesisForm,
    addBloodPressureReadings,
    updateAppointmentsForPatientNameChange
} from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';

interface YesNoDetailsProps {
  id: string;
  label: string;
  value: 'Sim' | 'Não' | 'Não sei' | null;
  detailsValue: string;
  onValueChange: (value: 'Sim' | 'Não' | 'Não sei' | null) => void;
  onDetailsChange: (details: string) => void;
  detailsLabel?: string;
  options?: { value: string; label: string }[];
  selectPlaceholder?: string;
  disabled?: boolean;
}

const YesNoDetailsField: React.FC<YesNoDetailsProps> = ({ id, label, value, detailsValue, onValueChange, onDetailsChange, detailsLabel = "Quais?", options, selectPlaceholder, disabled }) => {
  const showDetails = value === 'Sim';
  const currentOptions = options || [
    { value: "Sim", label: "Sim" },
    { value: "Não", label: "Não" },
  ];

  return (
    <div className="space-y-3 p-4 border border-[var(--border-color)] rounded-2xl bg-[var(--background-light)]">
      <Select
        id={id}
        label={label}
        value={value || ''}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value as 'Sim' | 'Não' | 'Não sei' | null)}
        options={currentOptions}
        containerClassName="mb-0"
        placeholder={selectPlaceholder || "Selecione..."}
        disabled={disabled}
      />
      {showDetails && (
        <Textarea
          id={`${id}Details`}
          label={detailsLabel}
          value={detailsValue}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder={detailsLabel}
          containerClassName="mb-0 mt-2"
          disabled={disabled}
        />
      )}
    </div>
  );
};

const diseaseOptionsList = [
    { id: 'disease_cardiovascular', label: 'Cardíaca' }, { id: 'disease_respiratory', label: 'Respiratória' },
    { id: 'disease_vascular', label: 'Vascular' }, { id: 'disease_diabetes', label: 'Diabetes' },
    { id: 'disease_hypertension', label: 'Hipertensão' }, { id: 'disease_renal', label: 'Renal' },
    { id: 'disease_neoplasms', label: 'Neoplasias' }, { id: 'disease_hereditary', label: 'Doenças Hereditárias' },
] as const;


export const NewPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId?: string }>(); 
  const isEditMode = !!patientId;
  const { showToast } = useToast(); 

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Patient, 'id'>>({
    fullName: '', dob: '', guardian: '', rg: '', cpf: '', phone: '',
    addressStreet: '', addressNumber: '', addressDistrict: '',
    emergencyContactName: '', emergencyContactPhone: '',
    payment_type: null, health_plan_code: '',
  });

  const [originalPatientData, setOriginalPatientData] = useState<Patient | null>(null);

  const [diseases, setDiseases] = useState<AnamnesisFormUIData>({
    medications_taken: null, medications_details: '',
    is_smoker: null, is_pregnant: null,
    allergies_exist: null, allergies_details: '',
    has_disease: null,
    disease_cardiovascular: false, 
    disease_respiratory: false, 
    disease_vascular: false, 
    disease_diabetes: false,
    disease_hypertension: false, 
    disease_renal: false, 
    disease_neoplasms: false, 
    disease_hereditary: false, 
    disease_other_details: '',
    surgeries_had: null, surgeries_details: '',
  });
  const [bloodPressureReadings, setBloodPressureReadings] = useState<BloodPressureReading[]>([{ date: '', value: '' }]);
  const [anamnesisFilled, setAnamnesisFilled] = useState(false); 

  useEffect(() => {
    if (isEditMode && patientId) {
      setIsLoading(true);
      setPageError(null);
      getPatientByCpf(patientId)
        .then(({ data, error }) => {
          if (error) {
            setPageError("Falha ao carregar dados do paciente para edição.");
            showToast("Falha ao carregar dados do paciente.", "error");
          } else if (data) {
            setOriginalPatientData(data);
            setFormData({
              fullName: data.fullName, dob: data.dob, guardian: data.guardian || '',
              rg: data.rg || '', cpf: data.cpf, phone: data.phone || '',
              addressStreet: data.addressStreet || '', addressNumber: data.addressNumber || '',
              addressDistrict: data.addressDistrict || '',
              emergencyContactName: data.emergencyContactName || '',
              emergencyContactPhone: data.emergencyContactPhone || '',
              payment_type: data.payment_type || null,
              health_plan_code: data.health_plan_code || '',
            });
          } else {
            setPageError("Paciente não encontrado para edição.");
            showToast("Paciente não encontrado para edição.", "error");
          }
        })
        .finally(() => setIsLoading(false));
    } else {
        handleClearAnamnesisFields();
    }
  }, [patientId, isEditMode, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAnamnesisInputChange = () => {
    if (!anamnesisFilled) setAnamnesisFilled(true);
  };

  const handleDiseaseChange = (diseaseKey: keyof AnamnesisFormUIData, value: any) => {
    setDiseases(prev => ({ ...prev, [diseaseKey]: value }));
    handleAnamnesisInputChange();
  };
  
  const handleBloodPressureChange = (index: number, field: keyof Omit<BloodPressureReading, 'id' | 'created_at'>, value: string) => {
    const updatedReadings = [...bloodPressureReadings];
    const currentReading = { ...updatedReadings[index] };
    (currentReading as any)[field] = value;
    updatedReadings[index] = currentReading;
    setBloodPressureReadings(updatedReadings);
    handleAnamnesisInputChange();
  };

  const addBloodPressureReading = () => {
    setBloodPressureReadings([...bloodPressureReadings, { date: '', value: '' }]);
    handleAnamnesisInputChange();
  };

  const removeBPReadingField = (index: number) => {
    if (bloodPressureReadings.length > 1) {
      setBloodPressureReadings(bloodPressureReadings.filter((_, i) => i !== index));
    } else {
      setBloodPressureReadings([{ date: '', value: '' }]); 
    }
    handleAnamnesisInputChange();
  };
  
  const clearPatientFields = () => {
    setFormData({
      fullName: '', dob: '', guardian: '', rg: '', cpf: '', phone: '',
      addressStreet: '', addressNumber: '', addressDistrict: '',
      emergencyContactName: '', emergencyContactPhone: '',
      payment_type: null, health_plan_code: '',
    });
  };

  const handleClearAnamnesisFields = () => {
    setDiseases({
        medications_taken: null, medications_details: '', 
        is_smoker: null, is_pregnant: null,
        allergies_exist: null, allergies_details: '',
        has_disease: null,
        disease_cardiovascular: false, 
        disease_respiratory: false, 
        disease_vascular: false, 
        disease_diabetes: false,
        disease_hypertension: false, 
        disease_renal: false, 
        disease_neoplasms: false, 
        disease_hereditary: false, 
        disease_other_details: '',
        surgeries_had: null, surgeries_details: '',
    });
    setBloodPressureReadings([{ date: '', value: '' }]);
    setAnamnesisFilled(false);
  };

  const handleClear = () => {
    if (isEditMode) return; 
    clearPatientFields();
    handleClearAnamnesisFields();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const patientDataPayload = { ...formData };

    if (!isEditMode) {
      if (!patientDataPayload.cpf.trim()) {
        patientDataPayload.cpf = `ID-${Date.now()}`;
        showToast(`ID único gerado: ${patientDataPayload.cpf}`, "info", 4000);
      }
      if (!patientDataPayload.fullName.trim()) {
        patientDataPayload.fullName = `Paciente ${patientDataPayload.cpf.slice(-6)}`;
      }
    }

    try {
      if (isEditMode && patientId) {
        const { error } = await updatePatient(patientId, patientDataPayload);
        if (error) {
          let errorMessage = 'Erro ao atualizar paciente: ' + error.message;
          if ((error as any).code === '23505' || error.message.includes('duplicate key value violates unique constraint')) {
            errorMessage = 'Erro: O CPF informado já está cadastrado em outro paciente.';
          }
          showToast(errorMessage, 'error', 6000);
        } else {
          showToast('Paciente atualizado com sucesso!', 'success');
          if (originalPatientData && originalPatientData.fullName !== patientDataPayload.fullName) {
            const { error: syncError } = await updateAppointmentsForPatientNameChange(patientDataPayload.cpf, patientDataPayload.fullName);
            if (syncError) showToast("Nome do paciente atualizado, mas falha ao sincronizar com agendamentos existentes.", "warning", 8000);
            else showToast("Nome sincronizado com os agendamentos.", "info", 4000);
          }
          navigate(NavigationPath.PatientDetail.replace(':patientId', patientDataPayload.cpf));
        }
      } else {
        const { error: addPatientError } = await addPatient(patientDataPayload);
        if (addPatientError) {
          if (addPatientError && typeof addPatientError === 'object' && 'code' in addPatientError && (addPatientError as { code: string }).code === '23505') {
            showToast('Erro ao salvar paciente: CPF já cadastrado.', 'error');
          } else {
            showToast('Erro ao salvar paciente: ' + addPatientError.message, 'error');
          }
        } else {
          showToast('Paciente salvo com sucesso!', 'success');
          if (anamnesisFilled) {
            const anamnesisDataToSave: Omit<SupabaseAnamnesisData, 'id' | 'created_at'> = {
                patient_cpf: patientDataPayload.cpf,
                medications_taken: diseases.medications_taken, medications_details: diseases.medications_details || null,
                is_smoker: diseases.is_smoker, is_pregnant: diseases.is_pregnant,
                allergies_exist: diseases.allergies_exist, allergies_details: diseases.allergies_details || null,
                has_disease: diseases.has_disease, disease_cardiovascular: diseases.disease_cardiovascular,
                disease_respiratory: diseases.disease_respiratory, disease_vascular: diseases.disease_vascular,
                disease_diabetes: diseases.disease_diabetes, disease_hypertension: diseases.disease_hypertension,
                disease_renal: diseases.disease_renal, disease_neoplasms: diseases.disease_neoplasms,
                disease_hereditary: diseases.disease_hereditary, disease_other_details: diseases.disease_other_details || null,
                surgeries_had: diseases.surgeries_had, surgeries_details: diseases.surgeries_details || null,
            };
            const { error: anamnesisError } = await addAnamnesisForm(anamnesisDataToSave);
            if (anamnesisError) showToast("Paciente salvo, mas erro ao salvar anamnese: " + anamnesisError.message, "warning");
            else showToast("Anamnese salva com sucesso!", "success");

            const validBPReadings = bloodPressureReadings.filter(bp => bp.date && bp.value);
            if (validBPReadings.length > 0) {
                const bpDataToSave: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[] = validBPReadings.map(bp => ({
                    patient_cpf: patientDataPayload.cpf, reading_date: bp.date, reading_value: bp.value
                }));
                const { error: bpError } = await addBloodPressureReadings(bpDataToSave);
                if (bpError) showToast("Erro ao salvar aferições de P.A.: " + bpError.message, "warning");
                else showToast("Aferições de P.A. salvas com sucesso!", "success");
            }
          }
          handleClear(); 
          navigate(NavigationPath.PatientsList);
        }
      }
    } catch (error: any) {
      showToast('Erro inesperado: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const pageTitle = isEditMode ? "Editar Paciente" : "Cadastro de Novo Paciente";
  const submitButtonText = isEditMode ? (isLoading ? 'Atualizando...' : 'Atualizar Paciente') : (isLoading ? 'Salvando...' : 'Salvar Paciente');

  if (isLoading && isEditMode && !formData.fullName) return <div className="text-center py-10 text-[var(--text-secondary)]">Carregando...</div>;
  if (pageError) return (
    <Card title="Erro"><p className="text-red-500 text-center py-4">{pageError}</p><div className="text-center mt-4"><Button onClick={() => navigate(NavigationPath.PatientsList)} leftIcon={<ArrowUturnLeftIcon />} variant="secondary">Voltar</Button></div></Card>
  );

  return (
    <Card title={<span className="text-white text-2xl">{pageTitle}</span>}>
      <form onSubmit={handleSubmit} className="space-y-10">
        <fieldset>
          <legend className="text-xl font-semibold text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-3 mb-6">Dados Pessoais</legend>
          <Input label="Nome Completo" name="fullName" value={formData.fullName} onChange={handleChange} disabled={isLoading} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <DatePicker label="Data de Nascimento" name="dob" value={formData.dob} onChange={handleChange} disabled={isLoading} description="Use o calendário para selecionar."/>
            <Input label="Responsável (se menor)" name="guardian" value={formData.guardian} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Input label="RG" name="rg" value={formData.rg} onChange={handleChange} disabled={isLoading} />
            <Input label="CPF (ID do Paciente)" name="cpf" value={formData.cpf} onChange={handleChange} disabled={isLoading || (isEditMode && !formData.cpf.startsWith('ID-'))}
              description={isEditMode && formData.cpf.startsWith('ID-') ? 'ID provisório pode ser substituído pelo CPF.' : isEditMode ? 'CPF não pode ser alterado.' : 'Deixe em branco para gerar ID.'}
            />
            <Input label="Telefone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isLoading} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xl font-semibold text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-3 mb-6">Endereço & Pagamento</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Rua/Avenida" name="addressStreet" value={formData.addressStreet} onChange={handleChange} disabled={isLoading} containerClassName="md:col-span-2" />
            <Input label="Número" name="addressNumber" value={formData.addressNumber} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Input label="Bairro" name="addressDistrict" value={formData.addressDistrict} onChange={handleChange} disabled={isLoading} />
            <Select label="Tipo de Pagamento" name="payment_type" value={formData.payment_type || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value as 'health_plan' | 'private' | '';
                  setFormData(prev => ({ ...prev, payment_type: value || null, health_plan_code: value !== 'health_plan' ? '' : prev.health_plan_code }));
              }}
              options={[{ value: 'private', label: 'Particular' }, { value: 'health_plan', label: 'Plano de Saúde' }]}
              placeholder="Selecione..." containerClassName="mb-0" disabled={isLoading}
            />
            {formData.payment_type === 'health_plan' && (
              <Input label="Código do Plano" name="health_plan_code" value={formData.health_plan_code || ''} onChange={handleChange} disabled={isLoading} placeholder="Digite o código"/>
            )}
          </div>
        </fieldset>
        
        <fieldset>
          <legend className="text-xl font-semibold text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-3 mb-6">Contato de Emergência</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nome" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} disabled={isLoading} />
            <Input label="Telefone" name="emergencyContactPhone" type="tel" value={formData.emergencyContactPhone} onChange={handleChange} disabled={isLoading} />
          </div>
        </fieldset>

        {!isEditMode && (
          <fieldset>
            <legend className="text-xl font-semibold text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-3 mb-6">Anamnese (Opcional)</legend>
            <div className="space-y-6">
              <YesNoDetailsField id="medications" label="Uso de medicação?" value={diseases.medications_taken} detailsValue={diseases.medications_details} onValueChange={(val) => handleDiseaseChange('medications_taken', val as 'Sim' | 'Não' | null)} onDetailsChange={(details) => handleDiseaseChange('medications_details', details)} detailsLabel="Quais medicações?" options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]} disabled={isLoading}/>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select id="isSmoker" label="Fumante?" value={diseases.is_smoker || ''} onChange={(e) => handleDiseaseChange('is_smoker', e.target.value as 'Sim' | 'Não' | null)} options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]} placeholder="Selecione..." disabled={isLoading} containerClassName="mb-0"/>
                  <Select id="isPregnant" label="Gestante?" value={diseases.is_pregnant || ''} onChange={(e) => handleDiseaseChange('is_pregnant', e.target.value as 'Sim' | 'Não' | null)} options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]} placeholder="Selecione..." disabled={isLoading} containerClassName="mb-0"/>
              </div>
              <YesNoDetailsField id="allergies" label="Possui algum tipo de alergia?" value={diseases.allergies_exist} detailsValue={diseases.allergies_details} onValueChange={(val) => handleDiseaseChange('allergies_exist', val as 'Sim' | 'Não' | 'Não sei' | null)} onDetailsChange={(details) => handleDiseaseChange('allergies_details', details)} detailsLabel="Especificar alergias" options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }, {value: "Não sei", label: "Não sei"}]} disabled={isLoading}/>
              <div>
                  <Select id="hasDisease" label="Possui alguma doença?" value={diseases.has_disease || ''} onChange={(e) => handleDiseaseChange('has_disease', e.target.value as 'Sim' | 'Não' | null)} options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]} placeholder="Selecione..." disabled={isLoading}/>
                  {diseases.has_disease === 'Sim' && (
                  <div className="mt-4 p-4 bg-[var(--background-light)] rounded-2xl space-y-3 border border-[var(--border-color)]">
                      <p className="text-[var(--text-secondary)] mb-2">Selecione as opções abaixo:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {diseaseOptionsList.map(opt => (
                          <label key={opt.id} className={`flex items-center space-x-2 text-white p-2 hover:bg-white/10 rounded-lg ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                          <input type="checkbox" className="form-checkbox h-5 w-5 text-[var(--accent-cyan)] bg-[var(--background-medium)] border-[var(--border-color)] rounded focus:ring-[var(--accent-cyan)]" checked={!!diseases[opt.id as keyof AnamnesisFormUIData]} onChange={(e) => handleDiseaseChange(opt.id as keyof AnamnesisFormUIData, e.target.checked)} disabled={isLoading}/>
                          <span>{opt.label}</span></label>
                      ))}
                      </div>
                      <Textarea label="Outras doenças (especificar)" value={diseases.disease_other_details} onChange={(e) => handleDiseaseChange('disease_other_details', e.target.value)} containerClassName="mt-3 mb-0" disabled={isLoading}/>
                  </div>
                  )}
              </div>
              <YesNoDetailsField id="surgeries" label="Já fez alguma cirurgia?" value={diseases.surgeries_had} detailsValue={diseases.surgeries_details} onValueChange={(val) => handleDiseaseChange('surgeries_had', val as 'Sim' | 'Não' | null)} onDetailsChange={(details) => handleDiseaseChange('surgeries_details', details)} detailsLabel="Qual(is) cirurgia(s)?" options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]} disabled={isLoading}/>
            
              <h3 className="text-xl font-semibold text-[var(--accent-cyan)] border-b border-[var(--border-color)] pb-3 mb-4 pt-6">Pressão Arterial (Opcional)</h3>
              <div className="space-y-4">
                {bloodPressureReadings.map((reading, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 p-4 border border-[var(--border-color)] rounded-2xl items-end bg-[var(--background-light)]">
                    <DatePicker label={`Data da Aferição ${index + 1}`} value={reading.date} onChange={(e) => handleBloodPressureChange(index, 'date', e.target.value)} disabled={isLoading}/>
                    <Input label={`Valor (ex: 120/80 mmHg)`} value={reading.value} onChange={(e) => handleBloodPressureChange(index, 'value', e.target.value)} disabled={isLoading}/>
                    <Button type="button" variant="danger" size="md" onClick={() => removeBPReadingField(index)} disabled={isLoading || bloodPressureReadings.length <= 1} className="h-12"><TrashIcon className="w-5 h-5"/></Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addBloodPressureReading} leftIcon={<PlusIcon />} disabled={isLoading}>Adicionar Aferição</Button>
              </div>
            </div>
          </fieldset>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-[var(--border-color)]">
          <Button type="button" variant="secondary" onClick={() => navigate(isEditMode && patientId ? NavigationPath.PatientDetail.replace(':patientId', patientId) : NavigationPath.Home)} leftIcon={<ArrowUturnLeftIcon />} disabled={isLoading}>{isEditMode ? 'Voltar' : 'Cancelar'}</Button>
          {!isEditMode && (<Button type="button" variant="danger" onClick={handleClear} disabled={isLoading}>Limpar</Button>)}
          <Button type="submit" variant="primary" disabled={isLoading}>{submitButtonText}</Button>
        </div>
      </form>
    </Card>
  );
};