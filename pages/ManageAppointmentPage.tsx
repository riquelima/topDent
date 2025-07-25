
import React, { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { ChevronUpDownIcon, MagnifyingGlassIcon, ClockIcon, ArrowUturnLeftIcon } from '../components/icons/HeroIcons';
import { Appointment, Patient, DentistUser, NavigationPath, Procedure } from '../types';
import { addAppointment, getPatientByCpf, updateAppointment, getPatients, getAppointmentById, getProcedures, updatePatientLastAppointment } from '../services/supabaseService';
import type { SupabaseAppointmentData } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { getKnownDentists } from '../src/utils/users';
import { isoToDdMmYyyy, getTodayInSaoPaulo } from '../src/utils/formatDate';

const statusOptions: { value: Appointment['status']; label: string }[] = [
  { value: 'Scheduled', label: 'Agendado' },
  { value: 'Confirmed', label: 'Confirmado' },
  { value: 'Completed', label: 'Concluído' },
  { value: 'Cancelled', label: 'Cancelado' },
];

const PREDEFINED_PROCEDURES = [
  "Consulta", "Canal", "Extração", "Prótese", "Clareamento",
  "Aparelho Ortodôntico", "Restauração", "Implantes Dentários",
  "Periodontia", "Harmonização Facial"
];

const OTHER_PROCEDURE_KEY = "Outro(s)";
const OTHER_PROCEDURE_PREFIX = "Outro(s): ";

export const ManageAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams<{ appointmentId?: string }>();
  const location = useLocation();
  const isEditMode = !!appointmentId;
  const { showToast } = useToast();

  // State for appointment fields
  const [patientCpf, setPatientCpf] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');

  // State for procedures
  const [allSelectableProcedures, setAllSelectableProcedures] = useState<string[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<Record<string, boolean>>({});
  const [otherProcedureText, setOtherProcedureText] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  // Other appointment states
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('Scheduled');
  const [isLoading, setIsLoading] = useState(false); // For form submission

  // State for patient selection dropdown
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true); 
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  // State for dentist selection dropdown
  const [availableDentists, setAvailableDentists] = useState<DentistUser[]>([]);
  const [selectedDentistId, setSelectedDentistId] = useState<string | null>(null);
  const [isDentistDropdownOpen, setIsDentistDropdownOpen] = useState(false);
  const [dentistSearchTerm, setDentistSearchTerm] = useState('');
  const dentistDropdownRef = useRef<HTMLDivElement>(null);
  
  // General page state
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadedAppointmentData, setLoadedAppointmentData] = useState<Appointment | null>(null);

  const parseProcedureString = useCallback((procedureStr: string | undefined | null) => {
    const newSelected: Record<string, boolean> = {};
    allSelectableProcedures.forEach(p => newSelected[p] = false);
    let newOtherText = '';
    let newIsOtherSelected = false;

    if (procedureStr) {
      const parts = procedureStr.split(',').map(p => p.trim());
      parts.forEach(part => {
        if (allSelectableProcedures.includes(part)) {
          newSelected[part] = true;
        } else if (part.startsWith(OTHER_PROCEDURE_PREFIX)) {
          newOtherText = part.substring(OTHER_PROCEDURE_PREFIX.length);
          newIsOtherSelected = true;
        } else if (part && !allSelectableProcedures.includes(part)) { 
          if (newOtherText) newOtherText += `, ${part}`;
          else newOtherText = part;
          newIsOtherSelected = true;
        }
      });
    }
    
    setSelectedProcedures(newSelected);
    setOtherProcedureText(newOtherText);
    setIsOtherSelected(newIsOtherSelected);
  }, [allSelectableProcedures]);


  // Effect 1: Fetch initial page data (patients, dentists, customProcs, and existingAppt if editing)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingPageData(true);
      setPageError(null);
      setLoadedAppointmentData(null); 
      try {
        const [patientsRes, dentistsRes, customProceduresRes] = await Promise.all([
          getPatients(),
          getKnownDentists(),
          getProcedures() 
        ]);

        if (patientsRes.error) showToast('Erro ao carregar pacientes.', 'error');
        setAllPatients(patientsRes.data || []);
        setAvailableDentists(dentistsRes);

        const customProcedureNames = (customProceduresRes.data || []).map(p => p.name);
        const uniqueCombinedProcedures = Array.from(new Set([...PREDEFINED_PROCEDURES, ...customProcedureNames])).sort();
        setAllSelectableProcedures(uniqueCombinedProcedures);
        
        const navigationState = location.state as { patientCpf?: string; patientName?: string; } | null;

        if (isEditMode && appointmentId) {
          const { data: existingAppt, error: apptError } = await getAppointmentById(appointmentId);
          if (apptError || !existingAppt) {
            setPageError("Agendamento não encontrado ou erro ao carregar.");
            showToast("Erro ao carregar agendamento.", "error");
          } else {
            setLoadedAppointmentData(existingAppt); 
            setPatientCpf(existingAppt.patient_cpf);
            setPatientName(existingAppt.patient_name || '');
            setPatientSearchTerm(existingAppt.patient_name || '');
            const existingPatient = (patientsRes.data || []).find(p => p.cpf === existingAppt.patient_cpf);
            setPatientPhone(existingPatient?.phone || '');
            setAppointmentDate(existingAppt.appointment_date);
            setAppointmentTime(existingAppt.appointment_time);
            setNotes(existingAppt.notes || '');
            setStatus(existingAppt.status);
            setSelectedDentistId(existingAppt.dentist_id || null);
            const currentDentist = dentistsRes.find(d => d.id === existingAppt.dentist_id);
            setDentistSearchTerm(currentDentist ? currentDentist.full_name : '');
            
            // Return fields are for creating a NEW return, so they start empty.
            setReturnDate('');
            setReturnTime('');
          }
        } else if (navigationState?.patientCpf && navigationState?.patientName) {
            // This is a rebook action
            showToast(`Criando novo agendamento para: ${navigationState.patientName}`, 'info', 3000);
            
            const existingPatient = (patientsRes.data || []).find(p => p.cpf === navigationState.patientCpf);
            
            setPatientCpf(navigationState.patientCpf);
            setPatientName(navigationState.patientName);
            setPatientSearchTerm(navigationState.patientName);
            setPatientPhone(existingPatient?.phone || '');
            
            const today = getTodayInSaoPaulo();
            setAppointmentDate(today);
            setAppointmentTime('');
            setReturnDate('');
            setReturnTime('');
            setNotes('');
            setStatus('Scheduled');
            setSelectedDentistId(null);
            setDentistSearchTerm('');
        } else {
          // Standard new appointment
          const today = getTodayInSaoPaulo();
          setAppointmentDate(today);
          setPatientCpf(null);
          setPatientName('');
          setPatientPhone('');
          setPatientSearchTerm('');
          setAppointmentTime('');
          setReturnDate('');
          setReturnTime('');
          setNotes('');
          setStatus('Scheduled');
          setSelectedDentistId(null);
          setDentistSearchTerm('');
        }
      } catch (err: any) {
        setPageError("Erro ao carregar dados da página: " + (err.message || 'Erro desconhecido'));
        showToast("Erro crítico ao carregar dados.", "error");
      } finally {
        setIsLoadingPageData(false);
      }
    };
    fetchInitialData();
  }, [appointmentId, isEditMode, showToast, location.state]);

  // Effect 2: Parse procedures when loadedAppointmentData or allSelectableProcedures changes, or when switching to new mode
  useEffect(() => {
    if (allSelectableProcedures.length > 0) { // Ensure procedures list is ready
        if (isEditMode && loadedAppointmentData) {
            parseProcedureString(loadedAppointmentData.procedure);
        } else if (!isEditMode) {
            parseProcedureString(null); 
        }
    }
  }, [isEditMode, loadedAppointmentData, allSelectableProcedures, parseProcedureString]);

  const handleProcedureChange = (procedureName: string, checked: boolean) => {
    setSelectedProcedures(prev => ({ ...prev, [procedureName]: checked }));
  };

  const handleOtherProcedureChange = (checked: boolean) => {
    setIsOtherSelected(checked);
    if (!checked) setOtherProcedureText('');
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let digits = value.replace(/\D/g, "").substring(0, 4);
    let newFormattedTime = "";

    if (digits.length === 0) {
      newFormattedTime = "";
    } else if (digits.length <= 2) {
      newFormattedTime = digits;
    } else {
      newFormattedTime = `${digits.substring(0, 2)}:${digits.substring(2)}`;
    }
    
    if (value.length === 3 && value.endsWith(":") && digits.length === 2) {
      newFormattedTime = value;
    }
    setAppointmentTime(newFormattedTime);
  };
  
  const handleReturnTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let digits = value.replace(/\D/g, "").substring(0, 4);
    let newFormattedTime = "";

    if (digits.length === 0) {
      newFormattedTime = "";
    } else if (digits.length <= 2) {
      newFormattedTime = digits;
    } else {
      newFormattedTime = `${digits.substring(0, 2)}:${digits.substring(2)}`;
    }
    
    if (value.length === 3 && value.endsWith(":") && digits.length === 2) {
      newFormattedTime = value;
    }
    setReturnTime(newFormattedTime);
  };

  const triggerConfirmationWebhook = () => {
    const webhookUrl = 'https://primary-production-76569.up.railway.app/webhook/3b9c4d09-ad0f-4c10-a405-c49014ca14da';
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
    }).catch(error => {
      // Log the error but don't bother the user, as we can't know if it really failed
      console.error('Webhook trigger request failed to dispatch:', error);
    });
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalProcedures: string[] = [];
    Object.keys(selectedProcedures).forEach(proc => {
        if (selectedProcedures[proc]) finalProcedures.push(proc);
    });
    if (isOtherSelected && otherProcedureText.trim()) {
        finalProcedures.push(`${OTHER_PROCEDURE_PREFIX}${otherProcedureText.trim()}`);
    }
    const procedureString = finalProcedures.join(', ');

    if (!patientName.trim() || !selectedDentistId || !appointmentDate || !appointmentTime || !procedureString) {
      showToast('Paciente, Dentista, Data, Hora e Procedimento são obrigatórios.', 'error');
      return;
    }
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(appointmentTime)) {
        showToast('Hora inválida. Use HH:MM (ex: 14:30).', 'error');
        return;
    }

    setIsLoading(true);
    const selectedDentistObject = availableDentists.find(d => d.id === selectedDentistId);
    
    const appointmentDataPayload: SupabaseAppointmentData = {
      patient_cpf: patientCpf,
      patient_name: patientName.trim(),
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      procedure: procedureString,
      notes: notes || undefined,
      status,
      dentist_id: selectedDentistId,
      dentist_name: selectedDentistObject?.full_name || null,
      return_date: null, // This is now handled by creating a new appointment
    };

    try {
      let savedAppointment: Appointment | null = null;
      if (isEditMode && appointmentId) {
        const { data, error } = await updateAppointment(appointmentId, appointmentDataPayload);
        if (error) throw error;
        savedAppointment = data;
        showToast('Agendamento atualizado com sucesso!', 'success');
      } else {
        const { data: newData, error: mainError } = await addAppointment(appointmentDataPayload);
        if (mainError) throw mainError;
        savedAppointment = newData;
        showToast('Agendamento salvo com sucesso!', 'success');
      }

      if (savedAppointment) {
          if (savedAppointment.patient_cpf && savedAppointment.status === 'Completed') {
            const { error: updatePatientError } = await updatePatientLastAppointment(savedAppointment.patient_cpf, savedAppointment.appointment_date);
            if (updatePatientError) {
              console.warn("Failed to update patient's last appointment date:", updatePatientError);
              showToast("Falha ao atualizar data no perfil do paciente.", "warning");
            }
          }
          
          if (patientPhone && patientPhone.trim()) {
              triggerConfirmationWebhook();
              showToast('Confirmação de agendamento enviada para o WhatsApp do paciente!', 'success', 6000);
          } else {
              showToast('Agendamento salvo. Lembrete do WhatsApp não enviado (paciente sem telefone).', 'warning', 8000);
          }
      }
      
      if (returnDate && returnTime) {
        if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(returnTime)) {
            showToast('Hora do retorno é inválida. O agendamento principal foi salvo, mas o retorno não.', 'warning', 8000);
        } else {
            const returnAppointmentPayload: SupabaseAppointmentData = {
              patient_cpf: patientCpf,
              patient_name: patientName.trim(),
              appointment_date: returnDate,
              appointment_time: returnTime,
              procedure: "Retorno", 
              notes: `Agendamento de retorno referente à consulta de ${isoToDdMmYyyy(appointmentDate)}.`,
              status: 'Scheduled',
              dentist_id: selectedDentistId,
              dentist_name: selectedDentistObject?.full_name || null,
              return_date: null,
            };
            const { error: returnError } = await addAppointment(returnAppointmentPayload);
            if (returnError) {
              showToast(`Agendamento principal salvo, mas falha ao criar retorno: ${returnError.message}`, 'error', 8000);
            } else {
              showToast('Agendamento de retorno criado com sucesso!', 'success');
            }
        }
      }

      navigate(NavigationPath.Appointments);
    } catch (error: any) {
      showToast(`Erro: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent, ref: React.RefObject<HTMLDivElement>, setOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const patientListener = (e: MouseEvent) => handleClickOutside(e, patientDropdownRef, setIsPatientDropdownOpen);
    const dentistListener = (e: MouseEvent) => handleClickOutside(e, dentistDropdownRef, setIsDentistDropdownOpen);

    document.addEventListener("mousedown", patientListener);
    document.addEventListener("mousedown", dentistListener);
    return () => {
      document.removeEventListener("mousedown", patientListener);
      document.removeEventListener("mousedown", dentistListener);
    };
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setPatientCpf(patient.cpf);
    setPatientName(patient.fullName);
    setPatientPhone(patient.phone || '');
    setPatientSearchTerm(patient.fullName);
    setIsPatientDropdownOpen(false);
  };
  
  const handlePatientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setPatientSearchTerm(newSearchTerm);
    setPatientName(newSearchTerm);
    setPatientCpf(null);
    setPatientPhone(''); // Clear phone when typing new patient name
    if(newSearchTerm.trim() !== '') {
        setIsPatientDropdownOpen(true);
    } else {
        setIsPatientDropdownOpen(false);
    }
  };


  const handleDentistSelect = (dentist: DentistUser) => {
    setSelectedDentistId(dentist.id);
    setDentistSearchTerm(dentist.full_name);
    setIsDentistDropdownOpen(false);
  };
  
  const filteredDropdownPatients = allPatients.filter(p =>
    p.fullName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.cpf.includes(patientSearchTerm)
  );

  const filteredDropdownDentists = availableDentists.filter(d =>
    d.full_name.toLowerCase().includes(dentistSearchTerm.toLowerCase())
  );

  if (isLoadingPageData) {
    return <div className="text-center py-10 text-gray-300">Carregando dados do agendamento...</div>;
  }
  if (pageError) {
    return (
        <div>
            <Card title="Erro ao Carregar Agendamento" className="bg-[#1a1a1a]">
                 <p className="text-red-500 text-center py-4">{pageError}</p>
                 <div className="text-center mt-4">
                    <Button onClick={() => navigate(NavigationPath.Appointments)} leftIcon={<ArrowUturnLeftIcon />} variant="secondary">
                        Voltar para Agendamentos
                    </Button>
                </div>
            </Card>
        </div>
    );
  }

  return (
    <div>
      <Card title={isEditMode ? 'Editar Agendamento' : 'Novo Agendamento'} className="bg-[#1a1a1a]">
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative" ref={patientDropdownRef}>
              <label htmlFor="patientCpfInput" className="block text-sm font-medium text-gray-300 mb-1">Paciente *</label>
              <div className="flex">
                <Input
                  id="patientCpfInput" value={patientSearchTerm}
                  onChange={handlePatientInputChange}
                  onFocus={() => {if (allPatients.length > 0 && patientSearchTerm) setIsPatientDropdownOpen(true);}}
                  placeholder="Buscar ou Digitar Nome do Paciente" required
                  disabled={isLoading || (isEditMode && !!loadedAppointmentData?.patient_cpf)}
                  containerClassName="flex-grow mb-0" className="rounded-r-none"
                  prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                />
                <Button type="button" onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                  className="px-3 bg-gray-700 hover:bg-gray-600 border border-l-0 border-gray-600 rounded-l-none rounded-r-md h-[46px]"
                  aria-expanded={isPatientDropdownOpen} title="Selecionar Paciente" 
                  disabled={isLoading || (isEditMode && !!loadedAppointmentData?.patient_cpf)}
                ><ChevronUpDownIcon className="w-5 h-5 text-gray-400" /></Button>
              </div>
              {isPatientDropdownOpen && !(isEditMode && !!loadedAppointmentData?.patient_cpf) && (
                <div className="absolute top-full left-0 right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  {allPatients.length === 0 && !isLoadingPageData ? <p className="text-sm text-gray-400 text-center py-2">Carregando...</p> :
                    filteredDropdownPatients.length > 0 ? <ul>{filteredDropdownPatients.map(p => (
                      <li key={p.id} onClick={() => handlePatientSelect(p)}
                          className="px-3 py-2 text-sm text-white hover:bg-teal-500 hover:text-black cursor-pointer"
                      >{p.fullName} <span className="text-xs text-gray-300">({p.cpf})</span></li>))}
                    </ul> : <p className="text-sm text-gray-400 text-center py-2">Nenhum paciente encontrado.</p>}
                </div>
              )}
            </div>

            <Input
              label="Telefone do Paciente (para lembretes)"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="Ex: 5571987654321"
              disabled={isLoading}
            />

            <div className="relative" ref={dentistDropdownRef}>
              <label htmlFor="dentistSelectInput" className="block text-sm font-medium text-gray-300 mb-1">Dentista Responsável *</label>
              <div className="flex">
                <Input id="dentistSelectInput" value={dentistSearchTerm}
                  onChange={(e) => {setDentistSearchTerm(e.target.value); if(e.target.value.trim() !== '') setIsDentistDropdownOpen(true); else setIsDentistDropdownOpen(false);}}
                  onFocus={() => {if (availableDentists.length > 0) setIsDentistDropdownOpen(true);}}
                  placeholder="Buscar Dentista" required disabled={isLoading}
                  containerClassName="flex-grow mb-0" className="rounded-r-none h-[46px]"
                  prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                />
                <Button type="button" onClick={() => setIsDentistDropdownOpen(!isDentistDropdownOpen)}
                  className="px-3 bg-gray-700 hover:bg-gray-600 border border-l-0 border-gray-600 rounded-l-none rounded-r-md h-[46px]"
                  aria-expanded={isDentistDropdownOpen} title="Selecionar Dentista" disabled={isLoading}
                ><ChevronUpDownIcon className="w-5 h-5 text-gray-400" /></Button>
              </div>
              {isDentistDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  {filteredDropdownDentists.length > 0 ?
                    <ul>{filteredDropdownDentists.map(d => (
                      <li key={d.id} onClick={() => handleDentistSelect(d)}
                        className="px-3 py-2 text-sm text-white hover:bg-teal-500 hover:text-black cursor-pointer"
                      >{d.full_name}</li>))}
                    </ul> : <p className="text-sm text-gray-400 text-center py-2">Nenhum dentista encontrado.</p>}
                </div>
              )}
            </div>

            {isEditMode && (
              <Select
                label="Status *" value={status}
                onChange={(e) => setStatus(e.target.value as Appointment['status'])}
                options={statusOptions} disabled={isLoading} containerClassName="mb-0"
              />
            )}
            <DatePicker
              label="Data da Consulta *" value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)} required disabled={isLoading}
            />
            <Input
              label="Hora da Consulta (HH:MM) *" value={appointmentTime}
              onChange={handleTimeInputChange} required disabled={isLoading}
              prefixIcon={<ClockIcon className="w-5 h-5 text-gray-400" />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento(s) *</label>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allSelectableProcedures.map((proc) => (
                <label key={proc} className="flex items-center space-x-2 text-white cursor-pointer hover:text-teal-300">
                  <input
                    type="checkbox"
                    checked={!!selectedProcedures[proc]}
                    onChange={(e) => handleProcedureChange(proc, e.target.checked)}
                    className="form-checkbox h-5 w-5 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
                    disabled={isLoading}
                  />
                  <span>{proc}</span>
                </label>
              ))}
               <label key={OTHER_PROCEDURE_KEY} className="flex items-center space-x-2 text-white cursor-pointer hover:text-teal-300">
                  <input
                    type="checkbox"
                    checked={isOtherSelected}
                    onChange={(e) => handleOtherProcedureChange(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
                    disabled={isLoading}
                  />
                  <span>{OTHER_PROCEDURE_KEY}</span>
                </label>
            </div>
            {isOtherSelected && (
              <Input
                containerClassName="mt-4"
                label="Especificar Outro(s) Procedimento(s)"
                value={otherProcedureText}
                onChange={(e) => setOtherProcedureText(e.target.value)}
                placeholder="Ex: Limpeza, Aplicação de flúor"
                disabled={isLoading}
              />
            )}
          </div>

          <Textarea
            label="Observações Adicionais" value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4} placeholder="Notas sobre o agendamento, estado do paciente, etc." disabled={isLoading}
          />
          
          <fieldset className="p-4 border border-dashed border-gray-600 rounded-lg">
            <legend className="px-2 text-sm font-medium text-gray-400">Criar Retorno (Opcional)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <DatePicker
                    label="Data do Retorno" value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)} disabled={isLoading}
                />
                <Input
                    label="Hora do Retorno (HH:MM)" value={returnTime}
                    onChange={handleReturnTimeChange} disabled={isLoading}
                    prefixIcon={<ClockIcon className="w-5 h-5 text-gray-400" />}
                />
            </div>
            <p className="text-xs text-gray-500 mt-2">Preencha para criar um novo agendamento de retorno automaticamente.</p>
          </fieldset>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate(NavigationPath.Appointments)} leftIcon={<ArrowUturnLeftIcon />} disabled={isLoading}>
              Voltar para Agendamentos
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? (isEditMode ? 'Atualizando...' : 'Salvando...') : (isEditMode ? 'Atualizar Agendamento' : 'Salvar Agendamento')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
