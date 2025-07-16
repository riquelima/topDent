import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal'; 
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { 
    UserPlusIcon, 
    CalendarDaysIcon, 
    ClipboardDocumentListIcon, 
    DocumentPlusIcon, 
    ArrowRightOnRectangleIcon, 
    BellIcon, 
    EyeIcon,
    PencilIcon, 
    TrashIcon,
    ClockIcon,
    PlusIcon
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment, Reminder, Patient } from '../types';
import { 
    getAppointments, 
    getActiveReminders,
    updateReminder,      
    deleteReminderById,
    addReminder,
    getPatients,
    getAllTreatmentPlans,
    addAppointment
} from '../services/supabaseService'; 
import { isoToDdMmYyyy, formatToHHMM, getTodayInSaoPaulo } from '../src/utils/formatDate';
import { useToast } from '../contexts/ToastContext';

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ReactElement<HeroIconProps>;
  to?: NavigationPath | '#'; 
  onClick?: () => void;
  colorClass: string; 
  hoverColorClass: string;
  iconBgClass?: string;
  iconColorClass?: string;
}

const QuickAccessCard = ({ 
  title, description, icon, to, onClick, 
  colorClass, 
  hoverColorClass, 
  iconBgClass = 'bg-black/20', 
  iconColorClass = 'text-white' 
}: QuickAccessCardProps): React.ReactElement => {
  const cardBaseStyle = `text-left ${colorClass} ${hoverColorClass} transition-all duration-150 ease-in-out transform hover:scale-[1.03] shadow-xl rounded-xl`;

  const content = (
    <div className="flex items-center p-5 h-full">
      <div className={`mr-4 p-3 rounded-lg ${iconBgClass}`}>
        {React.cloneElement(icon, { className: `w-8 h-8 ${iconColorClass}` })}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-200">{description}</p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className={`cursor-pointer h-full ${cardBaseStyle}`}>
        {content}
      </div>
    );
  }
  
  if (to && to !== '#') {
    return (
      <Link to={to} className={`block h-full ${cardBaseStyle}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`h-full ${cardBaseStyle}`}>
      {content}
    </div>
  );
};

const statusDisplayConfig: Record<Appointment['status'], { label: string; className: string }> = {
  Scheduled: { label: 'Agendado', className: 'bg-yellow-500 text-black' }, 
  Confirmed: { label: 'Confirmado', className: 'bg-[#00bcd4] text-black' },
  Completed: { label: 'Concluído', className: 'bg-green-500 text-white' },
  Cancelled: { label: 'Cancelado', className: 'bg-[#f44336] text-white' },
};

interface QuickStats {
  patientsRegistered: number;
  consultationsToday: number;
  activeTreatments: number;
  totalConsultations: number;
  pendingConsultations: number;
}

interface DashboardPageProps {
  onLogout: () => void;
}

interface ReminderFormData {
  id: string;
  title: string;
  content: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const navigate = useNavigate(); 
  const { showToast } = useToast();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingUpcomingAppointments, setIsLoadingUpcomingAppointments] = useState(true);
  
  const [quickStats, setQuickStats] = useState<QuickStats>({
    patientsRegistered: 0,
    consultationsToday: 0,
    activeTreatments: 0,
    totalConsultations: 0,
    pendingConsultations: 0,
  });

  // Reminder states
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  
  // States for Adding a Reminder
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [newReminderFormData, setNewReminderFormData] = useState({ title: '', content: '' });
  
  // States for Editing a Reminder
  const [isEditReminderModalOpen, setIsEditReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderFormData | null>(null);
  
  // Common states for reminder actions
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);
  const [isDeleteReminderConfirmModalOpen, setIsDeleteReminderConfirmModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(!!(window as any).isAudioUnlocked);

  // States for return reminders
  const [returnReminders, setReturnReminders] = useState<Patient[]>([]);
  const [isLoadingReturnReminders, setIsLoadingReturnReminders] = useState(true);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [patientToDismiss, setPatientToDismiss] = useState<Patient | null>(null);

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

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingUpcomingAppointments(true);
    setIsLoadingReminders(true);
    setIsLoadingReturnReminders(true);

    const todayString = getTodayInSaoPaulo();

    // Fetch ALL appointments once
    const { data: allAppointments, error: appointmentsError } = await getAppointments();
    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError.message ? appointmentsError.message : 'Unknown error');
      showToast("Falha ao carregar agendamentos.", "error");
      setUpcomingAppointments([]);
      setQuickStats(prev => ({ ...prev, consultationsToday: 0, totalConsultations: 0, pendingConsultations: 0 }));
    } else {
      const appointmentsData = allAppointments || [];
      
      // Stats calculation
      const todayAppointmentsCount = appointmentsData.filter(appt => appt.appointment_date === todayString).length;
      const totalAppointmentsCount = appointmentsData.length;
      const pendingConsultationsCount = appointmentsData.filter(appt => appt.status === 'Scheduled' || appt.status === 'Confirmed').length;
      
      // Upcoming list calculation
      const upcoming = appointmentsData
        .filter(appt => {
          const isUpcomingDate = appt.appointment_date >= todayString;
          const isPendingStatus = appt.status === 'Scheduled' || appt.status === 'Confirmed';
          return isUpcomingDate && isPendingStatus;
        })
        .sort((a, b) => {
            if (a.appointment_date < b.appointment_date) return -1;
            if (a.appointment_date > b.appointment_date) return 1;
            if (a.appointment_time < b.appointment_time) return -1;
            if (a.appointment_time > b.appointment_time) return 1;
            return 0;
        });
      setUpcomingAppointments(upcoming);

      // Update stats state
      setQuickStats(prev => ({ 
        ...prev, 
        consultationsToday: todayAppointmentsCount,
        totalConsultations: totalAppointmentsCount,
        pendingConsultations: pendingConsultationsCount,
      }));
    }
    setIsLoadingUpcomingAppointments(false);
    
    // Parallel fetch for other data
    const [remindersRes, patientsRes, treatmentsRes] = await Promise.all([
      getActiveReminders(),
      getPatients(),
      getAllTreatmentPlans()
    ]);
    
    if (remindersRes.error) {
        console.error("Error fetching reminders:", remindersRes.error.message ? remindersRes.error.message : 'Unknown error');
        showToast("Falha ao carregar lembretes.", "error");
        setReminders([]);
    } else {
        setReminders(remindersRes.data || []);
    }
    setIsLoadingReminders(false);

    if (patientsRes.error) {
      console.error("Error fetching patients list for stats:", patientsRes.error.message);
      setQuickStats(prev => ({ ...prev, patientsRegistered: 0 }));
    } else {
      setQuickStats(prev => ({ ...prev, patientsRegistered: (patientsRes.data || []).length }));
    }
    
    if (treatmentsRes.error) {
      console.error("Error fetching treatment plans stats:", treatmentsRes.error.message);
      setQuickStats(prev => ({ ...prev, activeTreatments: 0 }));
    } else {
      setQuickStats(prev => ({ ...prev, activeTreatments: (treatmentsRes.data || []).length }));
    }

    // Logic for Return Reminders
    if (patientsRes.data && allAppointments) {
      // Correctly calculate 6 months ago based on São Paulo's date to avoid timezone issues.
      const sixMonthsAgoDate = new Date(`${todayString}T12:00:00Z`); // Use midday to avoid timezone boundary issues
      sixMonthsAgoDate.setUTCMonth(sixMonthsAgoDate.getUTCMonth() - 6);
      const sixMonthsAgoString = sixMonthsAgoDate.toISOString().split('T')[0];

      // Step 1: Create a map of the latest *completed* appointment date for each patient.
      const lastCompletedVisitMap = new Map<string, string>();
      allAppointments.forEach(appt => {
          if (appt.status === 'Completed' && appt.patient_cpf) {
              const currentLatest = lastCompletedVisitMap.get(appt.patient_cpf);
              if (!currentLatest || appt.appointment_date > currentLatest) {
                  lastCompletedVisitMap.set(appt.patient_cpf, appt.appointment_date);
              }
          }
      });

      // Step 2: Identify patients whose last completed visit was 6+ months ago.
      const patientsWhoNeedReturn = (patientsRes.data as Patient[]).filter(patient => {
          const lastVisit = lastCompletedVisitMap.get(patient.cpf);
          return lastVisit && lastVisit <= sixMonthsAgoString;
      });

      // Step 3: Identify patients who have a future appointment already scheduled.
      const upcomingAppointmentCpfs = new Set(
          allAppointments
              .filter(appt => appt.appointment_date >= todayString && (appt.status === 'Scheduled' || appt.status === 'Confirmed'))
              .map(appt => appt.patient_cpf)
              .filter((cpf): cpf is string => !!cpf)
      );

      // Step 4: Filter out patients who already have an upcoming appointment.
      const finalReturnReminders = patientsWhoNeedReturn
        .filter(patient => !upcomingAppointmentCpfs.has(patient.cpf))
        .map(patient => ({ // Add the derived last visit date for display
            ...patient,
            last_appointment_date: lastCompletedVisitMap.get(patient.cpf)
        }));
      
      setReturnReminders(finalReturnReminders);
    }
    setIsLoadingReturnReminders(false);

  }, [showToast]);


  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Reminder Modal Handlers
  const handleOpenEditReminderModal = (reminder: Reminder) => {
    setEditingReminder({ id: reminder.id, title: reminder.title, content: reminder.content });
    setIsEditReminderModalOpen(true);
  };

  const handleCloseEditReminderModal = () => {
    setIsEditReminderModalOpen(false);
    setEditingReminder(null);
  };
  
  const handleOpenAddReminderModal = () => {
    setIsAddReminderModalOpen(true);
  };
  
  const handleCloseAddReminderModal = () => {
    setIsAddReminderModalOpen(false);
    setNewReminderFormData({ title: '', content: '' });
  };
  
  const handleNewReminderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewReminderFormData({ ...newReminderFormData, [e.target.name]: e.target.value });
  };
  
  const handleAddReminder = async (e: FormEvent) => {
      e.preventDefault();
      if (!newReminderFormData.title.trim() || !newReminderFormData.content.trim()) {
          showToast('Título e Conteúdo são obrigatórios.', 'error');
          return;
      }
      setIsSubmittingReminder(true);
      const { error } = await addReminder({
          title: newReminderFormData.title,
          content: newReminderFormData.content,
      });
      if (error) {
          showToast('Erro ao adicionar lembrete: ' + error.message, 'error');
      } else {
          showToast('Lembrete adicionado com sucesso!', 'success');
          fetchDashboardData();
          handleCloseAddReminderModal();
      }
      setIsSubmittingReminder(false);
  };

  const handleReminderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingReminder) {
      setEditingReminder({ ...editingReminder, [e.target.name]: e.target.value });
    }
  };

  const handleUpdateReminder = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;
    setIsSubmittingReminder(true);
    const { error } = await updateReminder(editingReminder.id, {
      title: editingReminder.title,
      content: editingReminder.content,
    });
    if (error) {
      showToast('Erro ao atualizar lembrete: ' + error.message, 'error');
    } else {
      showToast('Lembrete atualizado com sucesso!', 'success');
      fetchDashboardData(); // Refetch all data to update reminders list
      handleCloseEditReminderModal();
    }
    setIsSubmittingReminder(false);
  };

  const handleOpenDeleteReminderModal = (reminder: Reminder) => {
    setReminderToDelete(reminder);
    setIsDeleteReminderConfirmModalOpen(true);
  };

  const handleCloseDeleteReminderModal = () => {
    setIsDeleteReminderConfirmModalOpen(false);
    setReminderToDelete(null);
  };

  const handleConfirmDeleteReminder = async () => {
    if (!reminderToDelete) return;
    setIsSubmittingReminder(true); 
    const { error } = await deleteReminderById(reminderToDelete.id);
    if (error) {
      showToast('Erro ao excluir lembrete: ' + error.message, 'error');
    } else {
      showToast('Lembrete excluído com sucesso!', 'success');
      fetchDashboardData(); // Refetch all data to update reminders list
    }
    handleCloseDeleteReminderModal();
    setIsSubmittingReminder(false);
  };

  // Return Reminders Actions
  const handleRebookPatient = (patient: Patient) => {
    if (!patient.cpf || !patient.fullName) {
      showToast("Dados do paciente incompletos.", "warning");
      return;
    }
    navigate(NavigationPath.NewAppointment, { state: { patientCpf: patient.cpf, patientName: patient.fullName } });
  };
  
  const handleSendWhatsAppReminder = (patient: Patient) => {
    if (!patient.phone) {
      showToast(`Paciente ${patient.fullName} não possui telefone cadastrado.`, 'warning');
      return;
    }

    const cleanedPhone = patient.phone.replace(/\D/g, '');
    const finalPhone = cleanedPhone.length > 11 ? cleanedPhone : `55${cleanedPhone}`;

    const messageText = `Olá ${patient.fullName}, faz tempo que você não retorna a clínica. Gostaria de agendar uma nova consulta?`;
    const encodedMessage = encodeURIComponent(messageText);
    
    const url = `https://wa.me/${finalPhone}?text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const requestDismissReminder = (patient: Patient) => {
    setPatientToDismiss(patient);
    setIsDismissModalOpen(true);
  };

  const closeDismissModal = () => {
    setIsDismissModalOpen(false);
    setPatientToDismiss(null);
  };

  const executeDismissReminder = async () => {
    if (!patientToDismiss) return;
    setIsSubmittingReminder(true);
    
    const farFutureDate = new Date();
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
    const dateString = farFutureDate.toISOString().split('T')[0];

    const dismissalAppointment = {
        patient_cpf: patientToDismiss.cpf,
        patient_name: patientToDismiss.fullName,
        appointment_date: dateString,
        appointment_time: '00:00',
        procedure: 'Lembrete de Retorno Dispensado Pelo Admin',
        status: 'Cancelled' as const,
        notes: `Este é um registro automático para dispensar o lembrete de retorno para ${patientToDismiss.fullName}.`,
    };

    const { error } = await addAppointment(dismissalAppointment);

    if (error) {
        showToast(`Erro ao dispensar lembrete: ${error.message}`, 'error');
    } else {
        showToast(`Lembrete para ${patientToDismiss.fullName} foi dispensado.`, 'success');
        fetchDashboardData();
    }
    
    closeDismissModal();
    setIsSubmittingReminder(false);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Bem-vindo à Top Dent</h1>
        <p className="text-[#b0b0b0] mt-1 text-lg">Painel administrativo da clínica</p>
      </div>
      
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"> {/* Changed to 3 columns for better fit */}
          <QuickAccessCard title="Novo Paciente" description="Cadastrar novo" icon={<UserPlusIcon />} to={NavigationPath.NewPatient} colorClass="bg-sky-600" hoverColorClass="hover:bg-sky-500" iconColorClass="text-white" iconBgClass="bg-black/25" />
          <QuickAccessCard 
            title="Agendar Consulta" 
            description="Marcar horário" 
            icon={<CalendarDaysIcon />} 
            to={NavigationPath.NewAppointment} 
            colorClass="bg-indigo-600" 
            hoverColorClass="hover:bg-indigo-500" 
            iconColorClass="text-white" 
            iconBgClass="bg-black/25" 
          />
          <QuickAccessCard title="Ver Prontuário" description="Buscar registros" icon={<ClipboardDocumentListIcon />} to={NavigationPath.ViewRecord} colorClass="bg-amber-600" hoverColorClass="hover:bg-amber-500" iconColorClass="text-white" iconBgClass="bg-black/25" /> 
          <QuickAccessCard title="Adicionar Tratamento" description="Novo plano dental" icon={<DocumentPlusIcon />} to={NavigationPath.TreatmentPlan} colorClass="bg-emerald-600" hoverColorClass="hover:bg-emerald-500" iconColorClass="text-white" iconBgClass="bg-black/25" />
          <QuickAccessCard 
            title="Histórico de Consultas" 
            description="Ver consultas concluídas" 
            icon={<ClockIcon />} 
            to={NavigationPath.ConsultationHistory} 
            colorClass="bg-purple-600" 
            hoverColorClass="hover:bg-purple-500" 
            iconColorClass="text-white" 
            iconBgClass="bg-black/25" 
          />
          <QuickAccessCard title="Sair" description="Encerrar sessão" icon={<ArrowRightOnRectangleIcon className="transform scale-x-[-1]"/>} onClick={onLogout} colorClass="bg-red-600" hoverColorClass="hover:bg-red-500" iconColorClass="text-white" iconBgClass="bg-black/25" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 flex">
          <Card 
            className="bg-[#1a1a1a] w-full flex flex-col"
            bodyClassName="flex-1 overflow-y-auto"
            title={
              <div className="flex justify-between items-center">
                <span className="flex items-center text-xl text-white">
                    <dotlottie-wc
                        src="https://lottie.host/1edc1d7e-c05c-4561-9b02-42e350c0e5f6/Yv6Cl4dWIE.lottie"
                        speed="1"
                        autoplay
                        loop
                        className="w-14 h-14 mr-3"
                        aria-label="Ícone animado de Próximos Agendamentos"
                    ></dotlottie-wc>
                    Próximos Agendamentos
                </span>
                <Link to={NavigationPath.Appointments} className="text-sm text-[#00bcd4] hover:text-[#00a5b8] font-medium">Ver Todos</Link>
              </div>
            }
          >
            {isLoadingUpcomingAppointments ? (
                <p className="text-[#b0b0b0] text-center py-4">Carregando próximos agendamentos...</p>
            ) : upcomingAppointments.length > 0 ? (
              <ul className="space-y-4">
                {upcomingAppointments.map(appt => {
                  const statusConfig = statusDisplayConfig[appt.status] || { label: appt.status, className: 'bg-gray-500 text-gray-200' };
                  const dateParts = isoToDdMmYyyy(appt.appointment_date).split('/');
                  return (
                    <li key={appt.id} className="p-4 bg-[#222222] rounded-xl shadow-md flex items-center space-x-4 border border-gray-700/50">
                      <div className="flex flex-col items-center justify-center p-3 bg-[#171717] rounded-lg w-16 text-center shadow-inner">
                        <span className="text-2xl font-bold text-white">{dateParts[0]}</span>
                        <span className="text-xs text-[#b0b0b0] uppercase tracking-wide">{new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="font-semibold text-lg text-white">{appt.patient_name}</p>
                        <p className="text-sm text-[#b0b0b0]">{appt.procedure}</p>
                        <p className="text-xs text-gray-500">
                          {formatToHHMM(appt.appointment_time)}
                          {appt.dentist_name && ` • Dentista: ${appt.dentist_name}`}
                          {!appt.dentist_name && ` • Dentista não definido`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                        {appt.patient_cpf ? (
                          <Link to={`/patient/${appt.patient_cpf}`} className="block">
                              <Button size="sm" variant="ghost" className="text-xs border-gray-600 hover:border-[#00bcd4] text-[#b0b0b0] hover:text-[#00bcd4]" leftIcon={<EyeIcon className="w-4 h-4"/>}>
                                Ver Paciente
                              </Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-xs border-gray-600" disabled>
                            Não Cadastrado
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[#b0b0b0] text-center py-4">Nenhum próximo agendamento encontrado.</p>
            )}
          </Card>
        </section>
        
        <div className="space-y-8">
          <section>
             <Card 
                className="bg-[#1a1a1a]" 
                title={
                    <div className="flex justify-between items-center w-full">
                        <span className="flex items-center text-xl text-white">
                            <dotlottie-wc
                                src="https://lottie.host/e121b752-68a2-4df0-aa2f-95c3dad925e4/lvtlihuUh8.lottie"
                                speed="1"
                                autoplay
                                loop
                                className="w-10 h-10 mr-3"
                                aria-label="Ícone animado de Lembretes Globais"
                            ></dotlottie-wc>
                            Lembretes Globais
                        </span>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-1.5 rounded-full hover:bg-gray-700" 
                            onClick={handleOpenAddReminderModal}
                            title="Adicionar Lembrete"
                        >
                            <PlusIcon className="w-5 h-5 text-[#00bcd4]" />
                        </Button>
                    </div>
                }
            >
              {isLoadingReminders ? (
                <p className="text-[#b0b0b0] text-center py-4">Carregando lembretes...</p>
              ) : reminders.length > 0 ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {reminders.map((reminder) => (
                    <li 
                      key={reminder.id} 
                      className="p-3 rounded-lg text-sm transition-colors duration-150 shadow-md bg-[#1f1f1f] border border-gray-700/50 hover:bg-[#2a2a2a]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-grow mr-2">
                            <p className="font-semibold text-[#00bcd4]">{reminder.title}</p>
                            <p className="text-sm text-gray-200 whitespace-pre-wrap">{reminder.content}</p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col space-y-1.5 items-center">
                            <button
                                type="button"
                                onClick={() => handleOpenEditReminderModal(reminder)}
                                className="p-1.5 rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-[#1f1f1f]"
                                aria-label="Editar Lembrete"
                                title="Editar Lembrete"
                            >
                                <PencilIcon className="w-5 h-5 text-[#00bcd4] hover:text-[#00a5b8]" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenDeleteReminderModal(reminder)}
                                className="p-1.5 rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-[#1f1f1f]"
                                aria-label="Excluir Lembrete"
                                title="Excluir Lembrete"
                            >
                                <TrashIcon className="w-5 h-5 text-[#f44336] hover:text-[#d32f2f]" />
                            </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#b0b0b0] text-center py-4">Nenhum lembrete ativo.</p>
              )}
            </Card>
          </section>

          <section>
            <Card
                className="bg-[#1a1a1a]"
                title={
                    <div className="flex justify-between items-center w-full">
                        <span className="flex items-center text-xl text-white">
                            <dotlottie-wc
                                src="https://lottie.host/da084b4b-f5cd-4fa8-be5b-53346b6d9cb9/TFjEZhOq32.lottie"
                                speed="1"
                                autoplay
                                loop
                                className="w-10 h-10 mr-3"
                                aria-label="Ícone animado de Lembretes de Retorno"
                            ></dotlottie-wc>
                             Lembretes de Retorno
                        </span>
                    </div>
                }
            >
                <p className="text-sm text-gray-400 mb-4">
                    Clientes que realizaram consulta há pelo menos 6 meses e não retornaram.
                </p>
                {isLoadingReturnReminders ? (
                    <p className="text-[#b0b0b0] text-center py-4">Carregando lembretes de retorno...</p>
                ) : returnReminders.length > 0 ? (
                    <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {returnReminders.map((patient) => (
                            <li key={patient.cpf} className="p-3 rounded-lg text-sm transition-colors duration-150 shadow-md bg-[#1f1f1f] border border-gray-700/50 hover:bg-[#2a2a2a] flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-white">{patient.fullName}</p>
                                    <p className="text-xs text-gray-500">Última visita: {patient.last_appointment_date ? isoToDdMmYyyy(patient.last_appointment_date) : 'N/A'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Link to={`/patient/${patient.cpf}`}>
                                        <Button size="sm" variant="ghost" className="p-2 rounded-full hover:bg-cyan-500/20" title="Ver Paciente">
                                            <EyeIcon className="w-5 h-5 text-cyan-400"/>
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="p-2 rounded-full hover:bg-green-500/20"
                                        onClick={() => handleSendWhatsAppReminder(patient)}
                                        title="Entrar em contato"
                                        disabled={!patient.phone}
                                    >
                                        <img src="https://raw.githubusercontent.com/riquelima/topDent/refs/heads/main/368d6855-50b1-41da-9d0b-c10e5d2b1e19.png" alt="WhatsApp" className="w-6 h-6" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="p-2 rounded-full hover:bg-yellow-500/20" onClick={() => handleRebookPatient(patient)} title="Reagendar">
                                      <img src="https://cdn-icons-png.flaticon.com/512/16655/16655637.png" alt="Reagendar" className="w-5 h-5"/>
                                    </Button>
                                    <Button size="sm" variant="ghost" className="p-2 rounded-full hover:bg-red-500/20" onClick={() => requestDismissReminder(patient)} title="Dispensar Lembrete">
                                      <TrashIcon className="w-5 h-5 text-red-400"/>
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-[#b0b0b0] text-center py-4">Nenhum paciente necessitando retorno.</p>
                )}
            </Card>
          </section>

          <section>
            <Card
                className="bg-[#1a1a1a]"
                title={
                    <div className="flex items-center text-xl text-white">
                        <dotlottie-wc
                            src="https://lottie.host/05c45dae-1499-4a47-bf6c-f90a35dccffa/esmVugX0Jy.lottie"
                            speed="1"
                            autoplay
                            loop
                            className="w-10 h-10 mr-3"
                            aria-label="Ícone animado de Estatísticas Rápidas"
                        ></dotlottie-wc>
                        Estatísticas Rápidas
                    </div>
                }
            >
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Pacientes cadastrados</span>
                  <span className="font-bold text-2xl text-white">{quickStats.patientsRegistered}</span>
                </li>
                <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Consultas hoje</span>
                  <span className="font-bold text-2xl text-white">{quickStats.consultationsToday}</span>
                </li>
                 <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Tratamentos em andamento</span>
                  <span className="font-bold text-2xl text-white">{quickStats.activeTreatments}</span>
                </li>
                 <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Total de consultas no sistema</span>
                  <span className="font-bold text-2xl text-white">{quickStats.totalConsultations}</span>
                </li>
                 <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Consultas pendentes</span>
                  <span className="font-bold text-2xl text-white">{quickStats.pendingConsultations}</span>
                </li>
              </ul>
            </Card>
          </section>
        </div>
      </div>

      {isAudioUnlocked ? null : (
        <div className="fixed bottom-6 left-6 bg-yellow-500 text-black px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-4 animate-pulse">
          <BellIcon className="w-6 h-6" />
          <div>
              <p className="text-sm font-semibold">Ativar o som das notificações</p>
              <p className="text-xs">Clique no botão para ouvir os alertas.</p>
          </div>
          <Button variant="secondary" onClick={unlockAudioManually} className="bg-black hover:bg-gray-800 px-3 py-1 rounded-md text-sm text-white">
              Ativar Som
          </Button>
        </div>
      )}
      
       <Modal
          isOpen={isAddReminderModalOpen}
          onClose={handleCloseAddReminderModal}
          title="Adicionar Novo Lembrete Global"
          footer={
            <div className="flex justify-end space-x-3 w-full">
              <Button type="button" variant="ghost" onClick={handleCloseAddReminderModal} disabled={isSubmittingReminder}>
                Cancelar
              </Button>
              <Button type="submit" form="addReminderForm" variant="primary" disabled={isSubmittingReminder}>
                {isSubmittingReminder ? 'Salvando...' : 'Adicionar Lembrete'}
              </Button>
            </div>
          }
        >
          <form id="addReminderForm" onSubmit={handleAddReminder} className="space-y-4">
            <Input
              label="Título"
              name="title"
              value={newReminderFormData.title}
              onChange={handleNewReminderFormChange}
              required autoFocus
              disabled={isSubmittingReminder}
            />
            <Textarea
              label="Conteúdo"
              name="content"
              value={newReminderFormData.content}
              onChange={handleNewReminderFormChange}
              required
              rows={4}
              disabled={isSubmittingReminder}
            />
          </form>
        </Modal>

      {editingReminder && (
        <Modal
          isOpen={isEditReminderModalOpen}
          onClose={handleCloseEditReminderModal}
          title="Editar Lembrete Global"
          footer={
            <div className="flex justify-end space-x-3 w-full">
                <Button type="button" variant="ghost" onClick={handleCloseEditReminderModal} disabled={isSubmittingReminder}>Cancelar</Button>
                <Button type="submit" form="editReminderForm" variant="primary" disabled={isSubmittingReminder}>{isSubmittingReminder ? 'Atualizando...' : 'Atualizar Lembrete'}</Button>
            </div>
          }
        >
          <form id="editReminderForm" onSubmit={handleUpdateReminder} className="space-y-4">
            <Input
              label="Título" name="title"
              value={editingReminder.title}
              onChange={handleReminderFormChange}
              required autoFocus
              disabled={isSubmittingReminder}
            />
            <Textarea
              label="Conteúdo" name="content"
              value={editingReminder.content}
              onChange={handleReminderFormChange}
              required rows={4}
              disabled={isSubmittingReminder}
            />
          </form>
        </Modal>
      )}

      {reminderToDelete && (
        <ConfirmationModal
          isOpen={isDeleteReminderConfirmModalOpen}
          onClose={handleCloseDeleteReminderModal}
          onConfirm={handleConfirmDeleteReminder}
          title="Confirmar Exclusão de Lembrete"
          message={<>Tem certeza que deseja excluir o lembrete <strong className="text-[#00bcd4]">{reminderToDelete.title}</strong>? Esta ação é irreversível.</>}
          confirmButtonText="Excluir Lembrete"
          isLoading={isSubmittingReminder}
        />
      )}

      {patientToDismiss && (
        <ConfirmationModal
            isOpen={isDismissModalOpen}
            onClose={closeDismissModal}
            onConfirm={executeDismissReminder}
            title="Dispensar Lembrete de Retorno"
            message={<>Tem certeza que deseja dispensar o lembrete para <strong className="text-[#00bcd4]">{patientToDismiss.fullName}</strong>? Ele não aparecerá mais nesta lista até a próxima consulta concluída.</>}
            confirmButtonText="Sim, Dispensar"
            confirmButtonVariant="primary"
            isLoading={isSubmittingReminder}
        />
      )}
    </div>
  );
};