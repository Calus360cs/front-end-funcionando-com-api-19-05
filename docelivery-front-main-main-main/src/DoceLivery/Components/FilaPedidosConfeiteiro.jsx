import React, { useState, useEffect, useCallback } from 'react';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';
import PedidoCard from './PedidoCard';

const ABAS = [
  { id: 'NOVO',       nome: 'Novos' },
  { id: 'PREPARANDO', nome: 'Em Preparação' },
  { id: 'PRONTO',     nome: 'Prontos' },
  { id: 'HISTORICO',  nome: 'Histórico' },
];

const STATUS_NOVOS = ['NOVO', 'PAGO', 'AGUARDANDO_PAGAMENTO', 'PENDENTE'];

const FilaPedidosConfeiteiro = () => {
  const [pedidos, setPedidos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState('NOVO');
  const confeiteiroId = AuthService.getUserId();

  const carregarFila = useCallback(async () => {
    try {
      const dados = await OrderService.getFilaTrabalho(confeiteiroId);
      setPedidos(dados || []);
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
    } finally {
      setLoading(false);
    }
  }, [confeiteiroId]);

  const carregarHistorico = useCallback(async () => {
    try {
      const dados = await OrderService.getTodosPedidos(confeiteiroId);
      setHistorico(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  }, [confeiteiroId]);

  useEffect(() => {
    carregarFila();
    const intervalo = setInterval(carregarFila, 10000);
    return () => clearInterval(intervalo);
  }, [carregarFila]);

  useEffect(() => {
    if (filtro === 'HISTORICO') carregarHistorico();
  }, [filtro, carregarHistorico]);

  const handleAtualizarStatus = async (id, novoStatus) => {
    try {
      await OrderService.atualizarStatus(id, novoStatus);
      carregarFila();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status do pedido.');
    }
  };

  const pedidosFiltrados = filtro === 'HISTORICO'
    ? historico
    : pedidos.filter(p => {
        const s = p.status?.toUpperCase();
        return filtro === 'NOVO' ? STATUS_NOVOS.includes(s) : s === filtro;
      });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#333' }}>Fila de Pedidos 🧁</h2>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        {ABAS.map(aba => {
          const total = filtro === 'HISTORICO'
            ? historico.length
            : pedidos.filter(p => {
                const s = p.status?.toUpperCase();
                return aba.id === 'NOVO' ? STATUS_NOVOS.includes(s) : s === aba.id;
              }).length;

          return (
            <button
              key={aba.id}
              onClick={() => setFiltro(aba.id)}
              style={{
                padding: '10px 15px',
                marginRight: '10px',
                border: 'none',
                backgroundColor: filtro === aba.id ? '#ff69b4' : '#eee',
                color: filtro === aba.id ? '#fff' : '#333',
                cursor: 'pointer',
                borderRadius: '4px 4px 0 0',
                fontWeight: 'bold',
              }}
            >
              {aba.nome} ({total})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p>Carregando pedidos...</p>
      ) : pedidosFiltrados.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>Nenhum pedido nesta categoria.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {pedidosFiltrados.map(pedido => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onAtualizarStatus={handleAtualizarStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilaPedidosConfeiteiro;
