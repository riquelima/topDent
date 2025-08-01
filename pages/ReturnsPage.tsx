

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getUpcomingReturns, getConfigurationValue, updateConfigurationValue, clearAppointmentReturnDate, addAppointment } from '../services/supabaseService';
import { AppointmentReturnInfo, NavigationPath } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { Link } from 'react-router-dom';
import { Textarea } from '../components/ui/Textarea';
import { useToast } from '../contexts/ToastContext';
import { TrashIcon, ArrowPathIcon } from '../components/icons/HeroIcons';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

const WHATSAPP_TEMPLATE_KEY = 'whatsapp_return_message';
const DEFAULT_WHATSAPP_TEMPLATE = 'Olá, {patientName}! Seu retorno na Top Dent está agendado para o dia {returnDate}. Confirma sua presença?';

export const ReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<AppointmentReturnInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [originalMessageTemplate, setOriginalMessageTemplate] = useState('');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<AppointmentReturnInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [convertingReturnId, setConvertingReturnId] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getUpcomingReturns();
      if (fetchError) {
        throw new Error(fetchError.message || 'Erro desconhecido ao buscar retornos.');
      }
      setReturns(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Fetch returns error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    const { data, error } = await getConfigurationValue(WHATSAPP_TEMPLATE_KEY);
    if (error) {
        showToast('Erro ao carregar a mensagem de retorno.', 'error');
        console.error("Error fetching whatsapp template:", error);
        setMessageTemplate(DEFAULT_WHATSAPP_TEMPLATE);
        setOriginalMessageTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    } else {
        const currentTemplate = data || DEFAULT_WHATSAPP_TEMPLATE;
        setMessageTemplate(currentTemplate);
        setOriginalMessageTemplate(currentTemplate);
    }
    setIsLoadingSettings(false);
  }, [showToast]);

  useEffect(() => {
    fetchReturns();
    fetchSettings();
  }, [fetchReturns, fetchSettings]);

  const handleWhatsAppClick = (phone: string, name: string, returnDate: string) => {
    const cleanedPhone = phone.replace(/\D/g, '');
    const formattedReturnDate = isoToDdMmYyyy(returnDate);
    const messageText = messageTemplate
      .replace(/{patientName}/g, name)
      .replace(/{returnDate}/g, formattedReturnDate);
    const message = encodeURIComponent(messageText);
    const finalPhone = cleanedPhone.length > 11 ? cleanedPhone : `55${cleanedPhone}`;
    const url = `https://wa.me/${finalPhone}?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const { error } = await updateConfigurationValue(WHATSAPP_TEMPLATE_KEY, messageTemplate);
    if (error) {
        showToast('Erro ao salvar a mensagem.', 'error');
        console.error("Error saving whatsapp template:", error);
    } else {
        showToast('Mensagem salva com sucesso!', 'success');
        setOriginalMessageTemplate(messageTemplate);
        setIsEditingMessage(false);
    }
    setIsSavingSettings(false);
  };

  const handleCancelEdit = () => {
    setMessageTemplate(originalMessageTemplate);
    setIsEditingMessage(false);
  };
  
  const requestDeleteReturn = (ret: AppointmentReturnInfo) => {
    setReturnToDelete(ret);
    setIsConfirmDeleteModalOpen(true);
  };
  
  const closeConfirmDeleteModal = () => {
      setIsConfirmDeleteModalOpen(false);
      setReturnToDelete(null);
  };

  const executeDeleteReturn = async () => {
      if (!returnToDelete) return;
      setIsDeleting(true);
      const { error: deleteError } = await clearAppointmentReturnDate(returnToDelete.id);

      if (deleteError) {
          showToast('Erro ao excluir lembrete de retorno.', 'error');
          console.error("Delete return reminder error:", deleteError);
      } else {
          showToast('Lembrete de retorno excluído com sucesso!', 'success');
          fetchReturns(); // refetch data
      }
      setIsDeleting(false);
      closeConfirmDeleteModal();
  };

  const handleConvertSingleReturn = async (ret: AppointmentReturnInfo) => {
    setConvertingReturnId(ret.id);

    const newAppointmentPayload = {
        patient_cpf: ret.patient_cpf,
        patient_name: ret.patient_name,
        appointment_date: ret.return_date,
        appointment_time: '09:00', // Default time
        procedure: 'Retorno',
        notes: `Retorno referente ao agendamento ID: ${ret.id}`,
        status: 'Scheduled' as const,
        dentist_id: ret.dentist_id || null,
        dentist_name: ret.dentist_name || 'A definir',
        return_date: null,
    };

    const { error: insertError } = await addAppointment(newAppointmentPayload);

    if (insertError) {
        showToast(`Erro ao criar novo agendamento: ${insertError.message}`, 'error');
        setConvertingReturnId(null);
        return;
    }

    const { error: clearError } = await clearAppointmentReturnDate(ret.id);

    if (clearError) {
        showToast('Retorno convertido, mas falha ao limpar o lembrete original.', 'warning');
    } else {
        showToast('Retorno convertido em agendamento com sucesso!', 'success');
    }
    
    setConvertingReturnId(null);
    fetchReturns();
  };


  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center text-[var(--text-secondary)] py-8">Carregando retornos...</p>;
    }
    if (error) {
      return <p className="text-center text-red-500 py-8">{error}</p>;
    }
    if (returns.length === 0) {
      return <p className="text-center text-[var(--text-secondary)] py-8">Nenhum retorno futuro agendado.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-color)]">
          <thead className="bg-[var(--background-light)]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider align-middle">Data do Retorno</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider align-middle">Paciente</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider align-middle">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {returns.map((ret) => (
              <tr key={ret.id} className="hover:bg-[var(--background-light)] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold align-middle">{isoToDdMmYyyy(ret.return_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white align-middle">
                  <Link to={NavigationPath.PatientDetail.replace(':patientId', ret.patient_cpf || '')} className="hover:text-[var(--accent-cyan)] transition-colors">
                    {ret.patient_name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                    <div className="flex justify-center items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsAppClick(ret.patient_phone, ret.patient_name, ret.return_date)}
                            className="p-2 rounded-full hover:bg-green-500/20"
                            title="Enviar lembrete via WhatsApp"
                        >
                            <img src="https://raw.githubusercontent.com/riquelima/topDent/refs/heads/main/368d6855-50b1-41da-9d0b-c10e5d2b1e19.png" alt="WhatsApp Icon" className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestDeleteReturn(ret)}
                            className="p-2 rounded-full hover:bg-red-500/20"
                            title="Excluir lembrete de retorno"
                            disabled={isDeleting || !!convertingReturnId}
                        >
                            <TrashIcon className="w-6 h-6 text-red-400 hover:text-red-300" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConvertSingleReturn(ret)}
                            className="p-2 rounded-full hover:bg-teal-500/20"
                            title="Converter em Agendamento"
                            disabled={isDeleting || !!convertingReturnId}
                        >
                            {convertingReturnId === ret.id ? (
                                <ArrowPathIcon className="w-6 h-6 animate-spin text-teal-400" />
                            ) : (
                                <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" alt="Converter em Agendamento" className="w-6 h-6" />
                            )}
                        </Button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Lembretes de Retorno</h1>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="w-full flex justify-between items-center text-left p-4 bg-[var(--background-light)] hover:bg-[var(--background-medium)] rounded-2xl transition-colors shadow-md"
          aria-expanded={isSettingsOpen}
          aria-controls="return-settings-panel"
        >
          <span className="text-lg font-semibold text-white">Configurações de Retorno</span>
          <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isSettingsOpen && (
          <div id="return-settings-panel" className="mt-2 p-6 bg-[var(--background-medium)] rounded-2xl border border-[var(--border-color)]">
            {isLoadingSettings ? (
              <p className="text-center text-[var(--text-secondary)]">Carregando configurações...</p>
            ) : (
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-[var(--accent-cyan)]">Mensagem Padrão do WhatsApp</h3>
                <Textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  readOnly={!isEditingMessage}
                  rows={4}
                  className={!isEditingMessage ? 'bg-[var(--background-dark)] border-[var(--border-color)] text-gray-400 cursor-not-allowed' : ''}
                  aria-label="Modelo da mensagem do WhatsApp"
                />
                <p className="text-xs text-gray-500">
                  Use as variáveis <code className="bg-gray-700 px-1 py-0.5 rounded">{'{patientName}'}</code> e <code className="bg-gray-700 px-1 py-0.5 rounded">{'{returnDate}'}</code> que serão substituídas automaticamente.
                </p>
                <div className="flex justify-end space-x-3">
                  {isEditingMessage ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleCancelEdit}
                        disabled={isSavingSettings}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                      >
                        {isSavingSettings ? 'Salvando...' : 'Salvar Mensagem'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => setIsEditingMessage(true)}
                    >
                      Editar Mensagem
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Card>
        {renderContent()}
      </Card>

      {returnToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={closeConfirmDeleteModal}
            onConfirm={executeDeleteReturn}
            title="Confirmar Exclusão de Lembrete"
            message={<>Tem certeza que deseja excluir o lembrete de retorno para <strong className="text-[var(--accent-cyan)]">{returnToDelete.patient_name}</strong> no dia <strong className="text-[var(--accent-cyan)]">{isoToDdMmYyyy(returnToDelete.return_date)}</strong>? Esta ação não pode ser desfeita.</>}
            confirmButtonText="Excluir Lembrete"
            isLoading={isDeleting}
        />
      )}
    </div>
  );
};