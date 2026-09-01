import React, { useState, useEffect, useRef } from 'react';
import { IoArrowBack, IoCheckmarkCircle, IoTimeOutline } from 'react-icons/io5';
import api from '../services/api';
import Styles from './PedidoStatus.module.css';

const STATUS_LABELS = {
  AGUARDANDO_PAGAMENTO: 'Aguardando confirmação do pagamento...',
  NOVO:                 'Pedido recebido! Aguardando confeiteiro aceitar.',
  PAGO:                 'Pagamento aprovado! Aguardando confeiteiro.',
  PREPARANDO:           'Confeiteiro aceitou! Preparando seus doces 👩🍳',
  EM_PREPARACAO:        'Confeiteiro aceitou! Preparando seus doces 👩🍳',
  PRONTO:               'Pedido pronto! Aguardando entregador.',
  SAIU_PARA_ENTREGA:    'Saiu para entrega! 🛵',
  CONCLUIDO:            'Pedido entregue com sucesso! 🎉',
  ENTREGUE:             'Pedido entregue com sucesso! 🎉',
  CANCELADO:            'Pedido cancelado.',
};

const PROGRESS = {
  AGUARDANDO_PAGAMENTO: 15,
  NOVO: 30, PAGO: 30,
  PREPARANDO: 55, EM_PREPARACAO: 55,
  PRONTO: 75,
  SAIU_PARA_ENTREGA: 90,
  CONCLUIDO: 100, ENTREGUE: 100,
};

const ETAPAS_CONCLUIDAS = {
  PREPARANDO:        ['recebido', 'aceito'],
  EM_PREPARACAO:     ['recebido', 'aceito'],
  PRONTO:            ['recebido', 'aceito'],
  SAIU_PARA_ENTREGA: ['recebido', 'aceito', 'entrega'],
  CONCLUIDO:         ['recebido', 'aceito', 'entrega'],
  ENTREGUE:          ['recebido', 'aceito', 'entrega'],
};

const PedidoStatus = () => {
  const savedOrder   = useRef(JSON.parse(localStorage.getItem('currentOrder') || '{}')).current;
  const savedOrderId = useRef(localStorage.getItem('currentOrderId')).current;

  // status vem da API; itens/total vêm do localStorage (o backend retorna itens:[])
  const [statusAtual,  setStatusAtual]  = useState(null);
  const [carregando,   setCarregando]   = useState(true);

  const orderId = savedOrderId || savedOrder?.id || savedOrder?.pedidoId;

  useEffect(() => {
    if (!orderId) { setCarregando(false); return; }

    const buscar = async () => {
      try {
        const dados = await api.get(`/pedidos/${orderId}`);
        if (dados?.status) setStatusAtual(dados.status.toUpperCase());
      } catch (err) {
        console.error('Erro ao buscar status:', err);
      } finally {
        setCarregando(false);
      }
    };

    buscar();
    const intervalo = setInterval(buscar, 5000);
    return () => clearInterval(intervalo);
  }, [orderId]);

  if (!orderId) {
    return (
      <div className={Styles.container}>
        <div className={Styles.header}>
          <button onClick={() => window.location.href = '/docelivery/cliente/Home-Page'}>
            <IoArrowBack size={24} />
          </button>
          <h2>Pedido não encontrado</h2>
        </div>
        <p style={{ padding: '20px', color: '#666' }}>Nenhum pedido ativo. Faça um novo pedido.</p>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className={Styles.container}>
        <div className={Styles.header}>
          <button onClick={() => window.location.href = '/docelivery/cliente/Home-Page'}>
            <IoArrowBack size={24} />
          </button>
          <h2>Acompanhar Pedido</h2>
        </div>
        <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Carregando status...</p>
      </div>
    );
  }

  // Status: prefere o da API; fallback para o salvo no localStorage
  const statusKey = statusAtual || savedOrder?.status?.toUpperCase() || 'NOVO';
  const progresso = PROGRESS[statusKey] || 15;
  const etapas    = ETAPAS_CONCLUIDAS[statusKey] || ['recebido'];

  // Itens e total: SEMPRE do localStorage (backend retorna itens:[] e total:0)
  const itens = savedOrder?.itens?.length > 0 ? savedOrder.itens : [];
  const total = savedOrder?.total || savedOrder?.valorPedido || 0;
  const nomeLoja = savedOrder?.loja?.nome || 'Confeitaria';

  return (
    <div className={Styles.container}>
      <div className={Styles.header}>
        <button onClick={() => window.location.href = '/docelivery/cliente/Home-Page'}>
          <IoArrowBack size={24} />
        </button>
        <h2>Acompanhar Pedido</h2>
      </div>

      <div className={Styles.orderInfo}>
        <div className={Styles.statusIcon}>
          {statusKey === 'CANCELADO'
            ? <IoTimeOutline size={48} color="#ef4444" />
            : <IoCheckmarkCircle size={48} color="#10b981" />}
        </div>
        <h3>{STATUS_LABELS[statusKey] || 'Processando pedido...'}</h3>
        <p>Pedido #{orderId}</p>
        <p>{nomeLoja}</p>

        <div style={{ width: '100%', background: '#e5e7eb', borderRadius: 8, height: 10, margin: '16px 0 4px' }}>
          <div style={{
            width: `${progresso}%`,
            background: statusKey === 'CANCELADO' ? '#ef4444' : '#10b981',
            height: 10,
            borderRadius: 8,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <small style={{ color: '#9ca3af' }}>Atualiza automaticamente a cada 5 segundos</small>
      </div>

      {itens.length > 0 && (
        <div className={Styles.orderDetails}>
          <h4>Itens do Pedido</h4>
          {itens.map((item, index) => {
            const nome  = item.nomeProduto || item.name || item.title || item.produto?.nome || 'Item';
            const qtd   = parseInt(item.quantidade || item.quantity) || 1;
            const preco = parseFloat(item.precoUnitario || item.price || item.produto?.preco) || 0;
            return (
              <div key={item.id || index} className={Styles.orderItem}>
                <span>{qtd}x {nome}</span>
                <span>R$ {(preco * qtd).toFixed(2)}</span>
              </div>
            );
          })}
          <div className={Styles.total}>
            <strong>Total: R$ {parseFloat(total).toFixed(2)}</strong>
          </div>
        </div>
      )}

      <div className={Styles.statusTimeline}>
        <div className={Styles.timelineItem}>
          <IoCheckmarkCircle size={20} color="#10b981" />
          <span>Pedido recebido</span>
        </div>
        <div className={Styles.timelineItem}>
          {etapas.includes('aceito')
            ? <IoCheckmarkCircle size={20} color="#10b981" />
            : <IoTimeOutline size={20} color="#f59e0b" />}
          <span>Confeiteiro aceitou e está preparando</span>
        </div>
        <div className={Styles.timelineItem}>
          {etapas.includes('entrega')
            ? <IoCheckmarkCircle size={20} color="#10b981" />
            : <IoTimeOutline size={20} color="#d1d5db" />}
          <span>Saiu para entrega</span>
        </div>
      </div>

      <button
        className={Styles.backBtn}
        onClick={() => window.location.href = '/docelivery/cliente/Home-Page'}
      >
        Voltar ao Início
      </button>
    </div>
  );
};

export default PedidoStatus;
