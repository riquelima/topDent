import React, { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { UserPlusIcon, PencilIcon, TrashIcon, LockClosedIcon, UserIcon as FormUserIcon, CheckIcon, BellIcon, BriefcaseIcon, CheckCircleIcon, XCircleIcon, ChevronUpDownIcon } from '../components/icons/HeroIcons';
import { Dentist, Reminder, Procedure } from '../types';
import { 
    getDentists, addDentist, updateDentist, deleteDentist,
    getReminders, addReminder, updateReminderIsActive, deleteReminderById,
    getProcedures, addProcedure, updateProcedure, deleteProcedure
} from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { Modal } from '../components/ui/Modal';

interface DentistFormState {
  id?: string;
  full_name: string;
  username: string;
  password?: string;
}

interface ReminderFormState {
  title: string;
  content: string;
}

interface ProcedureFormState {
  id?: string;
  name: string;
}

export const ConfigurationsPage = (): JSX.Element => {
  const { showToast } = useToast();
  // State for toggling sections
  const [openSection, setOpenSection] = useState<string | null>('dentists');

  // Dentist States
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoadingDentists, setIsLoadingDentists] = useState(true);
  const [isSubmittingDentist, setIsSubmittingDentist] = useState(false);
  const [dentistError, setDentistError] = useState<string | null>(null);
  const [isDentistModalOpen, setIsDentistModalOpen] = useState(false);
  const [editingDentist, setEditingDentist] = useState<Dentist | null>(null);
  const [dentistFormData, setDentistFormData] = useState<DentistFormState>({ full_name: '', username: '', password: '' });
  const [isConfirmDeleteDentistModalOpen, setIsConfirmDeleteDentistModalOpen] = useState(false);
  const [dentistToDelete, setDentistToDelete] = useState<Dentist | null>(null);

  // Reminder States
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderFormData, setReminderFormData] = useState<ReminderFormState>({ title: '', content: '' });
  const [isConfirmDeleteReminderModalOpen, setIsConfirmDeleteReminderModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null);

  // Procedure States
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(true);
  const [isSubmittingProcedure, setIsSubmittingProcedure] = useState(false);
  const [procedureError, setProcedureError] = useState<string | null>(null);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [procedureFormData, setProcedureFormData] = useState<ProcedureFormState>({ name: '' });
  const [isConfirmDeleteProcedureModalOpen, setIsConfirmDeleteProcedureModalOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section));
  };


  const fetchDentists = useCallback(async () => {
    setIsLoadingDentists(true);
    setDentistError(null);
    const { data, error: fetchError } = await getDentists();
    if (fetchError) {
      setDentistError('Erro ao carregar dentistas.');
      showToast('Erro ao carregar dentistas.', 'error');
      console.error("Fetch dentists error:", fetchError);
    } else {
      setDentists(data || []);
    }
    setIsLoadingDentists(false);
  }, [showToast]);

  const fetchReminders = useCallback(async () => {
    setIsLoadingReminders(true);
    setReminderError(null);
    const { data, error: fetchError } = await getReminders();
    if (fetchError) {
      setReminderError('Erro ao carregar lembretes.');
      showToast('Erro ao carregar lembretes.', 'error');
      console.error("Fetch reminders error:", fetchError);
    } else {
      setReminders(data || []);
    }
    setIsLoadingReminders(false);
  }, [showToast]);

  const fetchProcedures = useCallback(async () => {
    setIsLoadingProcedures(true);
    setProcedureError(null);
    const { data, error: fetchError } = await getProcedures(true); // Fetch all (active and inactive)
    if (fetchError) {
      setProcedureError('Erro ao carregar procedimentos.');
      showToast('Erro ao carregar procedimentos.', 'error');
      console.error("Fetch procedures error:", fetchError);
    } else {
      setProcedures(data || []);
    }
    setIsLoadingProcedures(false);
  }, [showToast]);

  useEffect(() => {
    fetchDentists();
    fetchReminders();
    fetchProcedures();
  }, [fetchDentists, fetchReminders, fetchProcedures]);

  // Dentist Modal Handlers
  const handleOpenDentistModal = (dentist?: Dentist) => {
    setEditingDentist(dentist || null);
    setDentistFormData(dentist ? 
      { id: dentist.id, full_name: dentist.full_name, username: dentist.username, password: '' } : 
      { full_name: '', username: '', password: '' }
    );
    setIsDentistModalOpen(true);
  };
  const handleCloseDentistModal = () => {
    setIsDentistModalOpen(false);
    setEditingDentist(null);
    setDentistFormData({ full_name: '', username: '', password: '' });
  };
  const handleDentistFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDentistFormData({ ...dentistFormData, [e.target.name]: e.target.value });
  };
  const handleDentistFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dentistFormData.full_name || !dentistFormData.username || (!editingDentist && !dentistFormData.password)) {
      showToast('Nome completo, usuário e senha (para novos) são obrigatórios.', 'error');
      return;
    }
    setIsSubmittingDentist(true);
    try {
      if (editingDentist && editingDentist.id) {
        const updatePayload: Partial<Omit<Dentist, 'id' | 'created_at' | 'updated_at'>> = {
          full_name: dentistFormData.full_name,
          username: dentistFormData.username,
        };
        if (dentistFormData.password) { 
          updatePayload.password = dentistFormData.password;
        }
        const { error: updateError } = await updateDentist(editingDentist.id, updatePayload);
        if (updateError) throw updateError;
        showToast('Dentista atualizado com sucesso!', 'success');
      } else {
        const addPayload: Omit<Dentist, 'id' | 'created_at' | 'updated_at'> = {
          full_name: dentistFormData.full_name,
          username: dentistFormData.username,
          password: dentistFormData.password!,
        };
        const { error: addError } = await addDentist(addPayload);
        if (addError) throw addError;
        showToast('Dentista cadastrado com sucesso!', 'success');
      }
      fetchDentists();
      handleCloseDentistModal();
    } catch (err: any) {
      let message = 'Erro ao salvar dentista.';
      if (err.message?.includes('unique constraint')) {
        message = 'Erro: Nome de usuário já existe.';
      } else if (err.message && !err.message.includes('upload')) {
        message += ` ${err.message}`;
      }
      showToast(message, 'error');
      console.error("Submit dentist error:", err);
    } finally {
      setIsSubmittingDentist(false);
    }
  };
  const requestDeleteDentist = (dentist: Dentist) => {
    setDentistToDelete(dentist);
    setIsConfirmDeleteDentistModalOpen(true);
  };
  const executeDeleteDentist = async () => {
    if (!dentistToDelete || !dentistToDelete.id) return;
    setIsSubmittingDentist(true); 
    const { error: deleteError } = await deleteDentist(dentistToDelete.id);
    if (deleteError) {
      showToast('Erro ao excluir dentista.', 'error');
      console.error("Delete dentist error:", deleteError);
    } else {
      showToast('Dentista excluído com sucesso.', 'success');
      fetchDentists();
    }
    setIsConfirmDeleteDentistModalOpen(false);
    setDentistToDelete(null);
    setIsSubmittingDentist(false);
  };

  // Reminder Form Handlers
  const handleReminderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReminderFormData({ ...reminderFormData, [e.target.name]: e.target.value });
  };

  const handleReminderFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reminderFormData.title.trim() || !reminderFormData.content.trim()) {
      showToast('Título e conteúdo do lembrete são obrigatórios.', 'error');
      return;
    }
    setIsSubmittingReminder(true);
    try {
      const { error: addError } = await addReminder({
        title: reminderFormData.title,
        content: reminderFormData.content,
      });
      if (addError) throw addError;
      showToast('Lembrete adicionado com sucesso!', 'success');
      setReminderFormData({ title: '', content: '' }); // Clear form
      fetchReminders(); // Refresh list
    } catch (err: any) {
      showToast('Erro ao adicionar lembrete: ' + err.message, 'error');
      console.error("Submit reminder error:", err);
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  const handleToggleReminderActive = async (reminder: Reminder) => {
    setIsSubmittingReminder(true); 
    try {
      const { error } = await updateReminderIsActive(reminder.id, !reminder.is_active);
      if (error) throw error;
      showToast(reminder.is_active ? 'Lembrete arquivado.' : 'Lembrete reativado.', 'success');
      fetchReminders();
    } catch (err: any) {
      showToast('Erro ao atualizar status do lembrete: ' + err.message, 'error');
    } finally {
      setIsSubmittingReminder(false);
    }
  };
  
  const requestDeleteReminder = (reminder: Reminder) => {
    setReminderToDelete(reminder);
    setIsConfirmDeleteReminderModalOpen(true);
  };

  const executeDeleteReminder = async () => {
    if (!reminderToDelete) return;
    setIsSubmittingReminder(true);
    try {
      const { error } = await deleteReminderById(reminderToDelete.id);
      if (error) throw error;
      showToast('Lembrete excluído com sucesso.', 'success');
      fetchReminders();
    } catch (err: any) {
      showToast('Erro ao excluir lembrete: ' + err.message, 'error');
    } finally {
      setIsConfirmDeleteReminderModalOpen(false);
      setReminderToDelete(null);
      setIsSubmittingReminder(false);
    }
  };

  // Procedure Handlers
  const handleOpenProcedureModal = (procedure?: Procedure) => {
    setEditingProcedure(procedure || null);
    setProcedureFormData(procedure ? { id: procedure.id, name: procedure.name } : { name: '' });
    setIsProcedureModalOpen(true);
  };
  const handleCloseProcedureModal = () => {
    setIsProcedureModalOpen(false);
    setEditingProcedure(null);
    setProcedureFormData({ name: '' });
  };
  const handleProcedureFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcedureFormData({ ...procedureFormData, [e.target.name]: e.target.value });
  };
  const handleProcedureFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!procedureFormData.name.trim()) {
      showToast('Nome do procedimento é obrigatório.', 'error');
      return;
    }
    setIsSubmittingProcedure(true);
    try {
      if (editingProcedure && editingProcedure.id) {
        const { error: updateError } = await updateProcedure(editingProcedure.id, { name: procedureFormData.name });
        if (updateError) throw updateError;
        showToast('Procedimento atualizado com sucesso!', 'success');
      } else {
        const { error: addError } = await addProcedure({ name: procedureFormData.name });
        if (addError) throw addError;
        showToast('Procedimento adicionado com sucesso!', 'success');
      }
      fetchProcedures();
      handleCloseProcedureModal();
    } catch (err: any) {
      showToast('Erro ao salvar procedimento: ' + err.message, 'error');
      console.error("Submit procedure error:", err);
    } finally {
      setIsSubmittingProcedure(false);
    }
  };
  const handleToggleProcedureActive = async (procedure: Procedure) => {
    setIsSubmittingProcedure(true);
    try {
      const { error } = await updateProcedure(procedure.id, { is_active: !procedure.is_active });
      if (error) throw error;
      showToast(procedure.is_active ? 'Procedimento desativado.' : 'Procedimento ativado.', 'success');
      fetchProcedures();
    } catch (err: any) {
      showToast('Erro ao atualizar status do procedimento: ' + err.message, 'error');
    } finally {
      setIsSubmittingProcedure(false);
    }
  };
  const requestDeleteProcedure = (procedure: Procedure) => {
    setProcedureToDelete(procedure);
    setIsConfirmDeleteProcedureModalOpen(true);
  };
  const executeDeleteProcedure = async () => {
    if (!procedureToDelete || !procedureToDelete.id) return;
    setIsSubmittingProcedure(true);
    const { error: deleteError } = await deleteProcedure(procedureToDelete.id);
    if (deleteError) {
      showToast('Erro ao excluir procedimento.', 'error');
    } else {
      showToast('Procedimento excluído com sucesso.', 'success');
      fetchProcedures();
    }
    setIsConfirmDeleteProcedureModalOpen(false);
    setProcedureToDelete(null);
    setIsSubmittingProcedure(false);
  };

  if (isLoadingDentists && isLoadingReminders && isLoadingProcedures) {
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando configurações...</div>;
  }

  const sectionContentClasses = (sectionName: string) => 
    `transition-all duration-500 ease-in-out overflow-hidden ${openSection === sectionName ? 'max-h-[3000px] p-6 border-t border-gray-700/50' : 'max-h-0'}`;


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
      </div>

      {/* Gerenciar Dentistas Card */}
      <Card
        className="bg-[#1a1a1a]"
        title={
          <button 
            onClick={() => toggleSection('dentists')} 
            className="w-full text-left flex justify-between items-center p-4 text-xl font-semibold text-white hover:bg-white/5 transition-colors"
            aria-expanded={openSection === 'dentists'}
            aria-controls="dentists-section"
          >
            <span className='flex items-center'><FormUserIcon className="w-6 h-6 mr-3 text-[#00bcd4]" /> Gerenciar Dentistas</span>
            <ChevronUpDownIcon className={`w-6 h-6 transform transition-transform ${openSection === 'dentists' ? 'rotate-180' : ''}`} />
          </button>
        }
        titleClassName="p-0 border-b-0"
        bodyClassName="p-0"
      >
        <div id="dentists-section" className={sectionContentClasses('dentists')}>
            <div className="mb-6 text-right">
              <Button onClick={() => handleOpenDentistModal()} leftIcon={<UserPlusIcon />}>
                Cadastrar Novo Dentista
              </Button>
            </div>
            {dentistError && <p className="text-red-500 text-center mb-4">{dentistError}</p>}
            {isLoadingDentists && dentists.length === 0 ? (
              <p className="text-center text-[#b0b0b0] py-4">Carregando dentistas...</p>
            ) : dentists.length === 0 && !dentistError ? (
              <p className="text-center text-[#b0b0b0] py-8">Nenhum dentista cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-[#1f1f1f]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Nome Completo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Usuário</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
                    {dentists.map(dentist => (
                      <tr key={dentist.id} className="hover:bg-[#1f1f1f] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {dentist.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b0b0b0]">{dentist.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDentistModal(dentist)} className="p-1.5" title="Editar Dentista" disabled={isSubmittingDentist}>
                              <PencilIcon className="w-4 h-4 text-[#00bcd4]" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => requestDeleteDentist(dentist)} className="p-1.5" title="Excluir Dentista" disabled={isSubmittingDentist}>
                              <TrashIcon className="w-4 h-4 text-[#f44336]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </Card>

      {/* Gerenciar Procedimentos Definidos Card */}
      <Card
        className="bg-[#1a1a1a]"
        title={
          <button 
            onClick={() => toggleSection('procedures')} 
            className="w-full text-left flex justify-between items-center p-4 text-xl font-semibold text-white hover:bg-white/5 transition-colors"
            aria-expanded={openSection === 'procedures'}
            aria-controls="procedures-section"
          >
            <span className='flex items-center'><BriefcaseIcon className="w-6 h-6 mr-3 text-[#00bcd4]" /> Gerenciar Nomes de Procedimentos</span>
            <ChevronUpDownIcon className={`w-6 h-6 transform transition-transform ${openSection === 'procedures' ? 'rotate-180' : ''}`} />
          </button>
        }
        titleClassName="p-0 border-b-0"
        bodyClassName="p-0"
      >
        <div id="procedures-section" className={sectionContentClasses('procedures')}>
          <div className="mb-6 text-right">
            <Button onClick={() => handleOpenProcedureModal()} leftIcon={<UserPlusIcon />}>
              Adicionar Novo Procedimento
            </Button>
          </div>
          {procedureError && <p className="text-red-500 text-center mb-4">{procedureError}</p>}
          {isLoadingProcedures && procedures.length === 0 ? (
            <p className="text-center text-[#b0b0b0] py-4">Carregando procedimentos...</p>
          ) : procedures.length === 0 && !procedureError ? (
            <p className="text-center text-[#b0b0b0] py-8">Nenhum procedimento customizado cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#1f1f1f]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Nome do Procedimento</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
                  {procedures.map(proc => (
                    <tr key={proc.id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{proc.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleToggleProcedureActive(proc)}
                          className={`p-1.5 rounded-full ${proc.is_active ? 'bg-green-500/20 hover:bg-green-500/40' : 'bg-red-500/20 hover:bg-red-500/40'} transition-colors`}
                          title={proc.is_active ? "Desativar" : "Ativar"}
                          disabled={isSubmittingProcedure}
                        >
                          {proc.is_active ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <XCircleIcon className="w-5 h-5 text-red-400" />}
                        </button>
                        <span className={`ml-2 text-xs ${proc.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {proc.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenProcedureModal(proc)} className="p-1.5" title="Editar Procedimento" disabled={isSubmittingProcedure}>
                            <PencilIcon className="w-4 h-4 text-[#00bcd4]" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => requestDeleteProcedure(proc)} className="p-1.5" title="Excluir Procedimento" disabled={isSubmittingProcedure}>
                            <TrashIcon className="w-4 h-4 text-[#f44336]" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>


      {/* Gerenciar Lembretes Card */}
      <Card
        className="bg-[#1a1a1a]"
        title={
          <button 
            onClick={() => toggleSection('reminders')} 
            className="w-full text-left flex justify-between items-center p-4 text-xl font-semibold text-white hover:bg-white/5 transition-colors"
            aria-expanded={openSection === 'reminders'}
            aria-controls="reminders-section"
          >
            <span className='flex items-center'><BellIcon className="w-6 h-6 mr-3 text-[#00bcd4]" /> Gerenciar Lembretes (Notas Globais)</span>
            <ChevronUpDownIcon className={`w-6 h-6 transform transition-transform ${openSection === 'reminders' ? 'rotate-180' : ''}`} />
          </button>
        }
        titleClassName="p-0 border-b-0"
        bodyClassName="p-0"
      >
        <div id="reminders-section" className={sectionContentClasses('reminders')}>
          <form onSubmit={handleReminderFormSubmit} className="space-y-4 mb-8 p-4 border border-gray-700 rounded-lg bg-[#1f1f1f]">
            <h3 className="text-lg font-semibold text-[#00bcd4]">Adicionar Novo Lembrete</h3>
            <Input
              label="Título do Lembrete"
              name="title"
              value={reminderFormData.title}
              onChange={handleReminderFormChange}
              placeholder="Ex: Reunião de equipe"
              required
              disabled={isSubmittingReminder}
            />
            <Textarea
              label="Conteúdo do Lembrete"
              name="content"
              value={reminderFormData.content}
              onChange={handleReminderFormChange}
              placeholder="Detalhes do lembrete..."
              required
              rows={3}
              disabled={isSubmittingReminder}
            />
            <div className="text-right">
              <Button type="submit" variant="primary" disabled={isSubmittingReminder}>
                {isSubmittingReminder ? 'Salvando...' : 'Salvar Lembrete'}
              </Button>
            </div>
          </form>

          <h3 className="text-lg font-semibold text-[#00bcd4] mb-4">Lembretes Cadastrados</h3>
          {reminderError && <p className="text-red-500 text-center mb-4">{reminderError}</p>}
          {isLoadingReminders && reminders.length === 0 ? (
            <p className="text-center text-[#b0b0b0] py-4">Carregando lembretes...</p>
          ) : reminders.length === 0 && !reminderError ? (
            <p className="text-center text-[#b0b0b0] py-8">Nenhum lembrete cadastrado.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {reminders.map(reminder => (
                <div key={reminder.id} className={`p-4 rounded-lg border ${reminder.is_active ? 'border-gray-600 bg-[#1f1f1f]' : 'border-gray-700 bg-gray-800 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-semibold ${reminder.is_active ? 'text-white' : 'text-gray-400'}`}>{reminder.title}</h4>
                      <p className={`text-sm mt-1 whitespace-pre-wrap ${reminder.is_active ? 'text-gray-300' : 'text-gray-500'}`}>{reminder.content}</p>
                      <p className="text-xs text-gray-500 mt-2">Criado em: {isoToDdMmYyyy(reminder.created_at.split("T")[0])}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleReminderActive(reminder)}
                        title={reminder.is_active ? "Arquivar Lembrete" : "Reativar Lembrete"}
                        disabled={isSubmittingReminder}
                        className="p-1.5"
                      >
                        {reminder.is_active ? <CheckIcon className="w-5 h-5 text-green-400" /> : <BellIcon className="w-5 h-5 text-yellow-400" />}
                        <span className="ml-1 text-xs hidden sm:inline">{reminder.is_active ? "Arquivar" : "Reativar"}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => requestDeleteReminder(reminder)}
                        title="Excluir Lembrete"
                        disabled={isSubmittingReminder}
                        className="p-1.5"
                      >
                        <TrashIcon className="w-5 h-5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* Modals are kept outside the collapsible sections */}
      {isDentistModalOpen && (
        <Modal
          isOpen={isDentistModalOpen}
          onClose={handleCloseDentistModal}
          title={editingDentist ? 'Editar Dentista' : 'Cadastrar Novo Dentista'}
        >
            <form onSubmit={handleDentistFormSubmit} className="space-y-6">
              <Input
                label="Nome Completo"
                name="full_name"
                value={dentistFormData.full_name}
                onChange={handleDentistFormChange}
                required
                disabled={isSubmittingDentist}
                prefixIcon={<FormUserIcon className="w-5 h-5 text-gray-400"/>}
              />
              <Input
                label="Usuário (para login)"
                name="username"
                value={dentistFormData.username}
                onChange={handleDentistFormChange}
                required
                disabled={isSubmittingDentist}
                prefixIcon={<FormUserIcon className="w-5 h-5 text-gray-400"/>}
              />
              <Input
                label={editingDentist ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'}
                name="password"
                type="password"
                value={dentistFormData.password || ''}
                onChange={handleDentistFormChange}
                required={!editingDentist}
                disabled={isSubmittingDentist}
                autoComplete="new-password"
                prefixIcon={<LockClosedIcon className="w-5 h-5 text-gray-400"/>}
              />
               <p className="text-xs text-gray-500">
                {editingDentist 
                    ? "A senha só será alterada se este campo for preenchido."
                    : "Crie uma senha segura para o novo dentista."
                }
              </p>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={handleCloseDentistModal} disabled={isSubmittingDentist}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmittingDentist}>
                  {isSubmittingDentist ? 'Salvando...' : (editingDentist ? 'Atualizar Dentista' : 'Salvar Dentista')}
                </Button>
              </div>
            </form>
          </Modal>
      )}
      {dentistToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteDentistModalOpen}
          onClose={() => setIsConfirmDeleteDentistModalOpen(false)}
          onConfirm={executeDeleteDentist}
          title="Confirmar Exclusão de Dentista"
          message={`Tem certeza que deseja excluir o dentista ${dentistToDelete.full_name} (usuário: ${dentistToDelete.username})? Esta ação é irreversível.`}
          confirmButtonText="Excluir Dentista"
          isLoading={isSubmittingDentist}
        />
      )}
      {reminderToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteReminderModalOpen}
          onClose={() => setIsConfirmDeleteReminderModalOpen(false)}
          onConfirm={executeDeleteReminder}
          title="Confirmar Exclusão de Lembrete"
          message={`Tem certeza que deseja excluir o lembrete "${reminderToDelete.title}"? Esta ação é irreversível.`}
          confirmButtonText="Excluir Lembrete"
          isLoading={isSubmittingReminder}
        />
      )}
      {isProcedureModalOpen && (
        <Modal
            isOpen={isProcedureModalOpen}
            onClose={handleCloseProcedureModal}
            title={editingProcedure ? 'Editar Procedimento' : 'Adicionar Novo Procedimento'}
        >
            <form onSubmit={handleProcedureFormSubmit} className="space-y-4">
                <Input
                    label="Nome do Procedimento"
                    name="name"
                    value={procedureFormData.name}
                    onChange={handleProcedureFormChange}
                    required
                    disabled={isSubmittingProcedure}
                    prefixIcon={<BriefcaseIcon className="w-5 h-5 text-gray-400" />}
                />
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="ghost" onClick={handleCloseProcedureModal} disabled={isSubmittingProcedure}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmittingProcedure}>
                        {isSubmittingProcedure ? 'Salvando...' : (editingProcedure ? 'Atualizar Procedimento' : 'Salvar Procedimento')}
                    </Button>
                </div>
            </form>
        </Modal>
      )}
      {procedureToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteProcedureModalOpen}
            onClose={() => setIsConfirmDeleteProcedureModalOpen(false)}
            onConfirm={executeDeleteProcedure}
            title="Confirmar Exclusão de Procedimento"
            message={`Tem certeza que deseja excluir o procedimento "${procedureToDelete.name}"? Esta ação é irreversível.`}
            confirmButtonText="Excluir Procedimento"
            isLoading={isSubmittingProcedure}
        />
      )}
    </div>
  );
};