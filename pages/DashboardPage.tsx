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
    PlusIcon,
    ChartBarIcon
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
  className?: string;
}

const QuickAccessCard = ({ 
  title, description, icon, to, onClick, 
  colorClass, 
  className = ''
}: QuickAccessCardProps): React.ReactElement => {
  const cardBaseStyle = `text-left ${colorClass} transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-2xl rounded-2xl`;
  const shadowColor = colorClass.replace('bg-', 'shadow-');

  const content = (
    <div className={`flex items-center p-5 h-full ${shadowColor}/30 hover:${shadowColor}/50`}>
      <div className={`mr-5 p-3 rounded-xl bg-black/30 text-white`}>
        {React.cloneElement(icon, { className: `w-8 h-8` })}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/80">{description}</p>
      </div>
    </div>
  );

  const finalClassName = `block h-full cursor-pointer ${cardBaseStyle} ${className}`;

  if (to && to !== '#') {
    return (
      <Link to={to} className={finalClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={finalClassName}>
      {content}
    </div>
  );
};

const statusDisplayConfig: Record<Appointment['status'], { label: string; className: string }> = {
  Scheduled: { label: 'Agendado', className: 'bg-yellow-500/80 text-black' }, 
  Confirmed: { label: 'Confirmado', className: 'bg-[var(--accent-cyan)] text-black' },
  Completed: { label: 'Concluído', className: 'bg-green-500 text-white' },
  Cancelled: { label: 'Cancelado', className: 'bg-[var(--accent-red)] text-white' },
  Ausente: { label: 'Ausente', className: 'bg-orange-500 text-white' },
};

interface ReminderFormData {
  id: string;
  title: string;
  content: string;
}

interface DashboardPageProps {
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const navigate = useNavigate(); 
  const { showToast } = useToast();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingUpcomingAppointments, setIsLoadingUpcomingAppointments] = useState(true);
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [newReminderFormData, setNewReminderFormData] = useState({ title: '', content: '' });
  
  const [isEditReminderModalOpen, setIsEditReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderFormData | null>(null);
  
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);
  const [isDeleteReminderConfirmModalOpen, setIsDeleteReminderConfirmModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  const [isAudioUnlocked, setIsAudioUnlocked] = useState(!!(window as any).isAudioUnlocked);

  const [returnReminders, setReturnReminders] = useState<Patient[]>([]);
  const [isLoadingReturnReminders, setIsLoadingReturnReminders] = useState(true);
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [patientToDismiss, setPatientToDismiss] = useState<Patient | null>(null);

  const [stats, setStats] = useState({ totalPatients: 0, appointmentsToday: 0, totalTreatments: 0, totalAppointments: 0, pendingAppointments: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const handleLogoutFromCard = () => {
    onLogout();
    navigate('/login');
  };

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
    setIsLoadingStats(true);

    const todayString = getTodayInSaoPaulo();

    const { data: allAppointments, error: appointmentsError } = await getAppointments();
    if (appointmentsError) {
      showToast("Falha ao carregar agendamentos.", "error");
    } else {
      const appointmentsData = allAppointments || [];
      const upcoming = appointmentsData
        .filter(appt => appt.appointment_date >= todayString && (appt.status === 'Scheduled' || appt.status === 'Confirmed'))
        .sort((a, b) => {
            if (a.appointment_date < b.appointment_date) return -1;
            if (a.appointment_date > b.appointment_date) return 1;
            if (a.appointment_time < b.appointment_time) return -1;
            if (a.appointment_time > b.appointment_time) return 1;
            return 0;
        });
      setUpcomingAppointments(upcoming);
    }
    setIsLoadingUpcomingAppointments(false);
    
    const [remindersRes, patientsRes, treatmentsRes] = await Promise.all([
      getActiveReminders(),
      getPatients(),
      getAllTreatmentPlans()
    ]);
    
    // Stats calculation
    const appointmentsData = allAppointments || [];
    const patientsData = patientsRes.data || [];
    const treatmentsData = treatmentsRes.data || [];

    setStats({
        totalPatients: patientsData.length,
        appointmentsToday: appointmentsData.filter(a => a.appointment_date === todayString).length,
        totalTreatments: treatmentsData.length,
        totalAppointments: appointmentsData.length,
        pendingAppointments: appointmentsData.filter(a => a.status === 'Scheduled' || a.status === 'Confirmed').length,
    });
    setIsLoadingStats(false);

    if (remindersRes.error) {
        showToast("Falha ao carregar lembretes.", "error");
    } else {
        setReminders(remindersRes.data || []);
    }
    setIsLoadingReminders(false);

    if (patientsRes.data && allAppointments) {
      const sixMonthsAgoDate = new Date(`${todayString}T12:00:00Z`);
      sixMonthsAgoDate.setUTCMonth(sixMonthsAgoDate.getUTCMonth() - 6);
      const sixMonthsAgoString = sixMonthsAgoDate.toISOString().split('T')[0];
      const lastCompletedVisitMap = new Map<string, string>();
      allAppointments.forEach(appt => {
          if (appt.status === 'Completed' && appt.patient_cpf) {
              const currentLatest = lastCompletedVisitMap.get(appt.patient_cpf);
              if (!currentLatest || appt.appointment_date > currentLatest) {
                  lastCompletedVisitMap.set(appt.patient_cpf, appt.appointment_date);
              }
          }
      });
      const patientsWhoNeedReturn = (patientsRes.data as Patient[]).filter(p => lastCompletedVisitMap.get(p.cpf) && lastCompletedVisitMap.get(p.cpf)! <= sixMonthsAgoString);
      const upcomingAppointmentCpfs = new Set(allAppointments.filter(a => a.appointment_date >= todayString && (a.status === 'Scheduled' || a.status === 'Confirmed')).map(a => a.patient_cpf).filter(Boolean as any as (x: string | null) => x is string));
      const finalReturnReminders = patientsWhoNeedReturn.filter(p => !upcomingAppointmentCpfs.has(p.cpf)).map(p => ({ ...p, last_appointment_date: lastCompletedVisitMap.get(p.cpf) }));
      setReturnReminders(finalReturnReminders);
    }
    setIsLoadingReturnReminders(false);
  }, [showToast]);


  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenEditReminderModal = (reminder: Reminder) => {
    setEditingReminder({ id: reminder.id, title: reminder.title, content: reminder.content });
    setIsEditReminderModalOpen(true);
  };

  const handleCloseEditReminderModal = () => {
    setIsEditReminderModalOpen(false);
    setEditingReminder(null);
  };
  
  const handleOpenAddReminderModal = () => setIsAddReminderModalOpen(true);
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
      const { error } = await addReminder({ title: newReminderFormData.title, content: newReminderFormData.content });
      if (error) showToast('Erro ao adicionar lembrete: ' + error.message, 'error');
      else {
          showToast('Lembrete adicionado com sucesso!', 'success');
          fetchDashboardData();
          handleCloseAddReminderModal();
      }
      setIsSubmittingReminder(false);
  };

  const handleReminderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingReminder) setEditingReminder({ ...editingReminder, [e.target.name]: e.target.value });
  };

  const handleUpdateReminder = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;
    setIsSubmittingReminder(true);
    const { error } = await updateReminder(editingReminder.id, { title: editingReminder.title, content: editingReminder.content });
    if (error) showToast('Erro ao atualizar lembrete: ' + error.message, 'error');
    else {
      showToast('Lembrete atualizado com sucesso!', 'success');
      fetchDashboardData();
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
    if (error) showToast('Erro ao excluir lembrete: ' + error.message, 'error');
    else {
      showToast('Lembrete excluído com sucesso!', 'success');
      fetchDashboardData();
    }
    handleCloseDeleteReminderModal();
    setIsSubmittingReminder(false);
  };

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
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(messageText)}`;
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
        patient_cpf: patientToDismiss.cpf, patient_name: patientToDismiss.fullName,
        appointment_date: dateString, appointment_time: '00:00',
        procedure: 'Lembrete de Retorno Dispensado Pelo Admin', status: 'Cancelled' as const,
        notes: `Registro automático para dispensar lembrete de retorno para ${patientToDismiss.fullName}.`,
    };

    const { error } = await addAppointment(dismissalAppointment);
    if (error) showToast(`Erro ao dispensar lembrete: ${error.message}`, 'error');
    else {
        showToast(`Lembrete para ${patientToDismiss.fullName} foi dispensado.`, 'success');
        fetchDashboardData();
    }
    closeDismissModal();
    setIsSubmittingReminder(false);
  };

  return (
    <div className="space-y-10">
      <div className="animate-fadeInUp opacity-0">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Bem-vindo à Top Dent</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-lg">Painel administrativo da clínica</p>
      </div>
      
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAccessCard title="Novo Paciente" description="Cadastrar novo" icon={<UserPlusIcon />} to={NavigationPath.NewPatient} colorClass="bg-gradient-to-br from-blue-500 to-blue-700" className="animate-fadeInUp stagger-1 opacity-0" />
          <QuickAccessCard title="Agendar Consulta" description="Marcar horário" icon={<CalendarDaysIcon />} to={NavigationPath.NewAppointment} colorClass="bg-gradient-to-br from-purple-500 to-purple-700" className="animate-fadeInUp stagger-2 opacity-0" />
          <QuickAccessCard title="Ver Prontuário" description="Buscar registros" icon={<ClipboardDocumentListIcon />} to={NavigationPath.ViewRecord} colorClass="bg-gradient-to-br from-amber-500 to-amber-700" className="animate-fadeInUp stagger-3 opacity-0" /> 
          <QuickAccessCard title="Adicionar Tratamento" description="Novo plano dental" icon={<DocumentPlusIcon />} to={NavigationPath.TreatmentPlan} colorClass="bg-gradient-to-br from-green-500 to-green-700" className="animate-fadeInUp stagger-4 opacity-0" />
          <QuickAccessCard title="Histórico de Consultas" description="Ver consultas passadas" icon={<ClockIcon />} to={NavigationPath.ConsultationHistory} colorClass="bg-gradient-to-br from-fuchsia-500 to-fuchsia-700" className="animate-fadeInUp stagger-5 opacity-0" />
          <QuickAccessCard title="Sair" description="Encerrar sessão" icon={<ArrowRightOnRectangleIcon className="transform scale-x-[-1]"/>} onClick={handleLogoutFromCard} colorClass="bg-gradient-to-br from-red-500 to-red-700" className="animate-fadeInUp stagger-6 opacity-0" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 flex animate-fadeInUp stagger-3 opacity-0">
          <Card 
            className="w-full flex flex-col"
            bodyClassName="flex-1 overflow-y-auto"
            title={
              <div className="flex justify-between items-center">
                <span className="flex items-center text-xl text-white -ml-4">
                    <dotlottie-wc src="https://lottie.host/1edc1d7e-c05c-4561-9b02-42e350c0e5f6/Yv6Cl4dWIE.lottie" speed="1" autoPlay loop style={{width: '80px', height: '80px'}}/>
                    Próximos Agendamentos
                </span>
                <Link to={NavigationPath.Appointments} className="text-sm text-[var(--accent-cyan)] hover:underline font-medium">Ver Todos</Link>
              </div>
            }
          >
            {isLoadingUpcomingAppointments ? <p className="text-[var(--text-secondary)] text-center py-4">Carregando...</p>
            : upcomingAppointments.length > 0 ? (
              <ul className="space-y-4">
                {upcomingAppointments.map(appt => {
                  const statusConfig = statusDisplayConfig[appt.status] || { label: appt.status, className: 'bg-gray-500 text-gray-200' };
                  const dateParts = isoToDdMmYyyy(appt.appointment_date).split('/');
                  return (
                    <li key={appt.id} className="p-4 bg-[var(--background-light)] rounded-2xl flex items-center space-x-4 border border-[var(--border-color)] hover:border-[var(--text-secondary)] transition-colors">
                      <div className="flex flex-col items-center justify-center p-3 bg-[var(--background-dark)] rounded-xl w-20 text-center shadow-inner">
                        <span className="text-3xl font-bold text-white">{dateParts[0]}</span>
                        <span className="text-xs text-[var(--text-secondary)] uppercase">{new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</span>
                      </div>
                      <div className="flex-grow">
                        <p className="font-semibold text-lg text-white">{appt.patient_name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{appt.procedure}</p>
                        <p className="text-xs text-gray-500">{formatToHHMM(appt.appointment_time)} {appt.dentist_name && `• ${appt.dentist_name}`}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusConfig.className}`}>{statusConfig.label}</span>
                        {appt.patient_cpf ? (
                          <Link to={`/patient/${appt.patient_cpf}`}><Button size="sm" variant="ghost" leftIcon={<EyeIcon className="w-4 h-4"/>}>Ver Paciente</Button></Link>
                        ) : <Button size="sm" variant="ghost" disabled>Não Cadastrado</Button>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-[var(--text-secondary)] text-center py-4">Nenhum próximo agendamento encontrado.</p>}
          </Card>
        </section>
        
        <div className="space-y-8 animate-fadeInUp stagger-4 opacity-0">
          <section>
             <Card title={
                <div className="flex justify-between items-center w-full">
                    <span className="flex items-center text-xl text-white -ml-2">
                        <dotlottie-wc src="https://lottie.host/e121b752-68a2-4df0-aa2f-95c3dad925e4/lvtlihuUh8.lottie" speed="1" autoPlay loop style={{width: '60px', height: '60px'}}/>
                        Lembretes Globais
                    </span>
                    <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-[var(--background-light)]" onClick={handleOpenAddReminderModal} title="Adicionar Lembrete"><PlusIcon className="w-5 h-5 text-[var(--accent-cyan)]" /></Button>
                </div>
            }>
              {isLoadingReminders ? <p className="text-[var(--text-secondary)] text-center py-4">Carregando...</p>
              : reminders.length > 0 ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {reminders.map((reminder) => (
                    <li key={reminder.id} className="p-3 rounded-xl transition-colors duration-150 bg-[var(--background-light)] border border-[var(--border-color)] hover:border-[var(--text-secondary)]">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow mr-2">
                            <p className="font-semibold text-[var(--accent-cyan)]">{reminder.title}</p>
                            <p className="text-sm text-white/90 whitespace-pre-wrap">{reminder.content}</p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col space-y-1.5 items-center">
                            <button type="button" onClick={() => handleOpenEditReminderModal(reminder)} className="p-1.5 rounded-lg hover:bg-[var(--background-dark)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border-color)] focus:ring-offset-1 focus:ring-offset-[var(--background-light)]" title="Editar Lembrete"><PencilIcon className="w-5 h-5 text-[var(--accent-cyan)]" /></button>
                            <button type="button" onClick={() => handleOpenDeleteReminderModal(reminder)} className="p-1.5 rounded-lg hover:bg-[var(--background-dark)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border-color)] focus:ring-offset-1 focus:ring-offset-[var(--background-light)]" title="Excluir Lembrete"><TrashIcon className="w-5 h-5 text-[var(--accent-red)]" /></button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[var(--text-secondary)] text-center py-4">Nenhum lembrete ativo.</p>}
            </Card>
          </section>

          <section>
            <Card title={
                <div className="flex justify-between items-center w-full">
                    <span className="flex items-center text-xl text-white -ml-2">
                        <dotlottie-wc src="https://lottie.host/da084b4b-f5cd-4fa8-be5b-53346b6d9cb9/TFjEZhOq32.lottie" speed="1" autoPlay loop style={{width: '60px', height: '60px'}}/>
                             Lembretes de Retorno
                    </span>
                </div>
            }>
                <p className="text-sm text-gray-400 mb-4">Pacientes que realizaram consulta há mais de 6 meses e não agendaram retorno.</p>
                {isLoadingReturnReminders ? <p className="text-[var(--text-secondary)] text-center py-4">Carregando...</p>
                : returnReminders.length > 0 ? (
                    <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {returnReminders.map((patient) => (
                            <li key={patient.cpf} className="p-3 rounded-xl transition-colors duration-150 bg-[var(--background-light)] border border-[var(--border-color)] hover:border-[var(--text-secondary)] flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-white">{patient.fullName}</p>
                                    <p className="text-xs text-gray-500">Última visita: {patient.last_appointment_date ? isoToDdMmYyyy(patient.last_appointment_date) : 'N/A'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button as={Link} to={`/patient/${patient.cpf}`} size="sm" variant="ghost" className="p-2 rounded-full hover:bg-cyan-500/20" title="Ver Paciente"><EyeIcon className="w-5 h-5 text-cyan-400"/></Button>
                                    <Button size="sm" variant="ghost" className="p-2 rounded-full hover:bg-green-500/20" onClick={() => handleSendWhatsAppReminder(patient)} title="Entrar em contato" disabled={!patient.phone}><img src="https://raw.githubusercontent.com/riquelima/topDent/refs/heads/main/368d6855-50b1-41da-9d0b-c10e5d2b1e19.png" alt="WhatsApp" className="w-6 h-6" /></Button>
                                    <Button size="sm" variant="ghost" className="p-2 rounded-full hover:bg-yellow-500/20" onClick={() => handleRebookPatient(patient)} title="Reagendar"><img src="https://cdn-icons-png.flaticon.com/512/4856/4856659.png" alt="Reagendar" className="w-5 h-5"/></Button>
                                    <Button size="sm" variant="ghost" className="p-2 rounded-full hover:bg-red-500/20" onClick={() => requestDismissReminder(patient)} title="Dispensar Lembrete"><TrashIcon className="w-5 h-5 text-red-400"/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-[var(--text-secondary)] text-center py-4">Nenhum paciente necessitando retorno.</p>}
            </Card>
          </section>

          <section>
            <Card title={
                <div className="flex justify-between items-center w-full">
                    <span className="flex items-center text-xl text-white -ml-2">
                        <dotlottie-wc src="https://lottie.host/05c45dae-1499-4a47-bf6c-f90a35dccffa/esmVugX0Jy.lottie" speed="1" autoPlay loop style={{width: '60px', height: '60px'}}/>
                        Estatísticas Rápidas
                    </span>
                </div>
            }>
                {isLoadingStats ? (
                    <p className="text-[var(--text-secondary)] text-center py-4">Carregando estatísticas...</p>
                ) : (
                    <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                            <span className="text-[var(--text-secondary)]">Pacientes cadastrados</span>
                            <span className="font-bold text-white text-lg">{stats.totalPatients}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                            <span className="text-[var(--text-secondary)]">Consultas hoje</span>
                            <span className="font-bold text-white text-lg">{stats.appointmentsToday}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                            <span className="text-[var(--text-secondary)]">Tratamentos em andamento</span>
                            <span className="font-bold text-white text-lg">{stats.totalTreatments}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                            <span className="text-[var(--text-secondary)]">Total de consultas no sistema</span>
                            <span className="font-bold text-white text-lg">{stats.totalAppointments}</span>
                        </li>
                        <li className="flex justify-between items-center pt-2">
                            <span className="text-[var(--text-secondary)]">Consultas pendentes</span>
                            <span className="font-bold text-white text-lg">{stats.pendingAppointments}</span>
                        </li>
                    </ul>
                )}
            </Card>
          </section>
        </div>
      </div>

      {!isAudioUnlocked && (
        <div className="fixed bottom-6 left-6 bg-yellow-400 text-black px-4 py-3 rounded-2xl shadow-lg z-50 flex items-center space-x-4 animate-pulse-glow">
          <BellIcon className="w-6 h-6" />
          <div>
              <p className="text-sm font-semibold">Ativar o som das notificações</p>
              <p className="text-xs">Clique no botão para ouvir os alertas.</p>
          </div>
          <Button variant="secondary" onClick={unlockAudioManually} className="bg-black/80 hover:bg-black px-3 py-1 rounded-lg text-sm text-white border-none shadow-none">
              Ativar Som
          </Button>
        </div>
      )}
      
       <Modal isOpen={isAddReminderModalOpen} onClose={handleCloseAddReminderModal} title="Adicionar Novo Lembrete Global" footer={
            <div className="flex justify-end space-x-3 w-full">
              <Button type="button" variant="secondary" onClick={handleCloseAddReminderModal} disabled={isSubmittingReminder}>Cancelar</Button>
              <Button type="submit" form="addReminderForm" variant="primary" disabled={isSubmittingReminder}>{isSubmittingReminder ? 'Salvando...' : 'Adicionar'}</Button>
            </div>
          }>
          <form id="addReminderForm" onSubmit={handleAddReminder} className="space-y-4"><Input label="Título" name="title" value={newReminderFormData.title} onChange={handleNewReminderFormChange} required autoFocus disabled={isSubmittingReminder}/><Textarea label="Conteúdo" name="content" value={newReminderFormData.content} onChange={handleNewReminderFormChange} required rows={4} disabled={isSubmittingReminder}/></form>
        </Modal>

      {editingReminder && (
        <Modal isOpen={isEditReminderModalOpen} onClose={handleCloseEditReminderModal} title="Editar Lembrete Global" footer={
            <div className="flex justify-end space-x-3 w-full"><Button type="button" variant="secondary" onClick={handleCloseEditReminderModal} disabled={isSubmittingReminder}>Cancelar</Button><Button type="submit" form="editReminderForm" variant="primary" disabled={isSubmittingReminder}>{isSubmittingReminder ? 'Atualizando...' : 'Atualizar'}</Button></div>
          }>
          <form id="editReminderForm" onSubmit={handleUpdateReminder} className="space-y-4"><Input label="Título" name="title" value={editingReminder.title} onChange={handleReminderFormChange} required autoFocus disabled={isSubmittingReminder}/><Textarea label="Conteúdo" name="content" value={editingReminder.content} onChange={handleReminderFormChange} required rows={4} disabled={isSubmittingReminder}/></form>
        </Modal>
      )}

      {reminderToDelete && (<ConfirmationModal isOpen={isDeleteReminderConfirmModalOpen} onClose={handleCloseDeleteReminderModal} onConfirm={handleConfirmDeleteReminder} title="Confirmar Exclusão" message={<>Tem certeza que deseja excluir o lembrete <strong className="text-[var(--accent-cyan)]">{reminderToDelete.title}</strong>? Esta ação é irreversível.</>} confirmButtonText="Excluir" isLoading={isSubmittingReminder}/>)}
      {patientToDismiss && (<ConfirmationModal isOpen={isDismissModalOpen} onClose={closeDismissModal} onConfirm={executeDismissReminder} title="Dispensar Lembrete" message={<>Tem certeza que deseja dispensar o lembrete para <strong className="text-[var(--accent-cyan)]">{patientToDismiss.fullName}</strong>?</>} confirmButtonText="Sim, Dispensar" confirmButtonVariant="primary" isLoading={isSubmittingReminder}/>)}
    </div>
  );
};