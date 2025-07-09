
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
    CalendarDaysIcon,
    MagnifyingGlassIcon
} from '../components/icons/HeroIcons';
import { 
    Patient, 
    NavigationPath, 
    SupabaseAnamnesisData, 
    BloodPressureReading, 
    SupabaseTreatmentPlanData, 
    Appointment
} from '../types';
import { isoToDdMmYyyy, formatToHHMM } from '../src/utils/formatDate';
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
  return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff'].some(ext => lowerName.endsWith(ext));
};

interface DetailItemProps {
  label: string;
  value?: string | null | boolean; 
  isBoolean?: boolean; 
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, isBoolean = false, className = '' }) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return (
      <div className={className}>
        <dt className="text-sm font-medium text-[#b0b0b0]">{label}</dt>
        <dd className="mt-1 text-base text-gray-500 italic">Não informado</dd>
      </div>
    );
  }

  let displayValue: string;
  if (isBoolean) {
    displayValue = value ? "Sim" : "Não";
  } else {
    displayValue = String(value);
  }
  
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-[#b0b0b0]">{label}</dt>
      <dd className="mt-1 text-base text-white whitespace-pre-wrap">{displayValue}</dd>
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
  const location = useLocation();
  const { showToast } = useToast();

  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [selectedPatientCPF, setSelectedPatientCPF] = useState<string | null>(null);
  const [isLoadingPatientsList, setIsLoadingPatientsList] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);

  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [anamnesisData, setAnamnesisData] = useState<SupabaseAnamnesisData | null>(null);
  const [bpReadings, setBpReadings] = useState<BloodPressureReading[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<SupabaseTreatmentPlanData[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [searchError, setSearchError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const cameFromDentistDashboard = location.state?.fromDentistDashboard;
  const isInitialSearchState = !patientDetails && !isLoadingRecord && !selectedPatientCPF && !searchError;


  useEffect(() => {
    const fetchInitialPatients = async () => {
      setIsLoadingPatientsList(true);
      const { data, error } = await getPatients();
      if (error) {
        showToast('Erro ao carregar lista de pacientes para busca.', 'error');
      } else {
        setAllPatientsList(data || []);
      }
      setIsLoadingPatientsList(false);
    };
    fetchInitialPatients();
  }, [showToast]);

  const resetRecordData = () => {
    setPatientDetails(null); 
    setAnamnesisData(null);
    setBpReadings([]);
    setTreatmentPlans([]);
    setAppointments([]);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientCPF(patient.cpf);
    setPatientSearchTerm(patient.fullName);
    resetRecordData();
    setIsPatientDropdownOpen(false);
    setSearchError(null);
    fetchFullPatientRecord(patient.cpf);
  };
  
  const handleSearchSubmit = () => { 
      const termToSearch = patientSearchTerm.trim();
      if (!termToSearch && !selectedPatientCPF) {
          showToast("Digite um CPF ou nome para buscar.", "warning");
          return;
      }
      
      let cpfToFetch = selectedPatientCPF || termToSearch; 
      
      if (!selectedPatientCPF) { 
        const foundPatientByCpf = allPatientsList.find(p => p.cpf === termToSearch);
        const foundPatientByName = allPatientsList.find(p => p.fullName.toLowerCase().includes(termToSearch.toLowerCase()));

        if (foundPatientByCpf) {
            cpfToFetch = foundPatientByCpf.cpf;
            setPatientSearchTerm(foundPatientByCpf.fullName); 
        } else if (foundPatientByName) {
            cpfToFetch = foundPatientByName.cpf;
            setPatientSearchTerm(foundPatientByName.fullName); 
        }
      }
      
      setSelectedPatientCPF(cpfToFetch); 
      resetRecordData();
      setSearchError(null);
      setIsPatientDropdownOpen(false);
      fetchFullPatientRecord(cpfToFetch);
  };

  const fetchFullPatientRecord = useCallback(async (cpf: string) => {
    if (!cpf) {
        setSearchError("CPF não fornecido para busca.");
        return;
    }
    setIsLoadingRecord(true);
    setSearchError(null);
    try {
      const [patientRes, anamnesisRes, bpRes, treatmentPlansRes, appointmentsRes] = await Promise.all([
        getPatientByCpf(cpf),
        getAnamnesisFormByPatientCpf(cpf),
        getBloodPressureReadingsByPatientCpf(cpf),
        getTreatmentPlansByPatientCpf(cpf),
        getAppointmentsByPatientCpf(cpf)
      ]);

      if (patientRes.error || !patientRes.data) {
        setSearchError("Paciente não encontrado ou erro ao buscar dados do paciente.");
        resetRecordData(); 
        setSelectedPatientCPF(null); 
      } else {
        setPatientDetails(patientRes.data);
      }
      setAnamnesisData(anamnesisRes.data || null);
      setBpReadings(bpRes.data || []);
      setTreatmentPlans(treatmentPlansRes.data || []);
      setAppointments(appointmentsRes.data || []);

    } catch (e: any) {
      setSearchError("Erro ao carregar prontuário completo: " + e.message);
      showToast("Erro ao carregar prontuário completo.", "error");
    } finally {
      setIsLoadingRecord(false);
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
  }, []);

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
    setPatientSearchTerm('');
    resetRecordData();
    setSearchError(null);
    setIsPatientDropdownOpen(false);
  };

  const renderSearchSection = () => (
    <Card 
      className={`${isInitialSearchState && !cameFromDentistDashboard ? 'min-h-[calc(70vh)] flex flex-col items-center justify-center p-6 sm:p-10 bg-[#1a1a1a]' : 'bg-[#1a1a1a]'} overflow-visible`}
      title={isInitialSearchState && !cameFromDentistDashboard ? undefined : <span className="text-white">Buscar Prontuário</span>}
      titleClassName={`${isInitialSearchState && !cameFromDentistDashboard ? 'hidden' : 'text-xl'}`}
    >
      {isInitialSearchState && !cameFromDentistDashboard && (
        <div className="text-center mb-12">
            <MagnifyingGlassIcon className="w-16 h-16 text-[#00bcd4] mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-semibold text-white">Buscar Prontuário</h2>
            <p className="text-[#b0b0b0] mt-2 text-lg">Digite o nome ou CPF do paciente para visualizar o prontuário completo.</p>
        </div>
      )}
      <div className={`flex flex-col sm:flex-row gap-4 ${isInitialSearchState && !cameFromDentistDashboard ? 'w-full max-w-4xl items-center' : 'items-end'}`}>
        <div className={`relative flex-grow w-full ${isInitialSearchState && !cameFromDentistDashboard ? '' : 'sm:w-auto'}`} ref={dropdownRef}>
          {!(isInitialSearchState && !cameFromDentistDashboard) && <label htmlFor="patientSearchInput" className="block text-sm font-medium text-[#b0b0b0] mb-1">Paciente</label>}
          <div className="flex">
            <Input
              id="patientSearchInput"
              placeholder={isInitialSearchState && !cameFromDentistDashboard ? "Digite CPF ou Nome do Paciente" : "Selecione ou digite para buscar..."}
              value={patientSearchTerm}
              onChange={(e) => {
                  setPatientSearchTerm(e.target.value);
                  if(e.target.value.trim() !== '') setIsPatientDropdownOpen(true); else setIsPatientDropdownOpen(false);
                  if (!e.target.value.trim() && !isLoadingRecord) setSelectedPatientCPF(null); 
              }}
              onFocus={() => { if (allPatientsList.length > 0) setIsPatientDropdownOpen(true); }}
              containerClassName="flex-grow mb-0"
              className={`rounded-r-none bg-[#1f1f1f] border-gray-700 focus:border-[#00bcd4] ${isInitialSearchState && !cameFromDentistDashboard ? 'h-[60px] text-lg px-6' : 'h-[46px]'}`}
              disabled={isLoadingPatientsList || isLoadingRecord}
              prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
            />
            <Button
              type="button"
              onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
              className={`px-3 bg-[#1f1f1f] hover:bg-gray-700 border border-l-0 border-gray-700 rounded-l-none rounded-r-md ${isInitialSearchState && !cameFromDentistDashboard ? 'h-[60px]' : 'h-[46px]'}`}
              aria-expanded={isPatientDropdownOpen}
              aria-haspopup="listbox"
              title="Selecionar Paciente"
              disabled={isLoadingPatientsList || isLoadingRecord}
            >
              <MagnifyingGlassIcon className={`text-gray-400 ${isInitialSearchState && !cameFromDentistDashboard ? 'w-7 h-7' : 'w-5 h-5'}`} />
            </Button>
          </div>
          {isPatientDropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1 w-full bg-[#1f1f1f] border border-gray-700 rounded-md shadow-lg z-20 ${isInitialSearchState && !cameFromDentistDashboard ? 'max-h-[50vh]' : 'max-h-72'} overflow-y-auto`}>
              {isLoadingPatientsList && allPatientsList.length === 0 ? (
                <p className={`text-center py-3 text-[#b0b0b0] ${isInitialSearchState && !cameFromDentistDashboard ? 'text-lg p-5' : 'text-sm'}`}>Carregando pacientes...</p>
              ) : filteredDropdownPatients.length > 0 ? (
                <ul>
                  {filteredDropdownPatients.map(p => (
                    <li
                      key={p.cpf}
                      onClick={() => handlePatientSelect(p)}
                      className={`cursor-pointer hover:bg-[#00bcd4] hover:text-black ${isInitialSearchState && !cameFromDentistDashboard ? 'px-6 py-4 text-lg text-white' : 'px-4 py-3 text-sm text-white'}`}
                      role="option"
                      aria-selected={selectedPatientCPF === p.cpf}
                    >
                      {p.fullName} <span className={`text-xs ${isInitialSearchState && !cameFromDentistDashboard ? 'text-gray-400' : 'text-gray-500'}`}>({p.cpf})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-center py-3 text-[#b0b0b0] ${isInitialSearchState && !cameFromDentistDashboard ? 'text-lg p-5' : 'text-sm'}`}>
                  {patientSearchTerm ? `Nenhum paciente encontrado.` : 'Nenhum paciente cadastrado.'}
                </p>
              )}
            </div>
          )}
        </div>
        <Button 
          onClick={handleSearchSubmit} 
          variant="primary"
          disabled={isLoadingPatientsList || isLoadingRecord || (!patientSearchTerm.trim() && !selectedPatientCPF)} 
          className={`w-full sm:w-auto ${isInitialSearchState && !cameFromDentistDashboard ? 'h-[60px] text-lg px-10 mt-6 sm:mt-0' : 'h-[46px]'}`}
        >
          {isLoadingRecord ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>
    </Card>
  );

  const getPaymentTypeDisplay = (patient: Patient | null): string | null => {
    if (!patient || !patient.payment_type) return "Não informado";
    return patient.payment_type === 'health_plan' ? 'Plano de Saúde' : 'Particular';
  };

  return (
    <div className="space-y-8">
      {!(isInitialSearchState && !cameFromDentistDashboard) && <h1 className="text-3xl font-bold text-white text-center">Prontuário do Paciente</h1>}
      {renderSearchSection()}

      {isLoadingRecord && <div className="text-center py-10 text-[#b0b0b0]">Carregando dados do prontuário...</div>}
      
      {searchError && !isLoadingRecord && selectedPatientCPF && <Card title="Erro na Busca" className="bg-[#1a1a1a]"><p className="text-red-500 text-center py-4">{searchError}</p></Card>}

      {patientDetails && !isLoadingRecord && (
        <div className="space-y-6 mt-8">
          <Card title={<div className="flex items-center text-white"><ClipboardDocumentListIcon className="w-6 h-6 mr-3 text-[#00bcd4]" />Dados Pessoais de {patientDetails.fullName}</div>} className="bg-[#1a1a1a]">
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <DetailItem label="Nome Completo" value={patientDetails.fullName} />
              <DetailItem label="Data de Nascimento" value={isoToDdMmYyyy(patientDetails.dob)} />
              <DetailItem label="CPF" value={patientDetails.cpf} />
              <DetailItem label="RG" value={patientDetails.rg} />
              <DetailItem label="Telefone" value={patientDetails.phone} />
              <DetailItem label="Responsável" value={patientDetails.guardian} />
              <DetailItem label="Tipo de Pagamento" value={getPaymentTypeDisplay(patientDetails)} />
              {patientDetails.payment_type === 'health_plan' && (
                <DetailItem label="Código do Plano" value={patientDetails.health_plan_code} />
              )}
              <DetailItem label="Rua/Avenida" value={patientDetails.addressStreet} />
              <DetailItem label="Número" value={patientDetails.addressNumber} />
              <DetailItem label="Bairro" value={patientDetails.addressDistrict} />
              <DetailItem label="Contato de Emergência (Nome)" value={patientDetails.emergencyContactName} />
              <DetailItem label="Contato de Emergência (Telefone)" value={patientDetails.emergencyContactPhone} />
            </dl>
          </Card>

          <Card title={<div className="flex items-center text-white"><DocumentTextIcon className="w-6 h-6 mr-3 text-[#00bcd4]" />Anamnese</div>} className="bg-[#1a1a1a]">
            {anamnesisData ? (
              <div className="space-y-3">
                <DetailItem label="Uso de Medicação" value={anamnesisData.medications_taken} />
                {anamnesisData.medications_taken === 'Sim' && <DetailItem label="Quais Medicações" value={anamnesisData.medications_details} />}
                <DetailItem label="Fumante" value={anamnesisData.is_smoker} />
                <DetailItem label="Gestante" value={anamnesisData.is_pregnant}/>
                <DetailItem label="Alergias" value={anamnesisData.allergies_exist} />
                {anamnesisData.allergies_exist === 'Sim' && <DetailItem label="Detalhes Alergias" value={anamnesisData.allergies_details} />}
                <DetailItem label="Possui Doenças" value={anamnesisData.has_disease} />
                {anamnesisData.has_disease === 'Sim' && (
                    <div>
                        <p className="text-sm font-medium text-[#b0b0b0] mt-2">Doenças Específicas:</p>
                        <ul className="list-disc list-inside ml-4 text-white text-sm">
                            {diseaseOptionsListForDisplay.map(d => 
                                anamnesisData[d.key] && <li key={d.key}>{d.label}</li>
                            )}
                            {anamnesisData.disease_other_details && <li>Outras: {anamnesisData.disease_other_details}</li>}
                        </ul>
                    </div>
                )}
                <DetailItem label="Cirurgias Anteriores" value={anamnesisData.surgeries_had} />
                {anamnesisData.surgeries_had === 'Sim' && <DetailItem label="Detalhes Cirurgias" value={anamnesisData.surgeries_details} />}
              </div>
            ) : <p className="text-[#b0b0b0]">Nenhuma anamnese registrada.</p>}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <Link to={NavigationPath.PatientAnamnesis.replace(':patientId', patientDetails.cpf)} state={location.state}>
                    <Button variant="ghost">
                        {anamnesisData ? 'Ver/Editar Anamnese Completa' : 'Preencher Anamnese'}
                    </Button>
                </Link>
            </div>
          </Card>

          <Card title={<div className="flex items-center text-white"><HeartIcon className="w-6 h-6 mr-3 text-[#00bcd4]" />Pressão Arterial</div>} className="bg-[#1a1a1a]">
            {bpReadings.length > 0 ? (
              <ul className="space-y-2">
                {bpReadings.map((bp, index) => (
                  <li key={bp.id || index} className="p-3 bg-[#1f1f1f] rounded-md text-sm">
                    <span className="font-semibold text-white">{isoToDdMmYyyy(bp.date)}:</span> <span className="text-white">{bp.value} mmHg</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[#b0b0b0]">Nenhuma leitura de P.A. registrada.</p>}
          </Card>

          <Card title={<div className="flex items-center text-white"><BriefcaseIcon className="w-6 h-6 mr-3 text-[#00bcd4]" />Planos de Tratamento</div>} className="bg-[#1a1a1a]">
            {treatmentPlans.length > 0 ? (
              <div className="space-y-4">
                {treatmentPlans.map(plan => (
                  <div key={plan.id} className="p-3 bg-[#1f1f1f] rounded-md">
                    <p className="text-sm text-[#b0b0b0]">Criado em: {plan.created_at ? isoToDdMmYyyy(plan.created_at.split('T')[0]) : 'N/A'}</p>
                    <p className="font-medium text-white mt-1">Descrição: <span className="font-normal whitespace-pre-wrap">{plan.description}</span></p>
                    {plan.files && plan.files.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-[#b0b0b0] mb-1">Arquivos Anexados:</h4>
                        <div className="flex flex-wrap gap-2">
                          {plan.files.map((file, index) => (
                              <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" title={file.name} className="flex-shrink-0">
                                {isImageFile(file.name) ? (
                                    <img 
                                        src={file.url} alt={file.name || 'Anexo'} 
                                        className="rounded w-16 h-16 cursor-pointer border border-gray-700 hover:opacity-80 object-cover"
                                        onClick={(e) => { e.preventDefault(); openImageInModal(file.url!); }}
                                    />
                                ) : (
                                  <div className="w-16 h-16 rounded bg-gray-700 flex flex-col items-center justify-center border border-gray-700 hover:bg-gray-600 text-center p-1">
                                      <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                                      <span className="text-xs text-gray-400 mt-1 truncate w-full">{file.name}</span>
                                  </div>
                                )}
                              </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {plan.dentist_signature && <p className="text-xs text-gray-500 mt-1">Ass.: {plan.dentist_signature}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-[#b0b0b0]">Nenhum plano de tratamento registrado.</p>}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <Link to={NavigationPath.PatientTreatmentPlans.replace(':patientId', patientDetails.cpf)} state={location.state}>
                     <Button variant="ghost">Ver/Gerenciar Planos de Tratamento</Button>
                </Link>
            </div>
          </Card>
          
          <Card title={<div className="flex items-center text-white"><CalendarDaysIcon className="w-6 h-6 mr-3 text-[#00bcd4]" />Agendamentos</div>} className="bg-[#1a1a1a]">
            {appointments.length > 0 ? (
              <ul className="space-y-3">
                {appointments.slice(0, 5).map(appt => ( 
                  <li key={appt.id} className="p-3 bg-[#1f1f1f] rounded-md text-sm">
                    <p className="font-semibold text-white">{isoToDdMmYyyy(appt.appointment_date)} às {formatToHHMM(appt.appointment_time)}</p>
                    <p className="text-gray-300">Procedimento: {appt.procedure}</p>
                    <p className="text-[#b0b0b0]">Status: {statusLabelMap[appt.status] || appt.status}</p>
                    {appt.dentist_name && <p className="text-xs text-gray-500 mt-1">Dentista: {appt.dentist_name}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[#b0b0b0]">Nenhum agendamento encontrado.</p>}
             <div className="mt-4 pt-4 border-t border-gray-700">
                <Link to={NavigationPath.Appointments}>
                     <Button variant="ghost">Ver Todos Agendamentos</Button>
                </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Action Buttons Section */}
      {(!isInitialSearchState || cameFromDentistDashboard) && !isLoadingRecord && (
        <div className="mt-8 pt-6 border-t border-gray-700 text-center space-x-4">
          {cameFromDentistDashboard && (
            <Button 
              onClick={() => navigate(NavigationPath.Home)} 
              leftIcon={<ArrowUturnLeftIcon />} 
              variant="secondary"
            >
              Voltar para Dashboard
            </Button>
          )}
          {!isInitialSearchState && ( // Show if a search was attempted or results are displayed
             <Button 
                onClick={handleClearSearch} 
                leftIcon={<MagnifyingGlassIcon />} 
                variant={cameFromDentistDashboard ? "ghost" : "secondary"}
            >
                Nova Busca no Prontuário
            </Button>
          )}
        </div>
      )}
      <ImageModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} imageUrl={selectedImageUrl} />
    </div>
  );
};