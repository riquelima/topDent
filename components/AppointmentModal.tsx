
import React, { useState, useEffect, FormEvent, useRef, useCallback, ChangeEvent } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { ChevronUpDownIcon } from './icons/HeroIcons';
import { Appointment, Patient } from '../types';
import { addAppointment, getPatientByCpf, updateAppointment, SupabaseAppointmentData, getPatients } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';

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
  // Procedure state changes
  const [selectedProcedures, setSelectedProcedures] = useState<Record<string, boolean>>({});
  const [otherProcedureText, setOtherProcedureText] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('Scheduled');
  const [isLoading, setIsLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');

  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAllPatients = useCallback(async () => {
    if (!isOpen) return;
    setIsLoadingPatients(true);
    const { data, error } = await getPatients();
    if (error) {
      showToast('Erro ao carregar lista de pacientes.', 'error');
      console.error("Error fetching all patients for dropdown:", error);
    } else {
      setAllPatients(data || []);
    }
    setIsLoadingPatients(false);
  }, [showToast, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchAllPatients();
    }
  }, [isOpen, fetchAllPatients]);
  
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
        // If there's a part that's not predefined and not "Outro(s):",
        // it's likely part of the "Outro(s)" or an old format.
        // For simplicity, we'll add it to otherProcedureText if it's not empty.
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
    if (existingAppointment) {
      setPatientCpf(existingAppointment.patient_cpf);
      setPatientName(existingAppointment.patient_name || '');
      setAppointmentDate(existingAppointment.appointment_date);
      setAppointmentTime(existingAppointment.appointment_time);
      parseProcedureString(existingAppointment.procedure);
      setNotes(existingAppointment.notes || '');
      setStatus(existingAppointment.status);
    } else {
      setPatientCpf('');
      setPatientName('');
      const today = new Date().toISOString().split('T')[0];
      setAppointmentDate(today);
      setAppointmentTime('');
      resetProcedureState();
      setNotes('');
      setStatus('Scheduled');
    }
    setCpfError('');
    setIsPatientDropdownOpen(false);
    setPatientSearchTerm('');
  }, [existingAppointment, isOpen]);

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
      setOtherProcedureText(''); // Clear text if "Outro(s)" is unchecked
    }
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

    if (!patientCpf || !appointmentDate || !appointmentTime || !procedureString) {
      showToast('Por favor, preencha Paciente, Data, Hora e ao menos um Procedimento.', 'error');
      return;
    }
    setIsLoading(true);

    const updatableAppointmentData: Partial<SupabaseAppointmentData> = {
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      procedure: procedureString,
      notes: notes || undefined,
      status,
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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handlePatientSelect = (patient: Patient) => {
    setPatientCpf(patient.cpf);
    setPatientName(patient.fullName);
    setIsPatientDropdownOpen(false);
    setCpfError('');
  };

  const filteredDropdownPatients = allPatients.filter(p => 
    p.fullName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.cpf.includes(patientSearchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"  aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-teal-400 mb-6">{existingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={dropdownRef}>
            <label htmlFor="patientCpfInput" className="block text-sm font-medium text-gray-300 mb-1">Paciente</label>
            <div className="flex">
              <Input
                id="patientCpfInput"
                value={patientCpf}
                onChange={(e) => setPatientCpf(e.target.value)}
                onBlur={handleCpfBlur}
                placeholder="Buscar Paciente"
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
              <div className="absolute top-full left-0 right-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Buscar paciente por nome ou CPF..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="w-full text-sm"
                    containerClassName="mb-2"
                  />
                </div>
                {isLoadingPatients ? (
                  <p className="text-sm text-gray-400 text-center py-2">Carregando pacientes...</p>
                ) : filteredDropdownPatients.length > 0 ? (
                  <ul>
                    {filteredDropdownPatients.map(p => (
                      <li
                        key={p.id}
                        onClick={() => handlePatientSelect(p)}
                        className="px-3 py-2 text-sm text-gray-200 hover:bg-teal-600 hover:text-white cursor-pointer"
                        role="option"
                        aria-selected={patientCpf === p.cpf}
                      >
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

          <Input
            label="Nome do Paciente"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Nome será preenchido ou digite"
            disabled={isLoading || !!existingAppointment} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Data da Consulta"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              label="Hora da Consulta"
              type="text"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              placeholder="HH:MM"
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
              title="Digite a hora no formato HH:MM (ex: 14:30)"
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Procedimentos Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimentos</label>
            <div className="space-y-2 p-3 border border-gray-700 rounded-md bg-gray-850 max-h-48 overflow-y-auto">
              {predefinedProcedures.map(proc => (
                <label key={proc} className="flex items-center space-x-2 text-gray-200 cursor-pointer hover:bg-gray-700 p-1 rounded">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
                    checked={!!selectedProcedures[proc]}
                    onChange={(e) => handleProcedureChange(proc, e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>{proc}</span>
                </label>
              ))}
              <label key={OTHER_PROCEDURE_KEY} className="flex items-center space-x-2 text-gray-200 cursor-pointer hover:bg-gray-700 p-1 rounded">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
                  checked={isOtherSelected}
                  onChange={(e) => handleOtherProcedureChange(e.target.checked)}
                  disabled={isLoading}
                />
                <span>{OTHER_PROCEDURE_KEY}</span>
              </label>
            </div>
            {isOtherSelected && (
              <Input
                label="Especifique Outro(s)"
                value={otherProcedureText}
                onChange={(e) => setOtherProcedureText(e.target.value)}
                placeholder="Digite o(s) procedimento(s) customizado(s)"
                disabled={isLoading}
                containerClassName="mt-3"
              />
            )}
          </div>

          <Textarea
            label="Observações (Opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação adicional sobre a consulta ou paciente."
            disabled={isLoading}
          />
           <Select
            label="Status"
            value={status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as Appointment['status'])}
            options={statusOptions}
            required
            disabled={isLoading}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? (existingAppointment ? 'Atualizando...' : 'Salvando...') : (existingAppointment ? 'Atualizar Agendamento' : 'Salvar Agendamento')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
