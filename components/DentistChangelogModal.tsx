
import React from 'react';
import { Button } from './ui/Button';
import { XMarkIcon, CheckIcon } from './icons/HeroIcons';
import { ChangelogEntry } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';

interface DentistChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dentistChangelogEntries: ChangelogEntry[] = [
  {
      id: 'dentist-release-14-07-2023',
      created_at: new Date('2023-07-14T18:00:00Z').toISOString(),
      release_date: '2023-07-14',
      version: 'v10.0.0',
      changes: [
        'Alerta de Chegada de Paciente: A notificação de chegada de paciente agora exibe um modal de aviso e toca o som "smile.mp3" de forma mais confiável.',
        'Ativação de Som: O sistema agora garante que os sons de notificação sejam ativados após a primeira interação do usuário na tela, resolvendo problemas de bloqueio pelo navegador.',
        'Layout do Widget de Anotações: Corrigida a sobreposição do widget de anotações com o ícone de notificações.',
        'Correção de Chat: Implementadas melhorias para garantir que o status "Lido" seja exibido corretamente e que a conversa role para a última mensagem ao ser aberta.',
      ]
  },
  {
    id: 'dentist-release-13-07-2025',
    created_at: new Date('2025-07-13T18:00:00Z').toISOString(),
    release_date: '2025-07-13',
    version: 'v9.5.0',
    changes: [
        'Layout Otimizado: Atalhos rápidos movidos para o topo e cards de agenda com cores mais suaves para melhor contraste e leitura.',
        'Anotações Dinâmicas: O widget de anotações agora é um painel flutuante e recolhível, com ícone e bordas atualizadas. Clique fora para fechar.',
        'Melhorias no Chat: O widget de chat agora também fecha automaticamente ao clicar fora e você pode enviar arquivos e imagens.',
        'Notificações Sonoras: Os alertas de novas mensagens no chat estão mais claros.',
        'Ícones Modernizados: Todos os ícones da sua agenda foram atualizados para um visual mais limpo.',
        'Changelog: Adicionamos este resumo de novidades para você! :)'
    ]
  },
];

export const DentistChangelogModal: React.FC<DentistChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sortedEntries = [...dentistChangelogEntries].sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#1f1f1f]/90 border border-gray-700/50 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">🦷 Novidades Para Você!</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full"
            aria-label="Fechar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          {sortedEntries.length > 0 ? (
            sortedEntries.map(entry => (
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
        <footer className="p-6 border-t border-gray-700/50 flex flex-col sm:flex-row justify-end items-center gap-4">
          <Button variant="primary" onClick={onClose}>
            Entendido!
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
