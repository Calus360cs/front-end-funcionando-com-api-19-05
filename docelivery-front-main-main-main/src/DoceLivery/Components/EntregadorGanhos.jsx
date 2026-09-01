import React, { useEffect, useState } from 'react';
import { IoWalletOutline, IoTrendingUpOutline, IoCalendarOutline, IoStatsChartOutline } from 'react-icons/io5';
import Styles from './EntregadorGanhos.module.css';
import EntregadorService from '../services/entregadorService';

const normalizarGanhos = (response) => {
  const payload = response?.data || response?.resumo || response?.financeiro || response || {};
  const resumo = payload?.resumo || payload?.dados || payload?.financeiro || payload || {};

  return {
    valor: Number(resumo?.valor ?? resumo?.total ?? resumo?.ganhos ?? resumo?.ganhosTotal ?? resumo?.totalGanhos ?? 0),
    entregas: Number(resumo?.entregas ?? resumo?.totalEntregas ?? resumo?.quantidadeEntregas ?? 0),
    media: Number(resumo?.media ?? resumo?.mediaPorEntrega ?? resumo?.valorMedio ?? 0)
  };
};

const normalizarHistorico = (response) => {
  const payload = response?.historico || response?.data?.historico || response?.financeiro?.historico || response?.data || [];
  const lista = Array.isArray(payload) ? payload : (payload?.historico || payload?.itens || []);

  return lista.map((item) => ({
    data: item?.data || item?.periodo || 'Sem data',
    entregas: Number(item?.entregas ?? item?.totalEntregas ?? item?.quantidadeEntregas ?? 0),
    valor: Number(item?.valor ?? item?.ganhos ?? item?.total ?? item?.totalGanhos ?? 0),
    tempo: item?.tempo || item?.tempoOnline || '0h 00min'
  }));
};

