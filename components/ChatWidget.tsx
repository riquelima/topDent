import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PaperAirplaneIcon, UserIcon as DentistIcon, CheckIcon, CheckDoubleIcon, XMarkIcon } from './icons/HeroIcons';
import { Dentist, ChatMessage } from '../types';
import { getDentists, getMessagesBetweenUsers, sendMessage, markMessagesAsRead, getUnreadMessages, subscribeToMessages } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { formatIsoToSaoPauloTime } from '../src/utils/formatDate';

interface ChatWidgetProps {
  adminId: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ adminId }) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState({ dentists: true, messages: false });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadMessages, setUnreadMessages] = useState<ChatMessage[]>([]);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSoundRef.current = new Audio('https://www.soundjay.com/buttons/sounds/button-1.mp3');
  }, []);

  const unreadCountsBySender = useMemo(() => {
    const counts = new Map<string, number>();
    unreadMessages.forEach(msg => {
      counts.set(msg.sender_id, (counts.get(msg.sender_id) || 0) + 1);
    });
    return counts;
  }, [unreadMessages]);
  
  const totalUnreadCount = useMemo(() => {
      return unreadMessages.length;
  }, [unreadMessages]);

  // Effect for fetching initial data and subscribing to real-time updates
  useEffect(() => {
    let chatSub: RealtimeChannel | null = null;
    
    const setupChat = async () => {
      setIsLoading(prevState => ({ ...prevState, dentists: true }));
      const dentistsRes = await getDentists();
      if (dentistsRes.error) {
        showToast('Erro ao carregar lista de dentistas.', 'error');
      } else {
        setDentists((dentistsRes.data || []).filter(d => d.username !== 'admin'));
      }
      setIsLoading(prevState => ({ ...prevState, dentists: false }));

      const unreadRes = await getUnreadMessages(adminId);
      if (unreadRes.data) {
        setUnreadMessages(unreadRes.data);
      }

      chatSub = subscribeToMessages(adminId, (newMessagePayload) => {
        if (notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(e => console.warn("Could not play chat notification sound:", e));
        }
        setUnreadMessages(prev => [...prev, newMessagePayload]);
      });

      if (chatSub) chatSub.subscribe();
    };

    setupChat();

    return () => {
      if (chatSub) chatSub.unsubscribe();
    };
  }, [adminId, showToast]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    // This effect updates the currently viewed chat with new incoming messages
    if (isOpen && selectedDentist) {
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
  }, [unreadMessages, selectedDentist, adminId, isOpen]);


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
        if (!markError) {
            setUnreadMessages(prev => prev.filter(msg => !idsToMark.includes(msg.id)));
        }
    }

    const { data, error } = await getMessagesBetweenUsers(adminId, dentist.id!);
    if (error) {
      showToast('Erro ao carregar mensagens.', 'error');
    } else {
      setMessages(data || []);
    }
    setIsLoading(prevState => ({ ...prevState, messages: false }));
  }, [adminId, showToast, unreadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDentist?.id) return;
    setIsSending(true);
    const content = newMessage;
    setNewMessage('');
    const sentMessage: ChatMessage = {
      id: `temp-${Date.now()}`, sender_id: adminId, recipient_id: selectedDentist.id,
      content, created_at: new Date().toISOString(), is_read: false
    };
    setMessages(prev => [...prev, sentMessage]);
    const { error } = await sendMessage({ sender_id: adminId, recipient_id: selectedDentist.id, content });
    if (error) {
      showToast(`Falha ao enviar mensagem: ${error.message}`, 'error');
      setMessages(prev => prev.filter(m => m.id !== sentMessage.id));
      setNewMessage(content);
    }
    setIsSending(false);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-full max-w-3xl h-[80vh] max-h-[700px] bg-[#1a1a1a] rounded-xl shadow-2xl flex flex-col z-50 border border-gray-700/50 animate-slide-up-widget">
          <header className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1f1f1f] rounded-t-xl">
            <h2 className="text-xl font-semibold text-white">Chat</h2>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-gray-600 transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-300" />
            </button>
          </header>

          <div className="flex-1 flex min-h-0">
            <aside className="w-1/3 border-r border-gray-700/50 flex flex-col">
              <div className="flex-1 overflow-y-auto">
                {isLoading.dentists ? (
                  <p className="p-4 text-center text-gray-400 text-sm">Carregando...</p>
                ) : (
                  <ul>{dentists.map(dentist => {
                    const unreadCount = unreadCountsBySender.get(dentist.id!) || 0;
                    const isSelected = selectedDentist?.id === dentist.id;
                    return (
                      <li key={dentist.id}>
                        <button onClick={() => handleSelectDentist(dentist)} className={`w-full text-left p-4 flex items-center space-x-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 ${ isSelected ? 'bg-[#00bcd4] text-black' : 'hover:bg-gray-700/50 text-white' }`}>
                          <div className={`p-2 rounded-full ${isSelected ? 'bg-black/20' : 'bg-gray-600'}`}><DentistIcon className="w-5 h-5" /></div>
                          <span className="font-medium truncate flex-grow">{dentist.full_name}</span>
                          {unreadCount > 0 && (
                             <span className={`ml-auto flex-shrink-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold leading-none rounded-full ${isSelected ? 'bg-white text-[#00bcd4]' : 'bg-red-600 text-white'}`}>{unreadCount}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}</ul>
                )}
              </div>
            </aside>
            <main className="w-2/3 flex flex-col">
              {selectedDentist ? (
                <>
                  <header className="p-4 border-b border-gray-700/50 flex items-center space-x-3 bg-[#1f1f1f]">
                    <div className="p-2 rounded-full bg-gray-600 text-white"><DentistIcon className="w-5 h-5"/></div>
                    <h3 className="text-lg font-semibold text-white">{selectedDentist.full_name}</h3>
                  </header>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#181818]">
                    {isLoading.messages ? (<p className="text-center text-gray-400">Carregando...</p>)
                    : messages.length === 0 ? (<p className="text-center text-gray-400">Inicie a conversa.</p>)
                    : (messages.map(msg => (
                        <div key={msg.id} className={`flex items-end ${msg.sender_id === adminId ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md px-4 py-2 rounded-xl shadow ${msg.sender_id === adminId ? 'bg-[#007b8b] text-white rounded-br-none' : 'bg-[#2a2a2a] text-gray-200 rounded-bl-none'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center justify-end text-right mt-1 opacity-70">
                              <p className="text-xs">{formatIsoToSaoPauloTime(msg.created_at)}</p>
                              {msg.sender_id === adminId && (<span className="ml-2">{msg.is_read ? <CheckDoubleIcon className="w-4 h-4 text-cyan-300" /> : <CheckIcon className="w-4 h-4 text-gray-400" />}</span>)}
                            </div>
                          </div>
                        </div>
                    )))}
                    <div ref={messagesEndRef} />
                  </div>
                  <footer className="p-4 bg-[#1f1f1f] border-t border-gray-700/50">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                      <Input containerClassName="flex-grow mb-0" className="bg-[#2a2a2a] border-gray-600 focus:border-[#00bcd4] h-12" placeholder="Digite sua mensagem..." value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={isSending || isLoading.messages} autoFocus />
                      <Button type="submit" variant="primary" className="h-12 w-12 p-0 flex-shrink-0" disabled={isSending || isLoading.messages || !newMessage.trim()}><PaperAirplaneIcon className="w-6 h-6"/></Button>
                    </form>
                  </footer>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                  <div>
                    <h3 className="text-xl">Selecione uma conversa</h3>
                    <p>Suas mensagens aparecerão aqui.</p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-8 right-8 bg-[#00bcd4] hover:bg-[#00a5b8] text-black w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e0e0e] focus:ring-[#00bcd4] z-40">
        <img src="https://cdn-icons-png.flaticon.com/512/9314/9314332.png" alt="Chat" className="w-8 h-8" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-[#00bcd4]">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes slide-up-widget {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up-widget { animation: slide-up-widget 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};