import React from 'react';
// 🛠️ IMPORT CORRIGIDO: Aponta para o arquivo onde criamos o useDashboard integrado
import { useDashboard } from '../context/DashboardContext.jsx';
import { IoTrendingUp, IoTimeOutline } from 'react-icons/io5';

/**
 * Componente visual para exibir o resumo de faturamento em tempo real.
 */
const VendasTempoReal = () => {
    const { dashboardData } = useDashboard();

    const calcularFallbackVendasHoje = () => {
        const recentes = dashboardData?.pedidos?.recentes || [];
        if (!Array.isArray(recentes) || recentes.length === 0) return 0;

        return recentes.reduce((acc, item) => {
            const tipo = (item?.tipo || '').toString().toLowerCase();
            const valor = parseFloat(item?.valor ?? 0) || 0;
            if (tipo === 'saida') return acc - valor;
            return acc + valor;
        }, 0);
    };
    
    // Blindagem contra dados nulos ou indefinidos vindos do Contexto central
    const vendasHojeContexto = dashboardData?.financeiro?.vendasHoje;
    const faturamentoHoje = (vendasHojeContexto ?? 0) > 0
        ? vendasHojeContexto
        : calcularFallbackVendasHoje();
    const pedidosHoje = dashboardData?.pedidos?.hoje || 0;

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IoTrendingUp style={{ color: '#8a2be2' }} /> Faturamento Hoje
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IoTimeOutline /> Tempo Real
                </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#8a2be2', marginBottom: '5px' }}>
                R$ {faturamentoHoje.toFixed(2)}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                Volume de <strong>{pedidosHoje}</strong> {pedidosHoje === 1 ? 'pedido' : 'pedidos'} hoje.
            </p>
        </div>
    );
};

export default VendasTempoReal;