const EntregadorGanhos = ({ showRelatorios = false }) => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('hoje');
  const [ganhos, setGanhos] = useState({});
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarGanhos = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setCarregando(false);
        return;
      }

      try {
        const response = await EntregadorService.getResumoFinanceiro(userId, periodoSelecionado);
        const dadosAtualizados = normalizarGanhos(response);
        const historicoAtualizado = normalizarHistorico(response);

        setGanhos((prev) => ({ ...prev, [periodoSelecionado]: dadosAtualizados }));
        setHistorico(historicoAtualizado);
      } catch (error) {
        console.warn('Não foi possível carregar os ganhos do entregador:', error);
        setGanhos((prev) => ({ ...prev, [periodoSelecionado]: null }));
        setHistorico([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarGanhos();
  }, [periodoSelecionado]);

  const dadosAtual = ganhos[periodoSelecionado] || null;

  return (
    <div className={Styles.ganhosContainer}>
      
      {/* Header */}
      <div className={Styles.ganhosHeader}>
        <h2>{showRelatorios ? '📊 Relatórios e Estatísticas' : '💰 Controle de Ganhos'}</h2>
        <div className={Styles.periodoSelector}>
          <button 
            className={periodoSelecionado === 'hoje' ? Styles.active : ''}
            onClick={() => setPeriodoSelecionado('hoje')}
          >
            Hoje
          </button>
          <button 
            className={periodoSelecionado === 'semana' ? Styles.active : ''}
            onClick={() => setPeriodoSelecionado('semana')}
          >
            Semana
          </button>
          <button 
            className={periodoSelecionado === 'mes' ? Styles.active : ''}
            onClick={() => setPeriodoSelecionado('mes')}
          >
            Mês
          </button>
        </div>
      </div>

      {carregando && <p className={Styles.semAvaliacao}>Carregando ganhos...</p>}

      {/* Cards de Resumo */}
      <div className={Styles.resumoCards}>
        <div className={Styles.resumoCard}>
          <div className={Styles.cardIcon}>
            <IoWalletOutline size={24} color="#10b981" />
          </div>
          <div className={Styles.cardContent}>
            <h3>{dadosAtual ? `R$ ${Number(dadosAtual.valor || 0).toFixed(2)}` : '—'}</h3>
            <p>Total de Ganhos</p>
            <small>{dadosAtual ? 'Dados recebidos da API' : 'Sem dados disponíveis'}</small>
          </div>
        </div>
        
        <div className={Styles.resumoCard}>
          <div className={Styles.cardIcon}>
            <IoStatsChartOutline size={24} color="#3b82f6" />
          </div>
          <div className={Styles.cardContent}>
            <h3>{dadosAtual ? dadosAtual.entregas : '—'}</h3>
            <p>Entregas Realizadas</p>
            <small>{dadosAtual ? 'Atualizado pela API' : 'Aguardando resposta'}</small>
          </div>
        </div>
        
        <div className={Styles.resumoCard}>
          <div className={Styles.cardIcon}>
            <IoTrendingUpOutline size={24} color="#8b5cf6" />
          </div>
          <div className={Styles.cardContent}>
            <h3>{dadosAtual ? `R$ ${Number(dadosAtual.media || 0).toFixed(2)}` : '—'}</h3>
            <p>Média por Entrega</p>
            <small>{dadosAtual ? 'Média calculada pelo backend' : 'Sem dados ainda'}</small>
          </div>
        </div>
      </div>

      {/* Gráfico / evolução */}
      <div className={Styles.graficoCard}>
        <h3>{showRelatorios ? '📈 Resumo de Desempenho' : '📈 Evolução dos Ganhos'}</h3>
        {!dadosAtual ? (
          <p>Nenhum dado de ganho disponível para este período.</p>
        ) : (
          <div className={Styles.graficoSimulado}>
            <p>{showRelatorios ? 'Resumo consolidado com os mesmos dados financeiros já carregados para o painel de ganhos.' : 'Os valores serão exibidos quando o backend retornar as métricas completas.'}</p>
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className={Styles.historicoCard}>
        <h3>{showRelatorios ? '📋 Visão Geral do Período' : '📋 Histórico Detalhado'}</h3>
        <div className={Styles.historicoTable}>
          <div className={Styles.tableHeader}>
            <span>Data</span>
            <span>Entregas</span>
            <span>Ganhos</span>
            <span>Tempo</span>
          </div>
          {historico.length === 0 ? (
            <div className={Styles.tableRow}>
              <span>Sem registros</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
          ) : historico.map((item, index) => (
            <div key={index} className={Styles.tableRow}>
              <span>{item.data}</span>
              <span>{item.entregas}</span>
              <span>R$ {Number(item.valor || 0).toFixed(2)}</span>
              <span>{item.tempo}</span>
            </div>
          ))}
        </div>
      </div>

      {!showRelatorios && (
        <>
          <div className={Styles.metasCard}>
            <h3>🎯 Metas e Conquistas</h3>
            <div className={Styles.metasGrid}>
              <div className={Styles.metaItem}>
                <div className={Styles.metaProgress}>
                  <div className={Styles.progressBar} style={{ width: '80%' }}></div>
                </div>
                <div className={Styles.metaInfo}>
                  <strong>Meta Diária</strong>
                  <span>12/15 entregas</span>
                </div>
              </div>

              <div className={Styles.metaItem}>
                <div className={Styles.metaProgress}>
                  <div className={Styles.progressBar} style={{ width: '65%' }}></div>
                </div>
                <div className={Styles.metaInfo}>
                  <strong>Meta Semanal</strong>
                  <span>R$ 567/R$ 800</span>
                </div>
              </div>

              <div className={Styles.metaItem}>
                <div className={Styles.metaProgress}>
                  <div className={Styles.progressBar} style={{ width: '90%' }}></div>
                </div>
                <div className={Styles.metaInfo}>
                  <strong>Avaliação</strong>
                  <span>4.8/5.0 ⭐</span>
                </div>
              </div>
            </div>
          </div>

          <div className={Styles.dicasFinanceiras}>
            <h4>💡 Dicas para Aumentar os Ganhos</h4>
            <ul>
              <li>🕐 Trabalhe nos horários de pico (12h-14h e 19h-21h)</li>
              <li>📍 Fique em áreas com alta demanda</li>
              <li>⭐ Mantenha uma boa avaliação para receber mais pedidos</li>
              <li>🚀 Complete as metas diárias para ganhar bônus</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default EntregadorGanhos;