
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
    SupabaseAnamnesisData, // Imported from types.ts
    SupabaseBloodPressureReading // Imported from types.ts
} from '../types';
import { 
    getPatientByCpf,
    getAnamnesisFormByPatientCpf,
    getBloodPressureReadingsByPatientCpf,
    addAnamnesisForm, 
    addBloodPressureReadings,
    // SupabaseAnamnesisData, // No longer from here
    // SupabaseBloodPressureReading // No longer from here
} from '../services/supabaseService';

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
      <div className="mb-3 p-3 border border-gray-700 rounded-md bg-gray-850">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className="text-gray-100">{value || "Não informado"}</p>
        {showDetails && detailsValue && (
          <>
            <p className="text-sm font-medium text-gray-400 mt-1">{detailsLabel}</p>
            <p className="text-gray-100 whitespace-pre-wrap">{detailsValue}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 border border-gray-700 rounded-md bg-gray-800">
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
  const { patientId } = useParams<{ patientId: string }>(); // This is the CPF
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [existingAnamnesis, setExistingAnamnesis] = useState<SupabaseAnamnesisData | null>(null);
  const [existingBPReadings, setExistingBPReadings] = useState<BloodPressureReading[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); // To switch between view and form

  // Form state (used for new or when editing existing)
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
    } else { // Reset form if no existing anamnesis data
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
          setPatient(null);
          setIsLoading(false);
          return;
        }
        setPatient(patientRes.data);

        const anamnesisRes = await getAnamnesisFormByPatientCpf(patientId);
        const bpRes = await getBloodPressureReadingsByPatientCpf(patientId);

        if (anamnesisRes.error) console.warn("Erro ao buscar anamnese:", anamnesisRes.error.message);
        if (bpRes.error) console.warn("Erro ao buscar pressão arterial:", bpRes.error.message);
        
        const currentAnamnesis = anamnesisRes.data || null;
        const currentBPs = bpRes.data || [];

        setExistingAnamnesis(currentAnamnesis);
        setExistingBPReadings(currentBPs);
        
        if (currentAnamnesis) {
            populateFormFromExistingData(currentAnamnesis, currentBPs);
            setIsEditMode(false); // Start in view mode if data exists
        } else {
            setIsEditMode(true); // Start in form mode if no data
            populateFormFromExistingData(null, []); // Reset form fields for new entry
        }

      } catch (e: any) {
        setError("Erro ao carregar dados: " + e.message);
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [patientId, populateFormFromExistingData]);

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
      // If only one left, clear it instead of removing
      setFormBPReadings([{ date: '', value: '' }]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
        alert("CPF do paciente é necessário.");
        return;
    }
    setIsLoading(true);

    // Map UI form data to SupabaseAnamnesisData
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
        // For simplicity, this example will always insert. 
        // A real app might update if existingAnamnesis.id exists.
        const anamnesisRes = await addAnamnesisForm(anamnesisToSave);
        if (anamnesisRes.error) throw anamnesisRes.error;

        const validBPReadings = formBPReadings.filter(bp => bp.date && bp.value);
        if (validBPReadings.length > 0) {
            const bpDataToSave: Omit<SupabaseBloodPressureReading, 'id' | 'created_at'>[] = validBPReadings.map(bp => ({
                patient_cpf: patientId,
                reading_date: bp.date,
                reading_value: bp.value
            }));
            // Here, you might want to delete old BP readings and add new ones, or add to existing.
            // For simplicity, we'll just add them. A more robust solution would handle updates.
            const bpRes = await addBloodPressureReadings(bpDataToSave);
            if (bpRes.error) throw bpRes.error;
        }
        
        alert("Anamnese salva com sucesso!");
        // Refresh data
        const updatedAnamnesisRes = await getAnamnesisFormByPatientCpf(patientId);
        const updatedBpRes = await getBloodPressureReadingsByPatientCpf(patientId);
        setExistingAnamnesis(updatedAnamnesisRes.data || null);
        setExistingBPReadings(updatedBpRes.data || []);
        populateFormFromExistingData(updatedAnamnesisRes.data || null, updatedBpRes.data || []);
        setIsEditMode(false);

    } catch (err: any) {
        alert("Erro ao salvar anamnese: " + err.message);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center py-10">Carregando...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!patient) return <div className="text-center py-10 text-red-500">Paciente não encontrado.</div>;


  const renderReadOnlyView = () => (
    <div className="space-y-6">
        <YesNoDetailsField id="meds_view" label="USO DE MEDICAÇÃO:" value={formData.medications_taken} detailsValue={formData.medications_details} detailsLabel="QUAIS?" onValueChange={()=>{}} onDetailsChange={()=>{}} readOnly />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border border-gray-700 rounded-md bg-gray-850">
                <p className="text-sm font-medium text-gray-400">FUMANTE:</p>
                <p className="text-gray-100">{formData.is_smoker || "Não informado"}</p>
            </div>
            <div className="p-3 border border-gray-700 rounded-md bg-gray-850">
                <p className="text-sm font-medium text-gray-400">GESTANTE:</p>
                <p className="text-gray-100">{formData.is_pregnant || "Não informado"}</p>
            </div>
        </div>

        <YesNoDetailsField id="allerg_view" label="TEM ALGUM TIPO DE ALERGIA:" value={formData.allergies_exist} options={[{value: "Sim", label:"Sim"}, {value:"Não", label:"Não"}, {value:"Não sei", label:"Não sei"}]} detailsValue={formData.allergies_details} detailsLabel="QUAL:" onValueChange={()=>{}} onDetailsChange={()=>{}} readOnly />
        
        <div className="p-3 border border-gray-700 rounded-md bg-gray-850">
            <p className="text-sm font-medium text-gray-400">POSSUI ALGUMA DOENÇA DE BASE:</p>
            <p className="text-gray-100 mb-2">{formData.has_disease || "Não informado"}</p>
            {formData.has_disease === 'Sim' && (
                <div className="ml-4 space-y-1 text-sm">
                    {diseaseOptionsList.map(d => formData[d.id as keyof AnamnesisFormUIData] && <p key={d.id} className="text-gray-200">- {formData[d.id as keyof AnamnesisFormUIData] ? d.label : ''}</p>)}
                    {formData.disease_other_details && <p className="text-gray-200">- Outras: {formData.disease_other_details}</p>}
                </div>
            )}
        </div>

        <YesNoDetailsField id="surg_view" label="PASSOU POR ALGUMA CIRURGIA:" value={formData.surgeries_had} detailsValue={formData.surgeries_details} detailsLabel="QUAL:" onValueChange={()=>{}} onDetailsChange={()=>{}} readOnly />

        <div>
            <h3 className="text-lg font-medium text-teal-400 mb-2 mt-4">PRESSÃO ARTERIAL:</h3>
            {existingBPReadings.length > 0 ? existingBPReadings.map((bp, idx) => (
                <div key={bp.id || idx} className="grid grid-cols-2 gap-4 mb-2 p-3 border border-gray-700 rounded-md bg-gray-850">
                    <div><span className="text-gray-400">Data {idx+1}:</span> <span className="text-gray-100">{bp.date}</span></div>
                    <div><span className="text-gray-400">Pressão {idx+1}:</span> <span className="text-gray-100">{bp.value}</span></div>
                </div>
            )) : <p className="text-gray-400">Nenhum registro de pressão arterial.</p>}
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
            <div className="mt-4 p-4 bg-gray-800 rounded-md space-y-3">
                <p className="text-gray-300 mb-2">Selecione as opções abaixo:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {diseaseOptionsList.map(opt => (
                    <label key={opt.id} className={`flex items-center space-x-2 text-gray-200 p-2 hover:bg-gray-700 rounded ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
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
            <h3 className="text-lg font-medium text-teal-400 mb-2">PRESSÃO ARTERIAL:</h3>
            {formBPReadings.map((reading, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 mb-3 p-3 border border-gray-700 rounded-md items-end bg-gray-800">
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
            <Button type="button" variant="ghost" size="sm" onClick={addBPReadingField} leftIcon={<PlusIcon />} disabled={isLoading}>
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
                        alert("Edição cancelada. Dados restaurados.");
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
    <div className="max-w-4xl mx-auto">
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
                        alert("Edição cancelada. Dados restaurados.");
                    } else { // No existing data, was a new form
                        populateFormFromExistingData(null, []); // Clear form
                        alert("Formulário limpo.");
                    }
                  } else { // Currently in read-only mode
                    setIsEditMode(true); // Switch to form mode
                  }
                }}
              >
                {isEditMode ? (existingAnamnesis ? 'Cancelar Edição' : 'Limpar Formulário') : (existingAnamnesis ? 'Editar Anamnese' : 'Preencher Nova Anamnese')}
              </Button>
            )}
          </div>
        }
      >
        {isEditMode ? renderForm() : (existingAnamnesis || existingBPReadings.length > 0 ? renderReadOnlyView() : <p className="text-gray-400 text-center py-6">Nenhum dado de anamnese ou pressão arterial registrado para este paciente. Clique em "Preencher Nova Anamnese" para adicionar.</p>)}

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
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
