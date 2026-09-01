/* eslint-disable react-refresh/only-export-components */
import React, { useState, useCallback, useMemo, useContext } from 'react';
import api from '../services/api';
import { DashboardContext } from './dashboardContextInstance'; // Importa o objeto Context do novo arquivo

const toNumber = (value) => {
    const n = parseFloat(value ?? 0);
    return Number.isFinite(n) ? n : 0;
};

const normalizarArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.data)) return value.data;
    return [];
};

const desembrulharResposta = (value) => value?.data ?? value?.dados ?? value?.resultado ?? value;

const normalizarSemana = (value) => {
    const ordem = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
    if (Array.isArray(value)) {
        if (value.length === 0) return ordem.map(day => ({ day, total: 0 }));
        return value.map((item) => ({
            day: item.day ?? item.dia ?? item.name ?? 'Dia',
            total: toNumber(item.total ?? item.valor ?? item.vendas),
        }));
    }

    if (value && typeof value === 'object') {
        return ordem.map(day => ({ day, total: toNumber(value[day] ?? value[day === 'Sab' ? 'Sáb' : day] ?? 0) }));
    }

    return ordem.map(day => ({ day, total: 0 }));
};

export const DashboardProvider = ({ children }) => {
    // Estado inicial zerado/vazio
    const [dashboardData, setDashboardData] = useState({
        pedidos: {
            hoje: 0,
            pendentes: 0,
            emPreparo: 0,
            concluidos: 0,
            recentes: []
        },
        financeiro: {
            vendasHoje: 0,
            vendasSemana: 0,
            vendasMes: 0,
            ticketMedio: 0,
            produtoMaisVendido: '',
            despesasTotais: 0,
            crescimentoMes: 0
        },
        // Guardará os dados dinâmicos da semana vindo da API
        vendasSemana: [], 
        cardapio: {
            totalProdutos: 0,
            produtosAtivos: 0,
            produtosInativos: 0,
            categorias: [],
            produtosBaixoEstoque: 0
        },
        agendamentos: {
            hoje: 0,
            semana: 0,
            proximos: []
        }
    });

    const updatePedidos = useCallback((newData) => {
        setDashboardData(prev => ({
            ...prev,
            pedidos: { ...prev.pedidos, ...newData }
        }));
    }, []);

    const updateFinanceiro = useCallback((newData) => {
        setDashboardData(prev => ({
            ...prev,
            financeiro: { ...prev.financeiro, ...newData }
        }));
    }, []);

    const updateCardapio = useCallback((newData) => {
        setDashboardData(prev => ({
            ...prev,
            cardapio: { ...prev.cardapio, ...newData }
        }));
    }, []);

    const updateAgendamentos = useCallback((newData) => {
        setDashboardData(prev => ({
            ...prev,
            agendamentos: { ...prev.agendamentos, ...newData }
        }));
    }, []);

    const adicionarVenda = useCallback((valor) => {
        setDashboardData(prev => ({
            ...prev,
            financeiro: {
                ...prev.financeiro,
                vendasHoje: prev.financeiro.vendasHoje + valor,
                vendasMes: prev.financeiro.vendasMes + valor
            },
            pedidos: {
                ...prev.pedidos,
                hoje: prev.pedidos.hoje + 1
            }
        }));
    }, []);

    // 🟢 Retorna diretamente os dados da lista mapeados pela API do Java
    const getVendasSemanais = useCallback(() => {
        if (!dashboardData.vendasSemana || dashboardData.vendasSemana.length === 0) {
            const diasNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
            return diasNomes.map(dia => ({ day: dia, total: 0 }));
        }
        return dashboardData.vendasSemana;
    }, [dashboardData.vendasSemana]);

    // Integração real com os Endpoints do Módulo Financeiro
    const carregarDadosFinanceiros = useCallback(async (confeiteiroId) => {
        if (!confeiteiroId) return;
        try {
            const [resumoResult, semanaResult, fluxoResult, filaResult, historicoResult] = await Promise.allSettled([
                api.get(`/financeiro/resumo/${confeiteiroId}?meses=1`),
                api.get(`/financeiro/vendas-semana/${confeiteiroId}`),
                api.get(`/financeiro/fluxo-caixa/${confeiteiroId}`),
                api.get(`/pedidos/confeiteiro/${confeiteiroId}/fila`),
                api.get(`/pedidos/confeiteiro/${confeiteiroId}/historico`),
            ]);

            const resumo = resumoResult.status === 'fulfilled' ? desembrulharResposta(resumoResult.value) : null;
            const semanaApi = semanaResult.status === 'fulfilled' ? desembrulharResposta(semanaResult.value) : null;
            const fluxoApi = fluxoResult.status === 'fulfilled' ? normalizarArray(desembrulharResposta(fluxoResult.value)) : [];
            const fila = filaResult.status === 'fulfilled' ? normalizarArray(desembrulharResposta(filaResult.value)) : [];
            const historico = historicoResult.status === 'fulfilled' ? normalizarArray(desembrulharResposta(historicoResult.value)) : [];

            const pedidos = [...fila, ...historico];
            const pedidosUnicosMap = new Map();
            pedidos.forEach((p) => {
                if (p?.id != null && !pedidosUnicosMap.has(p.id)) pedidosUnicosMap.set(p.id, p);
            });
            const pedidosUnicos = Array.from(pedidosUnicosMap.values());

            const hoje = new Date();
            const mes = hoje.getMonth();
            const ano = hoje.getFullYear();
            const getData = (p) => {
                const raw = p?.dataCriacao ?? p?.dataPedido ?? p?.createdAt ?? p?.dataHora ?? p?.dataAtualizacao;
                if (!raw) return null;
                const d = new Date(raw);
                return Number.isNaN(d.getTime()) ? null : d;
            };
            const getValor = (p) => toNumber(p?.valorPedido ?? p?.valorTotal ?? p?.total ?? p?.valor ?? 0);

            const STATUS_FINALIZADOS = ['ENTREGUE', 'CONCLUIDO', 'PAGO'];
            const pedidosFinalizados = pedidosUnicos.filter((p) => STATUS_FINALIZADOS.includes((p?.status ?? '').toUpperCase()));

            const pedidosDoMes = pedidosFinalizados.filter((p) => {
                const d = getData(p);
                return d && d.getMonth() === mes && d.getFullYear() === ano;
            });
            const pedidosHoje = pedidosFinalizados.filter((p) => {
                const d = getData(p);
                return d && d.toDateString() === hoje.toDateString();
            });

            const totalMesFallback = pedidosDoMes.reduce((acc, p) => acc + getValor(p), 0);
            const totalHojeFallback = pedidosHoje.reduce((acc, p) => acc + getValor(p), 0);
            const ticketFallback = pedidosFinalizados.length > 0
                ? pedidosFinalizados.reduce((acc, p) => acc + getValor(p), 0) / pedidosFinalizados.length
                : 0;

            const receitasFluxo = fluxoApi
                .filter((m) => (m?.tipo ?? '').toUpperCase() === 'ENTRADA')
                .reduce((acc, m) => acc + toNumber(m?.valor), 0);
            const despesasFluxo = fluxoApi
                .filter((m) => (m?.tipo ?? '').toUpperCase() === 'SAIDA')
                .reduce((acc, m) => acc + toNumber(m?.valor), 0);

            const faturamento = toNumber(resumo?.faturamentoBruto ?? resumo?.vendasMes ?? resumo?.vendasTotais) || receitasFluxo || totalMesFallback;
            const custos = toNumber(resumo?.custosOperacionais ?? resumo?.despesasTotais) || despesasFluxo;
            const lucro = toNumber(resumo?.lucroLiquido ?? resumo?.lucro) || (faturamento - custos);
            const ticketMedio = toNumber(resumo?.ticketMedio ?? resumo?.ticketMedioMes) || ticketFallback;
            const totalPedidos = toNumber(resumo?.totalPedidos ?? resumo?.pedidosConcluidos) || pedidosFinalizados.length;

            const vendasMensaisApi = normalizarArray(resumo?.vendasMensais ?? resumo?.vendasPorMes ?? resumo?.mensal);
            const vendasMensais = vendasMensaisApi.length > 0
                ? vendasMensaisApi.map((item) => ({
                    month: item.month ?? item.mes ?? item.name ?? item.nome ?? 'Mês',
                    total: toNumber(item.total ?? item.valor ?? item.vendas ?? item.faturamento)
                }))
                : ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((nome, idx) => {
                const total = pedidosFinalizados
                    .filter((p) => {
                        const d = getData(p);
                        return d && d.getMonth() === idx && d.getFullYear() === ano;
                    })
                    .reduce((acc, p) => acc + getValor(p), 0);
                return { month: nome, total };
            });

            const recentes = fluxoApi.length > 0
                ? fluxoApi.map((m) => ({
                    id: m.id,
                    descricao: m.descricao || 'Movimentação',
                    valor: toNumber(m.valor),
                    tipo: (m.tipo ?? '').toUpperCase() === 'SAIDA' ? 'saida' : 'receita',
                    data: m.dataLancamento ? new Date(m.dataLancamento).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
                }))
                : pedidosFinalizados.slice(0, 10).map((p) => ({
                    id: p.id,
                    descricao: `Pedido #${p.id}`,
                    valor: getValor(p),
                    tipo: 'receita',
                    data: getData(p)?.toLocaleDateString('pt-BR') || new Date().toLocaleDateString('pt-BR'),
                }));

            setDashboardData(prev => ({
                ...prev,
                financeiro: {
                    ...prev.financeiro,
                    vendasHoje: totalHojeFallback,
                    vendasMes: faturamento,
                    vendasTotais: faturamento,
                    ticketMedio,
                    despesasTotais: custos,
                    lucro,
                    lucroLiquido: lucro,
                    crescimentoMes: toNumber(resumo?.crescimentoMes ?? 0),
                    vendasMensais,
                },
                pedidos: {
                    ...prev.pedidos,
                    hoje: pedidosHoje.length,
                    pendentes: fila.filter((p) => ['NOVO', 'PENDENTE', 'AGUARDANDO_PAGAMENTO'].includes((p?.status ?? '').toUpperCase())).length,
                    concluidos: totalPedidos,
                    recentes,
                },
                vendasSemana: normalizarSemana(semanaApi),
            }));

            if (resumoResult.status !== 'fulfilled' || semanaResult.status !== 'fulfilled' || fluxoResult.status !== 'fulfilled') {
                console.warn('Parte dos endpoints financeiros não respondeu. Dados de fallback foram aplicados.');
            }
        } catch (error) {
            console.error('Falha ao carregar dados financeiros. Aplicando estado seguro.', error);
            setDashboardData(prev => ({
                ...prev,
                financeiro: {
                    ...prev.financeiro,
                    vendasHoje: 0,
                    vendasMes: 0,
                    ticketMedio: 0,
                    despesasTotais: 0,
                    lucro: 0,
                    crescimentoMes: 0,
                    vendasMensais: prev.financeiro?.vendasMensais || [],
                },
                pedidos: {
                    ...prev.pedidos,
                    recentes: prev.pedidos?.recentes || [],
                },
                vendasSemana: prev.vendasSemana?.length ? prev.vendasSemana : normalizarSemana(null),
            }));
        }
    }, []);

    // 🟢 OTIMIZAÇÃO CRÍTICA: useMemo evita que as páginas re-renderizem se o estado não mudou
    const contextValue = useMemo(() => ({
        dashboardData,
        updatePedidos,
        updateFinanceiro,
        updateCardapio,
        updateAgendamentos,
        adicionarVenda,
        getVendasSemanais,
        carregarDadosFinanceiros
    }), [
        dashboardData,
        updatePedidos,
        updateFinanceiro,
        updateCardapio,
        updateAgendamentos,
        adicionarVenda,
        getVendasSemanais,
        carregarDadosFinanceiros
    ]);

    return (
        <DashboardContext.Provider value={contextValue}>
            {children}
        </DashboardContext.Provider>
    );
};

// 🚨 HOOK CUSTOMIZADO CRIADO AQUI:
export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard deve ser usado dentro de um DashboardProvider');
    }
    return context;
};
