
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    UserPlusIcon, 
    CalendarDaysIcon, 
    ClipboardDocumentListIcon, 
    DocumentPlusIcon, 
    ArrowRightOnRectangleIcon, 
    BellIcon, 
    EyeIcon 
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment } from '../types';
// import { AppointmentModal } from '../components/AppointmentModal'; // Removed
import { getUpcomingAppointments } from '../services/supabaseService'; 
import { isoToDdMmYyyy, formatToHHMM } from '../src/utils/formatDate';

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

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ 
  title, description, icon, to, onClick, 
  colorClass, 
  hoverColorClass, 
  iconBgClass = 'bg-black/20', 
  iconColorClass = 'text-white' 
}) => {
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
  Scheduled: { label: 'Agendado', className: 'bg-blue-500 text-white' }, 
  Confirmed: { label: 'Confirmado', className: 'bg-[#00bcd4] text-black' },
  Completed: { label: 'Concluído', className: 'bg-gray-600 text-gray-200' },
  Cancelled: { label: 'Cancelado', className: 'bg-[#f44336] text-white' },
};

const initialNotifications = [
  { id: '1', title: 'Consulta de retorno', patient: 'Paciente Maria Silva - Hoje 16:00', type: 'return' as const, read: false },
  { id: '2', title: 'Pagamento pendente', patient: 'João Pedro - R$ 450,00', type: 'payment' as const, read: false },
];

const quickStatsData = {
  patientsRegistered: 20,
  consultationsToday: 1,
  activeTreatments: 0,
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate(); // Added useNavigate
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingUpcomingAppointments, setIsLoadingUpcomingAppointments] = useState(true);
  const [notifications, setNotifications] = useState(initialNotifications);

  const fetchUpcomingAppointments = useCallback(async (limit: number = 4) => {
    setIsLoadingUpcomingAppointments(true);
    const { data, error } = await getUpcomingAppointments(limit);
    if (error) {
      console.error("Error fetching upcoming appointments:", error.message ? error.message : 'Unknown error');
      setUpcomingAppointments([]);
    } else {
      setUpcomingAppointments(data || []);
    }
    setIsLoadingUpcomingAppointments(false);
  }, []);

  useEffect(() => {
    fetchUpcomingAppointments();
  }, [fetchUpcomingAppointments]);

  // handleAppointmentSaved is no longer needed here as modal is removed
  // const handleAppointmentSaved = (appointment: Appointment) => {
  //   fetchUpcomingAppointments(); 
  //   // setIsAppointmentModalOpen(false); // Modal state removed
  // };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white">Bem-vindo à Top Dent</h1>
        <p className="text-[#b0b0b0] mt-1 text-lg">Painel administrativo da clínica</p>
      </div>
      
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <QuickAccessCard title="Novo Paciente" description="Cadastrar novo" icon={<UserPlusIcon />} to={NavigationPath.NewPatient} colorClass="bg-sky-600" hoverColorClass="hover:bg-sky-500" iconColorClass="text-white" iconBgClass="bg-black/25" />
          <QuickAccessCard 
            title="Agendar Consulta" 
            description="Marcar horário" 
            icon={<CalendarDaysIcon />} 
            to={NavigationPath.NewAppointment} // Changed from onClick to 'to' prop
            colorClass="bg-indigo-600" 
            hoverColorClass="hover:bg-indigo-500" 
            iconColorClass="text-white" 
            iconBgClass="bg-black/25" 
          />
          <QuickAccessCard title="Ver Prontuário" description="Buscar registros" icon={<ClipboardDocumentListIcon />} to={NavigationPath.ViewRecord} colorClass="bg-amber-600" hoverColorClass="hover:bg-amber-500" iconColorClass="text-white" iconBgClass="bg-black/25" /> 
          <QuickAccessCard title="Adicionar Tratamento" description="Novo plano dental" icon={<DocumentPlusIcon />} to={NavigationPath.TreatmentPlan} colorClass="bg-emerald-600" hoverColorClass="hover:bg-emerald-500" iconColorClass="text-white" iconBgClass="bg-black/25" />
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
            <Card className="bg-[#1a1a1a]" titleClassName="flex items-center" title={<><BellIcon className="w-6 h-6 mr-3 text-yellow-400" /> Lembretes</>}>
              {notifications.length > 0 ? (
                <ul className="space-y-3">
                  {notifications.map((note) => (
                    <li 
                      key={note.id} 
                      className={`p-4 rounded-lg text-sm transition-colors duration-150 shadow-inner
                        ${note.type === 'return' ? 'bg-yellow-800/50 border border-yellow-700/70 hover:bg-yellow-800/70' : 'bg-blue-800/50 border border-blue-700/70 hover:bg-blue-800/70'}
                      `}
                    >
                      <p className="font-semibold text-white">{note.title}</p>
                      <p className="text-xs text-gray-300">{note.patient}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#b0b0b0]">Nenhum lembrete novo.</p>
              )}
            </Card>
          </section>

          <section>
            <Card className="bg-[#1a1a1a]" title="Estatísticas Rápidas">
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Pacientes cadastrados</span>
                  <span className="font-bold text-2xl text-white">{quickStatsData.patientsRegistered}</span>
                </li>
                <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Consultas hoje</span>
                  <span className="font-bold text-2xl text-white">{quickStatsData.consultationsToday}</span>
                </li>
                <li className="flex justify-between items-center text-md py-1">
                  <span className="text-[#b0b0b0]">Tratamentos ativos</span>
                  <span className="font-bold text-2xl text-white">{quickStatsData.activeTreatments}</span>
                </li>
              </ul>
            </Card>
          </section>
        </div>
      </div>
      {/* AppointmentModal removed from here */}
    </div>
  );
};
