
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PaperAirplaneIcon, CheckIcon, CheckDoubleIcon, XMarkIcon, FaceSmileIcon, PaperclipIcon, DocumentTextIcon } from './icons/HeroIcons';
import { Dentist, ChatMessage } from '../types';
import { getDentists, getMessagesBetweenUsers, sendMessage, markMessagesAsRead, getUnreadMessages, uploadChatFile, getSupabaseClient } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { formatIsoToSaoPauloTime } from '../src/utils/formatDate';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface ChatWidgetProps {
  adminId: string;
}

const isImageFile = (fileType: string | null | undefined): boolean => {
  if (!fileType) return false;
  return fileType.startsWith('image/');
};

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const selectedDentistRef = useRef<Dentist | null>(null);
  const isOpenRef = useRef(false);

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
        const audio = new Audio('/arpegio.mp3');
        audio.volume = 1.0;
        audio.preload = 'auto';
        audioRef.current = audio;
    } catch(e) {
        console.error("Failed to initialize audio:", e)
    }
  }, []);
  
  useEffect(() => {
    selectedDentistRef.current = selectedDentist;
    isOpenRef.current = isOpen;
  }, [selectedDentist, isOpen]);

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

  const playNotificationSound = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audioUnlockedRef.current) {
        audio.currentTime = 0;
        audio.play().catch((err) => console.warn("🔇 Som bloqueado:", err));
    }
  }, []);
  
  useEffect(() => {
    const setupChat = async () => {
      setIsLoading(prevState => ({ ...prevState, dentists: true }));
      const [dentistsRes, unreadRes] = await Promise.all([
          getDentists(),
          getUnreadMessages(adminId)
      ]);

      if (dentistsRes.error) {
        showToast('Erro ao carregar lista de dentistas.', 'error');
      } else {
        setDentists((dentistsRes.data || []).filter(d => d.username !== 'admin'));
      }
      setIsLoading(prevState => ({ ...prevState, dentists: false }));

      if (unreadRes.data) {
        setUnreadMessages(unreadRes.data);
      }
    };
    setupChat();
  }, [adminId, showToast]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const handleNewMessage = async (payload: any) => {
      const newMessage = payload.new as ChatMessage;
      if (isOpenRef.current && selectedDentistRef.current?.id === newMessage.sender_id) {
        setMessages(prev => [...prev, newMessage]);
        await markMessagesAsRead([newMessage.id], adminId);
        setUnreadMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
      } else {
        playNotificationSound();
        setUnreadMessages(prev => [...prev, newMessage]);
      }
    };

    const handleMessageUpdate = (payload: any) => {
      const updatedMessage = payload.new as ChatMessage;
      setMessages(prev =>
        prev.map(m => (m.id === updatedMessage.id ? { ...m, is_read: updatedMessage.is_read } : m))
      );
    };

    const channel = client
      .channel(`chat_admin_${adminId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `recipient_id=eq.${adminId}` }, handleNewMessage)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `sender_id=eq.${adminId}` }, handleMessageUpdate)
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [adminId, playNotificationSound]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setIsPickerOpen(false);
  };

  const handleToggleChat = () => {
    if (!audioUnlockedRef.current && audioRef.current) {
        audioRef.current.play().then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
            audioUnlockedRef.current = true;
        }).catch(() => {});
    }
    setIsOpen(!isOpen);
  };

  const handleSelectDentist = useCallback(async (dentist: Dentist) => {
    if (selectedDentist?.id === dentist.id) return;

    setSelectedDentist(dentist);
    setIsLoading(prevState => ({ ...prevState, messages: true }));
    setMessages([]);

    const idsToMark = unreadMessages
        .filter(msg => msg.sender_id === dentist.id)
        .map(msg => msg.id);
    
    if (idsToMark.length > 0) {
        await markMessagesAsRead(idsToMark, adminId);
        setUnreadMessages(prev => prev.filter(msg => !idsToMark.includes(msg.id)));
    }

    const { data, error } = await getMessagesBetweenUsers(adminId, dentist.id!);
    if (error) {
      showToast('Erro ao carregar mensagens.', 'error');
    } else {
      setMessages(data || []);
    }
    setIsLoading(prevState => ({ ...prevState, messages: false }));
  }, [adminId, showToast, unreadMessages, selectedDentist?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachedFiles.length === 0) || !selectedDentist?.id) return;
  
    setIsSending(true);
    const textContent = newMessage.trim();
    const filesToSend = [...attachedFiles];
    
    setNewMessage('');
    setAttachedFiles([]);
  
    const sentMessages: ChatMessage[] = [];
  
    try {
      // Logic to send text and files as separate messages if both exist
      if (textContent) {
        const { data, error } = await sendMessage({
          sender_id: adminId,
          recipient_id: selectedDentist.id,
          content: textContent,
        });
        if (error) throw new Error("Falha ao enviar mensagem de texto.");
        if (data) sentMessages.push(data);
      }
  
      for (const file of filesToSend) {
        const { data: uploadData, error: uploadError } = await uploadChatFile(file, adminId);
        if (uploadError) {
          showToast(`Falha no upload de ${file.name}.`, 'error');
          continue; // Skip to next file
        }
  
        if (uploadData?.publicUrl) {
          const { data, error } = await sendMessage({
            sender_id: adminId,
            recipient_id: selectedDentist.id,
            content: null, // Each file is a separate message without text
            file_url: uploadData.publicUrl,
            file_name: file.name,
            file_type: file.type,
          });
          if (error) throw new Error(`Falha ao enviar o arquivo ${file.name}.`);
          if (data) sentMessages.push(data);
        }
      }
    } catch (error: any) {
      showToast(error.message, 'error');
      // Restore inputs on failure
      setNewMessage(textContent);
      setAttachedFiles(filesToSend);
    } finally {
      if (sentMessages.length > 0) {
        setMessages(prev => [...prev, ...sentMessages]);
      }
      setIsSending(false);
    }
  };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const allowedFiles = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            setAttachedFiles(prev => [...prev, ...allowedFiles]);
            e.dataTransfer.clearData();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

  return (
    <>
      {isOpen && (
        <div ref={widgetRef} className="fixed bottom-24 right-8 w-full max-w-[1060px] h-[700px] bg-[#1a1a1a] rounded-xl shadow-2xl flex flex-col z-50 border border-gray-700/50 animate-slide-up-widget">
          <header className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-[#1f1f1f] rounded-t-xl">
            <h2 className="text-xl font-semibold text-white">Chat</h2>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-gray-600 transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-300" />
            </button>
          </header>
          <main className="flex-1 flex min-h-0">
            <aside className="w-1/3 border-r border-gray-700/50 flex flex-col bg-[#1f1f1f]">
              <div className="p-3 border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-white">Conversas</h3>
              </div>
              <ul className="overflow-y-auto flex-1">
                {isLoading.dentists ? (
                  <p className="text-center text-gray-400 p-4">Carregando...</p>
                ) : (
                  dentists.map(dentist => {
                    const unreadCount = unreadCountsBySender.get(dentist.id!) || 0;
                    return (
                        <li key={dentist.id} onClick={() => handleSelectDentist(dentist)}
                            className={`p-3 cursor-pointer border-l-4 ${selectedDentist?.id === dentist.id ? 'bg-[#2a2a2a] border-teal-500' : 'border-transparent hover:bg-[#2a2a2a]'}`}>
                           <div className="flex items-center justify-between">
                             <div className="flex items-center">
                                <img src="https://cdn-icons-png.flaticon.com/512/4344/4344446.png" alt="Profile Icon" className="w-8 h-8 rounded-full mr-3" />
                                <span className="font-medium text-white">{dentist.full_name}</span>
                             </div>
                             {unreadCount > 0 && <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                           </div>
                        </li>
                    )
                  })
                )}
              </ul>
            </aside>
            <section className="w-2/3 flex flex-col" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              {isDragging && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 border-4 border-dashed border-teal-500 rounded-lg pointer-events-none">
                  <p className="text-white text-lg font-semibold">Arraste e solte os arquivos aqui</p>
                </div>
              )}
              {selectedDentist ? (
                <>
                  <div className="p-3 border-b border-gray-700/50 flex items-center bg-[#1f1f1f]">
                     <img src="https://cdn-icons-png.flaticon.com/512/4344/4344446.png" alt="Profile Icon" className="w-8 h-8 rounded-full mr-3" />
                    <h3 className="text-lg font-semibold text-white">{selectedDentist.full_name}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#181818]">
                    {isLoading.messages ? (<p className="text-center text-gray-400">Carregando mensagens...</p>) 
                    : messages.length === 0 ? (<p className="text-center text-gray-400">Inicie a conversa com {selectedDentist.full_name}.</p>)
                    : (messages.map(msg => (
                        <div key={msg.id} className={`flex items-end ${msg.sender_id === adminId ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md px-4 py-2 rounded-xl shadow ${msg.sender_id === adminId ? 'bg-[#007b8b] text-white rounded-br-none' : 'bg-[#2a2a2a] text-gray-200 rounded-bl-none'}`}>
                            {msg.file_url && (
                                isImageFile(msg.file_type) ? (
                                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                        <img src={msg.file_url} alt={msg.file_name || 'imagem anexa'} className="max-w-xs rounded-lg my-1" />
                                    </a>
                                ) : (
                                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center bg-black/20 p-2 rounded-lg hover:bg-black/30 my-1">
                                        <DocumentTextIcon className="w-6 h-6 mr-2 flex-shrink-0" />
                                        <span className="truncate">{msg.file_name || 'Arquivo'}</span>
                                    </a>
                                )
                            )}
                            {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                            <div className="flex items-center justify-end text-right mt-1 opacity-70">
                              <p className="text-xs">{formatIsoToSaoPauloTime(msg.created_at)}</p>
                              {msg.sender_id === adminId && (
                                <span className="ml-2">
                                  {msg.is_read
                                    ? <span title="Lido"><CheckDoubleIcon className="w-4 h-4 text-cyan-300 transition-all" /></span>
                                    : <span title="Enviado"><CheckIcon className="w-4 h-4 text-gray-400 transition-all" /></span>}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                    )))}
                    <div ref={messagesEndRef} />
                  </div>
                  <footer className="p-4 bg-[#1f1f1f] border-t border-gray-700/50 relative" ref={pickerRef}>
                     {attachedFiles.length > 0 && (
                        <div className="p-2 mb-2 border-b border-gray-700/50 space-y-2 max-h-28 overflow-y-auto">
                            {attachedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-[#2a2a2a] p-1.5 rounded-md text-xs">
                                    <span className="text-gray-300 truncate pr-2">{file.name}</span>
                                    <button type="button" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}>
                                        <XMarkIcon className="w-4 h-4 text-red-400 hover:text-red-300"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {isPickerOpen && (
                      <div className="absolute bottom-full right-0 mb-2 z-10">
                          <EmojiPicker 
                              onEmojiClick={handleEmojiClick}
                              theme={Theme.DARK}
                              lazyLoadEmojis={true}
                              height={400}
                              width={350}
                          />
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                      <Button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()} 
                          variant="ghost" 
                          className="p-3 h-12"
                          aria-label="Anexar arquivo"
                          title="Anexar arquivo"
                          disabled={isSending}
                      >
                          <PaperclipIcon className="w-6 h-6 text-gray-400"/>
                      </Button>
                      <input 
                          type="file"
                          multiple
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      />
                      <Input 
                        containerClassName="flex-grow mb-0" 
                        className="bg-[#2a2a2a] border-gray-600 focus:border-[#00bcd4] h-12" 
                        placeholder="Digite sua mensagem..." 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        disabled={isSending || isLoading.messages} 
                        autoFocus
                        suffixIcon={
                          <button 
                            type="button" 
                            onClick={() => setIsPickerOpen(!isPickerOpen)} 
                            className="p-1 rounded-full text-gray-400 hover:text-white transition-colors"
                            aria-label="Adicionar emoji"
                            title="Adicionar emoji"
                          >
                            <FaceSmileIcon className="w-6 h-6"/>
                          </button>
                        }
                      />
                      <Button type="submit" variant="primary" className="h-12 w-12 p-0 flex-shrink-0" disabled={isSending || isLoading.messages || (!newMessage.trim() && attachedFiles.length === 0)}><PaperAirplaneIcon className="w-6 h-6"/></Button>
                    </form>
                  </footer>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-[#181818]">
                  <p className="text-gray-400">Selecione uma conversa para começar</p>
                </div>
              )}
            </section>
          </main>
        </div>
      )}

      <button onClick={handleToggleChat} className="fixed bottom-8 right-8 bg-[#00bcd4] hover:bg-[#00a5b8] text-black w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e0e0e] focus:ring-[#00bcd4] z-40">
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
