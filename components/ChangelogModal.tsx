
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { XMarkIcon, CheckIcon } from './icons/HeroIcons';
import { getChangelog } from '../services/supabaseService';
import { ChangelogEntry } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      getChangelog().then(({ data, error }) => {
        if (error) {
          setError('Não foi possível carregar as atualizações.');
        } else {
          const hardcodedEntries: ChangelogEntry[] = [
            {
              id: 'manual-entry-15-07-2025',
              created_at: new Date('2025-07-15T10:00:00Z').toISOString(),
              release_date: '2025-07-15',
              version: 'v10.1.0',
              changes: [
                'Ativação de Som Unificada: Adicionado um botão "Ativar Som" nos dashboards do admin e do dentista para desbloquear o áudio de forma confiável em todo o sistema.',
                'Correção de Áudio: Resolvido o problema que impedia o som de notificação de tocar devido a políticas de áudio do navegador.',
                'Melhoria na Aparência: Corrigido o texto do botão "Ativar Som" para garantir a visibilidade (fonte branca sobre fundo preto).',
                'Notificações Personalizadas: Implementada a lógica para tocar sons de notificação específicos para cada dentista.',
              ]
            },
            {
              id: 'manual-entry-14-07-2025',
              created_at: new Date('2025-07-14T10:00:00Z').toISOString(),
              release_date: '2025-07-14',
              version: 'v9.0.0',
              changes: [
                'Notificações de Chegada: Corrigido o envio de notificações de chegada de paciente, que agora são recebidas em tempo real pelo dentista.',
                'Funcionalidade de "Lido" no Chat: A confirmação de leitura no chat agora é atualizada em tempo real de forma confiável.',
                'Correções de Banco de Dados: Aplicadas diversas correções no banco de dados para resolver erros de "coluna não encontrada" e falhas de permissão.',
                'Scroll Automático do Chat: Ao abrir uma conversa, a visualização agora rola automaticamente para a mensagem mais recente.',
              ]
            },
            {
              id: 'manual-entry-consolidated-13-07-2025',
              created_at: new Date('2025-07-13T10:00:00Z').toISOString(),
              release_date: '2025-07-13',
              version: 'v8.0.0',
              changes: [
                'Automação de Agendamento no WhatsApp: Ao salvar um agendamento, uma automação é acionada no n8n para enviar a confirmação ao paciente.',
                'Feedback de Envio de Lembrete: Adicionado um toast de notificação que informa se a confirmação do WhatsApp foi enviada com sucesso ou se falhou por falta de telefone.',
                'Registro da Última Consulta no Paciente: O sistema agora salva automaticamente a data da última consulta no cadastro do paciente, facilitando o acompanhamento.',
                'Atualização Segura de CPF/ID: Melhorado o processo de atualização do CPF/ID de um paciente, garantindo que todos os seus dados vinculados (agendamentos, tratamentos) sejam migrados corretamente, evitando erros no banco de dados.',
              ]
            },
            {
              id: 'manual-entry-consolidated-12-07-2025',
              created_at: new Date('2025-07-12T10:00:00Z').toISOString(),
              release_date: '2025-07-12',
              version: 'v7.0.0',
              changes: [
                'Envio de Arquivos no Chat: Agora é possível enviar arquivos (imagens, PDFs, documentos) diretamente no chat, tanto para administradores quanto para dentistas.',
                'Arrastar e Soltar no Chat: Adicionada a funcionalidade de arrastar e soltar arquivos diretamente na janela do chat para facilitar o anexo.',
                'Fotos de Perfil para Dentistas: Administradores agora podem adicionar fotos de perfil para os dentistas na tela de configurações, que serão exibidas no chat.',
                'Melhorias nas Mensagens de Erro: Aprimoradas as mensagens de erro para uploads de arquivos, fornecendo instruções claras sobre como corrigir problemas de configuração no Supabase (como "Bucket not found" e permissões RLS).',
              ]
            },
            {
              id: 'manual-entry-consolidated-11-07-2025',
              created_at: new Date('2025-07-11T12:00:00Z').toISOString(),
              release_date: '2025-07-11',
              version: 'v6.0.0',
              changes: [
                'Automação de Confirmação de Agendamentos: Adicionado um novo botão em "Configurações" para acionar uma automação que envia confirmações de agendamento via WhatsApp.',
                'Criação Automática de Retornos: Ao agendar uma consulta com data e hora de retorno, um novo agendamento para o retorno é criado automaticamente no sistema.',
                'Conversão de Lembretes de Retorno: Agora é possível converter lembretes de retorno antigos em agendamentos individuais diretamente da tela de "Retornos", com um novo ícone de estrela.',
                'Correção no Campo de Hora: Corrigido um bug que impedia a digitação da hora da consulta, exibindo o código de formatação em vez do horário.',
                'Melhorias Gerais: Implementadas melhorias de usabilidade e correções de bugs para tornar o sistema mais estável e eficiente.',
              ]
            },
            {
              id: 'manual-entry-consolidated-10-07-2025',
              created_at: new Date('2025-07-10T15:00:00Z').toISOString(),
              release_date: '2025-07-10',
              version: 'v5.0.0',
              changes: [
                'O menu de Chat foi removido e substituído por um botão flutuante, proporcionando acesso rápido ao chat de qualquer tela.',
                'O layout do chat foi corrigido para que a lista de conversas permaneça visível ao abrir um chat.',
                'Agora é possível editar o ID de pacientes que foram cadastrados sem CPF para adicionar o documento posteriormente.',
                'Corrigido um erro que impedira o salvamento de novos agendamentos ao remover uma integração obsoleta.',
                'Na tela de Agendamentos, agora é possível alterar o status de uma consulta (Agendado, Concluído, etc.) com apenas um clique no status.',
                'O card "Próximos Agendamentos" no Dashboard agora exibe apenas agendamentos com status "Agendado" ou "Confirmado", ocultando os concluídos.',
                'O card "Estatísticas Rápidas" foi aprimorado para exibir dinamicamente o total de tratamentos e o total de consultas.',
                'Adicionada funcionalidade de adicionar lembretes diretamente do Dashboard.',
                'Corrigido o posicionamento do botão de adicionar lembretes.',
                'Adicionados filtros por status e data (Hoje, Próximos) na tela de Agendamentos.',
                'A visualização padrão da tela de Pacientes agora é em modo "Lista".',
                'A visualização padrão da tela de Tratamentos agora é em modo "Lista".',
              ]
            },
            {
              id: 'manual-entry-6',
              created_at: new Date('2025-07-09T18:00:00Z').toISOString(),
              release_date: '2025-07-09',
              version: 'v4.8.0',
              changes: [
                'Melhorada a notificação de chegada de paciente para o dentista.',
                'Agora, um pop-up com alerta sonoro é exibido imediatamente na tela do dentista.',
                'O modal de notificação de chegada de paciente agora tem um design mais impactante e informativo.',
                'O pop-up de chegada deve ser dispensado manually, garantindo que a notificação seja vista.',
                'Adicionado campo para "Plano de Saúde" ou "Particular" no cadastro de pacientes.',
                'Notificação de chegada do paciente agora informa o tipo de convênio.',
                'Ícone flutuante de chat para dentistas agora exibe um contador para mensagens não lidas.',
                'Adicionada contagem de notificações não lidas no ícone de notificações.',
                'Implementada a funcionalidade de dispensar notificações individuais.',
              ]
            },
            {
              id: 'manual-entry-4',
              created_at: new Date('2025-07-08T12:00:00Z').toISOString(),
              release_date: '2025-07-08',
              version: 'v4.4.0',
              changes: [
                'Implementado sistema de notificação de chegada de paciente. O administrador pode notificar o dentista com um clique.',
                'Adicionado painel de notificações em tempo real para dentistas.',
              ]
            },
            {
              id: 'manual-entry-3',
              created_at: new Date('2025-07-07T12:00:00Z').toISOString(),
              release_date: '2025-07-07',
              version: 'v4.3.0',
              changes: [
                'Adicionada a funcionalidade de excluir lembretes de retorno na página de Retornos.',
                'Melhorias visuais e de alinhamento na tabela de retornos.',
              ]
            },
            {
              id: 'manual-entry-2',
              created_at: new Date('2025-07-06T12:00:00Z').toISOString(),
              release_date: '2025-07-06',
              version: 'v4.2.0',
              changes: [
                'Permitido agendamento para pacientes não cadastrados diretamente na tela de agendamento.',
                'Adicionado ícone (favicon) da Top Dent na aba do navegador.',
              ]
            }
          ];

          const existingData = data || [];
          const existingVersions = new Set(existingData.map(entry => entry.version));
          const entriesToPrepend = hardcodedEntries.filter(entry => !existingVersions.has(entry.version));
          const combinedChangelog = [...entriesToPrepend, ...existingData];
          
          combinedChangelog.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
          setChangelog(combinedChangelog);
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#1f1f1f]/90 border border-gray-700/50 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">✨ Novidades e Atualizações</h2>
          <button
            onClick={onClose}
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
        <footer className="p-6 border-t border-gray-700/50 flex flex-col sm:flex-row justify-end items-center gap-4">
          <Button variant="primary" onClick={onClose}>
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
