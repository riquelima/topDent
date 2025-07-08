import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { XMarkIcon, CheckIcon } from './icons/HeroIcons';
import { getChangelog } from '../services/supabaseService';
import { ChangelogEntry } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      getChangelog().then(({ data, error }) => {
        if (error) {
          setError('Não foi possível carregar as atualizações.');
        } else {
           const todayISOString = new Date().toISOString().split('T')[0];
           const newEntry: ChangelogEntry = {
            id: 'manual-entry-1',
            created_at: new Date().toISOString(),
            release_date: todayISOString,
            version: 'v4.2.0',
            changes: [
                'Permitido agendamento para pacientes não cadastrados diretamente na tela de agendamento.',
                'Adicionado ícone (favicon) da Top Dent na aba do navegador.',
            ]
          };
          const existingData = data || [];
          // Prepend the new entry if it doesn't already exist in the list
          if (!existingData.some(entry => entry.version === newEntry.version)) {
             setChangelog([newEntry, ...existingData]);
          } else {
             setChangelog(existingData);
          }
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in" onClick={handleClose}>
      <div 
        className="bg-[#1f1f1f]/90 border border-gray-700/50 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">✨ Novidades e Atualizações</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full"
            aria-label="Fechar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <p className="text-center text-gray-400">Carregando...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : changelog.length > 0 ? (
            changelog.map(entry => (
              <div key={entry.id}>
                <h3 className="text-lg font-semibold text-[#00bcd4]">
                  {isoToDdMmYyyy(entry.release_date)}
                  {entry.version && <span className="text-sm font-normal text-gray-400 ml-2">({entry.version})</span>}
                </h3>
                <ul className="mt-2 space-y-1.5 list-inside">
                  {entry.changes.map((change, index) => (
                    <li key={index} className="flex items-start text-gray-200">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">Nenhuma atualização recente encontrada.</p>
          )}
        </main>
        <footer className="p-6 border-t border-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <label className="flex items-center cursor-pointer text-gray-300 hover:text-white">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 text-[#00bcd4] bg-gray-700 border-gray-600 rounded focus:ring-[#00bcd4]"
            />
            <span className="ml-2 text-sm">✅ Não mostrar novamente</span>
          </label>
          <Button variant="primary" onClick={handleClose}>
            Fechar
          </Button>
        </footer>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};