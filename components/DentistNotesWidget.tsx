import React, { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Modal } from './ui/Modal';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { PencilIcon, TrashIcon, ChevronRightIcon } from './icons/HeroIcons';
import { DentistNote } from '../types';
import { getNotesByDentist, addDentistNote, updateDentistNote, deleteDentistNote } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { formatIsoToSaoPauloTime } from '../src/utils/formatDate';

interface DentistNotesWidgetProps {
  dentistId: string;
}

export const DentistNotesWidget: React.FC<DentistNotesWidgetProps> = ({ dentistId }) => {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<DentistNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [newNoteContent, setNewNoteContent] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DentistNote | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<DentistNote | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await getNotesByDentist(dentistId);
    if (error) {
      showToast("Erro ao carregar anotações.", "error");
    } else {
      setNotes(data || []);
    }
    setIsLoading(false);
  }, [dentistId, showToast]);

  useEffect(() => {
    if (isExpanded) {
      fetchNotes();
    }
  }, [isExpanded, fetchNotes]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      showToast("A anotação não pode estar vazia.", "warning");
      return;
    }
    setIsSubmitting(true);
    const { error } = await addDentistNote({ dentist_id: dentistId, content: newNoteContent });
    if (error) {
      showToast("Erro ao salvar anotação.", "error");
    } else {
      showToast("Anotação adicionada!", "success");
      setNewNoteContent('');
      fetchNotes();
    }
    setIsSubmitting(false);
  };
  
  const handleOpenEditModal = (note: DentistNote) => {
    setEditingNote(note);
    setIsEditModalOpen(true);
  };
  
  const handleUpdateNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.content.trim()) {
      showToast("A anotação não pode estar vazia.", "warning");
      return;
    }
    setIsSubmitting(true);
    const { error } = await updateDentistNote(editingNote.id, editingNote.content);
    if (error) {
        showToast("Erro ao atualizar anotação.", "error");
    } else {
        showToast("Anotação atualizada!", "success");
        setIsEditModalOpen(false);
        setEditingNote(null);
        fetchNotes();
    }
    setIsSubmitting(false);
  };
  
  const handleOpenDeleteModal = (note: DentistNote) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    setIsSubmitting(true);
    const { error } = await deleteDentistNote(noteToDelete.id);
    if (error) {
        showToast("Erro ao excluir anotação.", "error");
    } else {
        showToast("Anotação excluída.", "success");
        setIsDeleteModalOpen(false);
        setNoteToDelete(null);
        fetchNotes();
    }
    setIsSubmitting(false);
  };

  const panelClasses = isExpanded ? 'translate-x-0' : 'translate-x-full';

  return (
    <>
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed top-40 right-8 bg-white text-black p-3 rounded-full shadow-lg z-40 hover:scale-110 transition-all duration-300 ${isExpanded ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
        aria-label="Abrir Anotações"
        title="Abrir Anotações"
      >
        <img src="https://cdn-icons-png.flaticon.com/512/3131/3131619.png" alt="Anotações" className="w-7 h-7" />
      </button>

      <div 
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#1f1f1f] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-white/20 ${panelClasses}`}
        aria-hidden={!isExpanded}
        role="dialog"
      >
        <div className="flex justify-between items-center text-xl font-semibold text-white p-4 border-b border-white/10">
            <div className="flex items-center">
                <img src="https://cdn-icons-png.flaticon.com/512/3131/3131619.png" alt="Anotações" className="w-6 h-6 mr-3" />
                Anotações
            </div>
            <button onClick={() => setIsExpanded(false)} className="p-1.5 rounded-full hover:bg-gray-700" title="Ocultar Anotações">
                <ChevronRightIcon className="w-6 h-6 text-white"/>
            </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-gray-400">Carregando anotações...</p>
          ) : notes.length > 0 ? (
            <ul className="space-y-3">
              {notes.map(note => (
                <li key={note.id} className="p-3 bg-[#2a2a2a] rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.content}</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700/50">
                     <p className="text-xs text-gray-500">
                        {note.created_at === note.updated_at ? 'Criado' : 'Editado'} às {formatIsoToSaoPauloTime(note.updated_at)}
                    </p>
                    <div className="flex space-x-2">
                      <button onClick={() => handleOpenEditModal(note)} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700" title="Editar">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenDeleteModal(note)} className="p-1.5 rounded-md text-red-400 hover:bg-gray-700" title="Excluir">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 py-8">Nenhuma anotação encontrada.</p>
          )}
        </div>

        <form onSubmit={handleAddNote} className="p-4 border-t border-white/10 space-y-2 mt-auto bg-[#1f1f1f]">
          <Textarea 
            placeholder="Adicionar nova anotação..."
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            rows={3}
            className="text-sm bg-[#2a2a2a] border-gray-600 focus:border-white focus:ring-white"
            disabled={isSubmitting}
            containerClassName="mb-0"
          />
          <Button type="submit" fullWidth disabled={isSubmitting} className="bg-white hover:bg-gray-200 text-black focus:ring-white">
            {isSubmitting ? "Salvando..." : "Adicionar Anotação"}
          </Button>
        </form>
      </div>
      
      {editingNote && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Editar Anotação"
            footer={
                <div className="flex justify-end space-x-3">
                    <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" form="editNoteForm" disabled={isSubmitting} className="bg-white hover:bg-gray-200 text-black focus:ring-white">
                        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            }
          >
              <form id="editNoteForm" onSubmit={handleUpdateNote}>
                <Textarea 
                    value={editingNote.content}
                    onChange={e => setEditingNote({...editingNote, content: e.target.value})}
                    rows={6}
                    autoFocus
                    disabled={isSubmitting}
                    className="bg-[#2a2a2a] border-gray-600 focus:border-white focus:ring-white"
                />
              </form>
          </Modal>
      )}

      {noteToDelete && (
          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteNote}
            title="Confirmar Exclusão"
            message={<p>Tem certeza que deseja excluir esta anotação? Esta ação é irreversível.</p>}
            confirmButtonText="Excluir Anotação"
            isLoading={isSubmitting}
          />
      )}
    </>
  );
};