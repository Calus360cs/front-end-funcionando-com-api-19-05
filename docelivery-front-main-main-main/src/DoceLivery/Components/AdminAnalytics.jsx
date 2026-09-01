import React, { useState, useEffect } from 'react';
import { IoPersonOutline, IoTimeOutline, IoStarOutline, IoAlertCircleOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import Styles from './AdminAnalytics.module.css';
import ApiService from '../services/api';

const getNestedValue = (source, keys, fallback = null) => {
  if (!source || typeof source !== 'object') return fallback;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }

  return fallback;
};

const normalizeSupportMetrics = (payload) => {
  const source = payload?.supportMetrics || payload?.metrics || payload?.data || payload || {};

  return {
    activeTickets: getNestedValue(source, ['activeTickets', 'ticketsAtivos', 'ticketsPendentes', 'pendingTickets', 'openTickets'], null),
    resolvedToday: getNestedValue(source, ['resolvedToday', 'ticketsResolvidos', 'resolvidosHoje', 'resolved'], null),
    avgResolutionTime: getNestedValue(source, ['avgResolutionTime', 'tempoMedioResolucao', 'tempoRespostaMedio', 'averageResolutionTime'], null),
    customerSatisfaction: getNestedValue(source, ['customerSatisfaction', 'satisfacaoCliente', 'satisfacao', 'averageSatisfaction'], null),
    satisfactionChange: getNestedValue(source, ['satisfactionChange', 'variacaoSatisfacao', 'change'], null),
  };
};

const normalizeCustomerSatisfaction = (payload) => {
  const source = payload?.customerSatisfaction || payload?.satisfacao || payload?.satisfaction || payload || {};

  return {
    overall: getNestedValue(source, ['overall', 'media', 'score', 'avaliacaoGeral'], null),
    responseTime: getNestedValue(source, ['responseTime', 'tempoResposta', 'averageResponseTime'], null),
    resolutionRate: getNestedValue(source, ['resolutionRate', 'taxaResolucao', 'resolution'], null),
    totalReviews: getNestedValue(source, ['totalReviews', 'totalAvaliacoes', 'total'], null),
  };
};

const normalizeIssues = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.commonIssues)) return payload.commonIssues;
  if (Array.isArray(payload.problemasComuns)) return payload.problemasComuns;
  if (Array.isArray(payload.issues)) return payload.issues;

  return [];
};

const normalizePerformance = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.agentPerformance)) return payload.agentPerformance;
  if (Array.isArray(payload.performance)) return payload.performance;
  if (Array.isArray(payload.agents)) return payload.agents;

  return [];
};

const normalizeResponseTimeData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.responseTimeData)) return payload.responseTimeData;
  if (Array.isArray(payload.tempoResposta)) return payload.tempoResposta;
  if (Array.isArray(payload.chart)) return payload.chart;

  return [];
};

const AdminAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Estados dinâmicos que virão da API do backend
  const [supportMetrics, setSupportMetrics] = useState({
    activeTickets: null,
    resolvedToday: null,
    avgResolutionTime: null,
    customerSatisfaction: null,
    satisfactionChange: null
  });

  const [commonIssues, setCommonIssues] = useState([]);
  const [agentPerformance, setAgentPerformance] = useState([]);
  const [responseTimeData, setResponseTimeData] = useState([]);
  const [customerSatisfaction, setCustomerSatisfaction] = useState({
    overall: null,
    responseTime: null,
    resolutionRate: null,
    totalReviews: null
  });

  useEffect(() => {
    const buscarAnalytics = async () => {
      try {
        setLoading(true);
        const data = await ApiService.get(`/admin/analytics?period=${selectedPeriod}`);
        const payload = data?.data || data || {};
        
        if (payload) {
          setSupportMetrics(normalizeSupportMetrics(payload));
          setCommonIssues(normalizeIssues(payload));
          setAgentPerformance(normalizePerformance(payload));
          setResponseTimeData(normalizeResponseTimeData(payload));
          setCustomerSatisfaction(normalizeCustomerSatisfaction(payload));
          setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
        setErro(null);
      } catch (err) {
        setErro('Ocorreu um erro ao buscar as métricas analíticas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    buscarAnalytics();
    const interval = setInterval(() => {
      buscarAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  return (
    <div className={Styles.analyticsContainer}>
      <div className={Styles.analyticsHeader}>
        <h2>Analytics de Atendimento</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>
            Atualizado às {lastUpdated || '—'}
          </span>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={Styles.periodSelect}
          >
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
          </select>
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#856404' }}>
          ⚠️ {erro}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando dados analíticos...</div>
      ) : (
        <>
          {/* Métricas Principais */}
          <div className={Styles.metricsGrid}>
            <div className={Styles.metricCard}>
              <div className={Styles.metricIcon} style={{ background: 'linear-gradient(135deg, #4CAF50, #45a049)' }}>
                <IoCheckmarkCircleOutline size={24} />
              </div>
              <div className={Styles.metricContent}>
                <h3>{supportMetrics.resolvedToday ?? '—'}</h3>
                <p>Tickets Resolvidos</p>
                <span className={Styles.metricChange}>no período</span>
              </div>
            </div>

            <div className={Styles.metricCard}>
              <div className={Styles.metricIcon} style={{ background: 'linear-gradient(135deg, #FF9800, #F57C00)' }}>
                <IoTimeOutline size={24} />
              </div>
              <div className={Styles.metricContent}>
                <h3>{supportMetrics.avgResolutionTime ?? '—'}</h3>
                <p>Tempo Médio de Resolução</p>
                <span className={Styles.metricChange}>médio</span>
              </div>
            </div>

            <div className={Styles.metricCard}>
              <div className={Styles.metricIcon} style={{ background: 'linear-gradient(135deg, #2196F3, #1976D2)' }}>
                <IoStarOutline size={24} />
              </div>
              <div className={Styles.metricContent}>
                <h3>{supportMetrics.customerSatisfaction === null || supportMetrics.customerSatisfaction === undefined ? '—' : Number(supportMetrics.customerSatisfaction).toFixed(1)}</h3>
                <p>Satisfação do Cliente</p>
                <span className={Styles.metricChange}>{supportMetrics.satisfactionChange} vs período ant.</span>
              </div>
            </div>

            <div className={Styles.metricCard}>
              <div className={Styles.metricIcon} style={{ background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)' }}>
                <IoAlertCircleOutline size={24} />
              </div>
              <div className={Styles.metricContent}>
                <h3>{supportMetrics.activeTickets ?? '—'}</h3>
                <p>Tickets Ativos</p>
                <span className={Styles.metricChange}>aguardando resposta</span>
              </div>
            </div>
          </div>

          {/* Problemas Mais Comuns */}
          <div className={Styles.issuesSection}>
            <h3>Problemas Mais Comuns</h3>
            <div className={Styles.issuesList}>
              {commonIssues.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>Sem ocorrências de problemas no período.</div>
              ) : commonIssues.map((issue, index) => (
                <div key={index} className={Styles.issueItem}>
                  <div className={Styles.issueInfo}>
                    <div className={Styles.issueName}>{issue.issue || issue.assunto || issue.nome || 'Item sem descrição'}</div>
                    <div className={Styles.issueCount}>{issue.count || issue.totalOcorrencias || issue.total || '0'} ocorrências</div>
                  </div>
                  <div className={Styles.issueMetrics}>
                    <span className={`${Styles.severity} ${Styles[issue.severity || 'low']}`}>
                      {issue.severity === 'high' ? 'Alta' : issue.severity === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                    <span className={`${Styles.trend} ${Styles[issue.trend || 'stable']}`}>
                      {issue.trend === 'up' ? '↗' : issue.trend === 'down' ? '↘' : '→'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance dos Agentes */}
          <div className={Styles.agentSection}>
            <h3>Performance da Equipe</h3>
            <div className={Styles.agentGrid}>
              {agentPerformance.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '1rem', width: '100%' }}>Nenhum agente ativo registrado.</div>
              ) : agentPerformance.map((agent, index) => (
                <div key={index} className={Styles.agentCard}>
                  <div className={Styles.agentAvatar}>
                    <IoPersonOutline size={24} />
                  </div>
                  <div className={Styles.agentInfo}>
                    <h4>{agent.name || agent.nome}</h4>
                    <div className={Styles.agentStats}>
                      <div className={Styles.agentStat}>
                        <span className={Styles.statValue}>{agent.tickets || agent.totalAtendimentos || agent.total || '—'}</span>
                        <span className={Styles.statLabel}>Tickets</span>
                      </div>
                      <div className={Styles.agentStat}>
                        <span className={Styles.statValue}>{agent.satisfaction || agent.notaMedia ? Number(agent.satisfaction || agent.notaMedia).toFixed(1) : '—'}</span>
                        <span className={Styles.statLabel}>Satisfação</span>
                      </div>
                      <div className={Styles.agentStat}>
                        <span className={Styles.statValue}>{agent.avgTime || agent.tempoAtendimento || '—'}</span>
                        <span className={Styles.statLabel}>Tempo Médio</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de Tempo de Resposta */}
          <div className={Styles.chartSection}>
            <h3>Tempo de Resposta por Horário</h3>
            <div className={Styles.chartContainer}>
              {responseTimeData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', width: '100%', padding: '2rem' }}>Sem dados de resposta para o gráfico.</div>
              ) : responseTimeData.map((data, index) => (
                <div key={index} className={Styles.chartBar}>
                  <div 
                    className={Styles.bar}
                    style={{ height: `${(Number(data.time || data.tempo || 0) / 4) * 100}%` }}
                  ></div>
                  <span className={Styles.barLabel}>{data.hour || data.horario || '—'}</span>
                  <span className={Styles.barValue}>{data.time || data.tempo ? `${Number(data.time || data.tempo).toFixed(1)}min` : '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo de Satisfação */}
          <div className={Styles.satisfactionSummary}>
            <h3>Resumo de Satisfação do Cliente</h3>
            <div className={Styles.satisfactionGrid}>
              <div className={Styles.satisfactionItem}>
                <div className={Styles.satisfactionScore}>{customerSatisfaction.overall === null || customerSatisfaction.overall === undefined ? '—' : Number(customerSatisfaction.overall).toFixed(1)}</div>
                <div className={Styles.satisfactionLabel}>Avaliação Geral</div>
                <div className={Styles.satisfactionStars}>
                  {'★'.repeat(Math.floor(customerSatisfaction.overall || 0))}
                </div>
              </div>
              <div className={Styles.satisfactionItem}>
                <div className={Styles.satisfactionScore}>{customerSatisfaction.responseTime || '—'}</div>
                <div className={Styles.satisfactionLabel}>Tempo de Resposta</div>
              </div>
              <div className={Styles.satisfactionItem}>
                <div className={Styles.satisfactionScore}>{customerSatisfaction.resolutionRate || '—'}</div>
                <div className={Styles.satisfactionLabel}>Taxa de Resolução</div>
              </div>
              <div className={Styles.satisfactionItem}>
                <div className={Styles.satisfactionScore}>{customerSatisfaction.totalReviews || customerSatisfaction.totalAvaliacoes || '—'}</div>
                <div className={Styles.satisfactionLabel}>Total de Avaliações</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;