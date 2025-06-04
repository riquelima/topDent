
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    ClockIcon, 
    MagnifyingGlassIcon, 
    PencilSquareIcon, 
    BriefcaseIcon, 
    HeartIcon, 
    ExclamationTriangleIcon
} from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment } from '../types';
import { getAppointmentsByDate } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';

interface DentistDashboardPageProps {
  userName: string;
}

interface ShortcutCardProps {
  title: string;
  icon: React.ReactElement<HeroIconProps>;
  to: NavigationPath | string;
  color?: string; 
}

const ShortcutCard: React.FC<ShortcutCardProps> = ({ title, icon, to, color = 'bg-teal-600' }) => (
  <Link to={to}>
    <Card className="hover:shadow-teal-400/30 transition-all duration-300 ease-in-out" hoverEffect>
      <div className="flex flex-col items-center justify-center p-6 text-center h-48">
        <div className={`p-4 rounded-full mb-3 ${color} text-white`}>
          {React.cloneElement(icon, { className: "w-10 h-10" })}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
    </Card>
  </Link>
);

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
    Completed: { bg: 'bg-gray-600/20', text: 'text-gray-300', border: 'border-gray-500'}, // Added "Completed"
};

const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
};

const clinicalAlerts = [
  { id: 'a1', message: 'Paciente João da Silva tem alergia a Penicilina registrada.', level: 'high' },
  { id: 'a2', message: 'Lembrar de solicitar novo Raio-X para Maria Oliveira na próxima consulta.', level: 'medium' },
  { id: 'a3', message: 'Paciente Carlos Pereira em tratamento contínuo para Periodontite.', level: 'medium' },
];


export const DentistDashboardPage: React.FC<DentistDashboardPageProps> = ({ userName }) => {
  const { showToast } = useToast();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  const todayDateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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

  return (
    <div className="space-y-10 text-white bg-[#121212] min-h-full">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-teal-400">
        Olá, {userName}, aqui está sua agenda de hoje ({formatDate(new Date())})
      </h1>

      {/* Agenda de Consultas */}
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
                 const style = statusStyles[currentStatusLabel] || statusStyles[appt.status] || { bg: 'bg-gray-600/20', text: 'text-gray-300', border: 'border-gray-500'};
                 return (
                    <Card key={appt.id} className={`${style.bg} border ${style.border} shadow-lg rounded-xl`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="text-2xl font-bold text-teal-300">{appt.appointment_time}</div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${style.bg.replace('/20', '')} ${style.text}`}>
                                {currentStatusLabel}
                            </span>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-1">{appt.patient_name || appt.patient_cpf}</h3>
                        <p className="text-sm text-gray-300 mb-4">{appt.procedure}</p>
                        <Link to={`/patient/${appt.patient_cpf}`}>
                             <Button variant="ghost" size="sm" fullWidth className="border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-white">
                                Ver Prontuário
                            </Button>
                        </Link>
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

      {/* Atalhos Rápidos */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ShortcutCard title="Buscar Prontuário" icon={<MagnifyingGlassIcon />} to={NavigationPath.ViewRecord} color="bg-blue-600" />
          <ShortcutCard title="Registrar Evolução Clínica" icon={<PencilSquareIcon />} to="#" color="bg-indigo-600" />
          <ShortcutCard title="Ver Planos de Tratamento" icon={<BriefcaseIcon />} to={NavigationPath.AllTreatmentPlans} color="bg-purple-600" />
          <ShortcutCard title="Visualizar Anamnese" icon={<HeartIcon />} to="#" color="bg-pink-600" />
        </div>
      </section>

      {/* Alertas Clínicos e Lembretes */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <ExclamationTriangleIcon className="w-7 h-7 mr-3 text-yellow-400" />
            Alertas Clínicos e Lembretes
        </h2>
        {clinicalAlerts.length > 0 ? (
          <div className="space-y-4">
            {clinicalAlerts.map(alert => (
              <Card key={alert.id} className={`border-l-4 ${alert.level === 'high' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'} p-5 shadow-md rounded-lg`}>
                <div className="flex items-start">
                    <ExclamationTriangleIcon className={`w-5 h-5 mr-3 mt-1 flex-shrink-0 ${alert.level === 'high' ? 'text-red-400' : 'text-yellow-400'}`} />
                    <p className={`text-sm ${alert.level === 'high' ? 'text-red-200' : 'text-yellow-200'}`}>{alert.message}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-800">
            <p className="text-center text-gray-400 py-6">Nenhum alerta ou lembrete clínico no momento.</p>
          </Card>
        )}
      </section>
    </div>
  );
};
