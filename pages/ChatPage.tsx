import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PaperAirplaneIcon, UserIcon as DentistIcon } from '../components/icons/HeroIcons';
import { Dentist, ChatMessage } from '../types';
import { getDentists, getMessagesBetweenUsers, sendMessage, subscribeToMessages } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { formatToHHMM } from '../src/utils/formatDate';

interface ChatPageProps {
  adminId: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ adminId }) => {
  const { showToast } = useToast();
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState({ dentists: true, messages: false });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const { data, error } = await getMessagesBetweenUsers(adminId, dentist.id!);
    if (error) {
      showToast(`Erro ao carregar mensagens: ${error.message || 'Erro desconhecido'}.`, 'error');
    } else {
      setMessages(data || []);
    }
    setIsLoading(prevState => ({ ...prevState, messages: false }));
  }, [adminId, showToast, selectedDentist]);

  useEffect(() => {
    if (!adminId) return;

    const subscription = subscribeToMessages(adminId, (newMessagePayload) => {
        if (newMessagePayload.sender_id === selectedDentist?.id) {
            setMessages(prevMessages => [...prevMessages, newMessagePayload]);
        } else {
            // Future enhancement: show notification badge on dentist list
            showToast(`Nova mensagem de outro dentista!`, 'success');
        }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [adminId, selectedDentist, showToast]);

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
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, sentMessage]);

    const { error } = await sendMessage({
      sender_id: adminId,
      recipient_id: selectedDentist.id,
      content: content,
    });

    if (error) {
      showToast(`Falha ao enviar mensagem: ${error.message || 'Erro desconhecido'}.`, 'error');
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
              {dentists.map(dentist => (
                <li key={dentist.id}>
                  <button
                    onClick={() => handleSelectDentist(dentist)}
                    className={`w-full text-left p-4 flex items-center space-x-3 transition-colors duration-150 focus:outline-none ${selectedDentist?.id === dentist.id ? 'bg-[#00bcd4] text-black' : 'hover:bg-gray-700/50 text-white'}`}
                  >
                    <div className={`p-2 rounded-full ${selectedDentist?.id === dentist.id ? 'bg-black/20' : 'bg-gray-600'}`}>
                        <DentistIcon className="w-5 h-5"/>
                    </div>
                    <span className="font-medium truncate">{dentist.full_name}</span>
                  </button>
                </li>
              ))}
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