

import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { PaperAirplaneIcon, XMarkIcon, FaceSmileIcon, PaperclipIcon, DocumentTextIcon, CheckIcon } from './icons/HeroIcons';
import { Dentist, ChatMessage } from '../types';
import { getAdminUserId, getMessagesBetweenUsers, sendMessage, markMessagesAsRead, getUnreadMessages, uploadChatFile, getSupabaseClient } from '../services/supabaseService';
import { useToast } from '../contexts/ToastContext';
import { formatIsoToSaoPauloTime } from '../src/utils/formatDate';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface DentistChatWidgetProps {
  dentistId: string;
}

const isImageFile = (fileType: string | null | undefined): boolean => {
  if (!fileType) return false;
  return fileType.startsWith('image/');
};

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const isOpenRef = useRef(false);
  
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const totalUnreadCount = useMemo(() => unreadMessages.length, [unreadMessages]);

  const playNotificationSound = useCallback(() => {
    if ((window as any).isAudioUnlocked) {
        const audio = document.getElementById('notification-sound') as HTMLAudioElement;
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(error => console.warn("Dentist chat notification sound failed to play:", error));
        }
    }
  }, []);

  useEffect(() => {
    const setup = async () => {
      setIsLoading(prevState => ({ ...prevState, admin: true }));
      const [adminRes, unreadRes] = await Promise.all([
          getAdminUserId(),
          getUnreadMessages(dentistId)
      ]);

      if (adminRes.error || !adminRes.data) {
        showToast('Não foi possível conectar ao chat.', 'error');
      } else {
        setAdminUser(adminRes.data);
      }
      setIsLoading(prevState => ({ ...prevState, admin: false }));

      if (unreadRes.data) {
        setUnreadMessages(unreadRes.data);
      }
    };
    setup();
  }, [dentistId, showToast]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
  
    const handleNewMessage = async (payload: any) => {
        const newMessage = payload.new as ChatMessage;
        if (isOpenRef.current) {
            setMessages(prev => [...prev, newMessage]);
            await markMessagesAsRead([newMessage.id], dentistId);
            setUnreadMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
        } else {
            playNotificationSound();
            setUnreadMessages(prev => [...prev, newMessage]);
        }
    };

    const handleMessageUpdate = (payload: any) => {
      const updatedMessage = payload.new as ChatMessage;

      if (updatedMessage.sender_id === dentistId && updatedMessage.is_read === true) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === updatedMessage.id
              ? { ...msg, is_read: true }
              : msg
          )
        );
      }
    };
  
    const channel = client
      .channel(`dentist_chat_realtime_${dentistId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `recipient_id=eq.${dentistId}` }, handleNewMessage)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${dentistId}`,
        },
        handleMessageUpdate
      )
      .subscribe();
  
    return () => {
      client.removeChannel(channel);
    };
  }, [dentistId, playNotificationSound]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  useLayoutEffect(scrollToBottom, [messages]);
  
  const markConversationAsRead = useCallback(async () => {
    const idsToMarkAsRead = unreadMessages.map(msg => msg.id);

    // Optimistic UI update
    setUnreadMessages([]);

    if (idsToMarkAsRead.length > 0) {
        // Fire and forget, log error on failure
        markMessagesAsRead(idsToMarkAsRead, dentistId).then(({ error: markError }) => {
            if (markError) {
                console.error("Silent error marking messages as read on close:", JSON.stringify(markError, null, 2));
            }
        });
    }
  }, [dentistId, unreadMessages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
            if (isOpenRef.current) {
                markConversationAsRead();
                setIsPickerOpen(false);
                setIsOpen(false);
            }
        } else if (isPickerOpen && pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
            setIsPickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen, markConversationAsRead]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setIsPickerOpen(false);
  };

  const fetchMessages = useCallback(async () => {
    if (!adminUser) return;
    setIsLoading(prevState => ({ ...prevState, messages: true }));
    setMessages([]);

    const { data, error } = await getMessagesBetweenUsers(dentistId, adminUser.id!);
    setIsLoading(prevState => ({ ...prevState, messages: false }));

    if (error) {
        showToast('Erro ao carregar mensagens.', 'error');
        setMessages([]);
    } else {
        const fetchedMessages = data || [];
        setMessages(fetchedMessages);

        // In the background, tell the server to mark these as read
        const idsToMarkAsRead = fetchedMessages
            .filter(msg => msg.recipient_id === dentistId && !msg.is_read)
            .map(msg => msg.id);
            
        if (idsToMarkAsRead.length > 0) {
            markMessagesAsRead(idsToMarkAsRead, dentistId).then(({ error: markError }) => {
                if (markError) {
                    console.error("Background error marking messages as read:", JSON.stringify(markError, null, 2));
                }
            });
        }
    }
  }, [adminUser, dentistId, showToast]);

  const toggleChat = () => {
    if (!(window as any).isAudioUnlocked) {
        const audio = document.getElementById('notification-sound') as HTMLAudioElement;
        if (audio) {
            audio.play().then(() => {
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
                (window as any).isAudioUnlocked = true;
            }).catch(() => {});
        }
    }
    
    const nextIsOpenState = !isOpen;
    setIsOpen(nextIsOpenState);
    if (nextIsOpenState) {
      // Optimistically clear unread count.
      setUnreadMessages([]);
      if (adminUser) {
        fetchMessages();
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachedFiles.length === 0) || !adminUser?.id) return;
  
    setIsSending(true);
    const textContent = newMessage.trim();
    const filesToSend = [...attachedFiles];
  
    setNewMessage('');
    setAttachedFiles([]);
  
    const sentMessages: ChatMessage[] = [];
  
    try {
      if (textContent) {
        const { data, error } = await sendMessage({
          sender_id: dentistId,
          recipient_id: adminUser.id,
          content: textContent,
        });
        if (error) throw new Error("Falha ao enviar mensagem de texto.");
        if (data) sentMessages.push(data);
      }
  
      for (const file of filesToSend) {
        const { data: uploadData, error: uploadError } = await uploadChatFile(file, dentistId);
        if (uploadError) {
          showToast(`Falha no upload de ${file.name}.`, 'error');
          continue;
        }
  
        if (uploadData?.publicUrl) {
          const { data, error } = await sendMessage({
            sender_id: dentistId,
            recipient_id: adminUser.id,
            content: null,
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
        <div ref={widgetRef} className="fixed bottom-24 right-8 w-full max-w-3xl h-[700px] bg-[var(--background-medium)] rounded-xl shadow-2xl flex flex-col z-50 border border-[var(--border-color)] animate-slide-up-widget">
          <header className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--background-light)] rounded-