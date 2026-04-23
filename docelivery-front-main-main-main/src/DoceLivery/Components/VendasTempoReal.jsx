import React, { useEffect, useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import Styles from './VendasTempoReal.module.css';

const VendasTempoReal = () => {
    const { dashboardData } = useDashboard();
    const [ultimaVenda, setUltimaVenda] = useState(null);
    const [mostrarNotificacao, setMostrarNotificacao] = useState(false);

    useEffect(() => {
        const vendasHojeAtual = dashboardData.financeiro.vendasHoje;
        
        if (ultimaVenda !== null && vendasHojeAtual > ultimaVenda) {
            setMostrarNotificacao(true);
            setTimeout(() => setMostrarNotificacao(false), 3000);
        }
        
        setUltimaVenda(vendasHojeAtual);
    }, [dashboardData.financeiro.vendasHoje]);

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const hoje = new Date().getDay();

    return (
        <div className={Styles.vendasContainer}>
            {mostrarNotificacao && (
                <div className={Styles.notificacao}>
                    🎉 Nova venda registrada!
                </div>
            )}
            
            <div className={Styles.vendasGrid}>
                {diasSemana.map((dia, index) => {
                    const isHoje = index === hoje;
                    const valor = dashboardData.vendasSemana[
                        ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][index]
                    ];
                    
                    return (
                        <div 
                            key={dia} 
                            className={`${Styles.diaCard} ${isHoje ? Styles.hoje : ''}`}
                        >
                            <span className={Styles.diaNome}>{dia}</span>
                            <span className={Styles.diaValor}>R$ {valor.toFixed(0)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VendasTempoReal;