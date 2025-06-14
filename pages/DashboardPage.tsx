
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
    ClockIcon // Added ClockIcon for history
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment, Reminder } from '../types';
import { 
    getUpcomingAppointments, 
    getActiveReminders,
    updateReminder,      
    deleteReminderById,
    getPatients // Added getPatients
} from '../services/supabaseService'; 
import { isoToDdMmYyyy, formatToHHMM } from '../src/utils/formatDate';
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
}: QuickAccessCardProps): JSX.Element => {
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
}

interface ReminderFormData {
  id: string;
  title: string;
  content: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate(); 
  const { showToast } = useToast();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingUpcomingAppointments, setIsLoadingUpcomingAppointments] = useState(true);
  
  const [quickStats, setQuickStats] = useState<QuickStats>({
    patientsRegistered: 0,
    consultationsToday: 0,
    activeTreatments: 0, // Remains 0 or could be fetched if needed
  });

  // Reminder states
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [isEditReminderModalOpen, setIsEditReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderFormData | null>(null);
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);
  const [isDeleteReminderConfirmModalOpen, setIsDeleteReminderConfirmModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);


  const fetchDashboardData = useCallback(async (limit: number = 4) => {
    setIsLoadingUpcomingAppointments(true);
    setIsLoadingReminders(true); // Assuming reminders are part of dashboard data load

    const todayString = new Date().toISOString().split('T')[0];

    // Fetch upcoming appointments
    const { data: appointmentsData, error: appointmentsError } = await getUpcomingAppointments(limit);
    if (appointmentsError) {
      console.error("Error fetching upcoming appointments:", appointmentsError.message ? appointmentsError.message : 'Unknown error');
      showToast("Falha ao carregar próximos agendamentos.", "error");
      setUpcomingAppointments([]);
      setQuickStats(prev => ({ ...prev, consultationsToday: 0 }));
    } else {
      setUpcomingAppointments(appointmentsData || []);
      const todayAppointmentsCount = (appointmentsData || []).filter(
        (appt: Appointment) => appt.appointment_date === todayString
      ).length;
      setQuickStats(prev => ({ ...prev, consultationsToday: todayAppointmentsCount }));
    }
    setIsLoadingUpcomingAppointments(false);

    // Fetch active reminders
    const { data: remindersData, error: remindersError } = await getActiveReminders();
    if (remindersError) {
        console.error("Error fetching reminders:", remindersError.message ? remindersError.message : 'Unknown error');
        showToast("Falha ao carregar lembretes.", "error");
        setReminders([]);
    } else {
        setReminders(remindersData || []);
    }
    setIsLoadingReminders(false);

    // Fetch total patients for stats
    const { data: patientsData, error: patientsListError } = await getPatients();
    if (patientsListError) {
      console.error("Error fetching patients list for stats:", patientsListError.message);
      setQuickStats(prev => ({ ...prev, patientsRegistered: 0 }));
    } else {
      setQuickStats(prev => ({ ...prev, patientsRegistered: (patientsData || []).length }));
    }

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
          <QuickAccessCard title="Sair" description="Encerrar sessão" icon={<ArrowRightOnRectangleIcon className="transform scale-x-[-1]"/>} onClick={() => alert('Logout action to be implemented!')} colorClass="bg-red-600" hoverColorClass="hover:bg-red-500" iconColorClass="text-white" iconBgClass="bg-black/25" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <Card 
            className="bg-[#1a1a1a]"
            title={
              <div className="flex justify-between items-center">
                <span className="flex items-center text-xl text-white"><CalendarDaysIcon className="w-6 h-6 mr-3 text-[#00bcd4]" />Próximos Agendamentos</span>
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
                        <p className="font-semibold text-lg text-white">{appt.patient_name || appt.patient_cpf}</p>
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
                        <Link to={`/patient/${appt.patient_cpf}`} className="block">
                            <Button size="sm" variant="ghost" className="text-xs border-gray-600 hover:border-[#00bcd4] text-[#b0b0b0] hover:text-[#00bcd4]" leftIcon={<EyeIcon className="w-4 h-4"/>}>
                              Ver Paciente
                            </Button>
                        </Link>
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
                titleClassName="flex items-center" 
                title={
                    <div className="flex justify-between items-center w-full">
                        <span className="flex items-center text-white"><BellIcon className="w-6 h-6 mr-3 text-yellow-400" /> Lembretes</span>
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
            <Card className="bg-[#1a1a1a]" title="Estatísticas Rápidas">
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
                  <span className="text-[#b0b0b0]">Tratamentos ativos</span>
                  <span className="font-bold text-2xl text-white">{quickStats.activeTreatments}</span>
                </li>
              </ul>
            </Card>
          </section>
        </div>
      </div>

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <Modal
            isOpen={isEditReminderModalOpen}
            onClose={handleCloseEditReminderModal}
            title="Editar Lembrete"
            footer={
                <div className="flex justify-end space-x-3">
                    <Button variant="ghost" onClick={handleCloseEditReminderModal} disabled={isSubmittingReminder}>Cancelar</Button>
                    <Button variant="primary" type="submit" form="editReminderForm" disabled={isSubmittingReminder}>
                        {isSubmittingReminder ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            }
        >
            <form id="editReminderForm" onSubmit={handleUpdateReminder} className="space-y-4">
                <Input
                    label="Título"
                    name="title"
                    value={editingReminder.title}
                    onChange={handleReminderFormChange}
                    required
                    disabled={isSubmittingReminder}
                />
                <Textarea
                    label="Conteúdo"
                    name="content"
                    value={editingReminder.content}
                    onChange={handleReminderFormChange}
                    required
                    rows={4}
                    disabled={isSubmittingReminder}
                />
            </form>
        </Modal>
      )}

    {/* Delete Reminder Confirmation Modal */}
    {reminderToDelete && (
        <ConfirmationModal
            isOpen={isDeleteReminderConfirmModalOpen}
            onClose={handleCloseDeleteReminderModal}
            onConfirm={handleConfirmDeleteReminder}
            title="Confirmar Exclusão de Lembrete"
            message={<p>Tem certeza que deseja excluir o lembrete: <strong className="text-[#00bcd4]">{reminderToDelete.title}</strong>? Esta ação é irreversível.</p>}
            confirmButtonText="Excluir Lembrete"
            isLoading={isSubmittingReminder}
        />
    )}

    </div>
  );
};
