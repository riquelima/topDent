

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
    ClockIcon, 
    MagnifyingGlassIcon, 
    DocumentPlusIcon, 
    ArrowRightOnRectangleIcon,
    XMarkIcon, 
    CheckIcon,
    CalendarDaysIcon, 
    EyeIcon,
    ListBulletIcon,
    BellIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment, ConsultationHistoryEntry, Notification } from '../types';
import { 
    getAppointmentsByDate, 
    updateAppointmentStatus,
    getAppointmentsByDateRangeForDentist,
    getAllAppointmentsForDentist,
    addConsultationHistoryEntry,
    getUnreadNotificationsForDentist,
    markNotificationsAsRead,
    subscribeToNotificationsForDentist,
    updatePatientLastAppointment
} from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';
import { formatIsoToSaoPauloTime, isoToDdMmYyyy, formatToHHMM, getTodayInSaoPaulo } from '../src/utils/formatDate';
import { DentistNotesWidget } from '../components/DentistNotesWidget';

interface DentistDashboardPageProps {
  dentistId: string;
  dentistUsername: string;
  dentistDisplayFullName: string; 
}

const getWeekDateRange = (date: Date): { start: string, end: string } => {
    const formatDateToIso = (d: Date) => {
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const d = new Date(date);
    const day = d.getDay(); 
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(new Date(d).setDate(diffToMonday)); 
    const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6)); 

    return {
        start: formatDateToIso(monday),
        end: formatDateToIso(sunday),
    };
};

const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
    Ausente: 'Ausente',
};

const statusColors: Record<Appointment['status'], { border: string; bg: string; text: string; time: string; }> = {
  Scheduled: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-300', time: 'text-gray-300' },
  Confirmed: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-300', time: 'text-gray-300' },
  Completed: { border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-300', time: 'text-gray-300' },
  Cancelled: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-300', time: 'text-gray-300' },
  Ausente: { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-300', time: 'text-gray-300' },
};


interface AppointmentActionSubcardProps {
  appointment: Appointment;
  onUpdateStatus: (appointment: Appointment, newStatus: Appointment['status']) => void;
  isUpdatingStatus: boolean;
  dentistId: string;
  showDate: boolean;
  onViewPatient: (patientCpf: string) => void;
}

const AppointmentActionSubcard: React.FC<AppointmentActionSubcardProps> = ({ appointment, onUpdateStatus, isUpdatingStatus, dentistId, showDate, onViewPatient }) => {
    const currentStatusLabel = statusLabelMap[appointment.status] || appointment.status;
    const colors = statusColors[appointment.status] || statusColors.Scheduled;
    const isCancelled = appointment.status === 'Cancelled';
    const isCompleted = appointment.status === 'Completed';
    const isAusente = appointment.status === 'Ausente';

    return (
        <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg} shadow-md mb-3`}>
            <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full bg-black/20 ${colors.text}`}>{currentStatusLabel}</span>
                <div className="text-right">
                {showDate && (
                    <span className="block text-xs text-gray-400">{isoToDdMmYyyy(appointment.appointment_date).slice(0, 5)}</span>
                )}
                <span className={`text-xl font-bold ${colors.time}`}>{formatToHHMM(appointment.appointment_time)}</span>
                </div>
            </div>
            <p className="text-md font-semibold text-white truncate" title={appointment.patient_name}>{appointment.patient_name}</p>
            <p className="text-xs text-gray-400 truncate" title={appointment.procedure}>{appointment.procedure}</p>
            <div className="mt-3 flex justify-end space-x-2">
                <Button
                    onClick={() => onViewPatient(appointment.patient_cpf || '')}
                    variant="ghost"
                    size="sm"
                    className="p-2 border-gray-600 hover:border-teal-500 text-gray-300 hover:text-teal-400"
                    title={appointment.patient_cpf ? "Ver Prontuário" : "Paciente não cadastrado"}
                    disabled={isUpdatingStatus || !appointment.patient_cpf}
                    >
                    <EyeIcon className="w-4 h-4" />
                </Button>
                <Button
                    onClick={() => onUpdateStatus(appointment, 'Cancelled')}
                    disabled={isUpdatingStatus || isCancelled || isCompleted || isAusente}
                    size="sm"
                    variant="danger"
                    className={`p-2 ${isUpdatingStatus || isCancelled || isCompleted || isAusente ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Cancelar Agendamento"
                >
                    <XMarkIcon className="w-4 h-4" />
                </Button>
                <Button
                    onClick={() => onUpdateStatus(appointment, 'Completed')}
                    disabled={isUpdatingStatus || isCompleted || isCancelled || isAusente}
                    size="sm"
                    variant="primary" 
                    className={`p-2 bg-green-600 hover:bg-green-500 ${isUpdatingStatus || isCompleted || isCompleted || isAusente ? 'opacity-50 cursor-not-allowed' : ''}`}
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
  icon: React.ReactElement<HeroIconProps | React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>>;
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  onUpdateStatus: (appointment: Appointment, newStatus: Appointment['status']) => void; 
  isUpdatingStatus: boolean;
  dentistId: string;
  showDate: boolean;
  onViewPatient: (patientCpf: string) => void;
  className?: string;
}

const VerticalAgendaCard: React.FC<VerticalAgendaCardProps> = ({ title, icon, appointments, isLoading, error, onUpdateStatus, isUpdatingStatus, dentistId, showDate, onViewPatient, className }) => {
  return (
    <Card className={`bg-[#1f1f1f] shadow-xl flex flex-col ${className}`}>
      <div className="flex items-center text-xl font-semibold text-teal-400 p-4 border-b border-gray-700">
        {React.cloneElement(icon, {className: "w-6 h-6 mr-3"})}
        {title}
      </div>
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
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
                dentistId={dentistId}
                showDate={showDate}
                onViewPatient={onViewPatient}
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
  const cardBaseStyle = `${color} hover:opacity-90 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg rounded-lg`;
  
  const content = (
    <div className={`flex items-center p-3 text-left w-60 h-20 ${cardBaseStyle}`}>
      <div className="p-3 rounded-lg mr-3 bg-black/20 text-white flex-shrink-0">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <h3 className="text-md font-semibold text-white">{title}</h3>
    </div>
  );

  const buttonProps = {
    className: "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e0e0e] focus:ring-white rounded-lg",
    ...(onClick && { onClick }),
  };

  return to ? <Link to={to} {...buttonProps}>{content}</Link> : <button {...buttonProps}>{content}</button>;
};

const CalendarAgenda: React.FC<{ appointments: Appointment[]; onViewPatient: (cpf: string) => void }> = ({ appointments, onViewPatient }) => {
  const [currentDate, setCurrentDate] = useState(new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })));
  const [selectedDate, setSelectedDate] = useState(new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })));

  const appointmentDates = useMemo(() => {
    return new Set(appointments.map(a => a.appointment_date));
  }, [appointments]);

  const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleDateClick = (day: number) => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

  const appointmentsForSelectedDay = useMemo(() => {
    const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return appointments
      .filter(a => a.appointment_date === selectedDateString)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  }, [selectedDate, appointments]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth });

  return (
    <Card className="bg-[#1f1f1f] shadow-xl flex flex-col">
       <div className="flex items-center text-xl font-semibold text-teal-400 p-4 border-b border-gray-700">
        <img src="https://cdn-icons-png.flaticon.com/512/11152/11152688.png" alt="Agenda Completa" className="w-6 h-6 mr-3" />
        Agenda Completa
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5 text-white" /></button>
          <h3 className="font-semibold text-lg text-white">
            {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate).replace(/^\w/, c => c.toUpperCase())}
          </h3>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5 text-white" /></button>
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
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasAppointment = appointmentDates.has(dateString);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`w-full aspect-square rounded-full text-sm flex items-center justify-center relative transition-colors duration-150
                  ${isSelected ? 'bg-teal-500 text-black font-bold' : isToday ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-200'}`}
              >
                {day}
                {hasAppointment && <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-teal-400'}`} />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 border-t border-gray-700 pt-4 flex-1 overflow-y-auto">
          <h4 className="font-semibold text-white mb-2">Agendamentos para {isoToDdMmYyyy(selectedDate.toISOString().split('T')[0])}</h4>
          {appointmentsForSelectedDay.length > 0 ? (
            <ul className="space-y-2">
              {appointmentsForSelectedDay.map(appt => (
                <li key={appt.id} onClick={() => appt.patient_cpf && onViewPatient(appt.patient_cpf)} className="p-3 rounded-md bg-[#2a2a2a] hover:bg-gray-700/80 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{appt.patient_name}</p>
                      <p className="text-xs text-gray-400">{appt.procedure}</p>
                    </div>
                    <p className="text-sm font-bold text-teal-400">{formatToHHMM(appt.appointment_time)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-center text-gray-500 py-4">Nenhum agendamento para esta data.</p>}
        </div>
      </div>
    </Card>
  );
};


export const DentistDashboardPage: React.FC<DentistDashboardPageProps> = ({ dentistId, dentistUsername, dentistDisplayFullName }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [allAppointmentsData, setAllAppointmentsData] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); 
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const notificationIdsRef = useRef<Set<string>>(new Set());

  const [arrivalNotification, setArrivalNotification] = useState<Notification | null>(null);
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(!!(window as any).isAudioUnlocked);


  const todayDateString = getTodayInSaoPaulo();
  const formattedDate = isoToDdMmYyyy(todayDateString);
  const dayOfWeek = useMemo(() => {
    const spDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(spDate).replace(/^\w/, (c) => c.toUpperCase());
  }, []);
  
  const unlockAudioManually = useCallback(async () => {
    if (!(window as any).isAudioUnlocked) {
        const audio = document.getElementById('notification-sound') as HTMLAudioElement;
        if (audio) {
            try {
                await audio.play();
                audio.pause();
                audio.currentTime = 0;
                (window as any).isAudioUnlocked = true;
                setIsAudioUnlocked(true);
                showToast("🔊 Notificações sonoras ativadas!", "success");
            } catch (error) {
                console.warn("Erro ao desbloquear áudio manualmente", error);
                showToast("❌ Não foi possível ativar o som. Por favor, interaja com a página e tente novamente.", "error", 6000);
            }
        } else {
            showToast("❌ Player de áudio não encontrado no sistema.", "error");
        }
    }
  }, [showToast]);

  const playArrivalSound = useCallback(() => {
    if ((window as any).isAudioUnlocked) {
      const audio = document.getElementById('notification-sound') as HTMLAudioElement;
      if (audio) {
        // Map dentist names to their custom notification sounds
        const dentistSoundMap: Record<string, string> = {
          'Dentista Teste': '/dentistateste.mp3',
          'Alessandra Luzia': '/alessandra.mp3',
          'Azenaldo Júnior': '/azenaldo.mp3',
          'Carolina Rosa Barros Oliveira': '/carolina.mp3',
          'Jemima Oliveira': '/jemima.mp3',
          'Luciana Rocha Marins Ramos': '/luciana.mp3',
          'Vanessa Vandita': '/vanessa.mp3',
        };

        // Determine the correct sound file, defaulting to arpegio.mp3
        const soundFile = dentistSoundMap[dentistDisplayFullName] || '/arpegio.mp3';
        
        // Only update src if it's different to avoid re-loading unnecessarily
        if (audio.src !== window.location.origin + soundFile) {
            audio.src = soundFile;
        }
        
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error("Audio playback failed:", error);
          showToast("Erro ao tocar o som da notificação.", "error");
        });
      }
    } else {
      console.warn("Audio not unlocked. Sound will not play until user clicks the activation button.");
    }
  }, [showToast, dentistDisplayFullName]);
  

  const handleNewNotification = useCallback((newNotification: Notification) => {
    if (!notificationIdsRef.current.has(newNotification.id)) {
        playArrivalSound();
        notificationIdsRef.current.add(newNotification.id);
        setNotifications(prev => [newNotification, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setArrivalNotification(newNotification);
        setIsArrivalModalOpen(true);
    }
  }, [playArrivalSound]);

  useEffect(() => {
    let notificationSub: ReturnType<typeof subscribeToNotificationsForDentist> | null = null;
    
    const setup = async () => {
        setIsLoading(true);
        setError(null);

        const todayStr = getTodayInSaoPaulo();
        const spNowForWeek = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));

        try {
            const [
                todayRes, weekRes, allRes, 
                initialNotificationsRes
            ] = await Promise.all([
                getAppointmentsByDate(todayStr, dentistId, dentistUsername),
                getAppointmentsByDateRangeForDentist(getWeekDateRange(spNowForWeek).start, getWeekDateRange(spNowForWeek).end, dentistId, dentistUsername),
                getAllAppointmentsForDentist(dentistId, 50, 1, dentistUsername),
                getUnreadNotificationsForDentist(dentistId),
            ]);

            if (todayRes.error) throw new Error("Falha ao carregar agenda de hoje.");
            const fetchedTodayAppointments = (todayRes.data || []).filter(appt => !['Completed', 'Cancelled', 'Ausente'].includes(appt.status));
            setTodayAppointments(fetchedTodayAppointments);

            if (weekRes.error) throw new Error("Falha ao carregar agenda da semana.");
            const weekAppointmentsIntermediate = (weekRes.data || []).filter(appt => !['Completed', 'Cancelled', 'Ausente'].includes(appt.status));
            setWeekAppointments(weekAppointmentsIntermediate.filter(weekAppt => !fetchedTodayAppointments.find(todayAppt => todayAppt.id === weekAppt.id)));
            
            if (allRes.error) throw new Error("Falha ao carregar agenda completa.");
            const filteredAll = (allRes.data || []).filter(appt => !['Completed', 'Cancelled', 'Ausente'].includes(appt.status));
            const upcoming = filteredAll.filter(a => a.appointment_date >= todayStr).sort((a,b) => new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() - new Date(`${b.appointment_date}T${b.appointment_time}`).getTime());
            const past = filteredAll.filter(a => a.appointment_date < todayStr).sort((a,b) => new Date(`${b.appointment_date}T${b.appointment_time}`).getTime() - new Date(`${a.appointment_date}T${a.appointment_time}`).getTime());
            setAllAppointmentsData([...upcoming, ...past]);

            if (initialNotificationsRes.data && initialNotificationsRes.data.length > 0) {
                const unreadNotifs = initialNotificationsRes.data;
                setNotifications(unreadNotifs);
                notificationIdsRef.current = new Set(unreadNotifs.map(n => n.id));
                setArrivalNotification(unreadNotifs[0]);
                setIsArrivalModalOpen(true);
            }
        } catch (e: any) {
            setError(e.message);
            showToast(e.message, 'error');
        } finally {
            setIsLoading(false);
        }

        notificationSub = subscribeToNotificationsForDentist(dentistId, handleNewNotification);
    };

    setup();
    
    return () => {
        notificationSub?.unsubscribe();
    };
  }, [dentistId, dentistUsername, showToast, handleNewNotification]);
  
  const handleDismissArrivalModal = async () => {
    if (!arrivalNotification) return;

    const notificationIdToDismiss = arrivalNotification.id;

    setIsArrivalModalOpen(false);
    setArrivalNotification(null);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationIdToDismiss));
    notificationIdsRef.current.delete(notificationIdToDismiss);

    const { error } = await markNotificationsAsRead([notificationIdToDismiss]);
    if (error) {
        showToast("Erro ao marcar notificação como lida.", "error");
        console.error("Failed to mark notification as read:", error);
    }
  };

  const handleToggleNotificationPanel = () => {
    setIsNotificationPanelOpen(prev => !prev);
  };

  const handleDismissNotification = async (notificationIdToDismiss: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== notificationIdToDismiss));
    notificationIdsRef.current.delete(notificationIdToDismiss);
    const { error } = await markNotificationsAsRead([notificationIdToDismiss]);
    if (error) {
        showToast("Erro ao remover notificação.", "error");
        setNotifications(originalNotifications); 
        notificationIdsRef.current.add(notificationIdToDismiss);
    }
  };
  
    const refreshAllAppointmentData = async () => {
        setIsLoading(true);
        setError(null);
        const todayStr = getTodayInSaoPaulo();
        const spNowForWeek = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const weekDateRange = getWeekDateRange(spNowForWeek);

        try {
            const [todayRes, weekRes, allRes] = await Promise.all([
                getAppointmentsByDate(todayStr, dentistId, dentistUsername),
                getAppointmentsByDateRangeForDentist(weekDateRange.start, weekDateRange.end, dentistId, dentistUsername),
                getAllAppointmentsForDentist(dentistId, 50, 1, dentistUsername)
            ]);
            
            if (todayRes.error) throw new Error("Falha ao recarregar agenda de hoje.");
            const fetchedTodayAppointments = (todayRes.data || []).filter(appt => !['Completed', 'Cancelled', 'Ausente'].includes(appt.status));
            setTodayAppointments(fetchedTodayAppointments);

            if (weekRes.error) throw new Error("Falha ao recarregar agenda da semana.");
            const weekAppointmentsIntermediate = (weekRes.data || []).filter(appt => !['Completed', 'Cancelled', 'Ausente'].includes(appt.status));
            setWeekAppointments(weekAppointmentsIntermediate.filter(weekAppt => !fetchedTodayAppointments.find(todayAppt => todayAppt.id === weekAppt.id)));
            
            if (allRes.error) throw new Error("Falha ao recarregar agenda completa.");
            const filteredAll = (allRes.data || []).filter(appt => !['Completed', 'Cancelled', 'Ausente'].includes(appt.status));
            const upcoming = filteredAll.filter(a => a.appointment_date >= todayStr).sort((a,b) => new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() - new Date(`${b.appointment_date}T${b.appointment_time}`).getTime());
            const past = filteredAll.filter(a => a.appointment_date < todayStr).sort((a,b) => new Date(`${b.appointment_date}T${b.appointment_time}`).getTime() - new Date(`${a.appointment_date}T${a.appointment_time}`).getTime());
            setAllAppointmentsData([...upcoming, ...past]);
        } catch (e: any) {
            showToast(e.message, 'error');
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };


  const handleUpdateStatus = async (appointment: Appointment, newStatus: Appointment['status']) => {
    setIsUpdatingStatus(true);
    const { data: updatedAppointmentData, error } = await updateAppointmentStatus(appointment.id, newStatus);
    if (error) {
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
    } else {
        showToast(`Agendamento marcado como ${statusLabelMap[newStatus].toLowerCase()}!`, 'success');

        if (newStatus === 'Completed' && appointment.patient_cpf) {
            await updatePatientLastAppointment(appointment.patient_cpf, appointment.appointment_date);
        }
        
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
        refreshAllAppointmentData(); 
    }
    setIsUpdatingStatus(false);
  };
  
  const handleViewPatient = (patientCpf: string) => {
    if (patientCpf) {
      navigate(`/patient/${patientCpf}`, { 
        state: { fromDentistDashboard: true }
      });
    }
  };

  const shortcuts: ShortcutCardProps[] = [
    { title: "Buscar Prontuário", icon: <MagnifyingGlassIcon />, onClick: () => navigate(NavigationPath.ViewRecord, { state: { fromDentistDashboard: true, dentistIdContext: dentistId } }), color: "bg-sky-700" },
    { title: "Adicionar Tratamento", icon: <DocumentPlusIcon />, onClick: () => navigate(NavigationPath.TreatmentPlan, { state: { fromDentistDashboard: true, dentistIdContext: dentistId, dentistUsernameContext: dentistUsername } }), color: "bg-emerald-700" },
    { title: "Histórico de Consultas", icon: <ListBulletIcon />, to: NavigationPath.ConsultationHistory, color: "bg-purple-700" },
  ];

  return (
    <>
      <div className="fixed top-24 right-8 z-40">
          <button onClick={handleToggleNotificationPanel} className="relative p-2 rounded-full text-gray-300 hover:text-white bg-[#1f1f1f] border border-gray-600 shadow-lg hover:bg-gray-700 transition-colors">
              <BellIcon className="w-7 h-7" />
              {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-[#1f1f1f]">
                    {notifications.length}
                  </span>
              )}
          </button>
      </div>
      <div className="space-y-10">
        <div className="relative text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Olá {dentistDisplayFullName}, seja bem vindo(a).</h1>
        </div>
        <p className="text-center text-lg text-gray-400 -mt-8">Aqui está sua agenda {formattedDate} - {dayOfWeek}</p>
        
        <section>
            <h2 className="text-xl font-semibold mb-4 text-center text-teal-400">Atalhos Rápidos</h2>
            <div className="flex flex-wrap justify-center gap-4">
                {shortcuts.map(s => <ShortcutCard key={s.title} {...s} />)}
            </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <VerticalAgendaCard title="Agenda Hoje" icon={<img src="https://cdn-icons-png.flaticon.com/512/1136/1136922.png" alt="Agenda Hoje" />} appointments={todayAppointments} isLoading={isLoading} error={error} onUpdateStatus={handleUpdateStatus} isUpdatingStatus={isUpdatingStatus} dentistId={dentistId} showDate={false} onViewPatient={handleViewPatient}/>
            <VerticalAgendaCard title="Agenda da Semana" icon={<img src="https://cdn-icons-png.flaticon.com/512/8295/8295170.png" alt="Agenda da Semana" />} appointments={weekAppointments} isLoading={isLoading} error={error} onUpdateStatus={handleUpdateStatus} isUpdatingStatus={isUpdatingStatus} dentistId={dentistId} showDate={true} onViewPatient={handleViewPatient}/>
            <CalendarAgenda 
              appointments={allAppointmentsData} 
              onViewPatient={handleViewPatient}
            />
          </div>
        </section>
      </div>

      <DentistNotesWidget dentistId={dentistId} />
      
      {!isAudioUnlocked && (
        <div className="fixed bottom-6 left-6 bg-yellow-500 text-black px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-4 animate-pulse">
            <BellIcon className="w-6 h-6" />
            <div>
                <p className="text-sm font-semibold">Ativar o som das notificações</p>
                <p className="text-xs">Clique no botão para ouvir os alertas.</p>
            </div>
            <Button onClick={unlockAudioManually} className="bg-black/80 hover:bg-black px-3 py-1 rounded-lg text-sm text-white">
                Ativar Som
            </Button>
        </div>
      )}

      {isNotificationPanelOpen && (
          <div className="fixed top-24 right-8 w-80 bg-gray-800 rounded-lg shadow-2xl z-50 border border-gray-700 animate-fade-in-down">
              <div className="flex justify-between items-center p-3 border-b border-gray-700">
                  <h3 className="font-semibold text-white">Notificações</h3>
                  <button onClick={() => setIsNotificationPanelOpen(false)} className="p-1 rounded-full hover:bg-gray-600"><XMarkIcon className="w-5 h-5 text-gray-400"/></button>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className="relative p-3 rounded-md hover:bg-gray-700/50 group">
                      <p className="text-sm text-gray-200 pr-6">{n.message}</p>
                      <p className="text-xs text-gray-500 text-right mt-1">{formatIsoToSaoPauloTime(n.created_at)}</p>
                      <button onClick={(e) => handleDismissNotification(n.id, e)} className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-all" aria-label="Remover"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                  )) : <p className="text-sm text-gray-400 text-center p-4">Nenhuma nova notificação.</p>}
              </div>
          </div>
      )}

      {isArrivalModalOpen && arrivalNotification && (
        <Modal 
            isOpen={isArrivalModalOpen} 
            onClose={() => {}}
            title="Aviso de Chegada de Paciente" 
            size="md" 
            footer={
              <div className="w-full flex justify-center">
                  <Button 
                      variant="primary" 
                      onClick={handleDismissArrivalModal} 
                      className="px-8 py-2.5 text-lg"
                  >
                      OK, Entendido
                  </Button>
              </div>
            }>
            <div className="text-center py-6 px-4">
              <BellIcon className="w-20 h-20 text-yellow-400 mx-auto mb-5 animate-pulse" />
              {(() => {
                const lines = arrivalNotification.message.split('\n');
                const mainMessage = lines[0];
                const details = lines.slice(1);
                return (
                    <>
                        <p className="text-xl font-semibold text-white mb-4">{mainMessage}</p>
                        {details.length > 0 && (
                            <div className="text-left bg-[#1f1f1f] p-4 rounded-lg border border-gray-700 space-y-2 max-w-sm mx-auto">
                                {details.map((line, index) => {
                                    const parts = line.split(':');
                                    if (parts.length < 2) return null;
                                    const label = parts[0];
                                    const value = parts.slice(1).join(':').trim();
                                    return (
                                        <div key={index} className="flex justify-between items-start">
                                            <span className="font-semibold text-teal-400 mr-2">{label}:</span>
                                            <span className="text-gray-200 text-right">{value}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                );
              })()}
            </div>
        </Modal>
      )}

      <style>{`@keyframes pulse-once { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } } .animate-pulse-once { animation: pulse-once 1.5s ease-in-out; } @keyframes fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }`}</style>
    </>
  );
};