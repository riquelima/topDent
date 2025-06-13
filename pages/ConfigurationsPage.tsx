
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlusIcon, PencilIcon, TrashIcon, LockClosedIcon, UserIcon as FormUserIcon } from '../components/icons/HeroIcons';
import { Dentist } from '../types';
import { getDentists, addDentist, updateDentist, deleteDentist } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

interface DentistFormState {
  id?: string; // For editing
  full_name: string;
  username: string;
  password?: string; // Optional for edit if not changing
}

export const ConfigurationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDentist, setEditingDentist] = useState<Dentist | null>(null);
  const [formData, setFormData] = useState<DentistFormState>({ full_name: '', username: '', password: '' });

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [dentistToDelete, setDentistToDelete] = useState<Dentist | null>(null);

  const fetchDentists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await getDentists();
    if (fetchError) {
      setError('Erro ao carregar dentistas.');
      showToast('Erro ao carregar dentistas.', 'error');
      console.error("Fetch dentists error:", fetchError);
    } else {
      setDentists(data || []);
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchDentists();
  }, [fetchDentists]);

  const handleOpenModal = (dentist?: Dentist) => {
    setEditingDentist(dentist || null);
    setFormData(dentist ? 
      { id: dentist.id, full_name: dentist.full_name, username: dentist.username, password: '' } : 
      { full_name: '', username: '', password: '' }
    );
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDentist(null);
    setFormData({ full_name: '', username: '', password: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.username || (!editingDentist && !formData.password)) {
      showToast('Nome completo, usuário e senha (para novos) são obrigatórios.', 'error');
      return;
    }
    setIsSubmitting(true);
    
    try {
      if (editingDentist && editingDentist.id) {
        const updatePayload: Partial<Omit<Dentist, 'id' | 'created_at' | 'updated_at'>> = {
          full_name: formData.full_name,
          username: formData.username,
        };
        if (formData.password) { // Only include password if it's being changed
          updatePayload.password = formData.password;
        }
        const { error: updateError } = await updateDentist(editingDentist.id, updatePayload);
        if (updateError) throw updateError;
        showToast('Dentista atualizado com sucesso!', 'success');
      } else {
        const { error: addError } = await addDentist({
          full_name: formData.full_name,
          username: formData.username,
          password: formData.password!, // Password is required for new
        });
        if (addError) throw addError;
        showToast('Dentista cadastrado com sucesso!', 'success');
      }
      fetchDentists();
      handleCloseModal();
    } catch (err: any) {
      let message = 'Erro ao salvar dentista.';
      if (err.message?.includes('unique constraint')) {
        message = 'Erro: Nome de usuário já existe.';
      } else if (err.message) {
        message += ` ${err.message}`;
      }
      showToast(message, 'error');
      console.error("Submit dentist error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeleteDentist = (dentist: Dentist) => {
    setDentistToDelete(dentist);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteDentist = async () => {
    if (!dentistToDelete || !dentistToDelete.id) return;
    setIsSubmitting(true); // Use same loading state for delete
    const { error: deleteError } = await deleteDentist(dentistToDelete.id);
    if (deleteError) {
      showToast('Erro ao excluir dentista.', 'error');
      console.error("Delete dentist error:", deleteError);
    } else {
      showToast('Dentista excluído com sucesso.', 'success');
      fetchDentists();
    }
    setIsConfirmDeleteModalOpen(false);
    setDentistToDelete(null);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
      </div>

      <Card title="Gerenciar Dentistas" className="bg-[#1a1a1a]" titleClassName="text-white">
        <div className="mb-6 text-right">
          <Button onClick={() => handleOpenModal()} leftIcon={<UserPlusIcon />}>
            Cadastrar Novo Dentista
          </Button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        {dentists.length === 0 && !isLoading && !error ? (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{dentist.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b0b0b0]">{dentist.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(dentist)} className="p-1.5" title="Editar Dentista">
                          <PencilIcon className="w-4 h-4 text-[#00bcd4]" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => requestDeleteDentist(dentist)} className="p-1.5" title="Excluir Dentista">
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
      </Card>

      {/* Modal para Adicionar/Editar Dentista */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4" onClick={handleCloseModal}>
          <Card title={editingDentist ? 'Editar Dentista' : 'Cadastrar Novo Dentista'} className="w-full max-w-md bg-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Input
                label="Nome Completo"
                name="full_name"
                value={formData.full_name}
                onChange={handleFormChange}
                required
                disabled={isSubmitting}
                prefixIcon={<FormUserIcon className="w-5 h-5 text-gray-400"/>}
              />
              <Input
                label="Usuário (para login)"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                required
                disabled={isSubmitting}
                prefixIcon={<FormUserIcon className="w-5 h-5 text-gray-400"/>}
              />
              <Input
                label={editingDentist ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'}
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleFormChange}
                required={!editingDentist}
                disabled={isSubmitting}
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
                <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : (editingDentist ? 'Atualizar Dentista' : 'Salvar Dentista')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Dentista */}
      {dentistToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={executeDeleteDentist}
          title="Confirmar Exclusão de Dentista"
          message={`Tem certeza que deseja excluir o dentista ${dentistToDelete.full_name} (usuário: ${dentistToDelete.username})? Esta ação é irreversível.`}
          confirmButtonText="Excluir Dentista"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};
