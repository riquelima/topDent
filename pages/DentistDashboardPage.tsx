
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    ClockIcon, 
    MagnifyingGlassIcon, 
    DocumentPlusIcon, 
    ArrowRightOnRectangleIcon,
    XMarkIcon, 
    CheckIcon,
    CalendarDaysIcon, 
    EyeIcon,
    ListBulletIcon // Added for history shortcut
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment, ConsultationHistoryEntry } from '../types';
import { 
    getAppointmentsByDate, 
    updateAppointmentStatus,
    getAppointmentsByDateRangeForDentist,
    getAllAppointmentsForDentist,
    addConsultationHistoryEntry
} from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';
import { formatToHHMM, isoToDdMmYyyy } from '../src/utils/formatDate';

interface DentistDashboardPageProps {
  dentistUsername: string; 
  dentistDisplayFullName: string; 
  onLogout: () => void;
}

const getWeekDateRange = (date: Date): { start: string, end: string } => {
    const d = new Date(date);
    const day = d.getDay(); 
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(new Date(d).setDate(diffToMonday)); 
    const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6)); 

    return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
    };
};


const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
};

const statusColors: Record<Appointment['status'], string> = {
  Scheduled: 'border-yellow-500 bg-yellow-500/10 text-yellow-700', 
  Confirmed: 'border-teal-500 bg-teal-500/10 text-teal-300',
  Completed: 'border-green-500 bg-green-500/10 text-green-300', 
  Cancelled: 'border-red-500 bg-red-500/10 text-red-300',   
};


interface AppointmentActionSubcardProps {
  appointment: Appointment;
  onUpdateStatus: (appointment: Appointment, newStatus: Appointment['status']) => void;
  isUpdatingStatus: boolean;
  dentistUsername: string;
}

const AppointmentActionSubcard: React.FC<AppointmentActionSubcardProps> = ({ appointment, onUpdateStatus, isUpdatingStatus, dentistUsername }) => {
  const currentStatusLabel = statusLabelMap[appointment.status] || appointment.status;
  const colors = statusColors[appointment.status] || statusColors.Scheduled;
  const isCancelled = appointment.status === 'Cancelled';
  const isCompleted = appointment.status === 'Completed';

  return (
    <div className={`p-4 rounded-lg border ${colors} shadow-md mb-3 bg-gray-800/50`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${colors.replace('border-', 'bg-').replace('/10', '/30')}`}>{currentStatusLabel}</span>
        <span className="text-xl font-bold text-teal-400">{formatToHHMM(appointment.appointment_time)}</span>
      </div>
      <p className="text-md font-semibold text-white truncate" title={appointment.patient_name || appointment.patient_cpf}>{appointment.patient_name || appointment.patient_cpf}</p>
      <p className="text-xs text-gray-400 truncate" title={appointment.procedure}>{appointment.procedure}</p>
      <div className="mt-3 flex justify-end space-x-2">
         <Link 
            to={`/patient/${appointment.patient_cpf}`} 
            state={{ from: NavigationPath.Home, dentistUsernameContext: dentistUsername }}
        >
            <Button
                variant="ghost"
                size="sm"
                className="p-2 border-gray-600 hover:border-teal-500 text-gray-300 hover:text-teal-400"
                title="Ver Prontuário"
                disabled={isUpdatingStatus}
            >
                <EyeIcon className="w-4 h-4"/>
            </Button>
        </Link>
        <Button
          onClick={() => onUpdateStatus(appointment, 'Cancelled')}
          disabled={isUpdatingStatus || isCancelled || isCompleted}
          size="sm"
          variant="danger"
          className={`p-2 ${isUpdatingStatus || isCancelled || isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Cancelar Agendamento"
        >
          <XMarkIcon className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => onUpdateStatus(appointment, 'Completed')}
          disabled={isUpdatingStatus || isCompleted || isCancelled}
          size="sm"
          variant="primary" 
          className={`p-2 bg-green-600 hover:bg-green-500 ${isUpdatingStatus || isCompleted || isCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Concluir Agendamento"
        >
          <CheckIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};


interface VerticalAgendaCardProps {
  title: string;
  icon: React.ReactElement<HeroIconProps>;
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  onUpdateStatus: (appointment: Appointment, newStatus: Appointment['status']) => void; 
  isUpdatingStatus: boolean;
  dentistUsername: string;
}

const VerticalAgendaCard: React.FC<VerticalAgendaCardProps> = ({ title, icon, appointments, isLoading, error, onUpdateStatus, isUpdatingStatus, dentistUsername }) => {
  return (
    <Card className="bg-gray-800 shadow-xl flex-1 min-w-[300px]">
      <div className="flex items-center text-xl font-semibold text-teal-400 mb-4 p-4 border-b border-gray-700">
        {React.cloneElement(icon, {className: "w-6 h-6 mr-3"})}
        {title}
      </div>
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-gray-400 text-center">Carregando...</p>
        ) : error ? (
          <p className="text-red-400 text-center">{error}</p>
        ) : appointments.length > 0 ? (
          appointments.map(appt => (
            <AppointmentActionSubcard 
                key={appt.id} 
                appointment={appt} 
                onUpdateStatus={onUpdateStatus} 
                isUpdatingStatus={isUpdatingStatus}
                dentistUsername={dentistUsername}
            />
          ))
        ) : (
          <p className="text-gray-400 text-center">Nenhum agendamento encontrado.</p>
        )}
      </div>
    </Card>
  );
};

interface ShortcutCardProps {
  title: string;
  icon: React.ReactElement<HeroIconProps>;
  to?: NavigationPath | string; 
  onClick?: () => void; 
  color?: string; 
}

const ShortcutCard: React.FC<ShortcutCardProps> = ({ title, icon, to, onClick, color = 'bg-gray-700' }) => {
  const cardBaseStyle = `${color} hover:opacity-90 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg rounded-xl`;
  
  const content = (
    <div className={`flex flex-col items-center justify-center p-4 text-center w-36 h-36 md:w-40 md:h-40 ${cardBaseStyle}`}>
      <div className={`p-3 rounded-full mb-2 bg-black/20 text-white`}>
        {React.cloneElement(icon, { className: "w-7 h-7 md:w-8 md:h-8" })}
      </div>
      <h3 className="text-sm md:text-md font-semibold text-white">{title}</h3>
    </div>
  );

  if (onClick && !to) {
    return <button onClick={onClick} className="focus:outline-none">{content}</button>;
  }
  if (to && !onClick) {
    return <Link to={to} className="focus:outline-none">{content}</Link>;
  }
  if (to && onClick) {
     console.warn(`ShortcutCard for "${title}" has both 'to' and 'onClick'. 'to' will take precedence. If onClick is for navigation, remove 'to'.`);
     return <Link to={to} className="focus:outline-none">{content}</Link>;
  }
  return <div className={cardBaseStyle}>{content}</div>; 
};


export const DentistDashboardPage: React.FC<DentistDashboardPageProps> = ({ dentistUsername, dentistDisplayFullName, onLogout }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [allAppointmentsData, setAllAppointmentsData] = useState<Appointment[]>([]);

  const [isLoadingToday, setIsLoadingToday] = useState(true);
  const [isLoadingWeek, setIsLoadingWeek] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(true);

  const [errorToday, setErrorToday] = useState<string | null>(null);
  const [errorWeek, setErrorWeek] = useState<string | null>(null);
  const [errorAll, setErrorAll] = useState<string | null>(null);
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); 

  const todayDateString = new Date().toISOString().split('T')[0];
  const weekDateRange = getWeekDateRange(new Date());

  const fetchAllDashboardData = useCallback(async () => {
    setIsLoadingToday(true);
    setIsLoadingWeek(true);
    setIsLoadingAll(true);
    setErrorToday(null);
    setErrorWeek(null);
    setErrorAll(null);

    let fetchedTodayAppointments: Appointment[] = [];

    // Fetch Today's Appointments
    try {
        const { data: todayData, error: todayError } = await getAppointmentsByDate(todayDateString, dentistUsername);
        if (todayError) { 
            setErrorToday("Falha ao carregar agenda de hoje."); 
            console.error(todayError); 
        } else {
            fetchedTodayAppointments = (todayData || []).filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled');
            setTodayAppointments(fetchedTodayAppointments);
        }
    } catch (e) {
        setErrorToday("Erro crítico ao carregar agenda de hoje."); console.error(e);
    } finally {
        setIsLoadingToday(false);
    }

    // Fetch Week's Appointments
    try {
        const { data: weekData, error: weekError } = await getAppointmentsByDateRangeForDentist(weekDateRange.start, weekDateRange.end, dentistUsername);
        if (weekError) { 
            setErrorWeek("Falha ao carregar agenda da semana."); 
            console.error(weekError); 
        } else {
            const weekAppointmentsIntermediate = (weekData || []).filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled');
            const finalWeekAppointments = weekAppointmentsIntermediate.filter(
                weekAppt => !fetchedTodayAppointments.find(todayAppt => todayAppt.id === weekAppt.id)
            );
            setWeekAppointments(finalWeekAppointments);
        }
    } catch (e) {
        setErrorWeek("Erro crítico ao carregar agenda da semana."); console.error(e);
    } finally {
        setIsLoadingWeek(false);
    }
    
    // Fetch All Appointments (for "Agenda Completa")
    try {
        const {data: allData, error: allError} = await getAllAppointmentsForDentist(dentistUsername, 50);
        if (allError) { 
            setErrorAll("Falha ao carregar agenda completa."); 
            console.error(allError); 
        } else {
            const filteredAppointments = (allData || []).filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled');
            const upcoming = filteredAppointments.filter(a => a.appointment_date >= todayDateString).sort((a,b) => new Date(a.appointment_date + 'T' + a.appointment_time).getTime() - new Date(b.appointment_date + 'T' + b.appointment_time).getTime());
            const past = filteredAppointments.filter(a => a.appointment_date < todayDateString).sort((a,b) => new Date(b.appointment_date + 'T' + b.appointment_time).getTime() - new Date(a.appointment_date + 'T' + a.appointment_time).getTime());
            setAllAppointmentsData([...upcoming, ...past]);
        }
    } catch (e) {
        setErrorAll("Erro crítico ao carregar agenda completa."); console.error(e);
    } finally {
        setIsLoadingAll(false);
    }

  }, [todayDateString, dentistUsername, weekDateRange.start, weekDateRange.end]);

  useEffect(() => {
    if(dentistUsername) {
        fetchAllDashboardData();
    }
  }, [fetchAllDashboardData, dentistUsername]);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const handleUpdateStatus = async (appointment: Appointment, newStatus: Appointment['status']) => {
    setIsUpdatingStatus(true);
    const { data: updatedAppointmentData, error } = await updateAppointmentStatus(appointment.id, newStatus);
    
    if (error) {
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
        console.error("Error updating appointment status:", error);
    } else {
        showToast(`Agendamento marcado como ${statusLabelMap[newStatus].toLowerCase()}!`, 'success');
        
        if (newStatus === 'Completed' || newStatus === 'Cancelled') {
            // Use the original appointment data as a base, then potentially override with updatedAppointmentData if available
            // This ensures that even if updatedAppointmentData is null (but no error occurred), we can still log to history.
            const baseAppointmentDataForHistory = {
                ...appointment, // Start with original data
                ...(updatedAppointmentData || {}), // Override with updated data if it exists
                status: newStatus // Ensure the new status is set correctly
            };

            const historyEntry: Omit<ConsultationHistoryEntry, 'id' | 'completion_timestamp' | 'created_at'> = {
                appointment_id: baseAppointmentDataForHistory.id,
                patient_cpf: baseAppointmentDataForHistory.patient_cpf,
                patient_name: baseAppointmentDataForHistory.patient_name,
                dentist_id: baseAppointmentDataForHistory.dentist_id,
                dentist_name: baseAppointmentDataForHistory.dentist_name,
                procedure_details: baseAppointmentDataForHistory.procedure,
                consultation_date: baseAppointmentDataForHistory.appointment_date,
                notes: baseAppointmentDataForHistory.notes,
                status: newStatus,
            };
            const { error: historyError } = await addConsultationHistoryEntry(historyEntry);
            if (historyError) {
                showToast('Status atualizado, mas falha ao registrar no histórico: ' + historyError.message, 'warning');
                console.error("Error adding to consultation history:", historyError);
            }
        }
        fetchAllDashboardData(); 
    }
    setIsUpdatingStatus(false);
  };

  const shortcuts: ShortcutCardProps[] = [
    { 
        title: "Buscar Prontuário", 
        icon: <MagnifyingGlassIcon />, 
        onClick: () => navigate(NavigationPath.ViewRecord, { state: { fromDentistDashboard: true, dentistUsernameContext: dentistUsername } }),
        color: "bg-sky-600" 
    },
    { 
        title: "Adicionar Tratamento", 
        icon: <DocumentPlusIcon />, 
        onClick: () => navigate(NavigationPath.TreatmentPlan, { state: { fromDentistDashboard: true, dentistUsernameContext: dentistUsername } }),
        color: "bg-emerald-600" 
    },
    { 
        title: "Histórico de Consultas", 
        icon: <ListBulletIcon />, 
        to: NavigationPath.ConsultationHistory,
        color: "bg-purple-600" 
    },
    { 
        title: "Sair", 
        icon: <ArrowRightOnRectangleIcon className="transform scale-x-[-1]" />, 
        onClick: handleLogoutClick, 
        color: "bg-red-600" 
    },
  ];

  return (
    <div className="space-y-10 text-white bg-[#121212] min-h-full">
      <h1 className="text-3xl md:text-4xl font-bold text-center">
        Olá, {dentistDisplayFullName}
      </h1>
      <p className="text-center text-lg text-gray-400 -mt-8">
        Aqui está sua agenda ({isoToDdMmYyyy(todayDateString)})
      </p>

      <section className="mt-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <VerticalAgendaCard 
            title="Agenda Hoje" 
            icon={<ClockIcon />}
            appointments={todayAppointments}
            isLoading={isLoadingToday}
            error={errorToday}
            onUpdateStatus={handleUpdateStatus}
            isUpdatingStatus={isUpdatingStatus}
            dentistUsername={dentistUsername}
          />
          <VerticalAgendaCard 
            title="Agenda da Semana" 
            icon={<CalendarDaysIcon />}
            appointments={weekAppointments}
            isLoading={isLoadingWeek}
            error={errorWeek}
            onUpdateStatus={handleUpdateStatus}
            isUpdatingStatus={isUpdatingStatus}
            dentistUsername={dentistUsername}
          />
          <VerticalAgendaCard 
            title="Agenda Completa" 
            icon={<CalendarDaysIcon />}
            appointments={allAppointmentsData}
            isLoading={isLoadingAll}
            error={errorAll}
            onUpdateStatus={handleUpdateStatus}
            isUpdatingStatus={isUpdatingStatus}
            dentistUsername={dentistUsername}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center text-teal-400">Atalhos Rápidos</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {shortcuts.map(shortcut => (
            <ShortcutCard key={shortcut.title} {...shortcut} />
          ))}
        </div>
      </section>
    </div>
  );
};
