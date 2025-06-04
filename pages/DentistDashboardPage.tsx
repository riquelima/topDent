
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
    CheckIcon  
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment } from '../types';
import { getAppointmentsByDate, updateAppointmentStatus } from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';
import { formatToHHMM } from '../src/utils/formatDate';

interface DentistDashboardPageProps {
  userName: string;
  onLogout: () => void;
}

interface ShortcutCardProps {
  title: string;
  icon: React.ReactElement<HeroIconProps>;
  to?: NavigationPath | string; 
  onClick?: () => void; 
  color?: string; 
}

const ShortcutCard: React.FC<ShortcutCardProps> = ({ title, icon, to, onClick, color = 'bg-teal-600' }) => {
  const cardContent = (
    <Card 
        className="hover:shadow-teal-400/30 transition-all duration-300 ease-in-out" 
        hoverEffect 
        onClick={onClick && !to ? onClick : undefined}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center h-48">
        <div className={`p-4 rounded-full mb-3 ${color} text-white`}>
          {React.cloneElement(icon, { className: "w-10 h-10" })}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
    </Card>
  );

  if (to && !onClick) { 
    return <Link to={to}>{cardContent}</Link>;
  }
  
  return cardContent; 
};


const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const statusStyles: Record<string, { bg: string, text: string, border: string }> = {
    Confirmado: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500'},
    Agendado: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500'},
    Cancelado: { bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-500'},
    Completed: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500'}, 
    Concluído: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500'},
};

const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
};


export const DentistDashboardPage: React.FC<DentistDashboardPageProps> = ({ userName, onLogout }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); 

  const todayDateString = new Date().toISOString().split('T')[0]; 

  const fetchTodayAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    setAppointmentsError(null);
    const { data, error } = await getAppointmentsByDate(todayDateString);
    if (error) {
      console.error("Error fetching today's appointments:", error);
      setAppointmentsError("Falha ao carregar a agenda de hoje.");
      showToast("Falha ao carregar a agenda de hoje.", "error");
      setTodayAppointments([]);
    } else {
      setTodayAppointments(data || []);
    }
    setIsLoadingAppointments(false);
  }, [todayDateString, showToast]);

  useEffect(() => {
    fetchTodayAppointments();
  }, [fetchTodayAppointments]);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    setIsUpdatingStatus(true);
    const { error } = await updateAppointmentStatus(appointmentId, newStatus);
    if (error) {
        showToast(`Erro ao atualizar status: ${error.message}`, 'error');
        console.error("Error updating appointment status:", error);
    } else {
        showToast(`Agendamento marcado como ${statusLabelMap[newStatus].toLowerCase()}!`, 'success');
        fetchTodayAppointments(); 
    }
    setIsUpdatingStatus(false);
  };

  const shortcuts: ShortcutCardProps[] = [
    { title: "Buscar Prontuário", icon: <MagnifyingGlassIcon />, to: NavigationPath.ViewRecord, color: "bg-blue-600" },
    { title: "Adicionar Tratamento", icon: <DocumentPlusIcon />, to: NavigationPath.TreatmentPlan, color: "bg-indigo-600" },
    { title: "Sair", icon: <ArrowRightOnRectangleIcon className="transform scale-x-[-1]" />, onClick: handleLogoutClick, color: "bg-red-600" },
  ];

  return (
    <div className="space-y-10 text-white bg-[#121212] min-h-full">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-teal-400">
        Olá, {userName}, aqui está sua agenda de hoje ({formatDate(new Date())})
      </h1>

      <section>
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
          <ClockIcon className="w-7 h-7 mr-3 text-teal-400" />
          Agenda de Consultas (Hoje)
        </h2>
        {isLoadingAppointments ? (
          <Card className="bg-gray-800">
            <p className="text-center text-gray-400 py-6">Carregando agenda de hoje...</p>
          </Card>
        ) : appointmentsError ? (
            <Card className="bg-gray-800 border border-red-500">
                <p className="text-center text-red-400 py-6">{appointmentsError}</p>
            </Card>
        ) : todayAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayAppointments.map(appt => {
                 const currentStatusLabel = statusLabelMap[appt.status] || appt.status;
                 const style = statusStyles[currentStatusLabel] || statusStyles['Agendado']; 
                 const isCancelled = appt.status === 'Cancelled';
                 const isCompleted = appt.status === 'Completed';

                 return (
                    <Card key={appt.id} className={`${style.bg} border ${style.border} shadow-lg rounded-xl flex flex-col justify-between`}>
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="text-2xl font-bold text-teal-300">{formatToHHMM(appt.appointment_time)}</div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style.bg.replace('/20', '')} ${style.text}`}>
                                    {currentStatusLabel}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-1">{appt.patient_name || appt.patient_cpf}</h3>
                            <p className="text-sm text-gray-300 mb-1">{appt.procedure}</p>
                            {appt.dentist_name && <p className="text-xs text-gray-400 mb-4">Dentista: {appt.dentist_name}</p>}
                            {!appt.dentist_name && <div className="mb-4"></div>} 
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <Link 
                                to={`/patient/${appt.patient_cpf}`} 
                                state={{ from: NavigationPath.Home }} // Passa o estado aqui
                                className="flex-grow mr-2"
                            >
                                 <Button variant="ghost" size="sm" fullWidth className="border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-white">
                                    Ver Prontuário
                                </Button>
                            </Link>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleUpdateStatus(appt.id, 'Cancelled')}
                                    disabled={isUpdatingStatus || isCancelled || isCompleted}
                                    className={`p-2 rounded-md ${isUpdatingStatus || isCancelled || isCompleted ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} transition-colors`}
                                    title="Cancelar Agendamento"
                                    aria-label="Cancelar Agendamento"
                                >
                                    <XMarkIcon className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(appt.id, 'Completed')}
                                    disabled={isUpdatingStatus || isCompleted || isCancelled}
                                    className={`p-2 rounded-md ${isUpdatingStatus || isCompleted || isCancelled ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} transition-colors`}
                                    title="Concluir Agendamento"
                                    aria-label="Concluir Agendamento"
                                >
                                    <CheckIcon className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </Card>
                 );
            })}
          </div>
        ) : (
          <Card className="bg-gray-800">
            <p className="text-center text-gray-400 py-6">Nenhuma consulta agendada para hoje.</p>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortcuts.map(shortcut => (
            <ShortcutCard key={shortcut.title} {...shortcut} />
          ))}
        </div>
      </section>
    </div>
  );
};
