import React, { useEffect, useState } from 'react';
import { IoCarOutline, IoWalletOutline, IoTimeOutline, IoStatsChartOutline } from 'react-icons/io5';
import Styles from './EntregadorHome.module.css';
import EntregadorService from '../services/entregadorService';

const encontrarValor = (obj, chaves) => {
  if (!obj || typeof obj !== 'object') return undefined;
  const fila = [obj];

  while (fila.length > 0) {
    const atual = fila.shift();

    if (Array.isArray(atual)) {
      fila.push(...atual);
      continue;
    }

    if (!atual || typeof atual !== 'object') continue;

    for (const chave of chaves) {
      if (Object.prototype.hasOwnProperty.call(atual, chave)) {
        const valor = atual[chave];
        if (valor !== undefined && valor !== null && valor !== '') return valor;
      }
    }

    fila.push(...Object.values(atual));
  }

  return undefined;
};

const normalizarDashboard = (response) => {
  const payload = response?.data || response?.dashboard || response?.resumo || response || {};
  return {
    entregasHoje: Number(encontrarValor(payload, ['entregasHoje', 'entregas_hj', 'entregasDia', 'quantidadeEntregasHoje', 'totalEntregasHoje', 'pedidosHoje']) ?? 0),
    ganhosDia: Number(encontrarValor(payload, ['ganhosDia', 'ganhosHoje', 'ganhos_hj', 'valorHoje', 'valorDia', 'totalHoje', 'totalGanhoHoje', 'totalGanhos']) ?? 0),
    tempoOnline: encontrarValor(payload, ['tempoOnline', 'tempo_online', 'tempoAtivo', 'horasOnline']) || '0h 00min',
    avaliacaoMedia: Number(encontrarValor(payload, ['avaliacaoMedia', 'avaliacao', 'mediaAvaliacao', 'rating', 'notaMedia']) ?? 0)
  };
};

const EntregadorHome = ({ statusEntregador, setStatusEntregador }) => {
  const [estatisticas, setEstatisticas] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setCarregando(false);
        return;
      }

      try {
        const response = await EntregadorService.getDashboardData(userId);
        setEstatisticas(normalizarDashboard(response));
      } catch (error) {
        console.warn('Não foi possível carregar o dashboard do entregador:', error);
        setEstatisticas(null);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  const toggleStatus = async () => {
    const proximoStatus = statusEntregador === 'offline' ? 'disponivel' : statusEntregador === 'disponivel' ? 'ocupado' : 'offline';

    if (proximoStatus === 'offline') {
      localStorage.setItem('deliveryCompleted', JSON.stringify({
        timestamp: Date.now(),
        storeName: localStorage.getItem('currentStoreName') || 'Confeitaria',
        orderId: localStorage.getItem('currentOrderId') || '#0000'
      }));
    }

    setStatusEntregador(proximoStatus);

    const userId = localStorage.getItem('userId');
    if (userId) {
      const statusApi = proximoStatus === 'disponivel' ? 'ONLINE' : proximoStatus === 'ocupado' ? 'EM_ENTREGA' : 'OFFLINE';
      try {
        await EntregadorService.updateStatus(userId, statusApi);
      } catch (error) {
        console.warn('Não foi possível atualizar o status no backend:', error);
      }
    }
  };

  const getStatusConfig = () => {
    switch (statusEntregador) {
      case 'disponivel':
        return { color: '#10b981', text: 'Disponível', action: 'Simular Entrega' };
      case 'ocupado':
        return { color: '#f59e0b', text: 'Em Entrega', action: 'Finalizar Entrega' };
      default:
        return { color: '#ef4444', text: 'Offline', action: 'Ficar Online' };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={Styles.homeContainer}>
      
      {/* Status Control */}
      <div className={Styles.statusCard}>
        <div className={Styles.statusHeader}>
          <div className={Styles.statusInfo}>
            <h2>Status: {statusConfig.text}</h2>
            <p>{carregando ? 'Carregando informações do painel...' : statusEntregador === 'offline' ? 'Seu status está offline. Ative-se para receber entregas.' : 'Seu status está ativo e pronto para receber pedidos.'}</p>
          </div>
          <div className={Styles.statusIndicator} style={{ backgroundColor: statusConfig.color }}>
            <div className={Styles.statusDot}></div>
          </div>
        </div>
        <button 
          className={Styles.statusToggle}
          onClick={toggleStatus}
          style={{ backgroundColor: statusConfig.color }}
        >
          {statusConfig.action}
        </button>
      </div>

      {/* Estatísticas */}
      {!carregando && !estatisticas ? (
        <div className={Styles.dicasCard}>
          <h4>📊 Dados do painel</h4>
          <p>Não há métricas disponíveis para este entregador no momento.</p>
        </div>
      ) : (
        <div className={Styles.statsGrid}>
          <div className={Styles.statCard}>
            <IoWalletOutline size={24} color="#10b981" />
            <div>
              <h3>{estatisticas?.ganhosDia != null ? `R$ ${Number(estatisticas.ganhosDia).toFixed(2)}` : '—'}</h3>
              <p>Ganhos Hoje</p>
            </div>
          </div>
          
          <div className={Styles.statCard}>
            <IoCarOutline size={24} color="#3b82f6" />
            <div>
              <h3>{estatisticas?.entregasHoje != null ? estatisticas.entregasHoje : '—'}</h3>
              <p>Entregas Hoje</p>
            </div>
          </div>
          
          <div className={Styles.statCard}>
            <IoTimeOutline size={24} color="#8b5cf6" />
            <div>
              <h3>{estatisticas?.tempoOnline || '—'}</h3>
              <p>Tempo Online</p>
            </div>
          </div>
          
          <div className={Styles.statCard}>
            <IoStatsChartOutline size={24} color="#f59e0b" />
            <div>
              <h3>{estatisticas?.avaliacaoMedia != null ? estatisticas.avaliacaoMedia.toFixed(1) : '—'}</h3>
              <p>Avaliação</p>
            </div>
          </div>
        </div>
      )}

      {/* Dicas */}
      <div className={Styles.dicasCard}>
        <h4>💡 Dica do Dia</h4>
        <p>Os dados do painel são atualizados automaticamente quando o backend disponibiliza as informações da sua conta.</p>
      </div>
    </div>
  );
};

export default EntregadorHome;