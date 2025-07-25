

import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { ArrowUturnLeftIcon, PlusIcon, TrashIcon } from '../components/icons/HeroIcons';
import { 
    BloodPressureReading, 
    AnamnesisFormUIData, 
    Patient,
    SupabaseAnamnesisData, 
    SupabaseBloodPressureReading
} from '../types';
import { 
    getPatientByCpf,
    getAnamnesisFormByPatientCpf,
    getBloodPressureReadingsByPatientCpf,
    addAnamnesisForm, 
    addBloodPressureReadings,
} from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext'; // Added useToast

// Helper component for Yes/No/Details fields
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
  readOnly?: boolean;
}

const YesNoDetailsField: React.FC<YesNoDetailsProps> = ({ 
    id, label, value, detailsValue, onValueChange, onDetailsChange, 
    detailsLabel = "Quais?", options, selectPlaceholder, disabled, readOnly 
}) => {
  const showDetails = value === 'Sim';
  const currentOptions = options || [
    { value: "Sim", label: "Sim" },
    { value: "Não", label: "Não" },
  ];

  if (readOnly) {
    return (
      <div className="mb-3 p-3 border border-[var(--border-color)] rounded-xl bg-[var(--background-light)]">
        <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
        <p className="text-[var(--text-primary)]">{value || "Não informado"}</p>
        {showDetails && detailsValue && (
          <>
            <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">{detailsLabel}</p>
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{detailsValue}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 border border-[var(--border-color)] rounded-xl bg-[var(--background-light)]">
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


export const PatientAnamnesisPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>(); 
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [existingAnamnesis, setExistingAnamnesis] = useState<SupabaseAnamnesisData | null>(null);
  const [existingBPReadings, setExistingBPReadings] = useState<BloodPressureReading[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); 

  const [formData, setFormData] = useState<AnamnesisFormUIData>({
    medications_taken: null, medications_details: '',
    is_smoker: null, is_pregnant: null,
    allergies_exist: null, allergies_details: '',
    has_disease: null,
    disease_cardiovascular: false, disease_respiratory: false, disease_vascular: false,
    disease_diabetes: false, disease_hypertension: false, disease_renal: false,
    disease_neoplasms: false, disease_hereditary: false, disease_other_details: '',
    surgeries_had: null, surgeries_details: '',
  });
  const [formBPReadings, setFormBPReadings] = useState<Omit<BloodPressureReading, 'id' | 'created_at'>[]>([{ date: '', value: '' }]);

  const populateFormFromExistingData = useCallback((anamnesis: SupabaseAnamnesisData | null, bps: BloodPressureReading[]) => {
    if (anamnesis) {
        setFormData({
            medications_taken: anamnesis.medications_taken,
            medications_details: anamnesis.medications_details || '',
            is_smoker: anamnesis.is_smoker,
            is_pregnant: anamnesis.is_pregnant,
            allergies_exist: anamnesis.allergies_exist,
            allergies_details: anamnesis.allergies_details || '',
            has_disease: anamnesis.has_disease,
            disease_cardiovascular: !!anamnesis.disease_cardiovascular,
            disease_respiratory: !!anamnesis.disease_respiratory,
            disease_vascular: !!anamnesis.disease_vascular,
            disease_diabetes: !!anamnesis.disease_diabetes,
            disease_hypertension: !!anamnesis.disease_hypertension,
            disease_renal: !!anamnesis.disease_renal,
            disease_neoplasms: !!anamnesis.disease_neoplasms,
            disease_hereditary: !!anamnesis.disease_hereditary,
            disease_other_details: anamnesis.disease_other_details || '',
            surgeries_had: anamnesis.surgeries_had,
            surgeries_details: anamnesis.surgeries_details || '',
        });
    } else { 
        setFormData({
            medications_taken: null, medications_details: '',
            is_smoker: null, is_pregnant: null,
            allergies_exist: null, allergies_details: '',
            has_disease: null,
            disease_cardiovascular: false, disease_respiratory: false, disease_vascular: false,
            disease_diabetes: false, disease_hypertension: false, disease_renal: false,
            disease_neoplasms: false, disease_hereditary: false, disease_other_details: '',
            surgeries_had: null, surgeries_details: '',
        });
    }
    setFormBPReadings(bps.length > 0 ? bps.map(bp => ({date: bp.date, value: bp.value})) : [{ date: '', value: '' }]);
  }, []);


  useEffect(() => {
    if (!patientId) {
      setError("CPF do paciente não fornecido.");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const patientRes = await getPatientByCpf(patientId);
        if (patientRes.error || !patientRes.data) {
          setError("Paciente não encontrado ou erro ao buscar paciente.");
          showToast("Paciente não encontrado ou erro ao buscar paciente.", "error");
          setPatient(null);
          setIsLoading(false);
          return;
        }
        setPatient(patientRes.data);

        const anamnesisRes = await getAnamnesisFormByPatientCpf(patientId);
        const bpRes = await getBloodPressureReadingsByPatientCpf(patientId);

        if (anamnesisRes.error) {
            console.warn("Erro ao buscar anamnese:", anamnesisRes.error.message);
            showToast("Erro ao buscar dados de anamnese.", "warning");
        }
        if (bpRes.error) {
            console.warn("Erro ao buscar pressão arterial:", bpRes.error.message);
            showToast("Erro ao buscar dados de pressão arterial.", "warning");
        }
        
        const currentAnamnesis = anamnesisRes.data || null;
        const currentBPs = bpRes.data || [];

        setExistingAnamnesis(currentAnamnesis);
        setExistingBPReadings(currentBPs);
        
        if (currentAnamnesis) {
            populateFormFromExistingData(currentAnamnesis, currentBPs);
            setIsEditMode(false); 
        } else {
            setIsEditMode(true); 
            populateFormFromExistingData(null, []); 
        }

      } catch (e: any) {
        setError("Erro ao carregar dados: " + e.message);
        showToast("Erro crítico ao carregar dados: " + e.message, "error");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [patientId, populateFormFromExistingData, showToast]);

  const handleFormChange = (field: keyof AnamnesisFormUIData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDiseaseCheckboxChange = (diseaseKey: keyof Pick<AnamnesisFormUIData, 'disease_cardiovascular' | 'disease_respiratory' | 'disease_vascular' | 'disease_diabetes' | 'disease_hypertension' | 'disease_renal' | 'disease_neoplasms' | 'disease_hereditary'>, checked: boolean) => {
    setFormData(prev => ({ ...prev, [diseaseKey]: checked }));
  };

  const handleBPChange = (index: number, field: keyof Omit<BloodPressureReading, 'id' | 'created_at'>, value: string) => {
    const updated = [...formBPReadings];
    (updated[index] as any)[field] = value;
    setFormBPReadings(updated);
  };

  const addBPReadingField = () => {
    setFormBPReadings([...formBPReadings, { date: '', value: '' }]);
  };
  
  const removeBPReadingField = (index: number) => {
    if (formBPReadings.length > 1) {
      setFormBPReadings(formBPReadings.filter((_, i) => i !== index));
    } else {
      setFormBPReadings([{ date: '', value: '' }]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
        showToast("CPF do paciente é necessário.", "error");
        return;
    }
    setIsLoading(true);

    const anamnesisToSave: Omit<SupabaseAnamnesisData, 'id' | 'created_at'> = {
        patient_cpf: patientId,
        medications_taken: formData.medications_taken,
        medications_details: formData.medications_details || null,
        is_smoker: formData.is_smoker,
        is_pregnant: formData.is_pregnant,
        allergies_exist: formData.allergies_exist,
        allergies_details: formData.allergies_details || null,
        has_disease: formData.has_disease,
        disease_cardiovascular: formData.disease_cardiovascular,
        disease_respiratory: formData.disease_respiratory,
        disease_vascular: formData.disease_vascular,
        disease_diabetes: formData.disease_diabetes,
        disease_hypertension: formData.disease_hypertension,
        disease_renal: formData.disease_renal,
        disease_neoplasms: formData.disease_neoplasms,
        disease_hereditary: formData.disease_hereditary,
        disease_other_details: formData.disease_other_details || null,
        surgeries_had: formData.surgeries_had,
        surgeries_details: formData.surgeries_details || null,
    };

    try {
        // This will always insert a new anamnesis record. 
        // If an update mechanism is needed, getAnamnesisFormByPatientCpf would need to check existingAnamnesis.id
        // and then call an updateAnamnesisForm function (not currently implemented).
        const anamnesisRes = await addAnamnesisForm(anamnesisToSave);
        if (anamnesisRes.error) throw anamnesisRes.error;
        showToast("Anamnese salva com sucesso!", "success");

        const validBPReadings = formBPReadings.filter(bp => bp.date && bp.value);
        if (validBPReadings.length > 0) {
            const bpDataToSave: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[] = validBPReadings.map(bp => ({
                patient_cpf: patientId,
                reading_date: bp.date,
                reading_value: bp.value
            }));
            const bpRes = await addBloodPressureReadings(bpDataToSave);
            if (bpRes.error) {
                showToast("Anamnese salva, mas erro ao salvar P.A.: " + bpRes.error.message, "warning");
            } else {
                showToast("Aferições de P.A. salvas com sucesso!", "success");
            }
        }
        
        // Refresh data on page
        const updatedAnamnesisRes = await getAnamnesisFormByPatientCpf(patientId);
        const updatedBpRes = await getBloodPressureReadingsByPatientCpf(patientId);
        setExistingAnamnesis(updatedAnamnesisRes.data || null);
        setExistingBPReadings(updatedBpRes.data || []);
        populateFormFromExistingData(updatedAnamnesisRes.data || null, updatedBpRes.data || []);
        setIsEditMode(false);

    } catch (err: any) {
        showToast("Erro ao salvar anamnese: " + err.message, "error");
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading && !patient) return <div className="text-center py-10 text-[var(--text-secondary)]">Carregando dados do paciente e anamnese...</div>;
  if (error) return <div className="text-center py-10 text-red-400">{error}</div>;
  if (!patient && !isLoading) return <div className="text-center py-10 text-red-500">Paciente não encontrado. Verifique o CPF.</div>;


  const renderReadOnlyView = () => (
    <div className="space-y-6">
        <YesNoDetailsField id="meds_view" label="USO DE MEDICAÇÃO:" value={formData.medications_taken} detailsValue={formData.medications_details} detailsLabel="QUAIS?" onValueChange={()=>{}} onDetailsChange={()=>{}} readOnly />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border border-[var(--border-color)] rounded-xl bg-[var(--background-light)]">
                <p className="text-sm font-medium text-[var(--text-secondary)]">FUMANTE:</p>
                <p className="text-[var(--text-primary)]">{formData.is_smoker || "Não informado"}</p>
            </div>
            <div className="p-3 border border-[var(--border-color)] rounded-xl bg-[var(--background-light)]">
                <p className="text-sm font-medium text-[var(--text-secondary)]">GESTANTE:</p>
                <p className="text-[var(--text-primary)]">{formData.is_pregnant || "Não informado"}</p>
            </div>
        </div>

        <YesNoDetailsField id="allerg_view" label="TEM ALGUM TIPO DE ALERGIA:" value={formData.allergies_exist} options={[{value: "Sim", label:"Sim"}, {value:"Não", label:"Não"}, {value:"Não sei", label:"Não sei"}]} detailsValue={formData.allergies_details} detailsLabel="QUAL:" onValueChange={()=>{}} onDetailsChange={()=>{}} readOnly />
        
        <div className="p-3 border border-[var(--border-color)] rounded-xl bg-[var(--background-light)]">
            <p className="text-sm font-medium text-[var(--text-secondary)]">POSSUI ALGUMA DOENÇA DE BASE:</p>
            <p className="text-[var(--text-primary)] mb-2">{formData.has_disease || "Não informado"}</p>
            {formData.has_disease === 'Sim' && (
                <div className="ml-4 space-y-1 text-sm">
                    {diseaseOptionsList.map(d => formData[d.id as keyof AnamnesisFormUIData] && <p key={d.id} className="text-gray-200">- {formData[d.id as keyof AnamnesisFormUIData] ? d.label : ''}</p>)}
                    {formData.disease_other_details && <p className="text-gray-200">- Outras: {formData.disease_other_details}</p>}
                </div>
            )}
        </div>

        <YesNoDetailsField id="surg_view" label="PASSOU POR ALGUMA CIRURGIA:" value={formData.surgeries_had} detailsValue={formData.surgeries_details} detailsLabel="QUAL:" onValueChange={()=>{}} onDetailsChange={()=>{}} readOnly />

        <div>
            <h3 className="text-lg font-medium text-[var(--accent-cyan)] mb-2 mt-4">PRESSÃO ARTERIAL:</h3>
            {existingBPReadings.length > 0 ? existingBPReadings.map((bp, idx) => (
                <div key={bp.id || idx} className="grid grid-cols-2 gap-4 mb-2 p-3 border border-[var(--border-color)] rounded-xl bg-[var(--background-light)]">
                    <div><span className="text-[var(--text-secondary)]">Data {idx+1}:</span> <span className="text-[var(--text-primary)]">{bp.date}</span></div>
                    <div><span className="text-[var(--text-secondary)]">Pressão {idx+1}:</span> <span className="text-[var(--text-primary)]">{bp.value}</span></div>
                </div>
            )) : <p className="text-[var(--text-secondary)]">Nenhum registro de pressão arterial.</p>}
        </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-8">
        <YesNoDetailsField 
            id="medications" label="USO DE MEDICAÇÃO:"
            value={formData.medications_taken} detailsValue={formData.medications_details}
            onValueChange={(val) => handleFormChange('medications_taken', val)}
            onDetailsChange={(val) => handleFormChange('medications_details', val)}
            detailsLabel="QUAIS?" disabled={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select id="isSmoker" label="FUMANTE:" value={formData.is_smoker || ''}
                onChange={(e) => handleFormChange('is_smoker', e.target.value as 'Sim' | 'Não' | null)}
                options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
                placeholder="Selecione..." disabled={isLoading} containerClassName="mb-0"
            />
            <Select id="isPregnant" label="GESTANTE:" value={formData.is_pregnant || ''}
                onChange={(e) => handleFormChange('is_pregnant', e.target.value as 'Sim' | 'Não' | null)}
                options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
                placeholder="Selecione..." disabled={isLoading} containerClassName="mb-0"
            />
        </div>
        
        <YesNoDetailsField 
            id="allergies" label="TEM ALGUM TIPO DE ALERGIA:"
            value={formData.allergies_exist} detailsValue={formData.allergies_details}
            onValueChange={(val) => handleFormChange('allergies_exist', val as 'Sim' | 'Não' | 'Não sei' | null)}
            onDetailsChange={(val) => handleFormChange('allergies_details', val)}
            detailsLabel="QUAL:" 
            options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }, {value: "Não sei", label: "Não sei"}]}
            disabled={isLoading}
        />

        <div>
            <Select id="hasDisease" label="POSSUI ALGUMA DOENÇA DE BASE:" value={formData.has_disease || ''}
                onChange={(e) => handleFormChange('has_disease', e.target.value as 'Sim' | 'Não' | null)}
                options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
                placeholder="Selecione..." disabled={isLoading}
            />
            {formData.has_disease === 'Sim' && (
            <div className="mt-4 p-4 bg-[var(--background-light)] rounded-xl space-y-3 border border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] mb-2">Selecione as opções abaixo:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {diseaseOptionsList.map(opt => (
                    <label key={opt.id} className={`flex items-center space-x-2 text-gray-200 p-2 hover:bg-white/10 rounded ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-[var(--accent-cyan)] bg-[var(--background-medium)] border-[var(--border-color)] rounded focus:ring-[var(--accent-cyan)]"
                        checked={!!formData[opt.id as keyof AnamnesisFormUIData]}
                        onChange={(e) => handleDiseaseCheckboxChange(opt.id as keyof Pick<AnamnesisFormUIData, 'disease_cardiovascular' | 'disease_respiratory' | 'disease_vascular' | 'disease_diabetes' | 'disease_hypertension' | 'disease_renal' | 'disease_neoplasms' | 'disease_hereditary'>, e.target.checked)}
                        disabled={isLoading}
                    />
                    <span>{opt.label}</span>
                    </label>
                ))}
                </div>
                <Textarea label="Outras doenças (especificar)" value={formData.disease_other_details}
                    onChange={(e) => handleFormChange('disease_other_details', e.target.value)}
                    containerClassName="mt-3 mb-0" disabled={isLoading}
                />
            </div>
            )}
        </div>

        <YesNoDetailsField 
            id="surgeries" label="PASSOU POR ALGUMA CIRURGIA:"
            value={formData.surgeries_had} detailsValue={formData.surgeries_details}
            onValueChange={(val) => handleFormChange('surgeries_had', val)}
            onDetailsChange={(val) => handleFormChange('surgeries_details', val)}
            detailsLabel="QUAL?" disabled={isLoading}
        />

        <div>
            <h3 className="text-lg font-medium text-[var(--accent-cyan)] mb-2">PRESSÃO ARTERIAL:</h3>
            {formBPReadings.map((reading, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 mb-3 p-3 border border-[var(--border-color)] rounded-xl items-end bg-[var(--background-light)]">
                <DatePicker label={`Data da Aferição ${index + 1}`} value={reading.date}
                    onChange={(e) => handleBPChange(index, 'date', e.target.value)} disabled={isLoading}
                />
                <Input label={`Valor (ex: 120/80 mmHg)`} value={reading.value}
                    onChange={(e) => handleBPChange(index, 'value', e.target.value)} disabled={isLoading}
                />
                <Button type="button" variant="danger" size="sm" onClick={() => removeBPReadingField(index)} disabled={isLoading || formBPReadings.length <= 1} className="h-10">
                    <TrashIcon className="w-4 h-4"/>
                </Button>
                </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addBPReadingField} leftIcon={<PlusIcon />} disabled={isLoading}>
              Adicionar Aferição de P.A.
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            {existingAnamnesis && isEditMode && ( 
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => { 
                        setIsEditMode(false); 
                        populateFormFromExistingData(existingAnamnesis, existingBPReadings); 
                    }} 
                    disabled={isLoading}
                >
                    Cancelar Edição
                </Button>
            )}
            <Button type="submit" variant="primary" disabled={isLoading}>
              Salvar Anamnese
            </Button>
          </div>
    </form>
  );

  return (
    <div>
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span>Anamnese de {patient?.fullName} ({patient?.cpf})</span>
            {!isLoading && patient && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (isEditMode) { // Currently in form mode
                    if (existingAnamnesis) { // Had existing data, so "Cancel Edit"
                        populateFormFromExistingData(existingAnamnesis, existingBPReadings);
                        setIsEditMode(false);
                        showToast("Edição cancelada. Dados restaurados.", "warning", 2000);
                    } else { // No existing data, was a new form
                        populateFormFromExistingData(null, []); // Clear form
                        showToast("Formulário limpo.", "warning", 2000);
                    }
                  } else { // Currently in read-only mode
                    setIsEditMode(true); // Switch to form mode
                    // Form data is already populated by populateFormFromExistingData or reset if new
                  }
                }}
              >
                {isEditMode ? (existingAnamnesis ? 'Cancelar Edição' : 'Limpar Formulário') : (existingAnamnesis ? 'Editar Anamnese' : 'Preencher Nova Anamnese')}
              </Button>
            )}
          </div>
        }
      >
        {isEditMode ? renderForm() : (existingAnamnesis || existingBPReadings.length > 0 ? renderReadOnlyView() : <p className="text-[var(--text-secondary)] text-center py-6">Nenhum dado de anamnese ou pressão arterial registrado para este paciente. Clique em "Preencher Nova Anamnese" para adicionar.</p>)}

        <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
            <Button 
                onClick={() => navigate(`/patient/${patientId}`)} 
                leftIcon={<ArrowUturnLeftIcon />} 
                variant="secondary"
                disabled={isLoading}
            >
              Voltar para Detalhes do Paciente
            </Button>
        </div>
      </Card>
    </div>
  );
};