import React, { useState, useEffect } from 'react';
import { IoSearchOutline, IoPersonOutline, IoCheckmarkOutline, IoAlertCircleOutline } from 'react-icons/io5';
import Styles from './AdminPanel.module.css';
import ApiService from '../services/api';

const AdminSupport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarTickets = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/admin/support/tickets')
        .catch(() => ApiService.get('/support/tickets'))
        .catch(() => ApiService.get('/tickets'));
      const ticketsApi = Array.isArray(response) ? response : response?.data || response?.tickets || [];
      setTickets(Array.isArray(ticketsApi) ? ticketsApi : []);
      setErro(null);
    } catch (err) {
      setErro('Não foi possível carregar os tickets de suporte.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTickets();

    const handleSupportUpdated = () => {
      carregarTickets();
    };

    window.addEventListener('support:updated', handleSupportUpdated);
    return () => window.removeEventListener('support:updated', handleSupportUpdated);
  }, []);

  useEffect(() => {
    if (!selectedTicket?.id) {
      setMensagens([]);
      return;
    }

    const idLimpo = String(selectedTicket.id).replace('#', '').replace('SUP', '');

    const carregarMensagens = async () => {
      try {
        const response = await ApiService.get(`/admin/support/tickets/${idLimpo}`);
        const mensagensApi = response?.mensagens || response?.messages || response?.data?.mensagens || response?.data?.messages || [];
        setMensagens(Array.isArray(mensagensApi) ? mensagensApi : []);
      } catch (err) {
        console.error('Erro ao carregar mensagens do ticket:', err);
        setMensagens([]);
      }
    };

    carregarMensagens();
    const interval = window.setInterval(carregarMensagens, 3000);

    return () => window.clearInterval(interval);
  }, [selectedTicket?.id]);

  const handleEnviarMensagem = async () => {
    if (!selectedTicket?.id || !novaMensagem.trim()) return;

    try {
      setEnviandoMensagem(true);
      setErro(null);

      const idLimpo = String(selectedTicket.id).replace('#', '').replace('SUP', '');
      const usuarioLogado = JSON.parse(localStorage.getItem('userData') || '{}');

      const payload = {
        remetenteId: usuarioLogado?.id || localStorage.getItem('userId'),
        enviadoPeloAdmin: true,
        conteudo: novaMensagem.trim()
      };

      await ApiService.post(`/admin/support/tickets/${idLimpo}/mensagens`, payload);

      setNovaMensagem('');
      const response = await ApiService.get(`/admin/support/tickets/${idLimpo}`);
      const mensagensApi = response?.mensagens || response?.messages || response?.data?.mensagens || response?.data?.messages || [];
      setMensagens(Array.isArray(mensagensApi) ? mensagensApi : []);
    } catch (err) {
      setErro('Não foi possível enviar a mensagem para o ticket.');
      console.error(err);
    } finally {
      setEnviandoMensagem(false);
    }
  };

 const handleTicketAction = async (ticketId, action) => {
    try {
      setErro(null);
      // 🚀 Correção Sênior: Remove o caractere '#' ou 'SUP' gerado na visualização para mandar apenas o ID limpo ao Java
      const idLimpo = String(ticketId).replace('#', '').replace('SUP', '');

      if (action === 'assign') {
        await ApiService.patch(`/admin/support/tickets/${idLimpo}/assign`);
      } else if (action === 'resolve') {
        await ApiService.patch(`/admin/support/tickets/${idLimpo}/resolve`);
      }
      
      await carregarTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      setErro(`Falha ao executar a ação no backend. Verifique permissões do perfil ADMIN.`);
      console.error(err);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const id = String(ticket.id || '');
    // Busca o nome dentro do objeto usuario associado ao ticket
    const user = ticket.usuario?.nome || ''; 
    const issue = ticket.assunto || ''; // No Java está mapeado como assunto
    
    const matchesSearch = id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        issue.toLowerCase().includes(searchTerm.toLowerCase());
                          
    // Garante que a comparação ignore maiúsculas/minúsculas do banco (ex: "ABERTO", "EM_ANDAMENTO")
    const matchesFilter = filterType === 'all' || String(ticket.status).toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'aberto': return 'suspenso';
      case 'em_andamento': return 'pendente';
      case 'resolvido': return 'ativo';
      default: return 'pendente';
    }
  };

  const getStatusText = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'aberto': return 'Aberto';
      case 'em_andamento': return 'Em Andamento';
      case 'resolvido': return 'Resolvido';
      default: return status || '-';
    }
  };

  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
      case 'alta': return '#f44336';
      case 'medium':
      case 'media': return '#FF9800';
      case 'low':
      case 'baixa': return '#4CAF50';
      default: return '#666';
    }
  };

  return (
    <div className={Styles.adminPanel}>
      <div className={Styles.panelHeader}>
        <div className={Styles.searchContainer}>
          <IoSearchOutline className={Styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar tickets de suporte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={Styles.searchInput}
          />
        </div>
        
        <div className={Styles.filterContainer}>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className={Styles.filterSelect}
          >
            <option value="all">Todos os tickets</option>
            <option value="aberto">Abertos</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="resolvido">Resolvidos</option>
          </select>
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#856404' }}>
          ⚠️ {erro}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando tickets de suporte...</div>
      ) : (
        <div className={Styles.tableContainer}>
          <table className={Styles.dataTable}>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Usuário</th>
                <th>Problema</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                    Nenhum ticket encontrado.
                  </td>
                </tr>
              ) : filteredTickets.map(ticket => {
                const userName = ticket.usuario?.nome || 'Usuário';
                const userType = ticket.usuario?.tipoUsuario || 'CLIENTE';
                return (
                  <tr key={ticket.id}>
                    <td>
                      <div className={Styles.userInfo}>
                        <div className={Styles.userAvatar}>
                          <IoAlertCircleOutline size={16} />
                        </div>
                        <div>
                          <div className={Styles.userName}>{ticket.id}</div>
                          {ticket.relatedOrder && (
                            <div className={Styles.userEmail}>Pedido: {ticket.relatedOrder}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{userName}</div>
                        <small style={{ color: '#666' }}>
                          {userType === 'cliente' ? 'Cliente' : 'Confeiteiro'}
                        </small>
                      </div>
                    </td>
                    <td>{ticket.issue || ticket.assunto}</td>
                    <td>
                      <span style={{ 
                        color: getPriorityColor(ticket.priority),
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: '0.8rem'
                      }}>
                        {ticket.priority === 'high' || ticket.priority === 'alta' ? 'Alta' : 
                         ticket.priority === 'medium' || ticket.priority === 'media' ? 'Média' : 'Baixa'}
                      </span>
                    </td>
                    <td>
                      <span className={`${Styles.status} ${Styles[getStatusColor(ticket.status)]}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pt-BR') : '-'}</td>
                    <td>
                      <div className={Styles.actionButtons}>
                        <button 
                          className={Styles.actionBtn}
                          onClick={() => setSelectedTicket(ticket)}
                          title="Ver detalhes"
                        >
                          <IoSearchOutline size={16} />
                        </button>
                        {ticket.status === 'aberto' && (
                          <button 
                            className={`${Styles.actionBtn} ${Styles.activate}`}
                            onClick={() => handleTicketAction(ticket.id, 'assign')}
                            title="Assumir ticket"
                          >
                            <IoPersonOutline size={16} />
                          </button>
                        )}
                        {ticket.status !== 'resolvido' && (
                          <button 
                            className={`${Styles.actionBtn} ${Styles.activate}`}
                            onClick={() => handleTicketAction(ticket.id, 'resolve')}
                            title="Resolver"
                          >
                            <IoCheckmarkOutline size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <div className={Styles.modal} onClick={() => setSelectedTicket(null)}>
          <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Ticket {selectedTicket.id}</h3>
            <div className={Styles.userDetails}>
              <p><strong>Usuário:</strong> {selectedTicket.usuario?.nome || 'Usuário'} ({selectedTicket.usuario?.tipoUsuario || 'CLIENTE'})</p>
              <p><strong>Problema:</strong> {selectedTicket.issue || selectedTicket.assunto}</p>
              <p><strong>Descrição:</strong> {selectedTicket.description || selectedTicket.descricao || '-'}</p>
              <p><strong>Prioridade:</strong> 
                <span style={{ color: getPriorityColor(selectedTicket.priority), fontWeight: '600', marginLeft: '0.5rem' }}>
                  {selectedTicket.priority === 'high' || selectedTicket.priority === 'alta' ? 'Alta' : 
                   selectedTicket.priority === 'medium' || selectedTicket.priority === 'media' ? 'Média' : 'Baixa'}
                </span>
              </p>
              <p><strong>Status:</strong> {getStatusText(selectedTicket.status)}</p>
              <p><strong>Criado em:</strong> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('pt-BR') : '-'}</p>
              {selectedTicket.assignedTo && (
                <p><strong>Responsável:</strong> {selectedTicket.assignedTo}</p>
              )}
              {selectedTicket.relatedOrder && (
                <p><strong>Pedido Relacionado:</strong> {selectedTicket.relatedOrder}</p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Mensagens</h4>
              {mensagens.length === 0 ? (
                <div style={{ color: '#666', fontSize: '0.95rem' }}>Nenhuma mensagem recebida ainda.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {mensagens.map((mensagem, index) => {
                    const texto = mensagem?.texto || mensagem?.message || mensagem?.mensagem || mensagem?.content || '';
                    const autor = mensagem?.autor || mensagem?.sender || mensagem?.remetente || 'Sistema';
                    const horario = mensagem?.dataEnvio || mensagem?.createdAt || mensagem?.created_at || mensagem?.timestamp;

                    return (
                      <div key={`${mensagem?.id || index}-${autor}`} style={{ background: '#f8f9ff', border: '1px solid #e7e8f3', borderRadius: 10, padding: '0.75rem 0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem', color: '#6b6f8a', marginBottom: '0.35rem' }}>
                          <strong>{autor}</strong>
                          {horario ? <span>{new Date(horario).toLocaleString('pt-BR')}</span> : null}
                        </div>
                        <div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{texto}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <textarea
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder="Digite uma resposta para o cliente..."
                rows={3}
                style={{ width: '100%', border: '1px solid #d9dcf0', borderRadius: 10, padding: '0.75rem', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button
                  className={Styles.closeBtn}
                  style={{ background: 'linear-gradient(135deg, #8a2be2, #6a1b9a)', opacity: enviandoMensagem ? 0.7 : 1 }}
                  onClick={handleEnviarMensagem}
                  disabled={enviandoMensagem}
                >
                  {enviandoMensagem ? 'Enviando...' : 'Enviar mensagem'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              {selectedTicket.status !== 'resolvido' && (
                <button 
                  className={Styles.closeBtn}
                  style={{ background: 'linear-gradient(135deg, #4CAF50, #45a049)' }}
                  onClick={() => handleTicketAction(selectedTicket.id, 'resolve')}
                >
                  Resolver Ticket
                </button>
              )}
              <button 
                className={Styles.closeBtn}
                onClick={() => setSelectedTicket(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;