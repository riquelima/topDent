
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select'; 
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PlusIcon, PencilIcon, TrashIcon, BellIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/icons/HeroIcons'; 
import { Appointment, DentistUser, NavigationPath, ConsultationHistoryEntry } from '../types'; 
import { getAppointments, deleteAppointment, addNotification, getPatientByCpf, updateAppointmentStatus, addConsultationHistoryEntry, getProcedures, updatePatientLastAppointment } from '../services/supabaseService'; 
import { isoToDdMmYyyy, formatToHHMM, getTodayInSaoPaulo } from '../src/utils/formatDate';
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

type DateFilter = 'all' | 'today' | 'upcoming' | 'custom';

export const AppointmentsPage: React.FC = () => {
  const { showToast } = useToast(); 
  const navigate = useNavigate();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentToDelete | null>(null);

  const [dentists, setDentists] = useState<DentistUser[]>([]);
  const [isLoadingDentists, setIsLoadingDentists] = useState(true);
  
  // Filter states
  const [selectedDentistId, setSelectedDentistId] = useState<string>(''); 
  const [statusFilter, setStatusFilter] = useState<Appointment['status'] | ''>('');
  const [procedureFilter, setProcedureFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDate, setCustomDate] = useState('');
  
  const [availableProcedures, setAvailableProcedures] = useState<string[]>([]);
  const [notifiedAppointments, setNotifiedAppointments] = useState<Set<string>>(new Set());

  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // New state for the calendar popup
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // State for the calendar popup's month view - moved to top level
  const [calendarCurrentMonth, setCalendarCurrentMonth] = useState(new Date());

  const [arrivalModalInfo, setArrivalModalInfo] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
    step: 'select_type' | 'fill_details';
    healthPlanName: string;
    gto: string;
  }>({
    isOpen: false,
    appointment: null,
    step: 'select_type',
    healthPlanName: '',
    gto: '',
  });


  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingDentists(true);
    setError(null);
    try {
      const [appointmentsRes, knownDentistsRes, proceduresRes] = await Promise.all([
        getAppointments(),
        getKnownDentists(),
        getProcedures(),
      ]);
      
      if (appointmentsRes.error) {
        const errorMessage = appointmentsRes.error.message || "Erro desconhecido ao buscar agendamentos.";
        throw new Error(`Falha ao carregar agendamentos: ${errorMessage}`);
      }
      
      const appointmentsData = appointmentsRes.data || [];
      setAllAppointments(appointmentsData);
      setDentists(knownDentistsRes);

      const uniqueProceduresFromAppointments = new Set(
        appointmentsData.flatMap(a => a.procedure.split(',').map(p => p.trim()).filter(p => p))
      );
      const customProcedures = (proceduresRes.data || []).map(p => p.name);
      const allUniqueProcedures = Array.from(new Set([...uniqueProceduresFromAppointments, ...customProcedures])).sort();
      setAvailableProcedures(allUniqueProcedures);

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
    fetchPageData();
  }, [fetchPageData]);
  
  const filteredAndSortedAppointments = useMemo(() => {
    let processedAppointments = [...allAppointments];

    // Filters
    if (selectedDentistId) {
      const selectedDentistObject = dentists.find(d => d.id === selectedDentistId);
      if (selectedDentistObject) {
        processedAppointments = processedAppointments.filter(appt => appt.dentist_id === selectedDentistId || appt.dentist_id === selectedDentistObject.username);
      } else {
        processedAppointments = [];
      }
    }
    if (statusFilter) {
      processedAppointments = processedAppointments.filter(appt => appt.status === statusFilter);
    }
    if (procedureFilter) {
      processedAppointments = processedAppointments.filter(appt => appt.procedure.includes(procedureFilter));
    }

    const today = getTodayInSaoPaulo();
    
    switch (dateFilter) {
      case 'today':
        processedAppointments = processedAppointments.filter(appt => appt.appointment_date === today);
        break;
      case 'upcoming': 
        processedAppointments = processedAppointments.filter(appt => appt.appointment_date > today);
        break;
      case 'custom':
        if(customDate) {
          processedAppointments = processedAppointments.filter(appt => appt.appointment_date === customDate);
        }
        break;
    }

    // Sorting
    if (dateFilter === 'upcoming') {
      // Ascending sort for upcoming appointments (soonest first)
      processedAppointments.sort((a, b) => {
          if (a.appointment_date < b.appointment_date) return -1;
          if (a.appointment_date > b.appointment_date) return 1;
          if (a.appointment_time < b.appointment_time) return -1;
          if (a.appointment_time > b.appointment_time) return 1;
          return 0;
      });
    } else {
        // Descending sort for 'all' and 'today' (most recent first)
        processedAppointments.sort((a, b) => {
            if (a.appointment_date > b.appointment_date) return -1;
            if (a.appointment_date < b.appointment_date) return 1;
            if (a.appointment_time > b.appointment_time) return -1;
            if (a.appointment_time < b.appointment_time) return 1;
            return 0;
        });
    }
    
    return processedAppointments;
  }, [allAppointments, selectedDentistId, statusFilter, dateFilter, dentists, procedureFilter, customDate]);
  
  const appointmentsByDate = useMemo(() => {
    return filteredAndSortedAppointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
      const date = appt.appointment_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(appt);
      return acc;
    }, {});
  }, [filteredAndSortedAppointments]);

  // Handle outside clicks for the calendar popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);
  
  // Sync the calendar's display month when it's opened.
  useEffect(() => {
    if (isCalendarOpen) {
      // If a custom date is selected, start the calendar there. Otherwise, start on today's month.
      setCalendarCurrentMonth(customDate ? new Date(customDate + "T12:00:00") : new Date());
    }
  }, [isCalendarOpen, customDate]);

  const handleStatusChange = async (appointment: Appointment) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(appointment.id);
    let newStatus: Appointment['status'];
    switch (appointment.status) {
        case 'Scheduled': newStatus = 'Confirmed'; break;
        case 'Confirmed': newStatus = 'Completed'; break;
        case 'Completed': newStatus = 'Cancelled'; break;
        case 'Cancelled': newStatus = 'Scheduled'; break;
        default: newStatus = 'Scheduled';
    }
    const { data: updatedAppointment, error } = await updateAppointmentStatus(appointment.id, newStatus);
    if (error) {
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
    } else if (updatedAppointment) {
        showToast(`Status atualizado para "${statusLabelMap[newStatus]}"`, 'success');
        
        if (newStatus === 'Completed' && appointment.patient_cpf) {
            await updatePatientLastAppointment(appointment.patient_cpf, appointment.appointment_date);
        }
        
        if ((newStatus === 'Completed' || newStatus === 'Cancelled') && appointment.patient_cpf) {
            const historyEntry: Omit<ConsultationHistoryEntry, 'id' | 'completion_timestamp' | 'created_at'> = {
                appointment_id: appointment.id, patient_cpf: appointment.patient_cpf,
                patient_name: appointment.patient_name, dentist_id: appointment.dentist_id,
                dentist_name: appointment.dentist_name, procedure_details: appointment.procedure,
                consultation_date: appointment.appointment_date, notes: appointment.notes, status: newStatus,
            };
            await addConsultationHistoryEntry(historyEntry);
        }
        setAllAppointments(prev => prev.map(appt => appt.id === appointment.id ? { ...appt, status: newStatus } : appt));
    }
    setIsUpdatingStatus(null);
  };

  const handleRebookAppointment = (appointment: Appointment) => {
    if (!appointment.patient_cpf || !appointment.patient_name) {
        showToast("Não é possível reagendar para um paciente não cadastrado.", "warning");
        return;
    }
    navigate(NavigationPath.NewAppointment, { state: { patientCpf: appointment.patient_cpf, patientName: appointment.patient_name } });
  };
  
  const sendArrivalNotification = async (type: 'private' | 'health_plan') => {
    const { appointment, healthPlanName, gto } = arrivalModalInfo;
    if (!appointment) return;

    let message = `Paciente ${appointment.patient_name} chegou para a consulta.`;
    
    if (type === 'private') {
        message += `\nTipo: Consulta Particular`;
    } else if (type === 'health_plan') {
        if (!healthPlanName.trim() || !gto.trim()) {
            showToast('Plano e GTO são obrigatórios.', 'error');
            return;
        }
        message += `\nTipo: Plano de Saúde\nPlano: ${healthPlanName.trim()}\nNº GTO: ${gto.trim()}`;
    } else {
      return;
    }

    setNotifiedAppointments(prev => new Set(prev).add(appointment.id));

    const { error } = await addNotification({
        dentist_id: appointment.dentist_id!,
        message,
        appointment_id: appointment.id,
    });

    if (error) {
        const detail = error.message ? `: ${error.message}` : '.';
        showToast(`Falha ao enviar notificação${detail}`, 'error', 6000);
        setNotifiedAppointments(prev => { const newSet = new Set(prev); newSet.delete(appointment.id); return newSet; });
    } else {
        showToast(`Notificação enviada para ${appointment.dentist_name}!`, 'success');
    }
    
    setArrivalModalInfo({ isOpen: false, appointment: null, step: 'select_type', healthPlanName: '', gto: '' });
  };

  const handleNotifyArrival = (appointment: Appointment) => {
    if (!appointment.dentist_id || !appointment.dentist_name) {
        showToast('Este agendamento não possui um dentista responsável definido.', 'error');
        return;
    }
    setArrivalModalInfo({
        isOpen: true,
        appointment,
        step: 'select_type',
        healthPlanName: '',
        gto: '',
    });
  };
  
  const requestDeleteAppointment = (id: string, details: string) => {
    setAppointmentToDelete({ id, details });
    setIsConfirmDeleteModalOpen(true);
  };

  const closeConfirmDeleteModal = () => setIsConfirmDeleteModalOpen(false);

  const executeDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    setIsDeleting(true); 
    const { error: deleteError } = await deleteAppointment(appointmentToDelete.id);
    if (deleteError) showToast(`Erro ao excluir agendamento: ${deleteError.message}`, 'error');
    else {
      showToast("Agendamento excluído com sucesso!", 'success');
      fetchPageData(); 
    }
    setIsDeleting(false);
    closeConfirmDeleteModal();
  };

  const handleDateFilterChange = (filter: 'today' | 'upcoming' | 'all') => {
    setDateFilter(filter);
    setCustomDate('');
    setIsCalendarOpen(false);
  };

  const handleCustomDateSelect = (date: string) => {
    setCustomDate(date);
    setDateFilter('custom');
    setIsCalendarOpen(false);
  };
  
  const appointmentDatesSet = useMemo(() => {
    return new Set(allAppointments.map(a => a.appointment_date));
  }, [allAppointments]);

  const dentistOptions = [{ value: '', label: 'Todos os Dentistas' }, ...dentists.map(d => ({ value: d.id, label: d.full_name }))];
  const statusOptions = [{ value: '', label: 'Todos os Status' }, ...Object.entries(statusLabelMap).map(([value, label]) => ({ value, label }))];
  const procedureOptions = [{ value: '', label: 'Todos os Procedimentos' }, ...availableProcedures.map(p => ({ value: p, label: p }))];
  
  if (isLoading && allAppointments.length === 0) return <div className="text-center py-10 text-[#b0b0b0]">Carregando agendamentos...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  const renderCalendarPopup = () => {
    // This is no longer a component and does not call hooks
    const handlePrevMonth = () => setCalendarCurrentMonth(new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCalendarCurrentMonth(new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth() + 1, 1));

    const year = calendarCurrentMonth.getFullYear();
    const month = calendarCurrentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const paddingDays = Array.from({ length: firstDayOfMonth });

    return (
        <div ref={calendarRef} className="absolute top-full right-0 mt-2 bg-[#1f1f1f] border border-gray-700 rounded-lg shadow-2xl z-20 p-4 w-72">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5 text-white" /></button>
                <h3 className="font-semibold text-base text-white">
                    {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarCurrentMonth).replace(/^\w/, c => c.toUpperCase())}
                </h3>
                <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5 text-white" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = dateString === customDate;
                    const hasAppointment = appointmentDatesSet.has(dateString);

                    return (
                        <button
                            key={day}
                            onClick={() => handleCustomDateSelect(dateString)}
                            className={`w-full aspect-square rounded-full text-sm flex items-center justify-center relative transition-colors duration-150
                              ${isSelected ? 'bg-teal-500 text-black font-bold' : isToday ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-200'}`}
                        >
                            {day}
                            {hasAppointment && <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-teal-400'}`} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Agendamentos</h1>
        <Button onClick={() => navigate(NavigationPath.NewAppointment)} leftIcon={<PlusIcon />} disabled={isLoading || isDeleting} variant="primary">Novo Agendamento</Button>
      </div>

      <Card title="Filtros e Visualização" className="bg-[#1a1a1a] overflow-visible" titleClassName="text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Select label="Filtrar por dentista" value={selectedDentistId} onChange={e => setSelectedDentistId(e.target.value)} options={dentistOptions} disabled={isLoadingDentists || isLoading} containerClassName="mb-0"/>
          <Select label="Filtrar por procedimento" value={procedureFilter} onChange={e => setProcedureFilter(e.target.value)} options={procedureOptions} disabled={isLoading} containerClassName="mb-0"/>
          <Select label="Filtrar por status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as Appointment['status'] | '')} options={statusOptions} disabled={isLoading} containerClassName="mb-0"/>
          <div className="relative">
            <div className="flex-shrink-0 flex items-center space-x-2 bg-[#1f1f1f] p-1 rounded-lg w-full justify-around lg:justify-end h-[calc(100%-24px)] mt-auto">
              <Button size="sm" variant={dateFilter === 'today' ? 'primary' : 'ghost'} onClick={() => handleDateFilterChange('today')} disabled={isLoading}>Hoje</Button>
              <Button size="sm" variant={dateFilter === 'upcoming' ? 'primary' : 'ghost'} onClick={() => handleDateFilterChange('upcoming')} disabled={isLoading}>Próximos</Button>
              <Button size="sm" variant={dateFilter === 'all' ? 'primary' : 'ghost'} onClick={() => handleDateFilterChange('all')} disabled={isLoading}>Todos</Button>
              <Button size="sm" variant={dateFilter === 'custom' ? 'primary' : 'ghost'} onClick={() => setIsCalendarOpen(prev => !prev)} disabled={isLoading} leftIcon={<CalendarDaysIcon className="w-4 h-4 mr-1" />}>
                {customDate ? isoToDdMmYyyy(customDate) : 'Data'}
              </Button>
            </div>
            {isCalendarOpen && renderCalendarPopup()}
          </div>
        </div>
      </Card>
      
      {Object.keys(appointmentsByDate).length === 0 && !isLoading ? (
        <Card className="bg-[#1a1a1a]"><p className="text-center text-[#b0b0b0] py-8">Nenhum agendamento encontrado para a seleção atual.</p></Card>
      ) : (
        <div className="overflow-x-auto bg-[#1a1a1a] shadow-lg rounded-lg border border-gray-700/50">
          <table className="min-w-full">
            <thead className="bg-[#1f1f1f]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Procedimento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Dentista</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Hora</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            {Object.entries(appointmentsByDate).map(([date, appointmentsForDate]) => (
              <tbody key={date} className="divide-y divide-gray-800">
                <tr className="bg-gray-800/50">
                  <th colSpan={6} className="px-4 py-2 text-left text-sm font-semibold text-white">
                    {isoToDdMmYyyy(date)}
                  </th>
                </tr>
                {appointmentsForDate.map(appointment => (
                    <tr key={appointment.id} className="hover:bg-[#2a2a2a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{appointment.patient_cpf ? (<Link to={NavigationPath.PatientDetail.replace(':patientId', appointment.patient_cpf)} className="hover:text-[#00bcd4]">{appointment.patient_name}</Link>) : (<span>{appointment.patient_name} <span className="text-xs text-yellow-500">(Não cadastrado)</span></span>)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate" title={appointment.procedure}>{appointment.procedure}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{appointment.dentist_name || 'Não definido'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">{formatToHHMM(appointment.appointment_time)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><button onClick={() => handleStatusChange(appointment)} disabled={!!isUpdatingStatus} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait ${statusColorMap[appointment.status]} ${statusTextClassMap[appointment.status]}`} title={`Mudar status de ${statusLabelMap[appointment.status]}`}>{isUpdatingStatus === appointment.id ? '...' : (statusLabelMap[appointment.status] || appointment.status)}</button></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex items-center justify-center space-x-1">
                          <Button size="sm" variant="ghost" className="p-1.5" onClick={() => handleNotifyArrival(appointment)} disabled={isDeleting || notifiedAppointments.has(appointment.id)} title={notifiedAppointments.has(appointment.id) ? "Notificação já enviada" : "Notificar Chegada"}><BellIcon className={`w-4 h-4 ${notifiedAppointments.has(appointment.id) ? 'text-green-400' : 'text-yellow-400 hover:text-yellow-300'}`} /></Button>
                          <Button size="sm" variant="ghost" className="p-1.5" onClick={() => handleRebookAppointment(appointment)} disabled={isDeleting || !appointment.patient_cpf} title="Criar novo agendamento para este paciente">
                            <img src="https://cdn-icons-png.flaticon.com/512/4856/4856659.png" alt="Reagendar" className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="p-1.5" onClick={() => navigate(NavigationPath.EditAppointment.replace(':appointmentId', appointment.id))} disabled={isDeleting} title="Editar Agendamento"><PencilIcon className="w-4 h-4 text-[#00bcd4] hover:text-[#00a5b8]" /></Button>
                          <Button size="sm" variant="ghost" className="p-1.5" onClick={() => requestDeleteAppointment(appointment.id, `${appointment.procedure} para ${appointment.patient_name}`)} disabled={isDeleting} title="Excluir Agendamento"><TrashIcon className="w-4 h-4 text-[#f44336] hover:text-[#d32f2f]" /></Button>
                      </div></td>
                    </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}

      <Modal
        isOpen={arrivalModalInfo.isOpen}
        onClose={() => setArrivalModalInfo(prev => ({ ...prev, isOpen: false }))}
        title={`Notificar Chegada de ${arrivalModalInfo.appointment?.patient_name || ''}`}
        footer={
          arrivalModalInfo.step === 'fill_details' ? (
            <div className="flex justify-end space-x-3 w-full">
              <Button type="button" variant="ghost" onClick={() => setArrivalModalInfo(prev => ({...prev, step: 'select_type'}))}>
                Voltar
              </Button>
              <Button type="submit" form="healthPlanForm" variant="primary">
                Enviar Notificação
              </Button>
            </div>
          ) : null
        }
      >
        {arrivalModalInfo.step === 'select_type' ? (
          <div className="space-y-4">
            <p className="text-center text-lg text-white">Qual o tipo da consulta?</p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button fullWidth variant="primary" onClick={() => sendArrivalNotification('private')}>Consulta Particular</Button>
                <Button fullWidth variant="ghost" onClick={() => setArrivalModalInfo(prev => ({...prev, step: 'fill_details'}))}>Consulta Plano de Saúde</Button>
            </div>
          </div>
        ) : (
          <form id="healthPlanForm" onSubmit={(e) => { e.preventDefault(); sendArrivalNotification('health_plan'); }}>
            <div className="space-y-4">
              <p className="text-lg font-semibold text-white">Detalhes do Plano de Saúde</p>
              <Input 
                label="Nome do Plano"
                value={arrivalModalInfo.healthPlanName}
                onChange={e => setArrivalModalInfo(prev => ({ ...prev, healthPlanName: e.target.value }))}
                placeholder="Ex: Bradesco Saúde"
                required autoFocus
              />
              <Input 
                label="Número da GTO"
                value={arrivalModalInfo.gto}
                onChange={e => setArrivalModalInfo(prev => ({ ...prev, gto: e.target.value }))}
                placeholder="Ex: 123456789"
                required
              />
            </div>
          </form>
        )}
      </Modal>

      {appointmentToDelete && (
        <ConfirmationModal isOpen={isConfirmDeleteModalOpen} onClose={closeConfirmDeleteModal} onConfirm={executeDeleteAppointment} title="Confirmar Exclusão de Agendamento" message={<p>Tem certeza que deseja excluir o agendamento: <strong className="text-[#00bcd4]">{appointmentToDelete.details}</strong>? Esta ação é irreversível.</p>} confirmButtonText="Excluir Agendamento" isLoading={isDeleting} />
      )}
    </div>
  );
};
