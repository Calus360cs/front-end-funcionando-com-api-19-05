import React, { useState, useEffect } from 'react';
import { IoSearchOutline, IoReceipt, IoEyeOutline } from 'react-icons/io5';
import Styles from './AdminPanel.module.css';
import ApiService from '../services/api';

const STATUS_MAP = {
  entregue: { label: 'Entregue', css: 'ativo' },
  entregue_confirmado: { label: 'Entregue', css: 'ativo' },
  preparando: { label: 'Preparando', css: 'pendente' },
  pendente: { label: 'Pendente', css: 'pendente' },
  agendado: { label: 'Agendado', css: 'pendente' },
  pronto: { label: 'Pronto', css: 'pendente' },
  saiu_para_entrega: { label: 'Em entrega', css: 'pendente' },
  cancelado: { label: 'Cancelado', css: 'suspenso' },
};

const getStatus = (raw) => STATUS_MAP[(raw || '').toLowerCase()] || { label: raw || '-', css: 'pendente' };

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        setLoading(true);
        // Busca a lista unificada e limpa diretamente da API Sênior
        const response = await ApiService.get('/admin/pedidos');
        setOrders(Array.isArray(response) ? response : []);
        setErro(null);
      } catch (err) {
        setErro('Não foi possível carregar os pedidos em tempo real.');
        console.error("Erro ao buscar pedidos:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  const filteredOrders = orders.filter(order => {
    const id = String(order.id || '');
    const cliente = order.nomeCliente || order.cliente?.nome || order.customer || '';
    const loja = order.nomeLoja || order.loja?.nomeFantasia || order.store || '';
    const status = (order.status || '').toLowerCase();
    const matchesSearch = id.includes(searchTerm) ||
                          cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          loja.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={Styles.adminPanel}>
      <div className={Styles.panelHeader}>
        <div className={Styles.searchContainer}>
          <IoSearchOutline className={Styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por ID, cliente ou loja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={Styles.searchInput}
          />
        </div>
        <div className={Styles.filterContainer}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={Styles.filterSelect}>
            <option value="all">Todos os pedidos</option>
            <option value="pendente">Pendente</option>
            <option value="preparando">Preparando</option>
            <option value="pronto">Pronto</option>
            <option value="saiu_para_entrega">Em entrega</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {erro && <div className={Styles.errorBanner}>⚠️ {erro}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando pedidos...</div>
      ) : (
        <div className={Styles.tableContainer}>
          <table className={Styles.dataTable}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Loja</th>
                <th>Status</th>
                <th>Total</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Nenhum pedido encontrado de forma real no banco.</td></tr>
              ) : filteredOrders.map((order) => {
                const cliente = order.nomeCliente || order.cliente?.nome || '-';
                const loja = order.nomeLoja || order.loja?.nomeFantasia || '-';
                const total = order.valorPedido ?? 0;
                const data = order.dataHoraPedido || '';
                const { label, css } = getStatus(order.status);
                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{cliente}</td>
                    <td>{loja}</td>
                    <td><span className={`${Styles.status} ${Styles[css]}`}>{label}</span></td>
                    <td>R$ {Number(total).toFixed(2)}</td>
                    <td>{data ? new Date(data).toLocaleString('pt-BR') : '-'}</td>
                    <td>
                      <button className={Styles.actionBtn} onClick={() => setSelectedOrder(order)}>
                        <IoEyeOutline size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className={Styles.modal} onClick={() => setSelectedOrder(null)}>
          <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Pedido #{selectedOrder.id}</h3>
            <div className={Styles.userDetails}>
              <p><strong>Cliente:</strong> {selectedOrder.nomeCliente || selectedOrder.cliente?.nome || '-'}</p>
              <p><strong>Loja:</strong> {selectedOrder.nomeLoja || selectedOrder.loja?.nomeFantasia || '-'}</p>
              <p><strong>Status:</strong> <span className={`${Styles.status} ${Styles[getStatus(selectedOrder.status).css]}`}>{getStatus(selectedOrder.status).label}</span></p>
              <p><strong>Total:</strong> R$ {Number(selectedOrder.valorPedido ?? 0).toFixed(2)}</p>
              <p><strong>Data:</strong> {selectedOrder.dataHoraPedido ? new Date(selectedOrder.dataHoraPedido).toLocaleString('pt-BR') : '-'}</p>
              <p><strong>Itens:</strong></p>
              <ul>
                {(selectedOrder.itens || []).map(item => (
                  <li key={item.id}>{item.quantidade}x {item.nomeProduto} - R$ {Number(item.precoUnitario).toFixed(2)}</li>
                ))}
              </ul>
            </div>
            <button
              className={Styles.closeBtn}
              onClick={() => setSelectedOrder(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;