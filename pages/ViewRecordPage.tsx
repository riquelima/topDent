
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
    ChevronUpDownIcon, 
    ArrowUturnLeftIcon, 
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    HeartIcon,
    BriefcaseIcon,
    CalendarDaysIcon
} from '../components/icons/HeroIcons';
import { 
    Patient, 
    NavigationPath, 
    SupabaseAnamnesisData, 
    BloodPressureReading, 
    SupabaseTreatmentPlanData, 
    Appointment
} from '../types';
import { isoToDdMmYyyy, formatToHHMM } from '../src/utils/formatDate'; // Import formatToHHMM
import { 
    getPatients, 
    getPatientByCpf,
    getAnamnesisFormByPatientCpf,
    getBloodPressureReadingsByPatientCpf,
    getTreatmentPlansByPatientCpf,
    getAppointmentsByPatientCpf,
} from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { ImageModal } from '../components/ImageModal';

const isImageFile = (fileName: string | null | undefined): boolean => {
  if (!fileName) return false;
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.gif') || lowerName.endsWith('.webp');
};

interface DetailItemProps {
  label: string;
  value?: string | null | boolean; 
  isBoolean?: boolean; 
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, isBoolean = false }) => {
  if (value === null || value === undefined) {
    return null;
  }

  let displayValue: string;

  if (isBoolean) {
    if (typeof value === 'boolean') {
      displayValue = value ? "Sim" : "Não";
    } else if (value === 'Sim' || value === 'Não' || value === 'Não sei') { 
      displayValue = value;
    } else {
      displayValue = value ? "Sim" : "Não"; 
    }
  } else { 
    if (typeof value === 'string') {
      displayValue = value.trim() ? value.trim() : "Não informado";
    } else if (typeof value === 'boolean') { 
      displayValue = value ? "Sim" : "Não";
    } else {
      displayValue = "Valor inválido"; 
    }
  }
  
  if (displayValue === "" && !(isBoolean && value === false)) {
      displayValue = "Não informado";
  }

  return (
    <div>
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-base text-gray-100 whitespace-pre-wrap">{displayValue}</dd>
    </div>
  );
};


const diseaseOptionsListForDisplay: { key: keyof Pick<SupabaseAnamnesisData, 'disease_cardiovascular' | 'disease_respiratory' | 'disease_vascular' | 'disease_diabetes' | 'disease_hypertension' | 'disease_renal' | 'disease_neoplasms' | 'disease_hereditary'>; label: string }[] = [
    { key: 'disease_cardiovascular', label: 'Cardíaca' }, { key: 'disease_respiratory', label: 'Respiratória' },
    { key: 'disease_vascular', label: 'Vascular' }, { key: 'disease_diabetes', label: 'Diabetes' },
    { key: 'disease_hypertension', label: 'Hipertensão' }, { key: 'disease_renal', label: 'Renal' },
    { key: 'disease_neoplasms', label: 'Neoplasias' }, { key: 'disease_hereditary', label: 'Doenças Hereditárias' },
];

const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
};


export const ViewRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [selectedPatientCPF, setSelectedPatientCPF] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For initial patient list load
  const [isLoadingData, setIsLoadingData] = useState(false); // For loading full record data

  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [anamnesisData, setAnamnesisData] = useState<SupabaseAnamnesisData | null>(null);
  const [bpReadings, setBpReadings] = useState<BloodPressureReading[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<SupabaseTreatmentPlanData[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const isInitialSearchState = !patientDetails && !isLoadingData;

  useEffect(() => {
    const fetchInitialPatients = async () => {
      setIsLoading(true);
      const { data, error } = await getPatients();
      if (error) {
        showToast('Erro ao carregar lista de pacientes para busca.', 'error');
        console.error("Error fetching patients for dropdown:", error);
      } else {
        setAllPatientsList(data || []);
      }
      setIsLoading(false);
    };
    fetchInitialPatients();
  }, [showToast]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientCPF(patient.cpf);
    setPatientSearchTerm(patient.fullName); // Display full name in search box
    setPatientDetails(null); 
    setAnamnesisData(null);
    setBpReadings([]);
    setTreatmentPlans([]);
    setAppointments([]);
    setIsPatientDropdownOpen(false);
    setGeneralError(null);
    fetchFullPatientRecord(patient.cpf);
  };
  
  // Renamed from handleCpfSearch to be more generic for the "Buscar" button
  const handleSearchSubmit = () => { 
      const termToSearch = patientSearchTerm.trim();
      if (!termToSearch) {
          showToast("Digite um CPF ou nome para buscar.", "warning");
          return;
      }
      
      // Attempt to find by CPF first, then by name if no direct CPF match in list
      let cpfToFetch = termToSearch; // Assume term might be a CPF
      const foundPatientByName = allPatientsList.find(p => p.fullName.toLowerCase().includes(termToSearch.toLowerCase()));
      const foundPatientByCpf = allPatientsList.find(p => p.cpf === termToSearch);

      if (foundPatientByCpf) {
          cpfToFetch = foundPatientByCpf.cpf;
      } else if (foundPatientByName) {
          cpfToFetch = foundPatientByName.cpf;
      }
      // If not found in list but term looks like a CPF, proceed to fetch by it anyway

      setSelectedPatientCPF(cpfToFetch);
      setPatientDetails(null);
      setAnamnesisData(null);
      setBpReadings([]);
      setTreatmentPlans([]);
      setAppointments([]);
      setGeneralError(null);
      setIsPatientDropdownOpen(false);
      fetchFullPatientRecord(cpfToFetch);
  };

  const fetchFullPatientRecord = useCallback(async (cpf: string) => {
    setIsLoadingData(true);
    setGeneralError(null);
    try {
      const [
        patientRes,
        anamnesisRes,
        bpRes,
        treatmentPlansRes,
        appointmentsRes
      ] = await Promise.all([
        getPatientByCpf(cpf),
        getAnamnesisFormByPatientCpf(cpf),
        getBloodPressureReadingsByPatientCpf(cpf),
        getTreatmentPlansByPatientCpf(cpf),
        getAppointmentsByPatientCpf(cpf)
      ]);

      if (patientRes.error || !patientRes.data) {
        setGeneralError("Paciente não encontrado ou erro ao buscar dados do paciente.");
        setPatientDetails(null); setSelectedPatientCPF(null); 
        // Don't clear patientSearchTerm here, user might want to refine it
      } else {
        setPatientDetails(patientRes.data);
        setPatientSearchTerm(patientRes.data.fullName); // Update search term to reflect selected patient
      }
      setAnamnesisData(anamnesisRes.data || null);
      setBpReadings(bpRes.data || []);
      setTreatmentPlans(treatmentPlansRes.data || []);
      setAppointments(appointmentsRes.data || []);

      if (anamnesisRes.error && anamnesisRes.error.code !== 'PGRST116' && anamnesisRes.error.message !== 'JSON object requested, multiple (or no) rows returned') showToast("Aviso: Não foi possível carregar a anamnese.", "warning");
      if (bpRes.error) showToast("Aviso: Não foi possível carregar as leituras de P.A.", "warning");
      if (treatmentPlansRes.error) showToast("Aviso: Não foi possível carregar os planos de tratamento.", "warning");
      if (appointmentsRes.error) showToast("Aviso: Não foi possível carregar os agendamentos.", "warning");

    } catch (e: any) {
      console.error("Error fetching full patient record:", e);
      setGeneralError("Erro ao carregar prontuário completo: " + e.message);
      showToast("Erro ao carregar prontuário completo.", "error");
    } finally {
      setIsLoadingData(false);
    }
  }, [showToast]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  const filteredDropdownPatients = allPatientsList.filter(p => 
    p.fullName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.cpf.includes(patientSearchTerm)
  );

  const openImageInModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleClearSearch = () => {
    setSelectedPatientCPF(null);
    setPatientDetails(null);
    setPatientSearchTerm('');
    setAnamnesisData(null);
    setBpReadings([]);
    setTreatmentPlans([]);
    setAppointments([]);
    setGeneralError(null);
    setIsPatientDropdownOpen(false);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">Visualizar Prontuário do Paciente</h1>

      <Card 
        title={isInitialSearchState ? null : "Buscar Prontuário"}
        className={`${isInitialSearchState ? 'min-h-[calc(70vh)] flex flex-col items-center justify-center p-6 sm:p-10 overflow-visible' : 'overflow-visible'}`}
        titleClassName={`${isInitialSearchState ? 'text-4xl sm:text-5xl mb-10 text-center' : 'text-xl'}`}
      >
        {isInitialSearchState && (
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-12 text-center">Buscar Prontuário</h2>
        )}
        <div className={`flex flex-col sm:flex-row gap-4 ${isInitialSearchState ? 'w-full max-w-2xl items-center' : 'items-end'}`}>
          <div className={`relative flex-grow w-full ${isInitialSearchState ? '' : 'sm:w-auto'}`} ref={dropdownRef}>
            {!isInitialSearchState && <label htmlFor="patientSearchInput" className="block text-sm font-medium text-gray-300 mb-1">Paciente</label>}
            <div className="flex">
              <Input
                id="patientSearchInput"
                placeholder={isInitialSearchState ? "Digite CPF ou Nome do Paciente" : "Selecione ou digite para buscar..."}
                value={patientSearchTerm}
                onChange={(e) => {
                    setPatientSearchTerm(e.target.value);
                    if(e.target.value.trim() !== '') setIsPatientDropdownOpen(true); else setIsPatientDropdownOpen(false);
                }}
                onFocus={() => { if (allPatientsList.length > 0) setIsPatientDropdownOpen(true); }}
                containerClassName="flex-grow mb-0"
                className={`rounded-r-none ${isInitialSearchState ? 'h-[60px] text-lg px-6' : 'h-[46px]'}`}
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                className={`px-3 bg-gray-700 hover:bg-gray-600 border border-l-0 border-gray-700 rounded-l-none rounded-r-md ${isInitialSearchState ? 'h-[60px]' : 'h-[46px]'}`}
                aria-expanded={isPatientDropdownOpen}
                aria-haspopup="listbox"
                title="Selecionar Paciente"
                disabled={isLoading}
              >
                <ChevronUpDownIcon className={`text-gray-400 ${isInitialSearchState ? 'w-7 h-7' : 'w-5 h-5'}`} />
              </Button>
            </div>
            {isPatientDropdownOpen && (
              <div className={`absolute top-full left-0 right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20 ${isInitialSearchState ? 'max-h-[50vh]' : 'max-h-72'} overflow-y-auto`}>
                {isLoading && allPatientsList.length === 0 ? (
                  <p className={`text-center py-3 ${isInitialSearchState ? 'text-lg p-5' : 'text-sm'}`}>Carregando pacientes...</p>
                ) : filteredDropdownPatients.length > 0 ? (
                  <ul>
                    {filteredDropdownPatients.map(p => (
                      <li
                        key={p.id}
                        onClick={() => handlePatientSelect(p)}
                        className={`cursor-pointer hover:bg-teal-600 hover:text-white ${isInitialSearchState ? 'px-6 py-4 text-lg' : 'px-4 py-3 text-sm text-gray-200'}`}
                        role="option"
                        aria-selected={selectedPatientCPF === p.cpf}
                      >
                        {p.fullName} <span className={`text-xs ${isInitialSearchState ? 'text-gray-300' : 'text-gray-400'}`}>({p.cpf})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-center py-3 ${isInitialSearchState ? 'text-lg p-5 text-gray-300' : 'text-sm text-gray-400'}`}>
                    {patientSearchTerm ? `Nenhum paciente encontrado com "${patientSearchTerm}".` : 'Nenhum paciente cadastrado.'}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button 
            onClick={handleSearchSubmit} 
            disabled={isLoading || isLoadingData || !patientSearchTerm.trim()} 
            className={`w-full sm:w-auto ${isInitialSearchState ? 'h-[60px] text-lg px-10 mt-6 sm:mt-0' : 'h-[46px]'}`}
          >
            Buscar
          </Button>
        </div>
      </Card>

      {isLoadingData && <p className="text-center text-gray-300 py-6">Carregando dados do prontuário...</p>}
      {generalError && !isLoadingData && <Card title="Erro"><p className="text-red-400 text-center py-4">{generalError}</p></Card>}

      {patientDetails && !isLoadingData && (
        <div className="space-y-6 mt-8">
          <Card title={<div className="flex items-center"><ClipboardDocumentListIcon className="w-6 h-6 mr-2 text-teal-400" />Dados Pessoais de {patientDetails.fullName}</div>}>
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <DetailItem label="Nome Completo" value={patientDetails.fullName} />
              <DetailItem label="Data de Nascimento" value={isoToDdMmYyyy(patientDetails.dob)} />
              <DetailItem label="CPF" value={patientDetails.cpf} />
              <DetailItem label="RG" value={patientDetails.rg} />
              <DetailItem label="Telefone" value={patientDetails.phone} />
              <DetailItem label="Responsável" value={patientDetails.guardian} />
              <DetailItem label="Rua/Avenida" value={patientDetails.addressStreet} />
              <DetailItem label="Número" value={patientDetails.addressNumber} />
              <DetailItem label="Bairro" value={patientDetails.addressDistrict} />
              <DetailItem label="Contato de Emergência (Nome)" value={patientDetails.emergencyContactName} />
              <DetailItem label="Contato de Emergência (Telefone)" value={patientDetails.emergencyContactPhone} />
            </dl>
          </Card>

          <Card title={<div className="flex items-center"><DocumentTextIcon className="w-6 h-6 mr-2 text-teal-400" />Anamnese</div>}>
            {anamnesisData ? (
              <div className="space-y-3">
                <DetailItem label="Uso de Medicação" value={anamnesisData.medications_taken} isBoolean />
                {anamnesisData.medications_taken === 'Sim' && <DetailItem label="Quais Medicações" value={anamnesisData.medications_details} />}
                <DetailItem label="Fumante" value={anamnesisData.is_smoker} isBoolean />
                <DetailItem label="Gestante" value={anamnesisData.is_pregnant} isBoolean />
                <DetailItem label="Alergias" value={anamnesisData.allergies_exist} isBoolean={anamnesisData.allergies_exist === 'Sim' || anamnesisData.allergies_exist === 'Não' || anamnesisData.allergies_exist === 'Não sei'} />
                {anamnesisData.allergies_exist === 'Sim' && <DetailItem label="Detalhes Alergias" value={anamnesisData.allergies_details} />}
                <DetailItem label="Possui Doenças" value={anamnesisData.has_disease} isBoolean />
                {anamnesisData.has_disease === 'Sim' && (
                    <div>
                        <p className="text-sm font-medium text-gray-400 mt-2">Doenças Específicas:</p>
                        <ul className="list-disc list-inside ml-4 text-gray-200">
                            {diseaseOptionsListForDisplay.map(d => 
                                anamnesisData[d.key] && <li key={d.key}>{d.label}</li>
                            )}
                            {anamnesisData.disease_other_details && <li>Outras: {anamnesisData.disease_other_details}</li>}
                        </ul>
                    </div>
                )}
                <DetailItem label="Cirurgias Anteriores" value={anamnesisData.surgeries_had} isBoolean />
                {anamnesisData.surgeries_had === 'Sim' && <DetailItem label="Detalhes Cirurgias" value={anamnesisData.surgeries_details} />}
              </div>
            ) : <p className="text-gray-400">Nenhuma anamnese registrada para este paciente.</p>}
             <div className="mt-4 pt-4 border-t border-gray-700">
                <Link to={NavigationPath.PatientAnamnesis.replace(':patientId', patientDetails.cpf)}>
                    <Button variant="ghost">
                        {anamnesisData ? 'Ver/Editar Anamnese Completa' : 'Preencher Anamnese'}
                    </Button>
                </Link>
            </div>
          </Card>

          <Card title={<div className="flex items-center"><HeartIcon className="w-6 h-6 mr-2 text-teal-400" />Pressão Arterial</div>}>
            {bpReadings.length > 0 ? (
              <ul className="space-y-2">
                {bpReadings.map((bp, index) => (
                  <li key={bp.id || index} className="p-3 bg-gray-700 rounded-md text-sm">
                    <span className="font-semibold text-gray-200">{isoToDdMmYyyy(bp.date)}:</span> <span className="text-gray-100">{bp.value} mmHg</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-400">Nenhuma leitura de pressão arterial registrada.</p>}
          </Card>

          <Card title={<div className="flex items-center"><BriefcaseIcon className="w-6 h-6 mr-2 text-teal-400" />Planos de Tratamento</div>}>
            {treatmentPlans.length > 0 ? (
              <div className="space-y-4">
                {treatmentPlans.map(plan => (
                  <div key={plan.id} className="p-3 bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-400">Criado em: {plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'N/A'}</p>
                    <p className="font-medium text-gray-200 mt-1">Descrição: <span className="font-normal whitespace-pre-wrap">{plan.description}</span></p>
                    {plan.file_url && plan.file_names && (
                      <div className="mt-2">
                        {isImageFile(plan.file_names) ? (
                            <img 
                                src={plan.file_url} alt={plan.file_names || 'Anexo'} 
                                className="rounded max-w-[100px] max-h-20 cursor-pointer border border-gray-600 hover:opacity-80"
                                onClick={() => openImageInModal(plan.file_url!)}
                                title={`Clique para ampliar: ${plan.file_names}`}
                            />
                        ) : (
                            <a href={plan.file_url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline text-sm">
                            {plan.file_names} (Visualizar)
                            </a>
                        )}
                      </div>
                    )}
                    {plan.dentist_signature && <p className="text-xs text-gray-400 mt-1">Ass.: {plan.dentist_signature}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400">Nenhum plano de tratamento registrado.</p>}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <Link to={NavigationPath.PatientTreatmentPlans.replace(':patientId', patientDetails.cpf)}>
                     <Button variant="ghost">Ver/Gerenciar Planos de Tratamento</Button>
                </Link>
            </div>
          </Card>
          
          <Card title={<div className="flex items-center"><CalendarDaysIcon className="w-6 h-6 mr-2 text-teal-400" />Agendamentos</div>}>
            {appointments.length > 0 ? (
              <ul className="space-y-3">
                {appointments.map(appt => (
                  <li key={appt.id} className="p-3 bg-gray-700 rounded-md text-sm">
                    <p className="font-semibold text-gray-100">{isoToDdMmYyyy(appt.appointment_date)} às {formatToHHMM(appt.appointment_time)}</p>
                    <p className="text-gray-300">Procedimento: {appt.procedure}</p>
                    <p className="text-gray-400">Status: {statusLabelMap[appt.status] || appt.status}</p>
                    {appt.notes && <p className="text-xs text-gray-400 mt-1">Obs: {appt.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-400">Nenhum agendamento encontrado.</p>}
             <div className="mt-4 pt-4 border-t border-gray-700">
                <Link to={NavigationPath.Appointments}>
                     <Button variant="ghost">Ver Todos Agendamentos</Button>
                </Link>
            </div>
          </Card>

          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <Button 
                onClick={handleClearSearch} 
                leftIcon={<ArrowUturnLeftIcon />}
            >
              Limpar Busca / Voltar
            </Button>
          </div>
        </div>
      )}
      <ImageModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} imageUrl={selectedImageUrl} />
    </div>
  );
};
