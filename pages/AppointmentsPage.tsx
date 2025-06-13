
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select'; 
import { PlusIcon, PencilIcon, TrashIcon } from '../components/icons/HeroIcons'; 
import { Appointment, DentistUser, NavigationPath } from '../types'; 
import { getAppointments, deleteAppointment } from '../services/supabaseService'; 
import { isoToDdMmYyyy, formatToHHMM } from '../src/utils/formatDate';
// import { AppointmentModal } from '../components/AppointmentModal'; // Removed
import { ConfirmationModal } from '../components/ui/ConfirmationModal'; 
import { useToast } from '../contexts/ToastContext'; 
import { getKnownDentists } from '../src/utils/users'; 

const statusColorMap: Record<Appointment['status'], string> = {
    Scheduled: 'bg-blue-600', 
    Confirmed: 'bg-[#00bcd4]', 
    Completed: 'bg-gray-600', 
    Cancelled: 'bg-[#f44336]', 
};
const statusTextClassMap: Record<Appointment['status'], string> = {
    Scheduled: 'text-white',
    Confirmed: 'text-black', 
    Completed: 'text-gray-100',
    Cancelled: 'text-white',
};
const statusLabelMap: Record<Appointment['status'], string> = {
    Scheduled: 'Agendado',
    Confirmed: 'Confirmado',
    Completed: 'Concluído',
    Cancelled: 'Cancelado',
};

interface AppointmentToDelete {
  id: string;
  details: string;
}

type ActiveSortFilter = 'all' | 'upcoming';

