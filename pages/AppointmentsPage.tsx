import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Added import
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/icons/HeroIcons'; // Added PencilIcon, TrashIcon
import { Appointment } from '../types';
import { getAppointments, deleteAppointment } from '../services/supabaseService'; // Added deleteAppointment
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { AppointmentModal } from '../components/AppointmentModal';
import { Select } from '../components/ui/Select';
import { useToast } from '../contexts/ToastContext'; // Import useToast

const statusColorMap: Record<Appointment['status'], string> = {
    Scheduled: 'bg-blue-500',
    Confirmed: 'bg-green-500',
    Completed: 'bg-gray-500',
    Cancelled: 'bg-red-500',
};
const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
};


export const AppointmentsPage: React.FC = () => {
  const { showToast } = useToast(); // Initialize useToast
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: supabaseError } = await getAppointments();
    if (supabaseError) {
      const errorMessage = supabaseError.message || "Erro desconhecido ao buscar agendamentos.";
      console.error("Error fetching appointments:", errorMessage, 'Details:', JSON.stringify(supabaseError, null, 2));
      setError(`Falha ao carregar agendamentos: ${errorMessage}`);
      setAppointments([]);
    } else {
      setAppointments(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleOpenModal = (appointment?: Appointment) => {
    setEditingAppointment(appointment || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleAppointmentSaved = (savedAppointment: Appointment) => {
    fetchAppointments(); 
    handleCloseModal();
    // Toast for saved appointment is handled within AppointmentModal
  };
  
  const handleDeleteAppointment = async (appointmentId: string, appointmentDetails: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o agendamento: ${appointmentDetails}?`)) {
      setIsLoading(true); 
      const { error: deleteError } = await deleteAppointment(appointmentId);
      if (deleteError) {
        showToast(`Erro ao excluir agendamento: ${deleteError.message}`, 'error');
        console.error("Delete appointment error:", deleteError);
      } else {
        showToast("Agendamento excluído com sucesso!", 'success');
        fetchAppointments(); 
      }
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return <div className="text-center py-10 text-gray-400">Carregando agendamentos...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Todos os Agendamentos</h1>
        <Button 
          onClick={() => handleOpenModal()} 
          leftIcon={<PlusIcon className="w-5 h-5" />}
        >
          Novo Agendamento
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-8">Nenhum agendamento encontrado.</p>
        </Card>
      ) : (
        <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hora</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Procedimento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {appointments.map(appt => (
                <tr key={appt.id} className="hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{isoToDdMmYyyy(appt.appointment_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{appt.appointment_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    <Link to={`/patient/${appt.patient_cpf}`} className="hover:text-teal-400 transition-colors">
                        {appt.patient_name || appt.patient_cpf}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{appt.procedure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[appt.status]} text-white`}>
                      {statusLabelMap[appt.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => handleOpenModal(appt)} 
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Editar Agendamento"
                            disabled={isLoading}
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleDeleteAppointment(appt.id, `${appt.procedure} - ${appt.patient_name || appt.patient_cpf} em ${isoToDdMmYyyy(appt.appointment_date)}`)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Excluir Agendamento"
                            disabled={isLoading}
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onAppointmentSaved={handleAppointmentSaved}
        existingAppointment={editingAppointment}
      />
    </div>
  );
};
