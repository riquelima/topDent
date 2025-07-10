import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { PaperAirplaneIcon, CheckIcon, CheckDoubleIcon, XMarkIcon } from './icons/HeroIcons';
import { Dentist, ChatMessage } from '../types';
import { getAdminUserId, getMessagesBetweenUsers, sendMessage, markMessagesAsRead, getUnreadMessages, subscribeToMessages } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { formatIsoToSaoPauloTime } from '../src/utils/formatDate';

interface DentistChatWidgetProps {
  dentistId: string;
}

export const DentistChatWidget: React.FC<DentistChatWidgetProps> = ({ dentistId }) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<Dentist | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState({ admin: true, messages: false });
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadMessages, setUnreadMessages] = useState<ChatMessage[]>([]);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSoundRef.current = new Audio('https://www.soundjay.com/buttons/sounds/button-1.mp3');
  }, []);

  const totalUnreadCount = useMemo(() => unreadMessages.length, [unreadMessages]);

  useEffect(() => {
    let chatSub: RealtimeChannel | null = null;
    
    const setup = async () => {
      setIsLoading(prevState => ({ ...prevState, admin: true }));
      const adminRes = await getAdminUserId();
      if (adminRes.error || !adminRes.data) {
        showToast('Não foi possível conectar ao chat.', 'error');
      } else {
        setAdminUser(adminRes.data);
      }
      setIsLoading(prevState => ({ ...prevState, admin: false }));

      const unreadRes = await getUnreadMessages(dentistId);
      if (unreadRes.data) {
        setUnreadMessages(unreadRes.data);
      }

      chatSub = subscribeToMessages(dentistId, (newMessagePayload) => {
        if (notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(e => console.warn("Could not play chat notification sound:", e));
        }
        setUnreadMessages(prev => [...prev, newMessagePayload]);
      });

      if (chatSub) chatSub.subscribe();
    };

    setup();
    return () => {
      if (chatSub) chatSub.unsubscribe();
    };
  }, [dentistId, showToast]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (isOpen && adminUser) {
        const newMessagesFromAdmin = unreadMessages.filter(msg => msg.sender_id === adminUser.id);
        if (newMessagesFromAdmin.length > 0) {
            setMessages(prev => [...prev, ...newMessagesFromAdmin]);
            const idsToMark = newMessagesFromAdmin.map(m => m.id);
            markMessagesAsRead(idsToMark, dentistId).then(({ error }) => {
                if (!error) {
                    setUnreadMessages(prev => prev.filter(msg => !idsToMark.includes(msg.id)));
                }
            });
        }
    }
  }, [unreadMessages, adminUser, dentistId, isOpen]);

  const fetchMessages = useCallback(async () => {
    if (!adminUser) return;
    setIsLoading(prevState => ({ ...prevState, messages: true }));
    setMessages([]);

    const idsToMark = unreadMessages.map(msg => msg.id);
    if (idsToMark.length > 0) {
      const { error: markError } = await markMessagesAsRead(idsToMark, dentistId);
      if (!markError) setUnreadMessages([]);
    }
    
    const { data, error } = await getMessagesBetweenUsers(dentistId, adminUser.id!);
    if (error) {
      showToast('Erro ao carregar mensagens.', 'error');
    } else {
      setMessages(data || []);
    }
    setIsLoading(prevState => ({ ...prevState, messages: false }));
  }, [adminUser, dentistId, showToast, unreadMessages]);

  const toggleChat = () => {
      const nextIsOpenState = !isOpen;
      setIsOpen(nextIsOpenState);
      if (nextIsOpenState && adminUser) {
          fetchMessages();
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminUser?.id) return;
    setIsSending(true);
    const content = newMessage;
    setNewMessage('');
    const sentMessage: ChatMessage = {
      id: `temp-${Date.now()}`, sender_id: dentistId, recipient_id: adminUser.id,
      content, created_at: new Date().toISOString(), is_read: false
    };
    setMessages(prev => [...prev, sentMessage]);
    const { error } = await sendMessage({ sender_id: dentistId, recipient_id: adminUser.id, content });
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
        <div className="fixed bottom-24 right-8 w-full max-w-[1060px] h-[700px] bg-[#1a1a1a] rounded-xl shadow-2xl flex flex-col z-50 border border-gray-700/50 animate-slide-up-widget">
          <header className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1f1f1f] rounded-t-xl">
            <h2 className="text-xl font-semibold text-white">Chat com Admin</h2>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-gray-600 transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-300" />
            </button>
          </header>
          <main className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#181818]">
                {isLoading.messages || isLoading.admin ? (<p className="text-center text-gray-400">Carregando...</p>)
                : messages.length === 0 ? (<p className="text-center text-gray-400">Inicie a conversa.</p>)
                : (messages.map(msg => (
                    <div key={msg.id} className={`flex items-end ${msg.sender_id === dentistId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-xl shadow ${msg.sender_id === dentistId ? 'bg-[#007b8b] text-white rounded-br-none' : 'bg-[#2a2a2a] text-gray-200 rounded-bl-none'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end text-right mt-1 opacity-70">
                          <p className="text-xs">{formatIsoToSaoPauloTime(msg.created_at)}</p>
                          {msg.sender_id === dentistId && (<span className="ml-2">{msg.is_read ? <CheckDoubleIcon className="w-4 h-4 text-cyan-300" /> : <CheckIcon className="w-4 h-4 text-gray-400" />}</span>)}
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
          </main>
        </div>
      )}

      <button onClick={toggleChat} className="fixed bottom-8 right-8 bg-[#00bcd4] hover:bg-[#00a5b8] text-black w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e0e0e] focus:ring-[#00bcd4] z-40">
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