export const AppointmentsPage: React.FC = () => {
  const { showToast } = useToast(); 
  const navigate = useNavigate(); // Added useNavigate
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [filteredAndSortedAppointments, setFilteredAndSortedAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [isModalOpen, setIsModalOpen] = useState(false); // Modal state removed
  // const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null); // Modal state removed

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentToDelete | null>(null);

  const [dentists, setDentists] = useState<DentistUser[]>([]);
  const [isLoadingDentists, setIsLoadingDentists] = useState(true);
  const [selectedDentistId, setSelectedDentistId] = useState<string>(''); 
  const [activeSortFilter, setActiveSortFilter] = useState<ActiveSortFilter>('upcoming'); 

  const fetchAppointmentsAndDentists = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingDentists(true);
    setError(null);
    try {
      const appointmentsResPromise = getAppointments();
      const knownDentistsPromise = getKnownDentists();

      const [appointmentsRes, knownDentists] = await Promise.all([appointmentsResPromise, knownDentistsPromise]);
      
      if (appointmentsRes.error) {
        const errorMessage = appointmentsRes.error.message || "Erro desconhecido ao buscar agendamentos.";
        console.error("Error fetching appointments:", errorMessage, 'Details:', JSON.stringify(appointmentsRes.error, null, 2));
        setError(`Falha ao carregar agendamentos: ${errorMessage}`);
        setAllAppointments([]);
      } else {
        setAllAppointments(appointmentsRes.data || []);
      }

      setDentists(knownDentists);

    } catch (e: any) {
      console.error("Critical error fetching data:", e);
      setError(`Erro crítico: ${e.message}`);
      setAllAppointments([]);
      setDentists([]);
    } finally {
      setIsLoading(false);
      setIsLoadingDentists(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointmentsAndDentists();
  }, [fetchAppointmentsAndDentists]);

  useEffect(() => {
    let processedAppointments = [...allAppointments];

    if (selectedDentistId) {
      processedAppointments = processedAppointments.filter(appt => appt.dentist_id === selectedDentistId);
    }

    const today = new Date().toISOString().split('T')[0];
    switch (activeSortFilter) {
      case 'upcoming':
        processedAppointments = processedAppointments.filter(appt => appt.appointment_date >= today);
        processedAppointments.sort((a, b) => {
          if (a.appointment_date < b.appointment_date) return -1;
          if (a.appointment_date > b.appointment_date) return 1;
          if (a.appointment_time < b.appointment_time) return -1;
          if (a.appointment_time > b.appointment_time) return 1;
          return 0;
        });
        break;
      case 'all':
      default:
        const upcomingOrToday = processedAppointments.filter(appt => appt.appointment_date >= today);
        const past = processedAppointments.filter(appt => appt.appointment_date < today);

        upcomingOrToday.sort((a, b) => {
          if (a.appointment_date < b.appointment_date) return -1;
          if (a.appointment_date > b.appointment_date) return 1;
          if (a.appointment_time < b.appointment_time) return -1;
          if (a.appointment_time > b.appointment_time) return 1;
          return 0;
        });
        past.sort((a, b) => { 
            if (a.appointment_date > b.appointment_date) return -1;
            if (a.appointment_date < b.appointment_date) return 1;
            if (a.appointment_time > b.appointment_time) return -1;
            if (a.appointment_time < b.appointment_time) return 1;
            return 0;
        });
        processedAppointments = [...upcomingOrToday, ...past];
        break;
    }
    setFilteredAndSortedAppointments(processedAppointments);
  }, [allAppointments, selectedDentistId, activeSortFilter]);

  const handleOpenNewAppointmentPage = () => {
    navigate(NavigationPath.NewAppointment);
  };

  const handleOpenEditAppointmentPage = (appointment: Appointment) => {
    navigate(NavigationPath.EditAppointment.replace(':appointmentId', appointment.id));
  };

  // handleAppointmentSaved is no longer needed here as modal is replaced by a page
  // const handleAppointmentSaved = (savedAppointment: Appointment) => {
  //   fetchAppointmentsAndDentists(); 
  //   // handleCloseModal(); // Modal state removed
  // };
  
  const requestDeleteAppointment = (id: string, details: string) => {
    setAppointmentToDelete({ id, details });
    setIsConfirmDeleteModalOpen(true);
  };

  const closeConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setAppointmentToDelete(null);
  };

  const executeDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    setIsDeleting(true); 
    const { error: deleteError } = await deleteAppointment(appointmentToDelete.id);
    if (deleteError) {
      showToast(`Erro ao excluir agendamento: ${deleteError.message}`, 'error');
      console.error("Delete appointment error:", deleteError);
    } else {
      showToast("Agendamento excluído com sucesso!", 'success');
      fetchAppointmentsAndDentists(); 
    }
    setIsDeleting(false);
    closeConfirmDeleteModal();
  };

  const dentistOptions = [
    { value: '', label: 'Todos os Dentistas' },
    ...dentists.map(d => ({ value: d.id, label: d.full_name }))
  ];

  if (isLoading && allAppointments.length === 0) {
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando agendamentos...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Agendamentos</h1>
        <Button 
          onClick={handleOpenNewAppointmentPage} 
          leftIcon={<PlusIcon className="w-5 h-5" />}
          disabled={isLoading || isDeleting}
          variant="primary"
        >
          Novo Agendamento
        </Button>
      </div>

      <Card title="Filtros e Visualização" className="bg-[#1a1a1a]" titleClassName="text-white">
        <div className="flex flex-col md:flex-row md:items-end md:gap-4">
            <div className="flex-grow mb-4 md:mb-0">
                <Select
                    label="Filtrar por Dentista"
                    options={dentistOptions}
                    value={selectedDentistId}
                    onChange={(e) => setSelectedDentistId(e.target.value)}
                    disabled={isLoading || isLoadingDentists || isDeleting}
                    containerClassName="mb-0"
                />
            </div>
            <div className="flex space-x-2 md:ml-auto">
                <Button
                    variant={activeSortFilter === 'all' ? 'primary' : 'ghost'}
                    onClick={() => setActiveSortFilter('all')}
                    disabled={isLoading || isDeleting}
                    className="flex-1 md:flex-none"
                >
                    Todos
                </Button>
                <Button
                    variant={activeSortFilter === 'upcoming' ? 'primary' : 'ghost'}
                    onClick={() => setActiveSortFilter('upcoming')}
                    disabled={isLoading || isDeleting}
                    className="flex-1 md:flex-none"
                >
                    Próximos
                </Button>
            </div>
        </div>
      </Card>

      {filteredAndSortedAppointments.length === 0 ? (
        <Card className="bg-[#1a1a1a]">
          <p className="text-center text-[#b0b0b0] py-8">
            {allAppointments.length === 0 ? "Nenhum agendamento encontrado." : "Nenhum agendamento corresponde aos filtros selecionados."}
          </p>
        </Card>
      ) : (
        <div className="bg-[#1a1a1a] shadow-lg rounded-lg overflow-x-auto border border-gray-700/50">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#1f1f1f]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Hora</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Procedimento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Dentista</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
              {filteredAndSortedAppointments.map(appt => (
                <tr key={appt.id} className="hover:bg-[#1f1f1f] transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{isoToDdMmYyyy(appt.appointment_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{formatToHHMM(appt.appointment_time)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <Link to={NavigationPath.PatientDetail.replace(':patientId', appt.patient_cpf)} className="hover:text-[#00bcd4] transition-colors">
                        {appt.patient_name || appt.patient_cpf}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b0b0b0]">{appt.procedure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b0b0b0]">{appt.dentist_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[appt.status]} ${statusTextClassMap[appt.status]}`}>
                      {statusLabelMap[appt.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => handleOpenEditAppointmentPage(appt)} 
                            className="text-[#00bcd4] hover:text-[#00a5b8] p-1"
                            title="Editar Agendamento"
                            disabled={isLoading || isDeleting}
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => requestDeleteAppointment(appt.id, `${appt.procedure} - ${appt.patient_name || appt.patient_cpf} em ${isoToDdMmYyyy(appt.appointment_date)}`)}
                            className="text-[#f44336] hover:text-[#d32f2f] p-1"
                            title="Excluir Agendamento"
                            disabled={isLoading || isDeleting}
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
      {/* AppointmentModal removed from here */}
      {appointmentToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={closeConfirmDeleteModal}
          onConfirm={executeDeleteAppointment}
          title="Confirmar Exclusão de Agendamento"
          message={`Tem certeza que deseja excluir o agendamento: ${appointmentToDelete.details}? Esta ação é irreversível.`}
          confirmButtonText="Excluir Agendamento"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
