import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserPlusIcon, CalendarDaysIcon, ClipboardDocumentListIcon, DocumentPlusIcon, ArrowRightOnRectangleIcon, BellIcon } from '../components/icons/HeroIcons';
import type { IconProps as HeroIconProps } from '../components/icons/HeroIcons'; // Import IconProps
import { NavigationPath, Appointment } from '../types';

interface QuickAccessCardProps {
  title: string;
  icon: React.ReactElement<HeroIconProps>; // Use imported IconProps
  to: NavigationPath | '#';
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

  if (to === '#') {
    return (
      <Card className="text-center" hoverEffect onClick={onClick}>
        {content}
      </Card>
    );
  }

  return (
    <Link to={to}>
      <Card className="text-center" hoverEffect>
        {content}
      </Card>
    </Link>
  );
};

const todayAppointments: Appointment[] = [
  { id: '1', time: '09:00', patientName: 'Carlos Silva', procedure: 'Limpeza' },
  { id: '2', time: '10:30', patientName: 'Mariana Costa', procedure: 'Consulta de Rotina' },
  { id: '3', time: '14:00', patientName: 'João Pereira', procedure: 'Extração' },
];

const notifications = [
  "Consulta de Ana Beatriz às 16:00 (confirmada)",
  "Lembrete: Encomendar material de resina",
  "Paciente Pedro Alves ligou para reagendar",
];

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white text-center mb-10">Bem-vindo à Top Dent</h1>
      
      <section>
        <h2 className="text-2xl font-semibold text-gray-300 mb-6">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <QuickAccessCard title="Novo Paciente" icon={<UserPlusIcon />} to={NavigationPath.NewPatient} />
          <QuickAccessCard title="Agendar Consulta" icon={<CalendarDaysIcon />} to={NavigationPath.Appointments} /> {/* Placeholder link */}
          <QuickAccessCard title="Ver Prontuário" icon={<ClipboardDocumentListIcon />} to={NavigationPath.ViewRecord} /> {/* Placeholder link */}
          <QuickAccessCard title="Adicionar Plano" icon={<DocumentPlusIcon />} to={NavigationPath.TreatmentPlan} />
          <QuickAccessCard title="Sair" icon={<ArrowRightOnRectangleIcon />} to="#" onClick={() => alert('Sair Clicado!')} color="danger" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <Card title="Agendamentos do Dia">
            {todayAppointments.length > 0 ? (
              <ul className="space-y-4">
                {todayAppointments.map(appt => (
                  <li key={appt.id} className="p-4 bg-gray-700 rounded-md shadow flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-teal-400">{appt.time} - {appt.patientName}</p>
                      <p className="text-sm text-gray-300">{appt.procedure}</p>
                    </div>
                    <Button size="sm" variant="ghost">Detalhes</Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Nenhum agendamento para hoje.</p>
            )}
            <div className="mt-6 text-center">
                <Link to={NavigationPath.Appointments}>
                    <Button variant="primary">Ver Calendário Completo</Button>
                </Link>
            </div>
          </Card>
        </section>
        
        <section>
          {/* Original structure had Card wrapped around BellIcon + Text, then another Card.
              Consolidating for simpler structure and correct title usage.
          */}
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
    </div>
  );
};
