import React, { createContext, useContext, useState } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard deve ser usado dentro de DashboardProvider');
    }
    return context;
};

export const DashboardProvider = ({ children }) => {
    const [dashboardData, setDashboardData] = useState({
        // Dados de Pedidos
        pedidos: {
            hoje: 8,
            pendentes: 3,
            emPreparo: 2,
            concluidos: 15,
            recentes: [
                { id: 101, cliente: 'Ana Silva', produto: 'Bolo de Chocolate', valor: 45.00, status: 'Novo' },
                { id: 102, cliente: 'João Santos', produto: '12 Cupcakes', valor: 36.00, status: 'Em Preparo' },
                { id: 103, cliente: 'Maria Lima', produto: 'Torta de Limão', valor: 55.00, status: 'Concluído' }
            ]
        },
        
        // Dados Financeiros
        financeiro: {
            vendasHoje: 245.00,
            vendasSemana: 1850.00,
            vendasMes: 7200.00,
            ticketMedio: 42.50,
            produtoMaisVendido: 'Bolo de Chocolate'
        },
        
        // Dados de Vendas por Dia da Semana
        vendasSemana: {
            domingo: 320.00,
            segunda: 180.00,
            terca: 450.00,
            quarta: 290.00,
            quinta: 380.00,
            sexta: 520.00,
            sabado: 410.00
        },
        
        // Dados do Cardápio
        cardapio: {
            totalProdutos: 24,
            produtosAtivos: 22,
            produtosInativos: 2,
            categorias: ['Bolos', 'Cupcakes', 'Tortas', 'Doces Finos'],
            produtosBaixoEstoque: 3
        },
        
        // Dados de Agendamentos
        agendamentos: {
            hoje: 2,
            semana: 8,
            proximos: [
                { id: 1, cliente: 'Festa da Ana', data: '2024-01-15', produto: 'Bolo Personalizado' },
                { id: 2, cliente: 'Casamento João', data: '2024-01-20', produto: 'Bolo 3 Andares' }
            ]
        }
    });

    const updatePedidos = (newData) => {
        setDashboardData(prev => ({
            ...prev,
            pedidos: { ...prev.pedidos, ...newData }
        }));
    };

    const updateFinanceiro = (newData) => {
        setDashboardData(prev => ({
            ...prev,
            financeiro: { ...prev.financeiro, ...newData }
        }));
    };

    const updateCardapio = (newData) => {
        setDashboardData(prev => ({
            ...prev,
            cardapio: { ...prev.cardapio, ...newData }
        }));
    };

    const updateAgendamentos = (newData) => {
        setDashboardData(prev => ({
            ...prev,
            agendamentos: { ...prev.agendamentos, ...newData }
        }));
    };

    const adicionarVenda = (valor) => {
        const hoje = new Date();
        const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaAtual = diasSemana[hoje.getDay()];
        
        setDashboardData(prev => ({
            ...prev,
            vendasSemana: {
                ...prev.vendasSemana,
                [diaAtual]: prev.vendasSemana[diaAtual] + valor
            },
            financeiro: {
                ...prev.financeiro,
                vendasHoje: prev.financeiro.vendasHoje + valor,
                vendasSemana: prev.financeiro.vendasSemana + valor
            },
            pedidos: {
                ...prev.pedidos,
                hoje: prev.pedidos.hoje + 1
            }
        }));
    };

    const getVendasSemanais = () => {
        const diasOrdem = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        
        return diasOrdem.map((dia, index) => ({
            day: diasNomes[index],
            total: dashboardData.vendasSemana[dia]
        }));
    };

    return (
        <DashboardContext.Provider value={{
            dashboardData,
            updatePedidos,
            updateFinanceiro,
            updateCardapio,
            updateAgendamentos,
            adicionarVenda,
            getVendasSemanais
        }}>
            {children}
        </DashboardContext.Provider>
    );
};