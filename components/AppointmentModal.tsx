import React, { useState, useEffect, FormEvent } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Appointment, Patient } from '../types';
import { addAppointment, getPatientByCpf, updateAppointment, SupabaseAppointmentData } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext'; // Import useToast

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentSaved: (appointment: Appointment) => void;
  existingAppointment?: Appointment | null; // For editing
}

const statusOptions: { value: Appointment['status']; label: string }[] = [
  { value: 'Scheduled', label: 'Agendado' },
  { value: 'Confirmed', label: 'Confirmado' },
  { value: 'Completed', label: 'Concluído' },
  { value: 'Cancelled', label: 'Cancelado' },
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onAppointmentSaved, existingAppointment }) => {
  const { showToast } = useToast(); // Initialize useToast
  const [patientCpf, setPatientCpf] = useState('');
  const [patientName, setPatientName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(''); // YYYY-MM-DD
  const [appointmentTime, setAppointmentTime] = useState(''); // HH:MM
  const [procedure, setProcedure] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('Scheduled');
  const [isLoading, setIsLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');

  useEffect(() => {
    if (existingAppointment) {
      setPatientCpf(existingAppointment.patient_cpf);
      setPatientName(existingAppointment.patient_name || '');
      setAppointmentDate(existingAppointment.appointment_date);
      setAppointmentTime(existingAppointment.appointment_time);
      setProcedure(existingAppointment.procedure);
      setNotes(existingAppointment.notes || '');
      setStatus(existingAppointment.status);
    } else {
      // Reset form for new appointment
      setPatientCpf('');
      setPatientName('');
      const today = new Date().toISOString().split('T')[0];
      setAppointmentDate(today);
      setAppointmentTime('');
      setProcedure('');
      setNotes('');
      setStatus('Scheduled');
    }
    setCpfError('');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientCpf || !appointmentDate || !appointmentTime || !procedure) {
      showToast('Por favor, preencha CPF, Data, Hora e Procedimento.', 'error');
      return;
    }
    setIsLoading(true);

    // Prepare data for update or insert
    // patient_cpf and patient_name are not updated for existing appointments via this modal
    const updatableAppointmentData: Partial<SupabaseAppointmentData> = {
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      procedure,
      notes: notes || undefined,
      status,
    };
    
    // For new appointments, include patient_cpf and patient_name
    const newAppointmentData: SupabaseAppointmentData = {
      patient_cpf: patientCpf,
      patient_name: patientName || undefined,
      ...updatableAppointmentData,
    } as SupabaseAppointmentData; // Cast because updatableAppointmentData is Partial

    try {
      let savedAppointment: Appointment | null = null;
      if (existingAppointment?.id) {
        // Update existing appointment
        const { data, error } = await updateAppointment(existingAppointment.id, updatableAppointmentData);
        if (error) throw error;
        savedAppointment = data;
        showToast('Agendamento atualizado com sucesso!', 'success');
      } else {
        // Add new appointment
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"  aria-modal="true" role="dialog">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-teal-400 mb-6">{existingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="CPF do Paciente"
            value={patientCpf}
            onChange={(e) => setPatientCpf(e.target.value)}
            onBlur={handleCpfBlur}
            placeholder="Digite o CPF e pressione Tab"
            required
            disabled={isLoading || !!existingAppointment}
            error={cpfError}
          />
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
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              disabled={isLoading}
              className="dark:[color-scheme:dark]"
            />
          </div>
          <Input
            label="Procedimento"
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            placeholder="Ex: Limpeza, Consulta, Extração"
            required
            disabled={isLoading}
          />
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
            onChange={(e) => setStatus(e.target.value as Appointment['status'])}
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
