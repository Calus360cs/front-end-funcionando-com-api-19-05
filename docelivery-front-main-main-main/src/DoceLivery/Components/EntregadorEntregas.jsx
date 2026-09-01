import React, { useEffect, useState } from 'react';
import { IoCheckmarkCircleOutline, IoTimeOutline, IoCloseCircleOutline } from 'react-icons/io5';
import Styles from './EntregadorEntregas.module.css';
import EntregadorService from '../services/entregadorService';

const normalizarEntregas = (response) => {
  const payload = response?.data || response?.entregas || response?.items || response || [];
  const lista = Array.isArray(payload)
    ? payload
    : (payload?.content || payload?.entregas || payload?.items || []);

  return lista.map((item, index) => {
    const statusRaw = String(item?.status ?? item?.estado ?? item?.situacao ?? item?.state ?? '').toLowerCase();
    const status = statusRaw.includes('entreg') || statusRaw.includes('conclu') || statusRaw.includes('final')
      ? 'concluida'
      : statusRaw.includes('cancel') || statusRaw.includes('recus') || statusRaw.includes('erro')
        ? 'cancelada'
        : 'pendente';

    return {
      id: item?.id || item?.pedidoId || item?.pedido?.id || `#${index + 1}`,
      cliente: item?.cliente?.nome || item?.clienteNome || item?.nomeCliente || item?.cliente?.name || 'Cliente',
      endereco: item?.endereco || item?.enderecoEntrega || item?.enderecoCliente || item?.enderecoCompleto || 'Endereço não informado',
      produto: item?.produto || item?.descricao || item?.itens?.[0]?.nome || item?.pedido?.descricao || 'Pedido',
      valor: Number(item?.valor ?? item?.valorTotal ?? item?.total ?? item?.preco ?? item?.pedido?.valor ?? 0),
      status,
      data: item?.data || item?.dataEntrega || item?.criadoEm || item?.createdAt || 'Sem data',
      avaliacao: item?.avaliacao ?? item?.nota ?? item?.pedido?.avaliacao ?? null
    };
  });
};

const EntregadorEntregas = () => {
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [entregas, setEntregas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarEntregas = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setCarregando(false);
        return;
      }

      try {
        const response = await EntregadorService.getEntregasAtribuidas(userId);
        const lista = normalizarEntregas(response);
        setEntregas(lista);
      } catch (error) {
        console.warn('Não foi possível carregar as entregas do entregador:', error);
        setEntregas([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarEntregas();
  }, []);

  const entregasFiltradas = entregas.filter(entrega => 
    filtroStatus === 'todas' || entrega.status === filtroStatus
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'concluida': return <IoCheckmarkCircleOutline size={20} color="#10b981" />;
      case 'cancelada': return <IoCloseCircleOutline size={20} color="#ef4444" />;
      default: return <IoTimeOutline size={20} color="#f59e0b" />;
    }
  };

  const renderAvaliacoes = (avaliacao) => {
    if (!avaliacao) return <span className={Styles.semAvaliacao}>-</span>;
    return '⭐'.repeat(avaliacao);
  };

  return (
    <div className={Styles.entregasContainer}>
      
      <div className={Styles.entregasHeader}>
        <h2>🚚 Histórico de Entregas</h2>
        <div className={Styles.filtros}>
          <button 
            className={filtroStatus === 'todas' ? Styles.active : ''}
            onClick={() => setFiltroStatus('todas')}
          >
            Todas ({entregas.length})
          </button>
          <button 
            className={filtroStatus === 'concluida' ? Styles.active : ''}
            onClick={() => setFiltroStatus('concluida')}
          >
            Concluídas ({entregas.filter(e => e.status === 'concluida').length})
          </button>
        </div>
      </div>

      {carregando && <p className={Styles.semAvaliacao}>Carregando histórico de entregas...</p>}

      <div className={Styles.entregasList}>
        {!carregando && entregasFiltradas.length === 0 && (
          <div className={Styles.entregaCard}>
            <p>Nenhuma entrega foi encontrada para este entregador.</p>
          </div>
        )}
        {entregasFiltradas.map(entrega => (
          <div key={entrega.id} className={Styles.entregaCard}>
            <div className={Styles.entregaHeader}>
              <div className={Styles.entregaId}>
                <strong>{entrega.id}</strong>
                <span className={Styles.entregaData}>{entrega.data}</span>
              </div>
              <div className={Styles.entregaStatus}>
                {getStatusIcon(entrega.status)}
                <span>{entrega.status === 'concluida' ? 'Concluída' : 'Cancelada'}</span>
              </div>
            </div>
            
            <div className={Styles.entregaContent}>
              <div className={Styles.clienteInfo}>
                <h4>{entrega.cliente}</h4>
                <p>{entrega.endereco}</p>
              </div>
              
              <div className={Styles.pedidoInfo}>
                <p>{entrega.produto}</p>
                <div className={Styles.entregaMeta}>
                  <span className={Styles.valor}>R$ {entrega.valor.toFixed(2)}</span>
                  <span className={Styles.avaliacao}>
                    {renderAvaliacoes(entrega.avaliacao)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntregadorEntregas;