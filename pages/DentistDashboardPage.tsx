
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
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
    PaperAirplaneIcon
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment, ConsultationHistoryEntry, Notification, ChatMessage, Dentist } from '../types';
import { 
    getAppointmentsByDate, 
    updateAppointmentStatus,
    getAppointmentsByDateRangeForDentist,
    getAllAppointmentsForDentist,
    addConsultationHistoryEntry,
    getUnreadNotificationsForDentist,
    markNotificationsAsRead,
    getAdminUserId,
    getMessagesBetweenUsers,
    sendMessage,
    subscribeToMessages,
    subscribeToNotificationsForDentist
} from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';
import { formatToHHMM, isoToDdMmYyyy } from '../src/utils/formatDate';

interface DentistDashboardPageProps {
  dentistId: string;
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
  Scheduled: 'border-yellow-500 bg-yellow-500/10 text-yellow-300', 
  Confirmed: 'border-teal-500 bg-teal-500/10 text-teal-300',
  Completed: 'border-green-500 bg-green-500/10 text-green-300', 
  Cancelled: 'border-red-500 bg-red-500/10 text-red-300',   
};

const AppointmentActionSubcard: React.FC<AppointmentActionSubcardProps> = ({ appointment, onUpdateStatus, isUpdatingStatus, dentistId, showDate }) => {
  const currentStatusLabel = statusLabelMap[appointment.status] || appointment.status;
  const colors = statusColors[appointment.status] || statusColors.Scheduled;
  const isCancelled = appointment.status === 'Cancelled';
  const isCompleted = appointment.status === 'Completed';

  return (
    <div className={`p-4 rounded-lg border ${colors} shadow-md mb-3 bg-[#2a2a2a]/50`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${colors.replace('border-', 'bg-').replace('/10', '/30')}`}>{currentStatusLabel}</span>
        <div className="text-right">
          {showDate && (
            <span className="block text-xs text-gray-400">{isoToDdMmYyyy(appointment.appointment_date).slice(0, 5)}</span>
          )}
          <span className="text-xl font-bold text-teal-400">{formatToHHMM(appointment.appointment_time)}</span>
        </div>
      </div>
      <p className="text-md font-semibold text-white truncate" title={appointment.patient_name}>{appointment.patient_name}</p>
      <p className="text-xs text-gray-400 truncate" title={appointment.procedure}>{appointment.procedure}</p>
      <div className="mt-3 flex justify-end space-x-2">
        <Link
          to={appointment.patient_cpf ? `/patient/${appointment.patient_cpf}` : '#'}
          onClick={(e) => !appointment.patient_cpf && e.preventDefault()}
          className={!appointment.patient_cpf ? 'cursor-not-allowed' : ''}
          state={{ from: NavigationPath.Home, dentistIdContext: dentistId }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="p-2 border-gray-600 hover:border-teal-500 text-gray-300 hover:text-teal-400"
            title={appointment.patient_cpf ? "Ver Prontuário" : "Paciente não cadastrado"}
            disabled={isUpdatingStatus || !appointment.patient_cpf}
          >
            <EyeIcon className="w-4 h-4" />
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

interface AppointmentActionSubcardProps {
  appointment: Appointment;
  onUpdateStatus: (appointment: Appointment, newStatus: Appointment['status']) => void;
  isUpdatingStatus: boolean;
  dentistId: string;
  showDate: boolean;
}

const VerticalAgendaCard: React.FC<VerticalAgendaCardProps> = ({ title, icon, appointments, isLoading, error, onUpdateStatus, isUpdatingStatus, dentistId, showDate }) => {
  return (
    <Card className="bg-[#1f1f1f] shadow-xl flex-1 min-w-[300px]">
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
                dentistId={dentistId}
                showDate={showDate}
            />
          ))
        ) : (
          <p className="text-gray-400 text-center">Nenhum agendamento encontrado.</p>
        )}
      </div>
    </Card>
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
  dentistId: string;
  showDate: boolean;
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

  const buttonProps = {
    className: "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-white rounded-xl",
    ...(onClick && { onClick }),
  };

  return to ? <Link to={to} {...buttonProps}>{content}</Link> : <button {...buttonProps}>{content}</button>;
};

interface ShortcutCardProps {
  title: string;
  icon: React.ReactElement<HeroIconProps>;
  to?: NavigationPath | string; 
  onClick?: () => void; 
  color?: string; 
}


export const DentistDashboardPage: React.FC<DentistDashboardPageProps> = ({ dentistId, dentistUsername, dentistDisplayFullName, onLogout }) => {
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const notificationIdsRef = useRef<Set<string>>(new Set());

  const [arrivalNotificationQueue, setArrivalNotificationQueue] = useState<Notification[]>([]);
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const isAudioUnlocked = useRef(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminUser, setAdminUser] = useState<Dentist | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [unreadChatMessages, setUnreadChatMessages] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const todayDateString = new Date().toISOString().split('T')[0];

  const playNotificationSound = useCallback(() => {
    if (notificationSoundRef.current && isAudioUnlocked.current) {
        notificationSoundRef.current.play().catch(e => console.error("Error playing notification sound:", e));
    }
  }, []);

  const unlockAudio = useCallback(() => {
    if (notificationSoundRef.current && !isAudioUnlocked.current) {
        const promise = notificationSoundRef.current.play();
        if (promise !== undefined) {
            promise.then(() => {
                notificationSoundRef.current?.pause();
                notificationSoundRef.current!.currentTime = 0;
                isAudioUnlocked.current = true;
                window.removeEventListener('click', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
            }).catch(() => {});
        }
    }
  }, []);

  useEffect(() => {
    notificationSoundRef.current = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2c8a3063cf.mp3');
    notificationSoundRef.current.load();
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [unlockAudio]);

  const handleCloseArrivalModal = () => {
    setIsArrivalModalOpen(false);
    setTimeout(() => {
      setArrivalNotificationQueue(prev => prev.slice(1));
    }, 300);
  };
  
  useEffect(() => {
    if (arrivalNotificationQueue.length > 0 && !isArrivalModalOpen) {
      setIsArrivalModalOpen(true);
      playNotificationSound();
    }
  }, [arrivalNotificationQueue, isArrivalModalOpen, playNotificationSound]);

  const fetchAllDashboardData = useCallback(async () => {
    const weekDateRange = getWeekDateRange(new Date());
    setIsLoadingToday(true);
    setIsLoadingWeek(true);
    setIsLoadingAll(true);
    setErrorToday(null);
    setErrorWeek(null);
    setErrorAll(null);

    let fetchedTodayAppointments: Appointment[] = [];

    try {
        const { data: todayData, error: todayError } = await getAppointmentsByDate(todayDateString, dentistId, dentistUsername);
        if (todayError) throw todayError;
        fetchedTodayAppointments = (todayData || []).filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled');
        setTodayAppointments(fetchedTodayAppointments);
    } catch (e) {
        setErrorToday("Falha ao carregar agenda de hoje."); console.error(e);
    } finally {
        setIsLoadingToday(false);
    }

    try {
        const { data: weekData, error: weekError } = await getAppointmentsByDateRangeForDentist(weekDateRange.start, weekDateRange.end, dentistId, dentistUsername);
        if (weekError) throw weekError;
        const weekAppointmentsIntermediate = (weekData || []).filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled');
        const finalWeekAppointments = weekAppointmentsIntermediate.filter(
            weekAppt => !fetchedTodayAppointments.find(todayAppt => todayAppt.id === weekAppt.id)
        );
        setWeekAppointments(finalWeekAppointments);
    } catch (e) {
        setErrorWeek("Falha ao carregar agenda da semana."); console.error(e);
    } finally {
        setIsLoadingWeek(false);
    }
    
    try {
        const {data: allData, error: allError} = await getAllAppointmentsForDentist(dentistId, 50, undefined, dentistUsername);
        if (allError) throw allError;
        const filteredAppointments = (allData || []).filter(appt => appt.status !== 'Completed' && appt.status !== 'Cancelled');
        const upcoming = filteredAppointments.filter(a => a.appointment_date >= todayDateString).sort((a,b) => new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() - new Date(`${b.appointment_date}T${b.appointment_time}`).getTime());
        const past = filteredAppointments.filter(a => a.appointment_date < todayDateString).sort((a,b) => new Date(`${b.appointment_date}T${b.appointment_time}`).getTime() - new Date(`${a.appointment_date}T${a.appointment_time}`).getTime());
        setAllAppointmentsData([...upcoming, ...past]);
    } catch (e) {
        setErrorAll("Falha ao carregar agenda completa."); console.error(e);
    } finally {
        setIsLoadingAll(false);
    }
  }, [todayDateString, dentistId, dentistUsername]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleNewNotification = useCallback((newNotification: Notification) => {
    if (!notificationIdsRef.current.has(newNotification.id)) {
      notificationIdsRef.current.add(newNotification.id);
      setNotifications(prev => [newNotification, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setArrivalNotificationQueue(prev => [...prev, newNotification]);
    }
  }, []);

  useEffect(() => {
    if (!dentistId) return;

    fetchAllDashboardData();

    getUnreadNotificationsForDentist(dentistId).then(({ data }) => {
      if (data) {
        setNotifications(data);
        notificationIdsRef.current = new Set(data.map(n => n.id));
      }
    });

    const notificationSubscription = subscribeToNotificationsForDentist(dentistId, handleNewNotification);

    const setupChat = async () => {
        const { data: adminData, error: adminError } = await getAdminUserId();
        if (adminError || !adminData) return;
        setAdminUser(adminData);

        const { data: messagesData, error: messagesError } = await getMessagesBetweenUsers(dentistId, adminData.id!);
        if (messagesError) console.error("Error fetching chat messages", messagesError);
        else setChatMessages(messagesData || []);
    };
    setupChat();
    const chatSubscription = subscribeToMessages(dentistId, (newMessage) => {
        setChatMessages(prev => [...prev, newMessage]);
        if (!document.body.classList.contains('chat-modal-open')) {
            setUnreadChatMessages(prev => prev + 1);
        }
    });

    return () => {
      notificationSubscription?.unsubscribe();
      chatSubscription?.unsubscribe();
    };
  }, [dentistId, fetchAllDashboardData, handleNewNotification]);


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

  const handleUpdateStatus = async (appointment: Appointment, newStatus: Appointment['status']) => {
    setIsUpdatingStatus(true);
    const { data: updatedAppointmentData, error } = await updateAppointmentStatus(appointment.id, newStatus);
    if (error) {
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
    } else {
        showToast(`Agendamento marcado como ${statusLabelMap[newStatus].toLowerCase()}!`, 'success');
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
        fetchAllDashboardData(); 
    }
    setIsUpdatingStatus(false);
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadChatMessages(0);
    document.body.classList.add('chat-modal-open');
  };
  
  const handleCloseChat = () => {
    setIsChatOpen(false);
    document.body.classList.remove('chat-modal-open');
  }
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !adminUser || !dentistId) return;
    setIsSendingMessage(true);
    const content = newMessage;
    setNewMessage('');
    const { error } = await sendMessage({ sender_id: dentistId, recipient_id: adminUser.id!, content: content });
    if (error) {
        showToast(`Falha ao enviar mensagem: ${error.message}`, 'error');
        setNewMessage(content);
    }
    setIsSendingMessage(false);
  };

  const shortcuts: ShortcutCardProps[] = [
    { title: "Buscar Prontuário", icon: <MagnifyingGlassIcon />, onClick: () => navigate(NavigationPath.ViewRecord, { state: { fromDentistDashboard: true, dentistIdContext: dentistId } }), color: "bg-sky-600" },
    { title: "Adicionar Tratamento", icon: <DocumentPlusIcon />, onClick: () => navigate(NavigationPath.TreatmentPlan, { state: { fromDentistDashboard: true, dentistIdContext: dentistId, dentistUsernameContext: dentistUsername } }), color: "bg-emerald-600" },
    { title: "Histórico de Consultas", icon: <ListBulletIcon />, to: NavigationPath.ConsultationHistory, color: "bg-purple-600" },
    { title: "Sair", icon: <ArrowRightOnRectangleIcon className="transform scale-x-[-1]" />, onClick: onLogout, color: "bg-red-600" },
  ];

  return (
    <div className="space-y-10 text-white bg-[#121212] min-h-full">
       <div className="relative text-center">
         <h1 className="text-3xl md:text-4xl font-bold">Olá, {dentistDisplayFullName}</h1>
         <div className="absolute top-0 right-0">
            <button onClick={handleToggleNotificationPanel} className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                <BellIcon className="w-7 h-7" />
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-[#121212]">
                      {notifications.length}
                    </span>
                )}
            </button>
         </div>
       </div>

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
                        <p className="text-xs text-gray-500 text-right mt-1">{formatToHHMM(new Date(n.created_at).toTimeString())}</p>
                        <button onClick={(e) => handleDismissNotification(n.id, e)} className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-all" aria-label="Remover"><XMarkIcon className="w-4 h-4" /></button>
                      </div>
                    )) : <p className="text-sm text-gray-400 text-center p-4">Nenhuma nova notificação.</p>}
                </div>
            </div>
        )}

      <p className="text-center text-lg text-gray-400 -mt-8">Aqui está sua agenda ({isoToDdMmYyyy(todayDateString)})</p>

      <section className="mt-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <VerticalAgendaCard title="Agenda Hoje" icon={<ClockIcon />} appointments={todayAppointments} isLoading={isLoadingToday} error={errorToday} onUpdateStatus={handleUpdateStatus} isUpdatingStatus={isUpdatingStatus} dentistId={dentistId} showDate={false}/>
          <VerticalAgendaCard title="Agenda da Semana" icon={<CalendarDaysIcon />} appointments={weekAppointments} isLoading={isLoadingWeek} error={errorWeek} onUpdateStatus={handleUpdateStatus} isUpdatingStatus={isUpdatingStatus} dentistId={dentistId} showDate={true}/>
          <VerticalAgendaCard title="Agenda Completa" icon={<CalendarDaysIcon />} appointments={allAppointmentsData} isLoading={isLoadingAll} error={errorAll} onUpdateStatus={handleUpdateStatus} isUpdatingStatus={isUpdatingStatus} dentistId={dentistId} showDate={true}/>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-center text-teal-400">Atalhos Rápidos</h2>
        <div className="flex flex-wrap justify-center gap-6">{shortcuts.map(s => <ShortcutCard key={s.title} {...s} />)}</div>
      </section>

      {isArrivalModalOpen && arrivalNotificationQueue.length > 0 && (
        <Modal isOpen={isArrivalModalOpen} onClose={handleCloseArrivalModal} title="Aviso de Chegada de Paciente" size="md" footer={<div className="w-full flex justify-center"><Button variant="primary" onClick={handleCloseArrivalModal} className="px-8 py-2.5 text-lg">OK, Entendido</Button></div>}>
          <div className="text-center py-6 px-4 animate-pulse-once">
            <BellIcon className="w-20 h-20 text-yellow-400 mx-auto mb-5" />
            <p className="text-xl font-semibold text-white">{arrivalNotificationQueue[0].message}</p>
          </div>
        </Modal>
      )}

      <button onClick={handleOpenChat} className="fixed bottom-8 right-8 bg-[#00bcd4] hover:bg-[#00a5b8] text-black w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-[#00bcd4] z-40">
          <img src="https://cdn-icons-png.flaticon.com/512/1078/1078011.png" alt="Chat" className="w-8 h-8" />
          {unreadChatMessages > 0 && (<span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-[#00bcd4]">{unreadChatMessages}</span>)}
      </button>

      <Modal isOpen={isChatOpen} onClose={handleCloseChat} title={`Chat com ${adminUser?.full_name || 'Admin'}`} size="lg">
          <div className="flex flex-col h-[60vh]"><div className="flex-grow p-4 space-y-4 overflow-y-auto bg-[#181818] rounded-t-md">
              {chatMessages.map(msg => (<div key={msg.id} className={`flex ${msg.sender_id === dentistId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.sender_id === dentistId ? 'bg-[#007b8b] text-white rounded-br-none' : 'bg-[#2a2a2a] text-gray-200 rounded-bl-none'}`}><p className="text-sm">{msg.content}</p><p className="text-xs text-right mt-1 opacity-60">{formatToHHMM(msg.created_at)}</p></div></div>))}
              <div ref={messagesEndRef} /></div>
              <div className="p-4 bg-[#1f1f1f] rounded-b-md border-t border-gray-700">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-3">
                      <Input containerClassName="flex-grow" className="bg-[#2a2a2a] border-gray-600 focus:border-[#00bcd4] h-12" placeholder="Digite sua mensagem..." value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={isSendingMessage} />
                      <Button type="submit" variant="primary" className="h-12 w-12 p-0 flex-shrink-0" disabled={isSendingMessage || !newMessage.trim()}><PaperAirplaneIcon className="w-6 h-6" /></Button>
                  </form>
              </div>
          </div>
      </Modal>

      <style>{`@keyframes pulse-once { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } } .animate-pulse-once { animation: pulse-once 1.5s ease-in-out; } @keyframes fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }`}</style>
    </div>
  );
};
