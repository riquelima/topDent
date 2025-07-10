

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select'; 
import { PlusIcon, PencilIcon, TrashIcon, BellIcon } from '../components/icons/HeroIcons'; 
import { Appointment, DentistUser, NavigationPath, ConsultationHistoryEntry } from '../types'; 
import { getAppointments, deleteAppointment, addNotification, getPatientByCpf, updateAppointmentStatus, addConsultationHistoryEntry } from '../services/supabaseService'; 
import { isoToDdMmYyyy, formatToHHMM } from '../src/utils/formatDate';
// import { AppointmentModal } from '../components/AppointmentModal'; // Removed
import { ConfirmationModal } from '../components/ui/ConfirmationModal'; 
import { useToast } from '../contexts/ToastContext'; 
import { getKnownDentists } from '../src/utils/users'; 

const statusColorMap: Record<Appointment['status'], string> = {
    Scheduled: 'bg-yellow-500', 
    Confirmed: 'bg-[#00bcd4]', 
    Completed: 'bg-green-500', 
    Cancelled: 'bg-[#f44336]', 
};
const statusTextClassMap: Record<Appointment['status'], string> = {
    Scheduled: 'text-black',
    Confirmed: 'text-black', 
    Completed: 'text-white',
    Cancelled: 'text-white',
};
const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
};

interface AppointmentToDelete {
  id: string;
  details: string;
}

type DateFilter = 'all' | 'today' | 'upcoming';

export const AppointmentsPage: React.FC = () => {
  const { showToast } = useToast(); 
  const navigate = useNavigate(); // Added useNavigate
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [filteredAndSortedAppointments, setFilteredAndSortedAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentToDelete | null>(null);

  const [dentists, setDentists] = useState<DentistUser[]>([]);
  const [isLoadingDentists, setIsLoadingDentists] = useState(true);
  const [selectedDentistId, setSelectedDentistId] = useState<string>(''); 
  const [statusFilter, setStatusFilter] = useState<Appointment['status'] | ''>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  
  const [notifiedAppointments, setNotifiedAppointments] = useState<Set<string>>(new Set());

  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);


  const fetchAppointmentsAndDentists = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingDentists(true);
    setError(null);
    try {
      const appointmentsResPromise = getAppointments();
      const knownDentistsPromise = getKnownDentists();

      const [appointmentsRes, knownDentists] = await Promise.all([appointmentsResPromise, knownDentistsPromise]);
      
      if (appointmentsRes.error) {
        const errorMessage = appointmentsRes.error.message || "Erro desconhecido ao buscar agendamentos.";
        console.error("Error fetching appointments:", errorMessage, 'Details:', JSON.stringify(appointmentsRes.error, null, 2));
        setError(`Falha ao carregar agendamentos: ${errorMessage}`);
        setAllAppointments([]);
      } else {
        setAllAppointments(appointmentsRes.data || []);
      }

      setDentists(knownDentists);

    } catch (e: any) {
      console.error("Critical error fetching data:", e);
      setError(`Erro crítico: ${e.message}`);
      setAllAppointments([]);
      setDentists([]);
    } finally {
      setIsLoading(false);
      setIsLoadingDentists(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointmentsAndDentists();
  }, [fetchAppointmentsAndDentists]);

  useEffect(() => {
    let processedAppointments = [...allAppointments];

    // Dentist filter
    if (selectedDentistId) {
      const selectedDentistObject = dentists.find(d => d.id === selectedDentistId);
      if (selectedDentistObject) {
          processedAppointments = processedAppointments.filter(appt => {
          return appt.dentist_id === selectedDentistId || appt.dentist_id === selectedDentistObject.username;
        });
      } else {
         processedAppointments = [];
      }
    }
    
    // Status filter
    if (statusFilter) {
      processedAppointments = processedAppointments.filter(appt => appt.status === statusFilter);
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];
    
    // Date filter
    switch (dateFilter) {
      case 'today':
        processedAppointments = processedAppointments.filter(appt => appt.appointment_date === today);
        break;
      case 'upcoming': // From tomorrow onwards
        processedAppointments = processedAppointments.filter(appt => appt.appointment_date >= tomorrow);
        break;
      // 'all' doesn't filter by date
    }

    // Sorting logic
    if (dateFilter === 'all') {
      const upcomingOrToday = processedAppointments.filter(appt => appt.appointment_date >= today);
      const past = processedAppointments.filter(appt => appt.appointment_date < today);

      upcomingOrToday.sort((a, b) => {
        if (a.appointment_date < b.appointment_date) return -1;
        if (a.appointment_date > b.appointment_date) return 1;
        if (a.appointment_time < b.appointment_time) return -1;
        if (a.appointment_time > b.appointment_time) return 1;
        return 0;
      });
      past.sort((a, b) => { 
          if (a.appointment_date > b.appointment_date) return -1;
          if (a.appointment_date < b.appointment_date) return 1;
          if (a.appointment_time > b.appointment_time) return -1;
          if (a.appointment_time < b.appointment_time) return 1;
          return 0;
      });
      processedAppointments = [...upcomingOrToday, ...past];
    } else {
      // For 'today' and 'upcoming', just sort ascending by date and time
      processedAppointments.sort((a, b) => {
          if (a.appointment_date < b.appointment_date) return -1;
          if (a.appointment_date > b.appointment_date) return 1;
          if (a.appointment_time < b.appointment_time) return -1;
          if (a.appointment_time > b.appointment_time) return 1;
          return 0;
      });
    }
    setFilteredAndSortedAppointments(processedAppointments);
  }, [allAppointments, selectedDentistId, statusFilter, dateFilter, dentists]);
  
  const handleStatusChange = async (appointment: Appointment) => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(appointment.id);

    let newStatus: Appointment['status'];
    switch (appointment.status) {
        case 'Scheduled':
            newStatus = 'Confirmed';
            break;
        case 'Confirmed':
            newStatus = 'Completed';
            break;
        case 'Completed':
            newStatus = 'Cancelled';
            break;
        case 'Cancelled':
            newStatus = 'Scheduled';
            break;
        default:
            newStatus = 'Scheduled';
    }

    const { data: updatedAppointment, error } = await updateAppointmentStatus(appointment.id, newStatus);
    
    if (error) {
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
    } else if (updatedAppointment) {
        showToast(`Status atualizado para "${statusLabelMap[newStatus]}"`, 'success');
        
        if ((newStatus === 'Completed' || newStatus === 'Cancelled') && appointment.patient_cpf) {
            const historyEntry: Omit<ConsultationHistoryEntry, 'id' | 'completion_timestamp' | 'created_at'> = {
                appointment_id: appointment.id,
                patient_cpf: appointment.patient_cpf,
                patient_name: appointment.patient_name,
                dentist_id: appointment.dentist_id,
                dentist_name: appointment.dentist_name,
                procedure_details: appointment.procedure,
                consultation_date: appointment.appointment_date,
                notes: appointment.notes,
                status: newStatus,
            };
            await addConsultationHistoryEntry(historyEntry);
        }

        setAllAppointments(prev => prev.map(appt => appt.id === appointment.id ? { ...appt, status: newStatus } : appt));
    }

    setIsUpdatingStatus(null);
  };


  const handleOpenNewAppointmentPage = () => {
    navigate(NavigationPath.NewAppointment);
  };

  const handleOpenEditAppointmentPage = (appointment: Appointment) => {
    navigate(NavigationPath.EditAppointment.replace(':appointmentId', appointment.id));
  };

  const handleNotifyArrival = async (appointment: Appointment) => {
    if (!appointment.dentist_id || !appointment.dentist_name) {
        showToast('Este agendamento não possui um dentista responsável definido.', 'error');
        return;
    }

    let paymentInfo = '';
    if (appointment.patient_cpf) {
        try {
            const { data: patientData, error: patientError } = await getPatientByCpf(appointment.patient_cpf);
            if (patientError) {
                console.warn("Could not fetch patient details for notification:", patientError);
            } else if (patientData) {
                if (patientData.payment_type === 'health_plan') {
                    paymentInfo = '(Plano de Saúde)';
                } else if (patientData.payment_type === 'private') {
                    paymentInfo = '(Particular)';
                }
            }
        } catch (e) {
            console.warn("Exception fetching patient details for notification:", e);
        }
    }
    
    const baseMessage = `Paciente ${appointment.patient_name} chegou para a consulta`;
    const fullMessage = paymentInfo ? `${baseMessage} ${paymentInfo}` : baseMessage;
    const notificationMessage = `${fullMessage}.`;

    setNotifiedAppointments(prev => new Set(prev).add(appointment.id));

    const { error } = await addNotification({
        dentist_id: appointment.dentist_id,
        message: notificationMessage,
        appointment_id: appointment.id,
    });

    if (error) {
        showToast('Falha ao enviar notificação.', 'error');
        console.error("Error sending notification:", error);
        setNotifiedAppointments(prev => {
            const newSet = new Set(prev);
            newSet.delete(appointment.id);
            return newSet;
        });
    } else {
        showToast(`Notificação enviada para ${appointment.dentist_name}!`, 'success');
    }
  };
  
  const requestDeleteAppointment = (id: string, details: string) => {
    setAppointmentToDelete({ id, details });
    setIsConfirmDeleteModalOpen(true);
  };

  const closeConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setAppointmentToDelete(null);
  };

  const executeDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    setIsDeleting(true); 
    const { error: deleteError } = await deleteAppointment(appointmentToDelete.id);
    if (deleteError) {
      showToast(`Erro ao excluir agendamento: ${deleteError.message}`, 'error');
      console.error("Delete appointment error:", deleteError);
    } else {
      showToast("Agendamento excluído com sucesso!", 'success');
      fetchAppointmentsAndDentists(); 
    }
    setIsDeleting(false);
    closeConfirmDeleteModal();
  };

  const dentistOptions = [
    { value: '', label: 'Todos os Dentistas' },
    ...dentists.map(d => ({ value: d.id, label: d.full_name }))
  ];

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    ...Object.entries(statusLabelMap).map(([value, label]) => ({ value, label }))
  ];

  if (isLoading && allAppointments.length === 0) {
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando agendamentos...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Agendamentos</h1>
        <Button 
          onClick={handleOpenNewAppointmentPage} 
          leftIcon={<PlusIcon className="w-5 h-5" />}
          disabled={isLoading || isDeleting}
          variant="primary"
        >
          Novo Agendamento
        </Button>
      </div>

      <Card title="Filtros e Visualização" className="bg-[#1a1a1a]" titleClassName="text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Select 
              label="Filtrar por dentista"
              value={selectedDentistId}
              onChange={(e) => setSelectedDentistId(e.target.value)}
              options={dentistOptions}
              disabled={isLoadingDentists || isLoading}
              containerClassName="mb-0"
          />
          <Select 
              label="Filtrar por status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Appointment['status'] | '')}
              options={statusOptions}
              disabled={isLoading}
              containerClassName="mb-0"
          />
          <div className="flex-shrink-0 flex items-center space-x-2 bg-[#1f1f1f] p-1 rounded-lg w-full justify-around lg:justify-end h-[calc(100%-24px)] mt-auto">
            <Button
                size="sm"
                variant={dateFilter === 'today' ? 'primary' : 'ghost'}
                onClick={() => setDateFilter('today')}
                disabled={isLoading}
            >
                Hoje
            </Button>
            <Button
                size="sm"
                variant={dateFilter === 'upcoming' ? 'primary' : 'ghost'}
                onClick={() => setDateFilter('upcoming')}
                disabled={isLoading}
            >
                Próximos
            </Button>
            <Button
                size="sm"
                variant={dateFilter === 'all' ? 'primary' : 'ghost'}
                onClick={() => setDateFilter('all')}
                disabled={isLoading}
            >
                Todos
            </Button>
          </div>
        </div>
      </Card>
      
      {filteredAndSortedAppointments.length === 0 && !isLoading ? (
        <Card className="bg-[#1a1a1a]">
          <p className="text-center text-[#b0b0b0] py-8">
            Nenhum agendamento encontrado para a seleção atual.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#1f1f1f]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Data & Hora</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Procedimento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Dentista</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
              {filteredAndSortedAppointments.map(appointment => (
                <tr key={appointment.id} className="hover:bg-[#1f1f1f] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                    {isoToDdMmYyyy(appointment.appointment_date)} <br />
                    <span className="text-xs text-gray-400">{formatToHHMM(appointment.appointment_time)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {appointment.patient_cpf ? (
                      <Link to={NavigationPath.PatientDetail.replace(':patientId', appointment.patient_cpf)} className="hover:text-[#00bcd4]">
                          {appointment.patient_name}
                      </Link>
                    ) : (
                      <span>{appointment.patient_name} <span className="text-xs text-yellow-500">(Não cadastrado)</span></span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate" title={appointment.procedure}>
                    {appointment.procedure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{appointment.dentist_name || 'Não definido'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleStatusChange(appointment)}
                      disabled={!!isUpdatingStatus}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait ${statusColorMap[appointment.status]} ${statusTextClassMap[appointment.status]}`}
                      title={`Mudar status de ${statusLabelMap[appointment.status]}`}
                    >
                      {isUpdatingStatus === appointment.id ? '...' : (statusLabelMap[appointment.status] || appointment.status)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        size="sm" variant="ghost" className="p-1.5"
                        onClick={() => handleNotifyArrival(appointment)}
                        disabled={isDeleting || notifiedAppointments.has(appointment.id)}
                        title={notifiedAppointments.has(appointment.id) ? "Notificação já enviada" : "Notificar Chegada"}
                      >
                          <BellIcon className={`w-4 h-4 ${notifiedAppointments.has(appointment.id) ? 'text-green-400' : 'text-yellow-400 hover:text-yellow-300'}`} />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1.5" onClick={() => handleOpenEditAppointmentPage(appointment)} disabled={isDeleting} title="Editar Agendamento">
                        <PencilIcon className="w-4 h-4 text-[#00bcd4] hover:text-[#00a5b8]" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1.5" onClick={() => requestDeleteAppointment(appointment.id, `${appointment.procedure} para ${appointment.patient_name}`)} disabled={isDeleting} title="Excluir Agendamento">
                        <TrashIcon className="w-4 h-4 text-[#f44336] hover:text-[#d32f2f]" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {appointmentToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={closeConfirmDeleteModal}
            onConfirm={executeDeleteAppointment}
            title="Confirmar Exclusão de Agendamento"
            message={<p>Tem certeza que deseja excluir o agendamento: <strong className="text-[#00bcd4]">{appointmentToDelete.details}</strong>? Esta ação é irreversível.</p>}
            confirmButtonText="Excluir Agendamento"
            isLoading={isDeleting}
        />
      )}
    </div>
  );
};
