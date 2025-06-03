
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserPlusIcon, CalendarDaysIcon, ClipboardDocumentListIcon, DocumentPlusIcon, ArrowRightOnRectangleIcon, BellIcon } from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons';
import { NavigationPath, Appointment } from '../types';
import { AppointmentModal } from '../components/AppointmentModal'; // Import Modal
import { getAppointmentsByDate } from '../services/supabaseService';
import { isoToDdMmYyyy } from '../src/utils/formatDate';

interface QuickAccessCardProps {
  title: string;
  icon: React.ReactElement<HeroIconProps>;
  to?: NavigationPath | '#'; // Make 'to' optional
  onClick?: () => void;
  color?: 'primary' | 'danger';
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, icon, to, onClick, color = 'primary' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-4 h-40 md:h-48">
      <div className={`mb-3 p-3 rounded-full ${color === 'primary' ? 'bg-teal-500' : 'bg-red-500'} text-white`}>
        {React.cloneElement(icon, { className: "w-8 h-8" })}
      </div>
      <h3 className="text-md md:text-lg font-semibold text-white text-center">{title}</h3>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <Card className="text-center" hoverEffect>
          {content}
        </Card>
      </div>
    );
  }
  
  if (to && to !== '#') {
    return (
      <Link to={to}>
        <Card className="text-center" hoverEffect>
          {content}
        </Card>
      </Link>
    );
  }

  // Fallback for items that might not have 'to' or 'onClick' initially
  return (
    <Card className="text-center" hoverEffect>
      {content}
    </Card>
  );
};


const notifications = [
  "Lembrete: Encomendar material de resina",
  "Paciente Pedro Alves ligou para reagendar",
];

export const DashboardPage: React.FC = () => {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  const fetchTodaysAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data, error } = await getAppointmentsByDate(todayStr);
    if (error) {
      console.error("Error fetching today's appointments:", error.message ? error.message : 'Unknown error', 'Details:', JSON.stringify(error, null, 2));
      setTodayAppointments([]);
    } else {
      setTodayAppointments(data || []);
    }
    setIsLoadingAppointments(false);
  }, []);

  useEffect(() => {
    fetchTodaysAppointments();
  }, [fetchTodaysAppointments]);

  const handleAppointmentSaved = (appointment: Appointment) => {
    // If the saved appointment is for today, refresh today's list
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointment.appointment_date === todayStr) {
      fetchTodaysAppointments();
    }
    setIsAppointmentModalOpen(false); // Close modal
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white text-center mb-10">Bem-vindo à Top Dent</h1>
      
      <section>
        <h2 className="text-2xl font-semibold text-gray-300 mb-6">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <QuickAccessCard title="Novo Paciente" icon={<UserPlusIcon />} to={NavigationPath.NewPatient} />
          <QuickAccessCard title="Agendar Consulta" icon={<CalendarDaysIcon />} onClick={() => setIsAppointmentModalOpen(true)} />
          <QuickAccessCard title="Ver Prontuário" icon={<ClipboardDocumentListIcon />} to={NavigationPath.ViewRecord} /> 
          <QuickAccessCard title="Adicionar Plano" icon={<DocumentPlusIcon />} to={NavigationPath.TreatmentPlan} />
          <QuickAccessCard title="Sair" icon={<ArrowRightOnRectangleIcon />} onClick={() => alert('Sair Clicado!')} color="danger" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <Card title="Agendamentos do Dia">
            {isLoadingAppointments ? (
                <p className="text-gray-400 text-center py-4">Carregando agendamentos...</p>
            ) : todayAppointments.length > 0 ? (
              <ul className="space-y-4">
                {todayAppointments.map(appt => (
                  <li key={appt.id} className="p-4 bg-gray-700 rounded-md shadow flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-teal-400">{appt.appointment_time} - {appt.patient_name || appt.patient_cpf}</p>
                      <p className="text-sm text-gray-300">{appt.procedure}</p>
                       <p className="text-xs text-gray-400">Status: {appt.status}</p>
                    </div>
                     <Link to={`/patient/${appt.patient_cpf}`}>
                        <Button size="sm" variant="ghost">Ver Paciente</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Nenhum agendamento para hoje.</p>
            )}
            <div className="mt-6 text-center">
                <Link to={NavigationPath.Appointments}>
                    <Button variant="primary">Ver Todos Agendamentos</Button>
                </Link>
            </div>
          </Card>
        </section>
        
        <section>
          <Card titleClassName="flex items-center" title={<><BellIcon className="w-5 h-5 mr-2 text-teal-400" /> Notificações</>}>
             {notifications.length > 0 ? (
              <ul className="space-y-3">
                {notifications.map((note, index) => (
                  <li key={index} className="text-sm text-gray-300 pb-2 border-b border-gray-700 last:border-b-0">
                    {note}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Nenhuma notificação nova.</p>
            )}
          </Card>
        </section>
      </div>
      <AppointmentModal 
        isOpen={isAppointmentModalOpen} 
        onClose={() => setIsAppointmentModalOpen(false)}
        onAppointmentSaved={handleAppointmentSaved}
      />
    </div>
  );
};
