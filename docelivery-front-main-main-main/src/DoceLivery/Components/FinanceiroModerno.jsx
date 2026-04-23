import React, { useState } from 'react';
import { IoTrendingUp, IoTrendingDown, IoCard, IoTime, IoCalendar, IoStatsChart } from 'react-icons/io5';
import { useDashboard } from '../context/DashboardContext';
import SalesChart from './SalesChart';
import Styles from './FinanceiroModerno.module.css';

const FinanceiroModerno = () => {
    const { dashboardData, getVendasSemanais } = useDashboard();
    const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
    
    const dadosFinanceiros = {
        rendimentoMes: 4520.50,
        totalPedidos: 85,
        rendimentoMedio: 53.18,
        pedidosPendentes: 5,
        vendasTotais: 12500.00,
        despesasTotais: 3500.00,
        lucro: 9000.00,
        crescimentoMes: 12.5,
        ticketMedio: 42.30
    };

    const dadosVendasMensais = [
        { month: 'Jan', total: 3200 },
        { month: 'Fev', total: 3800 },
        { month: 'Mar', total: 4100 },
        { month: 'Abr', total: 3900 },
        { month: 'Mai', total: 4520 },
        { month: 'Jun', total: 4800 }
    ];

    const transacoesRecentes = [
        { id: 1, tipo: 'receita', descricao: 'Bolo de Aniversário', valor: 85.00, data: '2024-01-15' },
        { id: 2, tipo: 'despesa', descricao: 'Ingredientes', valor: -120.00, data: '2024-01-14' },
        { id: 3, tipo: 'receita', descricao: 'Kit Festa', valor: 150.00, data: '2024-01-14' },
        { id: 4, tipo: 'receita', descricao: '12 Cupcakes', valor: 48.00, data: '2024-01-13' }
    ];

    return (
        <div className={Styles.financeiroModerno}>
            <div className={Styles.header}>
                <div className={Styles.headerContent}>
                    <h1>Painel Financeiro</h1>
                    <p>Acompanhe suas vendas e rendimento em tempo real</p>
                </div>
                <div className={Styles.periodoSelector}>
                    <button 
                        className={`${Styles.periodoBtn} ${periodoSelecionado === 'semana' ? Styles.active : ''}`}
                        onClick={() => setPeriodoSelecionado('semana')}
                    >
                        Semana
                    </button>
                    <button 
                        className={`${Styles.periodoBtn} ${periodoSelecionado === 'mes' ? Styles.active : ''}`}
                        onClick={() => setPeriodoSelecionado('mes')}
                    >
                        Mês
                    </button>
                    <button 
                        className={`${Styles.periodoBtn} ${periodoSelecionado === 'ano' ? Styles.active : ''}`}
                        onClick={() => setPeriodoSelecionado('ano')}
                    >
                        Ano
                    </button>
                </div>
            </div>

            <div className={Styles.kpiGrid}>
                <div className={`${Styles.kpiCard} ${Styles.rendimento}`}>
                    <div className={Styles.kpiIcon}>
                        <IoTrendingUp size={24} />
                    </div>
                    <div className={Styles.kpiContent}>
                        <h3>Rendimento do Mês</h3>
                        <span className={Styles.kpiValue}>R$ {dadosFinanceiros.rendimentoMes.toFixed(2)}</span>
                        <div className={Styles.kpiMeta}>
                            <span className={Styles.crescimento}>+{dadosFinanceiros.crescimentoMes}%</span>
                            <span>vs mês anterior</span>
                        </div>
                    </div>
                </div>

                <div className={`${Styles.kpiCard} ${Styles.pedidos}`}>
                    <div className={Styles.kpiIcon}>
                        <IoCard size={24} />
                    </div>
                    <div className={Styles.kpiContent}>
                        <h3>Total de Pedidos</h3>
                        <span className={Styles.kpiValue}>{dadosFinanceiros.totalPedidos}</span>
                        <div className={Styles.kpiMeta}>
                            <span>{dadosFinanceiros.pedidosPendentes} pendentes</span>
                        </div>
                    </div>
                </div>

                <div className={`${Styles.kpiCard} ${Styles.ticket}`}>
                    <div className={Styles.kpiIcon}>
                        <IoStatsChart size={24} />
                    </div>
                    <div className={Styles.kpiContent}>
                        <h3>Ticket Médio</h3>
                        <span className={Styles.kpiValue}>R$ {dadosFinanceiros.ticketMedio.toFixed(2)}</span>
                        <div className={Styles.kpiMeta}>
                            <span>por pedido</span>
                        </div>
                    </div>
                </div>

                <div className={`${Styles.kpiCard} ${Styles.lucro}`}>
                    <div className={Styles.kpiIcon}>
                        <IoTrendingUp size={24} />
                    </div>
                    <div className={Styles.kpiContent}>
                        <h3>Lucro Líquido</h3>
                        <span className={Styles.kpiValue}>R$ {dadosFinanceiros.lucro.toFixed(2)}</span>
                        <div className={Styles.kpiMeta}>
                            <span>72% margem</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={Styles.chartsGrid}>
                <div className={Styles.chartCard}>
                    <div className={Styles.chartHeader}>
                        <h3>Vendas da Semana</h3>
                        <span>Últimos 7 dias</span>
                    </div>
                    <SalesChart salesData={getVendasSemanais()} />
                </div>

                <div className={Styles.chartCard}>
                    <div className={Styles.chartHeader}>
                        <h3>Vendas Mensais</h3>
                        <span>Últimos 6 meses</span>
                    </div>
                    <SalesChart salesData={dadosVendasMensais} />
                </div>
            </div>

            <div className={Styles.bottomGrid}>
                <div className={Styles.resumoFinanceiro}>
                    <h3>Resumo Financeiro</h3>
                    <div className={Styles.resumoItem}>
                        <div className={Styles.resumoLabel}>
                            <IoTrendingUp className={Styles.iconReceita} />
                            <span>Vendas Totais</span>
                        </div>
                        <span className={Styles.valorReceita}>R$ {dadosFinanceiros.vendasTotais.toFixed(2)}</span>
                    </div>
                    <div className={Styles.resumoItem}>
                        <div className={Styles.resumoLabel}>
                            <IoTrendingDown className={Styles.iconDespesa} />
                            <span>Despesas Totais</span>
                        </div>
                        <span className={Styles.valorDespesa}>R$ {dadosFinanceiros.despesasTotais.toFixed(2)}</span>
                    </div>
                    <div className={`${Styles.resumoItem} ${Styles.lucroItem}`}>
                        <div className={Styles.resumoLabel}>
                            <IoStatsChart className={Styles.iconLucro} />
                            <span>Lucro Líquido</span>
                        </div>
                        <span className={Styles.valorLucro}>R$ {dadosFinanceiros.lucro.toFixed(2)}</span>
                    </div>
                </div>

                <div className={Styles.transacoesRecentes}>
                    <h3>Transações Recentes</h3>
                    <div className={Styles.transacoesList}>
                        {transacoesRecentes.map(transacao => (
                            <div key={transacao.id} className={Styles.transacaoItem}>
                                <div className={Styles.transacaoInfo}>
                                    <span className={Styles.transacaoDescricao}>{transacao.descricao}</span>
                                    <span className={Styles.transacaoData}>{transacao.data}</span>
                                </div>
                                <span className={`${Styles.transacaoValor} ${Styles[transacao.tipo]}`}>
                                    {transacao.valor > 0 ? '+' : ''}R$ {Math.abs(transacao.valor).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceiroModerno;