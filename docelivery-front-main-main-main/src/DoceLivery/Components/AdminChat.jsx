import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoSendOutline, IoPersonOutline, IoCheckmarkDoneOutline } from 'react-icons/io5';
import Styles from './AdminChat.module.css';
import api from '../services/api';

const normalizeMessages = (payload) => {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.messages)) return payload.messages;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.conversation?.messages)) return payload.conversation.messages;

  return [];
};

const normalizeChatList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.chats)) return payload.chats;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.conversations)) return payload.conversations;
  return [];
};

const getChatDisplayName = (chat) => {
  const nome = chat?.user || chat?.nomeUsuario || chat?.nome || chat?.cliente?.nome || chat?.usuario?.nome || '';
  return nome || '—';
};

const getChatUserType = (chat) => {
  const tipo = String(chat?.userType || chat?.tipoUsuario || chat?.role || chat?.tipo || '').toLowerCase();
  if (tipo === 'cliente') return 'Cliente';
  if (tipo === 'entregador') return 'Entregador';
  if (tipo === 'admin') return 'Administrador';
  if (tipo === 'confeiteiro') return 'Confeiteiro';
  return '';
};

const getChatStatus = (chat) => {
  const onlineFlag = chat?.isOnline ?? chat?.online ?? chat?.connected ?? chat?.statusOnline;
  if (typeof onlineFlag === 'boolean') return onlineFlag ? 'online' : 'offline';

  const status = String(chat?.status || chat?.state || chat?.presence || '').toLowerCase();
  if (['online', 'disponivel', 'ativo', 'connected', 'available', 'open'].includes(status)) return 'online';
  if (['offline', 'indisponivel', 'inativo', 'disconnected', 'closed', 'busy'].includes(status)) return 'offline';
  return 'offline';
};

