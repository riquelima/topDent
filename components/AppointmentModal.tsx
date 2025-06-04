
import React, { useState, useEffect, FormEvent, useRef, useCallback, ChangeEvent } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { ChevronUpDownIcon } from './icons/HeroIcons';
import { Appointment, Patient, DentistUser } from '../types';
import { addAppointment, getPatientByCpf, updateAppointment, SupabaseAppointmentData, getPatients } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { getKnownDentists } from '../src/utils/users'; // Importa a lista de dentistas

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentSaved: (appointment: Appointment) => void;
  existingAppointment?: Appointment | null;
}

const statusOptions: { value: Appointment['status']; label: string }[] = [
  { value: 'Scheduled', label: 'Agendado' },
  { value: 'Confirmed', label: 'Confirmado' },
  { value: 'Completed', label: 'Concluído' },
  { value: 'Cancelled', label: 'Cancelado' },
];

const predefinedProcedures = [
  "Consulta", "Canal", "Extração", "Prótese", "Clareamento", 
  "Aparelho Ortodôntico", "Restauração", "Implantes Dentários", 
  "Periodontia", "Harmonização Facial"
];

const OTHER_PROCEDURE_KEY = "Outro(s)";
const OTHER_PROCEDURE_PREFIX = "Outro(s): ";

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onAppointmentSaved, existingAppointment }) => {
  const { showToast } = useToast();
  const [patientCpf, setPatientCpf] = useState('');
  const [patientName, setPatientName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedProcedures, setSelectedProcedures] = useState<Record<string, boolean>>({});
  const [otherProcedureText, setOtherProcedureText] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('Scheduled');
  const [isLoading, setIsLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');

  // Estados para seleção de Paciente
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  // Estados para seleção de Dentista
  const [availableDentists, setAvailableDentists] = useState<DentistUser[]>([]);
  const [selectedDentistId, setSelectedDentistId] = useState<string | null>(null);
  const [isDentistDropdownOpen, setIsDentistDropdownOpen] = useState(false);
  const [dentistSearchTerm, setDentistSearchTerm] = useState('');
  const dentistDropdownRef = useRef<HTMLDivElement>(null);


  const fetchModalData = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoadingPatients(true);
    const { data: patientsData, error: patientsError } = await getPatients();
    if (patientsError) {
      showToast('Erro ao carregar lista de pacientes.', 'error');
      console.error("Error fetching all patients for dropdown:", patientsError);
    } else {
      setAllPatients(patientsData || []);
    }
    setIsLoadingPatients(false);

    const dentists = getKnownDentists();
    setAvailableDentists(dentists);

  }, [showToast, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchModalData();
    }
  }, [isOpen, fetchModalData]);
  
  const resetProcedureState = () => {
    const initialSelectedProcedures: Record<string, boolean> = {};
    predefinedProcedures.forEach(p => initialSelectedProcedures[p] = false);
    setSelectedProcedures(initialSelectedProcedures);
    setIsOtherSelected(false);
    setOtherProcedureText('');
  };

  const parseProcedureString = (procedureStr: string | undefined | null) => {
    resetProcedureState();
    if (!procedureStr) return;

    const newSelectedProcedures: Record<string, boolean> = {};
    let newOtherText = '';
    let newIsOtherSelected = false;

    const parts = procedureStr.split(',').map(p => p.trim());
    parts.forEach(part => {
      if (predefinedProcedures.includes(part)) {
        newSelectedProcedures[part] = true;
      } else if (part.startsWith(OTHER_PROCEDURE_PREFIX)) {
        newOtherText = part.substring(OTHER_PROCEDURE_PREFIX.length);
        newIsOtherSelected = true;
      } else if (part && !predefinedProcedures.includes(part)) { 
        if (newOtherText) {
          newOtherText += `, ${part}`;
        } else {
          newOtherText = part;
        }
        newIsOtherSelected = true;
      }
    });
    setSelectedProcedures(current => ({...current, ...newSelectedProcedures}));
    setOtherProcedureText(newOtherText);
    setIsOtherSelected(newIsOtherSelected);
  };


  useEffect(() => {
    if (isOpen) {
        if (existingAppointment) {
            setPatientCpf(existingAppointment.patient_cpf);
            setPatientName(existingAppointment.patient_name || '');
            setAppointmentDate(existingAppointment.appointment_date);
            setAppointmentTime(existingAppointment.appointment_time);
            parseProcedureString(existingAppointment.procedure);
            setNotes(existingAppointment.notes || '');
            setStatus(existingAppointment.status);
            setSelectedDentistId(existingAppointment.dentist_id || null);
            const dentist = availableDentists.find(d => d.id === existingAppointment.dentist_id);
            setDentistSearchTerm(dentist ? dentist.name : '');


        } else {
            setPatientCpf('');
            setPatientName('');
            const today = new Date().toISOString().split('T')[0];
            setAppointmentDate(today);
            setAppointmentTime('');
            resetProcedureState();
            setNotes('');
            setStatus('Scheduled');
            setSelectedDentistId(null);
            setDentistSearchTerm('');
        }
        setCpfError('');
        setIsPatientDropdownOpen(false);
        setPatientSearchTerm('');
        setIsDentistDropdownOpen(false);
    }
  }, [existingAppointment, isOpen, availableDentists]);

  const handleCpfBlur = async () => {
    if (!patientCpf) {
      setPatientName('');
      setCpfError('');
      return;
    }
    setCpfError('');
    const { data: patient, error } = await getPatientByCpf(patientCpf);
    if (error) {
      console.error("Error fetching patient by CPF:", error);
      setCpfError("Erro ao buscar CPF.");
      setPatientName('');
    } else if (patient) {
      setPatientName(patient.fullName);
    } else {
      setCpfError("Paciente não encontrado com este CPF.");
      setPatientName('');
    }
  };
  
  const handleProcedureChange = (procedureName: string, checked: boolean) => {
    setSelectedProcedures(prev => ({ ...prev, [procedureName]: checked }));
  };

  const handleOtherProcedureChange = (checked: boolean) => {
    setIsOtherSelected(checked);
    if (!checked) {
      setOtherProcedureText(''); 
    }
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const previousTime = appointmentTime; // state value before this change

    let digits = value.replace(/\D/g, "").substring(0, 4);
    let newFormattedTime = "";

    if (digits.length === 0) {
        newFormattedTime = "";
    } else if (digits.length <= 2) {
        newFormattedTime = digits;
    } else { // digits.length is 3 or 4
        newFormattedTime = `${digits.substring(0, 2)}:${digits.substring(2)}`;
    }

    // Handle specific case for backspacing/typing that results in "HH:"
    if (value.length === 3 && value.endsWith(":") && digits.length === 2) {
       newFormattedTime = value; // Keep "HH:"
    }
    setAppointmentTime(newFormattedTime);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const finalProcedures: string[] = [];
    for (const proc of predefinedProcedures) {
        if (selectedProcedures[proc]) {
            finalProcedures.push(proc);
        }
    }
    if (isOtherSelected && otherProcedureText.trim()) {
        finalProcedures.push(`${OTHER_PROCEDURE_PREFIX}${otherProcedureText.trim()}`);
    }
    const procedureString = finalProcedures.join(', ');

    if (!patientCpf || !selectedDentistId || !appointmentDate || !appointmentTime || !procedureString) {
      showToast('Por favor, preencha Paciente, Dentista, Data, Hora e ao menos um Procedimento.', 'error');
      return;
    }
    // Validate time format using pattern for final check, though JS formatting should handle it
    const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(appointmentTime)) {
        showToast('Hora inválida. Use o formato HH:MM (ex: 14:30).', 'error');
        return;
    }

    setIsLoading(true);

    const selectedDentistObject = availableDentists.find(d => d.id === selectedDentistId);

    const updatableAppointmentData: Partial<SupabaseAppointmentData> = {
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      procedure: procedureString,
      notes: notes || undefined,
      status,
      dentist_id: selectedDentistId,
      dentist_name: selectedDentistObject?.name || null,
    };
    
    const newAppointmentData: SupabaseAppointmentData = {
      patient_cpf: patientCpf,
      patient_name: patientName || undefined,
      ...updatableAppointmentData,
    } as SupabaseAppointmentData;

    try {
      let savedAppointment: Appointment | null = null;
      if (existingAppointment?.id) {
        const { data, error } = await updateAppointment(existingAppointment.id, updatableAppointmentData);
        if (error) throw error;
        savedAppointment = data;
        showToast('Agendamento atualizado com sucesso!', 'success');
      } else {
        const { data, error } = await addAppointment(newAppointmentData);
        if (error) throw error;
        savedAppointment = data as Appointment;
        showToast('Agendamento salvo com sucesso!', 'success');
      }
      
      if (savedAppointment) {
        onAppointmentSaved(savedAppointment);
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      showToast(`Erro ao salvar agendamento: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutsidePatient = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsidePatient);
    return () => document.removeEventListener("mousedown", handleClickOutsidePatient);
  }, [patientDropdownRef]);

  useEffect(() => {
    const handleClickOutsideDentist = (event: MouseEvent) => {
      if (dentistDropdownRef.current && !dentistDropdownRef.current.contains(event.target as Node)) {
        setIsDentistDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideDentist);
    return () => document.removeEventListener("mousedown", handleClickOutsideDentist);
  }, [dentistDropdownRef]);


  const handlePatientSelect = (patient: Patient) => {
    setPatientCpf(patient.cpf);
    setPatientName(patient.fullName);
    setIsPatientDropdownOpen(false);
    setPatientSearchTerm(patient.fullName); 
    setCpfError('');
  };

  const handleDentistSelect = (dentist: DentistUser) => {
    setSelectedDentistId(dentist.id);
    setDentistSearchTerm(dentist.name); 
    setIsDentistDropdownOpen(false);
  };

  const filteredDropdownPatients = allPatients.filter(p => 
    p.fullName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.cpf.includes(patientSearchTerm)
  );

  const filteredDropdownDentists = availableDentists.filter(d =>
    d.name.toLowerCase().includes(dentistSearchTerm.toLowerCase())
  );


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"  aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-teal-400 mb-6">{existingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={patientDropdownRef}>
            <label htmlFor="patientCpfInput" className="block text-sm font-medium text-gray-300 mb-1">Paciente *</label>
            <div className="flex">
              <Input
                id="patientCpfInput"
                value={patientSearchTerm || patientName || patientCpf} 
                onChange={(e) => {
                  setPatientSearchTerm(e.target.value);
                  setPatientCpf(e.target.value); 
                  setPatientName(''); 
                  if(e.target.value.trim() !== '') setIsPatientDropdownOpen(true); else setIsPatientDropdownOpen(false);
                }}
                onFocus={() => {if (allPatients.length > 0) setIsPatientDropdownOpen(true);}}
                onBlur={handleCpfBlur}
                placeholder="Buscar Paciente por Nome ou CPF"
                required
                disabled={isLoading || !!existingAppointment}
                error={cpfError}
                containerClassName="flex-grow mb-0"
                className="rounded-r-none"
              />
              <Button
                type="button"
                onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                className="px-3 bg-gray-700 hover:bg-gray-600 border border-l-0 border-gray-700 rounded-l-none rounded-r-md h-[46px]"
                aria-expanded={isPatientDropdownOpen}
                aria-haspopup="listbox"
                title="Selecionar Paciente"
                disabled={isLoading || !!existingAppointment}
              >
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            {isPatientDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg z-30 max-h-60 overflow-y-auto">
                {isLoadingPatients ? (
                  <p className="text-sm text-gray-400 text-center py-2">Carregando pacientes...</p>
                ) : filteredDropdownPatients.length > 0 ? (
                  <ul>
                    {filteredDropdownPatients.map(p => (
                      <li key={p.id} onClick={() => handlePatientSelect(p)}
                        className="px-3 py-2 text-sm text-gray-200 hover:bg-teal-600 hover:text-white cursor-pointer"
                        role="option" aria-selected={patientCpf === p.cpf}>
                        {p.fullName} <span className="text-xs text-gray-400">({p.cpf})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">Nenhum paciente encontrado.</p>
                )}
              </div>
            )}
            {cpfError && !isPatientDropdownOpen && <p className="mt-1 text-xs text-red-400">{cpfError}</p>}
          </div>
          
           <div className="relative" ref={dentistDropdownRef}>
            <label htmlFor="dentistInput" className="block text-sm font-medium text-gray-300 mb-1">Dentista Responsável *</label>
            <div className="flex">
              <Input
                id="dentistInput"
                value={dentistSearchTerm || (availableDentists.find(d => d.id === selectedDentistId)?.name || '')}
                onChange={(e) => {
                  setDentistSearchTerm(e.target.value);
                  setSelectedDentistId(null); 
                  if(e.target.value.trim() !== '') setIsDentistDropdownOpen(true); else setIsDentistDropdownOpen(false);
                }}
                onFocus={() => {if (availableDentists.length > 0) setIsDentistDropdownOpen(true);}}
                placeholder="Buscar Dentista"
                required
                disabled={isLoading}
                containerClassName="flex-grow mb-0"
                className="rounded-r-none"
              />
              <Button
                type="button"
                onClick={() => setIsDentistDropdownOpen(!isDentistDropdownOpen)}
                className="px-3 bg-gray-700 hover:bg-gray-600 border border-l-0 border-gray-700 rounded-l-none rounded-r-md h-[46px]"
                aria-expanded={isDentistDropdownOpen}
                aria-haspopup="listbox"
                title="Selecionar Dentista"
                disabled={isLoading}
              >
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            {isDentistDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                 {availableDentists.length === 0 ? (
                     <p className="text-sm text-gray-400 text-center py-2">Nenhum dentista disponível.</p>
                 ): filteredDropdownDentists.length > 0 ? (
                  <ul>
                    {filteredDropdownDentists.map(d => (
                      <li key={d.id} onClick={() => handleDentistSelect(d)}
                        className="px-3 py-2 text-sm text-gray-200 hover:bg-teal-600 hover:text-white cursor-pointer"
                        role="option" aria-selected={selectedDentistId === d.id}>
                        {d.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">Nenhum dentista encontrado.</p>
                )}
              </div>
            )}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Data da Consulta *"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              label="Hora da Consulta *"
              type="text"
              value={appointmentTime}
              onChange={handleTimeInputChange}
              placeholder="HH:MM"
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
              title="Digite a hora no formato HH:MM (ex: 14:30)"
              maxLength={5}
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimentos *</label>
            <div className="space-y-2 p-3 border border-gray-700 rounded-md bg-gray-850 max-h-48 overflow-y-auto">
              {predefinedProcedures.map(proc => (
                <label key={proc} className="flex items-center space-x-2 text-gray-200 cursor-pointer hover:bg-gray-700 p-1 rounded">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
                    checked={!!selectedProcedures[proc]} onChange={(e) => handleProcedureChange(proc, e.target.checked)} disabled={isLoading} />
                  <span>{proc}</span>
                </label>
              ))}
              <label key={OTHER_PROCEDURE_KEY} className="flex items-center space-x-2 text-gray-200 cursor-pointer hover:bg-gray-700 p-1 rounded">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
                  checked={isOtherSelected} onChange={(e) => handleOtherProcedureChange(e.target.checked)} disabled={isLoading} />
                <span>{OTHER_PROCEDURE_KEY}</span>
              </label>
            </div>
            {isOtherSelected && (
              <Input label="Especifique Outro(s)" value={otherProcedureText} onChange={(e) => setOtherProcedureText(e.target.value)}
                placeholder="Digite o(s) procedimento(s) customizado(s)" disabled={isLoading} containerClassName="mt-3" />
            )}
          </div>

          <Textarea label="Observações (Opcional)" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação adicional sobre a consulta ou paciente." disabled={isLoading} />
           <Select label="Status" value={status} onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as Appointment['status'])}
            options={statusOptions} required disabled={isLoading} />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}> Cancelar </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? (existingAppointment ? 'Atualizando...' : 'Salvando...') : (existingAppointment ? 'Atualizar Agendamento' : 'Salvar Agendamento')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
