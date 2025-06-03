
import React, { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { ArrowUturnLeftIcon, PlusIcon } from '../components/icons/HeroIcons';
import { NavigationPath, BloodPressureReading, DiseaseOptions } from '../types';
import { 
    addAnamnesisForm, 
    addBloodPressureReadings,
    SupabaseAnamnesisData,
    SupabaseBloodPressureReading
} from '../services/supabaseService'; // Changed import
// isoToDdMmYyyy is for display, not for saving to DB if already in YYYY-MM-DD

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
    <div className="space-y-2 p-3 border border-gray-700 rounded-md">
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


export const AnamnesisFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [patientCPF, setPatientCPF] = useState('');
  
  const [medications, setMedications] = useState<{ value: 'Sim' | 'Não' | null, details: string }>({ value: null, details: '' });
  const [isSmoker, setIsSmoker] = useState<'Sim' | 'Não' | null>(null);
  const [isPregnant, setIsPregnant] = useState<'Sim' | 'Não' | null>(null);
  const [allergies, setAllergies] = useState<{ value: 'Sim' | 'Não' | 'Não sei' | null, details: string }>({ value: null, details: '' });
  const [hasDisease, setHasDisease] = useState<'Sim' | 'Não' | null>(null);
  const [diseases, setDiseases] = useState<DiseaseOptions>({
    cardiovascular: false, respiratory: false, vascular: false, diabetes: false,
    hypertension: false, renal: false, neoplasms: false, hereditary: false, other: ''
  });
  const [surgeries, setSurgeries] = useState<{ value: 'Sim' | 'Não' | null, details: string }>({ value: null, details: '' });
  const [bloodPressureReadings, setBloodPressureReadings] = useState<BloodPressureReading[]>([
    { date: '', value: '' }, // date is YYYY-MM-DD from DatePicker
  ]);

  const handleDiseaseChange = <K extends keyof DiseaseOptions,>(diseaseKey: K, value: DiseaseOptions[K]) => {
    setDiseases(prev => ({ ...prev, [diseaseKey]: value }));
  };

  const handleBloodPressureChange = (index: number, field: keyof BloodPressureReading, value: string) => {
    const updatedReadings = [...bloodPressureReadings];
    updatedReadings[index] = { ...updatedReadings[index], [field]: value };
    setBloodPressureReadings(updatedReadings);
  };

  const addBloodPressureReading = () => {
    setBloodPressureReadings([...bloodPressureReadings, { date: '', value: '' }]);
  };

  const clearForm = () => {
    setPatientCPF('');
    setMedications({ value: null, details: '' });
    setIsSmoker(null);
    setIsPregnant(null);
    setAllergies({ value: null, details: '' });
    setHasDisease(null);
    setDiseases({
        cardiovascular: false, respiratory: false, vascular: false, diabetes: false,
        hypertension: false, renal: false, neoplasms: false, hereditary: false, other: ''
    });
    setSurgeries({ value: null, details: '' });
    setBloodPressureReadings([{ date: '', value: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientCPF.trim()) {
        alert("CPF do Paciente é obrigatório para vincular a anamnese.");
        return;
    }
    setIsLoading(true);
    
    const anamnesisDataToSave: SupabaseAnamnesisData = {
        patient_cpf: patientCPF,
        medications_taken: medications.value,
        medications_details: medications.details || null,
        is_smoker: isSmoker,
        is_pregnant: isPregnant,
        allergies_exist: allergies.value,
        allergies_details: allergies.details || null,
        has_disease: hasDisease,
        disease_cardiovascular: diseases.cardiovascular,
        disease_respiratory: diseases.respiratory,
        disease_vascular: diseases.vascular,
        disease_diabetes: diseases.diabetes,
        disease_hypertension: diseases.hypertension,
        disease_renal: diseases.renal,
        disease_neoplasms: diseases.neoplasms,
        disease_hereditary: diseases.hereditary,
        disease_other_details: diseases.other || null,
        surgeries_had: surgeries.value,
        surgeries_details: surgeries.details || null,
    };
    
    let allSuccess = true;
    let messages: string[] = [];

    try {
        const { error: anamnesisError } = await addAnamnesisForm(anamnesisDataToSave);
        if (anamnesisError) {
            allSuccess = false;
            messages.push("Falha ao salvar Anamnese: " + anamnesisError.message);
            console.error("Supabase Anamnesis Error:", anamnesisError);
        } else {
            messages.push("Anamnese salva com sucesso.");
        }

        const validBPReadings = bloodPressureReadings.filter(bp => bp.date && bp.value);
        if (validBPReadings.length > 0) {
            const bpDataToSave: SupabaseBloodPressureReading[] = validBPReadings.map(bp => ({
                patient_cpf: patientCPF,
                reading_date: bp.date, // Already YYYY-MM-DD
                reading_value: bp.value
            }));
            const { error: bpError } = await addBloodPressureReadings(bpDataToSave);
            if (bpError) {
                allSuccess = false;
                messages.push("Falha ao salvar Pressão Arterial: " + bpError.message);
                console.error("Supabase BP Error:", bpError);
            } else {
                 messages.push("Pressão Arterial salva com sucesso.");
            }
        }
        
        if (allSuccess) {
            alert('Formulário de Anamnese salvo! \n' + messages.join('\n'));
            clearForm();
        } else {
            alert('Erro ao salvar o formulário: \n' + messages.join('\n'));
        }

    } catch (error: any) { // Catch unexpected client-side errors
        alert('Erro crítico ao salvar formulário: ' + error.message);
        console.error("Unexpected error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const diseaseOptionsList = [
    { id: 'cardiovascular', label: 'Cardíaca' }, { id: 'respiratory', label: 'Respiratória' },
    { id: 'vascular', label: 'Vascular' }, { id: 'diabetes', label: 'Diabetes' },
    { id: 'hypertension', label: 'Hipertensão' }, { id: 'renal', label: 'Renal' },
    { id: 'neoplasms', label: 'Neoplasias' }, { id: 'hereditary', label: 'Doenças Hereditárias' },
  ] as const;


  return (
    <div className="max-w-4xl mx-auto">
      <Card title="Formulário de Anamnese (Histórico Médico)">
        <form onSubmit={handleSubmit} className="space-y-8">
          
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
          
          <YesNoDetailsField 
            id="medications"
            label="Uso de medicação?"
            value={medications.value}
            detailsValue={medications.details}
            onValueChange={(val) => setMedications(prev => ({ ...prev, value: val as 'Sim' | 'Não' | null }))}
            onDetailsChange={(details) => setMedications(prev => ({ ...prev, details }))}
            detailsLabel="Quais medicações?"
            options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
            disabled={isLoading}
          />

          <Select
            id="isSmoker"
            label="Fumante?"
            value={isSmoker || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setIsSmoker(e.target.value as 'Sim' | 'Não' | null)}
            options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
            placeholder="Selecione..."
            disabled={isLoading}
          />

          <Select
            id="isPregnant"
            label="Gestante?"
            value={isPregnant || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setIsPregnant(e.target.value as 'Sim' | 'Não' | null)}
            options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
            placeholder="Selecione..."
            disabled={isLoading}
          />
          
          <YesNoDetailsField 
            id="allergies"
            label="Possui algum tipo de alergia?"
            value={allergies.value}
            detailsValue={allergies.details}
            onValueChange={(val) => setAllergies(prev => ({ ...prev, value: val as 'Sim' | 'Não' | 'Não sei' | null }))}
            onDetailsChange={(details) => setAllergies(prev => ({ ...prev, details }))}
            detailsLabel="Especificar alergias"
            options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }, {value: "Não sei", label: "Não sei"}]}
            disabled={isLoading}
          />

          <div>
            <Select
              id="hasDisease"
              label="Possui alguma doença?"
              value={hasDisease || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setHasDisease(e.target.value as 'Sim' | 'Não' | null)}
              options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
              placeholder="Selecione..."
              disabled={isLoading}
            />
            {hasDisease === 'Sim' && (
              <div className="mt-4 p-4 bg-gray-800 rounded-md space-y-3">
                <p className="text-gray-300 mb-2">Selecione as opções abaixo:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {diseaseOptionsList.map(opt => (
                     <label key={opt.id} className={`flex items-center space-x-2 text-gray-200 p-2 hover:bg-gray-700 rounded ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
                        checked={diseases[opt.id]}
                        onChange={(e) => handleDiseaseChange(opt.id, e.target.checked)}
                        disabled={isLoading}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <Input 
                  label="Outras doenças (especificar)"
                  value={diseases.other}
                  onChange={(e) => handleDiseaseChange('other', e.target.value)}
                  containerClassName="mt-3"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <YesNoDetailsField 
            id="surgeries"
            label="Já fez alguma cirurgia?"
            value={surgeries.value}
            detailsValue={surgeries.details}
            onValueChange={(val) => setSurgeries(prev => ({ ...prev, value: val as 'Sim' | 'Não' | null }))}
            onDetailsChange={(details) => setSurgeries(prev => ({ ...prev, details }))}
            detailsLabel="Qual(is) cirurgia(s)?"
            options={[{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }]}
            disabled={isLoading}
          />
          
          <div>
            <h3 className="text-lg font-medium text-teal-400 mb-2">Pressão Arterial</h3>
            {bloodPressureReadings.map((reading, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 p-3 border border-gray-700 rounded-md">
                <DatePicker 
                  label={`Data da Aferição ${index + 1}`}
                  value={reading.date} // YYYY-MM-DD
                  onChange={(e) => handleBloodPressureChange(index, 'date', e.target.value)}
                  disabled={isLoading}
                />
                <Input 
                  label={`Valor (ex: 120/80 mmHg)`}
                  value={reading.value}
                  onChange={(e) => handleBloodPressureChange(index, 'value', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addBloodPressureReading} leftIcon={<PlusIcon />} disabled={isLoading}>
              Adicionar Aferição
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <Button type="button" variant="ghost" onClick={() => navigate(NavigationPath.Home)} leftIcon={<ArrowUturnLeftIcon />} disabled={isLoading}>
              Voltar ao Início
            </Button>
            <Button type="button" variant="danger" onClick={clearForm} disabled={isLoading}>
              Limpar
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Anamnese'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};