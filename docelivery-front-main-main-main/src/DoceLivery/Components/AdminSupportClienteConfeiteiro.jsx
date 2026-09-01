import React, { useEffect, useMemo, useState } from 'react';
import { IoSearchOutline, IoPersonOutline, IoStorefrontOutline, IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import Styles from './AdminPanel.module.css';
import ApiService from '../services/api';

const normalizarTickets = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.tickets)) return payload.tickets;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;

  const arrays = Object.values(payload).filter(Array.isArray);
  return arrays.length > 0 ? arrays[0] : [];
};

const classificarTipo = (ticket) => {
  const raw = `${ticket?.usuario?.tipoUsuario || ticket?.tipoUsuario || ticket?.userType || ticket?.tipo || ticket?.role || ''}`.toLowerCase();

  if (raw.includes('confeiteiro')) return 'confeiteiro';
  if (raw.includes('entregador')) return 'entregador';
  return 'cliente';
};

const formatarStatus = (status) => {
  const texto = String(status || '').toLowerCase();
  if (texto.includes('aberto')) return 'Aberto';
  if (texto.includes('andamento') || texto.includes('pend')) return 'Em Andamento';
  if (texto.includes('resol')) return 'Resolvido';
  return status || 'Aberto';
};

const obterCorStatus = (status) => {
  const texto = String(status || '').toLowerCase();
  if (texto.includes('resol')) return '#4CAF50';
  if (texto.includes('andamento') || texto.includes('pend')) return '#FF9800';
  return '#f44336';
};

const renderLinhaTicket = (ticket, tipo) => {
  const nomeUsuario = ticket?.usuario?.nome || ticket?.nomeUsuario || ticket?.cliente?.nome || 'Usuário';
  const problema = ticket?.issue || ticket?.assunto || ticket?.mensagem || 'Sem problema informado';
  const dataCriacao = ticket?.createdAt || ticket?.dataCriacao || ticket?.created_at;

  return (
    <tr key={`${tipo}-${ticket.id || Math.random()}`}>
      <td>
        <div className={Styles.userInfo}>
          <div className={Styles.userAvatar}>
            {tipo === 'confeiteiro' ? <IoStorefrontOutline size={16} /> : <IoPersonOutline size={16} />}
          </div>
          <div>
            <div className={Styles.userName}>{ticket.id || 'Sem ID'}</div>
            <div className={Styles.userEmail}>{nomeUsuario}</div>
          </div>
        </div>
      </td>
      <td>{problema}</td>
      <td>
        <span style={{ color: obterCorStatus(ticket.status), fontWeight: 600 }}>
          {formatarStatus(ticket.status)}
        </span>
      </td>
      <td>{dataCriacao ? new Date(dataCriacao).toLocaleString('pt-BR') : '-'}</td>
    </tr>
  );
};

const AdminSupportClienteConfeiteiro = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const carregarTickets = async () => {
      try {
        setLoading(true);
        const endpoints = ['/admin/support/tickets', '/support/tickets', '/tickets', '/admin/tickets'];
        const respostas = await Promise.allSettled(endpoints.map((url) => ApiService.get(url)));
        const lista = respostas
          .filter((resposta) => resposta.status === 'fulfilled')
          .flatMap((resposta) => normalizarTickets(resposta.value));

        setTickets(lista);
        setErro(null);
      } catch (err) {
        console.error('Erro ao carregar tickets de suporte:', err);
        setErro('Não foi possível carregar os tickets de suporte.');
      } finally {
        setLoading(false);
      }
    };

    carregarTickets();
  }, []);

  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((ticket) => {
      const tipo = classificarTipo(ticket);
      const texto = `${ticket?.issue || ticket?.assunto || ''} ${ticket?.usuario?.nome || ticket?.nomeUsuario || ''}`.toLowerCase();
      const matchesSearch = texto.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || String(ticket.status || '').toLowerCase().includes(statusFilter.toLowerCase());
      return matchesSearch && matchesStatus && (tipo === 'cliente' || tipo === 'confeiteiro');
    });
  }, [tickets, searchTerm, statusFilter]);

  const clienteTickets = ticketsFiltrados.filter((ticket) => classificarTipo(ticket) === 'cliente');
  const confeiteiroTickets = ticketsFiltrados.filter((ticket) => classificarTipo(ticket) === 'confeiteiro');

  return (
    <div className={Styles.adminPanel}>
      <div className={Styles.panelHeader}>
        <div className={Styles.searchContainer}>
          <IoSearchOutline className={Styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por cliente ou confeiteiro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={Styles.searchInput}
          />
        </div>

        <div className={Styles.filterContainer}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={Styles.filterSelect}>
            <option value="all">Todos os status</option>
            <option value="aberto">Abertos</option>
            <option value="andamento">Em andamento</option>
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando suporte...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.2)', borderRadius: '12px', padding: '12px 16px', color: '#2e7d32', fontWeight: 600 }}>
                <IoPersonOutline size={16} style={{ marginRight: 8 }} />
                Clientes: {clienteTickets.length}
              </div>
              <div style={{ background: 'rgba(138, 43, 226, 0.08)', border: '1px solid rgba(138, 43, 226, 0.2)', borderRadius: '12px', padding: '12px 16px', color: '#8a2be2', fontWeight: 600 }}>
                <IoStorefrontOutline size={16} style={{ marginRight: 8 }} />
                Confeiteiros: {confeiteiroTickets.length}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2e7d32', marginBottom: 12 }}>
                <IoPersonOutline size={18} /> Cliente
              </h3>
              <div className={Styles.tableContainer}>
                <table className={Styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Problema</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clienteTickets.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Nenhum ticket de cliente encontrado.</td></tr>
                    ) : clienteTickets.map((ticket) => renderLinhaTicket(ticket, 'cliente'))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8a2be2', marginBottom: 12 }}>
                <IoStorefrontOutline size={18} /> Confeiteiro
              </h3>
              <div className={Styles.tableContainer}>
                <table className={Styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Problema</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confeiteiroTickets.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Nenhum ticket de confeiteiro encontrado.</td></tr>
                    ) : confeiteiroTickets.map((ticket) => renderLinhaTicket(ticket, 'confeiteiro'))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSupportClienteConfeiteiro;
