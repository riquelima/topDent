
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PaperAirplaneIcon, UserIcon as DentistIcon } from '../components/icons/HeroIcons';
import { Dentist, ChatMessage } from '../types';
import { getDentists, getMessagesBetweenUsers, sendMessage, markMessagesAsRead } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { formatToHHMM } from '../src/utils/formatDate';

interface ChatPageProps {
  adminId: string;
  unreadMessages: ChatMessage[];
  setUnreadMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ChatPage: React.FC<ChatPageProps> = ({ adminId, unreadMessages, setUnreadMessages }) => {
  const { showToast } = useToast();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState({ dentists: true, messages: false });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const unreadCountsBySender = useMemo(() => {
    const counts = new Map<string, number>();
    unreadMessages.forEach(msg => {
      if (msg.sender_id) {
        counts.set(msg.sender_id, (counts.get(msg.sender_id) || 0) + 1);
      }
    });
    return counts;
  }, [unreadMessages]);

  useEffect(() => {
    const fetchAllDentists = async () => {
      setIsLoading(prevState => ({ ...prevState, dentists: true }));
      const { data, error } = await getDentists();
      if (error) {
        showToast('Erro ao carregar lista de dentistas.', 'error');
      } else {
        // Exclude admin from the chat list
        setDentists((data || []).filter(d => d.username !== 'admin'));
      }
      setIsLoading(prevState => ({ ...prevState, dentists: false }));
    };
    fetchAllDentists();
  }, [showToast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSelectDentist = useCallback(async (dentist: Dentist) => {
    if (selectedDentist?.id === dentist.id) return;

    setSelectedDentist(dentist);
    setIsLoading(prevState => ({ ...prevState, messages: true }));
    setMessages([]);

    const idsToMark = unreadMessages
        .filter(msg => msg.sender_id === dentist.id)
        .map(msg => msg.id);
    
    if (idsToMark.length > 0) {
        const { error: markError } = await markMessagesAsRead(idsToMark, adminId);
        if (markError) {
            showToast('Erro ao marcar mensagens como lidas.', 'error');
        } else {
            // Correctly filter out only the messages that have been read for the selected dentist
            setUnreadMessages(prev => prev.filter(msg => !idsToMark.includes(msg.id)));
        }
    }

    const { data, error } = await getMessagesBetweenUsers(adminId, dentist.id!);
    if (error) {
      const typedError = error as any;
      const errorMessage = `Erro ao carregar mensagens: ${typedError.message || 'Erro desconhecido'}` + (typedError.code ? `. Código: ${typedError.code}` : '');
      showToast(errorMessage, 'error', 7000);
    } else {
      setMessages(data || []);
    }
    setIsLoading(prevState => ({ ...prevState, messages: false }));
  }, [adminId, showToast, unreadMessages, setUnreadMessages, selectedDentist?.id]);

  useEffect(() => {
    // This effect updates the currently viewed chat with new incoming messages
    // that are passed down from the central subscription in App.tsx
    if (selectedDentist) {
        const newMessagesForThisChat = unreadMessages.filter(
            (msg) => msg.sender_id === selectedDentist.id
        );
        if (newMessagesForThisChat.length > 0) {
            setMessages(prev => [...prev, ...newMessagesForThisChat]);
            
            const idsToMark = newMessagesForThisChat.map(m => m.id);
            markMessagesAsRead(idsToMark, adminId).then(({ error }) => {
                if (!error) {
                    setUnreadMessages(prev => prev.filter(msg => !idsToMark.includes(msg.id)));
                }
            });
        }
    }
  }, [unreadMessages, selectedDentist, adminId, setUnreadMessages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDentist || !selectedDentist.id) return;

    setIsSending(true);
    const content = newMessage;
    setNewMessage('');

    const sentMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: adminId,
      recipient_id: selectedDentist.id,
      content: content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, sentMessage]);

    const { error } = await sendMessage({
      sender_id: adminId,
      recipient_id: selectedDentist.id,
      content: content,
    });

    if (error) {
       const typedError = error as any;
       const errorMessage = `Falha ao enviar mensagem: ${typedError.message || 'Erro desconhecido'}` + (typedError.code ? `. Código: ${typedError.code}` : '');
      showToast(errorMessage, 'error', 7000);
      setMessages(prev => prev.filter(m => m.id !== sentMessage.id)); // Remove optimistic message
      setNewMessage(content); // Restore input
    }
    setIsSending(false);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-[#1a1a1a] rounded-lg shadow-2xl border border-gray-700/50">
      {/* Sidebar with Dentist List */}
      <aside className="w-1/3 xl:w-1/4 border-r border-gray-700/50 flex flex-col">
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white">Conversas</h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {isLoading.dentists ? (
            <p className="p-4 text-center text-gray-400">Carregando...</p>
          ) : (
            <ul>
              {dentists.map(dentist => {
                const unreadCount = unreadCountsBySender.get(dentist.id!) || 0;
                const isSelected = selectedDentist?.id === dentist.id;
                const hasUnread = unreadCount > 0;

                return (
                  <li key={dentist.id}>
                    <button
                      onClick={() => handleSelectDentist(dentist)}
                      className={`w-full text-left p-4 flex items-center space-x-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 ${
                        isSelected
                          ? 'bg-[#00bcd4] text-black'
                          : `hover:bg-gray-700/50 text-white ${hasUnread ? 'bg-sky-900/50' : ''}`
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          isSelected ? 'bg-black/20' : 'bg-gray-600'
                        }`}
                      >
                        <DentistIcon className="w-5 h-5" />
                      </div>
                      <span className={`font-medium truncate flex-grow ${!isSelected && hasUnread ? 'text-sky-400' : ''}`}>
                        {dentist.full_name}
                      </span>
                      {hasUnread && (
                        <span
                          className={`ml-auto flex-shrink-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold leading-none rounded-full ${
                            isSelected ? 'bg-white text-[#00bcd4]' : 'bg-red-600 text-white'
                          }`}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="w-2/3 xl:w-3/4 flex flex-col">
        {selectedDentist ? (
          <>
            <header className="p-4 border-b border-gray-700/50 flex items-center space-x-3 bg-[#1f1f1f]">
               <div className="p-2 rounded-full bg-gray-600 text-white"><DentistIcon className="w-5 h-5"/></div>
               <h3 className="text-lg font-semibold text-white">{selectedDentist.full_name}</h3>
            </header>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-[#181818]">
                {isLoading.messages ? (
                    <p className="text-center text-gray-400">Carregando mensagens...</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400">Inicie a conversa com {selectedDentist.full_name}.</p>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === adminId ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-xl shadow ${msg.sender_id === adminId ? 'bg-[#007b8b] text-white rounded-br-none' : 'bg-[#2a2a2a] text-gray-200 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs text-right mt-1 opacity-60">{formatToHHMM(msg.created_at)}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 bg-[#1f1f1f] border-t border-gray-700/50">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <Input
                        containerClassName="flex-grow"
                        className="bg-[#2a2a2a] border-gray-600 focus:border-[#00bcd4] h-12"
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        disabled={isSending || isLoading.messages}
                        autoFocus
                    />
                    <Button type="submit" variant="primary" className="h-12 w-12 p-0 flex-shrink-0" disabled={isSending || isLoading.messages || !newMessage.trim()}>
                        <PaperAirplaneIcon className="w-6 h-6"/>
                    </Button>
                </form>
            </footer>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-center text-gray-500">
            <div>
              <h3 className="text-xl">Selecione um dentista para começar a conversar</h3>
              <p>Suas conversas aparecerão aqui.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