const getActivityText = (chat) => {
  const rawValue = chat?.lastActivity || chat?.lastSeen || chat?.updatedAt || chat?.timestamp || chat?.lastMessageTime;
  if (!rawValue) return '';

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) return '';

  const diffMinutes = Math.floor((Date.now() - parsedDate.getTime()) / 60000);
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays}d`;
};

const AdminChat = ({ ticketId }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [ticket, setTicket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      return undefined;
    }

    let isMounted = true;

    const carregarDetalhesChat = async () => {
      try {
        const response = await api.get(`/api/suporte/tickets/${ticketId}`);
        if (isMounted) {
          setTicket(response?.data || response);
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do chat:', error);
      }
    };

    carregarDetalhesChat();
    const interval = window.setInterval(carregarDetalhesChat, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [ticketId]);

  const carregarDetalhesDoChat = useCallback(async (chatId) => {
    if (!chatId) return null;

    try {
      const response = await api.get(`/admin/chats/${chatId}`);
      return {
        ...(response || {}),
        id: chatId,
        messages: normalizeMessages(response?.messages || response?.data || response?.conversation || response),
      };
    } catch (err) {
      console.error('Erro ao buscar detalhes do chat:', err);
      return null;
    }
  }, []);

  const buscarChats = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const response = await api.get('/admin/chats');
      const chatsApi = normalizeChatList(response);
      const onlineCount = response?.onlineUsersCount ?? response?.onlineUsers ?? response?.totalOnline ?? chatsApi.filter((chat) => getChatStatus(chat) === 'online').length;
      
      if (response || Array.isArray(chatsApi)) {
        setActiveChats(chatsApi);
        setOnlineUsers(onlineCount || 0);

        if (selectedChat) {
          const chatAtualizado = chatsApi.find((c) => String(c.id) === String(selectedChat.id));
          if (chatAtualizado) {
            const detalhes = await carregarDetalhesDoChat(chatAtualizado.id);
            setSelectedChat((prev) => {
              if (!prev || String(prev.id) !== String(chatAtualizado.id)) return prev;
              return {
                ...prev,
                ...chatAtualizado,
                ...(detalhes || {}),
                messages: detalhes?.messages?.length ? detalhes.messages : prev.messages || chatAtualizado.messages || [],
              };
            });
          }
        }
      }
      setErro(null);
    } catch (err) {
      console.error('Erro ao buscar as conversas da API:', err);
      setErro('Não foi possível se comunicar com o servidor do chat.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [carregarDetalhesDoChat, selectedChat]);

  // Carregamento inicial e loop do chat (Polling) para atualização sem usar websockets legados
  useEffect(() => {
    buscarChats();
    
    const interval = setInterval(() => {
      buscarChats(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [buscarChats]);

  useEffect(() => {
    if (selectedChat?.id) {
      const carregar = async () => {
        const detalhes = await carregarDetalhesDoChat(selectedChat.id);
        if (detalhes) {
          setSelectedChat((prev) => prev && String(prev.id) === String(selectedChat.id)
            ? { ...prev, ...detalhes, messages: detalhes.messages?.length ? detalhes.messages : prev.messages || [] }
            : prev);
        }
      };

      carregar();
    }
    scrollToBottom();
  }, [selectedChat?.id, carregarDetalhesDoChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    if (!chat?.id) return;

    const detalhes = await carregarDetalhesDoChat(chat.id);
    if (detalhes) {
      setSelectedChat((prev) => prev && String(prev.id) === String(chat.id)
        ? { ...prev, ...chat, ...detalhes, messages: detalhes.messages?.length ? detalhes.messages : prev.messages || [] }
        : prev);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      const payload = {
        sender: 'admin',
        text: message.trim()
      };

      const resposta = await api.post(`/admin/chats/${selectedChat.id}/messages`, payload);
      const mensagemCriada = resposta?.message || resposta?.data || resposta;

      if (mensagemCriada) {
        setSelectedChat(prev => ({
          ...prev,
          messages: [...(prev.messages || []), mensagemCriada],
          lastMessage: mensagemCriada.text || mensagemCriada.message || message.trim(),
          timestamp: mensagemCriada.time || mensagemCriada.createdAt || new Date().toISOString()
        }));
      }
      
      setMessage('');
      scrollToBottom();
      buscarChats(true);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setErro('Não foi possível enviar a mensagem para a API.');
    }
  };

  return (
    <div className={Styles.chatContainer}>
      <div className={Styles.chatSidebar}>
        <div className={Styles.chatHeader}>
          <h3>Chat ao Vivo</h3>
          <div className={Styles.onlineIndicator}>
            <span className={Styles.onlineDot}></span>
            {onlineUsers} online
          </div>
        </div>

        {erro && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '6px 12px', margin: '8px 16px', borderRadius: 6, fontSize: '0.8rem', color: '#856404' }}>
            ⚠️ Problema de conexão.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8a2be2' }}>Carregando chats...</div>
        ) : (
          <div className={Styles.chatList}>
            {activeChats.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '2rem', fontSize: '0.9rem' }}>Nenhum atendimento ativo.</div>
            ) : activeChats.map(chat => (
              <div 
                key={chat.id}
                className={`${Styles.chatItem} ${selectedChat?.id === chat.id ? Styles.active : ''}`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className={Styles.chatAvatar}>
                  <IoPersonOutline size={20} />
                  <span className={`${Styles.statusDot} ${Styles[getChatStatus(chat)]}`}></span>
                </div>
                <div className={Styles.chatInfo}>
                  <div className={Styles.chatName}>
                    {getChatDisplayName(chat)}
                    <span className={Styles.userType}>
                      {getChatUserType(chat).charAt(0)}
                    </span>
                  </div>
                  <div className={Styles.lastMessage}>{chat.lastMessage || chat.ultimaMensagem || ''}</div>
                  <div className={Styles.chatTime}>
                    {chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
                {(chat.unread || 0) > 0 && (
                  <div className={Styles.unreadBadge}>{chat.unread}</div>
                )}
                {(chat.priority === 'high' || chat.prioridade === 'alta') && (
                  <div className={Styles.priorityBadge}>!</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={Styles.chatMain}>
        {selectedChat ? (
          <>
            <div className={Styles.chatMainHeader}>
              <div className={Styles.chatUserInfo}>
                <IoPersonOutline size={24} />
                <div>
                  {ticket && (
                    <div style={{ fontSize: '0.75rem', color: '#6b21a8', marginBottom: '2px', fontWeight: 600 }}>
                      Ticket #{ticket.id || ticketId}
                      {ticket.assunto ? ` · ${ticket.assunto}` : ''}
                    </div>
                  )}
                  <h4>{getChatDisplayName(selectedChat)}</h4>
                  <span>{getChatUserType(selectedChat)}</span>
                  <div style={{ fontSize: '0.72rem', color: getChatStatus(selectedChat) === 'online' ? '#2e7d32' : '#666', marginTop: '2px' }}>
                    {selectedChat?.isTyping || selectedChat?.typing ? 'Digitando...' : `${getChatStatus(selectedChat) === 'online' ? 'Online' : 'Offline'}${getActivityText(selectedChat) ? ` · ${getActivityText(selectedChat)}` : ''}`}
                  </div>
                </div>
              </div>
            </div>

            <div className={Styles.messagesContainer}>
              {(selectedChat.messages || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>Nenhuma mensagem recebida ainda.</div>
              ) : (selectedChat.messages || []).map(msg => {
                const texto = msg.text || msg.texto || '';
                const horario = msg.time || msg.dataHora;
                return (
                  <div key={msg.id || `${texto}-${horario}`} className={`${Styles.message} ${Styles[msg.sender || 'user']}`}>
                    <div className={Styles.messageContent}>
                      <p>{texto}</p>
                      <span className={Styles.messageTime}>
                        {horario ? new Date(horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        {msg.sender === 'admin' && <IoCheckmarkDoneOutline size={12} />}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className={Styles.messageInput}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className={Styles.sendBtn}>
                <IoSendOutline size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className={Styles.noChatSelected}>
            <IoPersonOutline size={64} />
            <h3>Selecione um chat para começar</h3>
            <p>Escolha uma conversa da lista para iniciar o atendimento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;