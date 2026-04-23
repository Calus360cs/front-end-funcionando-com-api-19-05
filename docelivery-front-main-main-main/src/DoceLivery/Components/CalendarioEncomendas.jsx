import React, { useState } from 'react';
import { IoCalendar, IoTime, IoAdd } from 'react-icons/io5';
import Styles from './CalendarioEncomendas.module.css';

const CalendarioEncomendas = () => {
    const [mesAtual, setMesAtual] = useState(new Date());
    const [encomendasAgendadas] = useState([
        { id: 1, data: '2024-01-15', cliente: 'Ana Silva', produto: 'Bolo Personalizado', horario: '14:00' },
        { id: 2, data: '2024-01-20', cliente: 'João Santos', produto: 'Bolo 3 Andares', horario: '16:00' },
        { id: 3, data: '2024-01-25', cliente: 'Maria Lima', produto: 'Cupcakes Festa', horario: '10:00' }
    ]);

    const getDiasDoMes = () => {
        const ano = mesAtual.getFullYear();
        const mes = mesAtual.getMonth();
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        const diasDoMes = [];

        // Dias vazios no início
        for (let i = 0; i < primeiroDia.getDay(); i++) {
            diasDoMes.push(null);
        }

        // Dias do mês
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            diasDoMes.push(dia);
        }

        return diasDoMes;
    };

    const getEncomendasDoDia = (dia) => {
        if (!dia) return [];
        const dataFormatada = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        return encomendasAgendadas.filter(encomenda => encomenda.data === dataFormatada);
    };

    const navegarMes = (direcao) => {
        const novoMes = new Date(mesAtual);
        novoMes.setMonth(mesAtual.getMonth() + direcao);
        setMesAtual(novoMes);
    };

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className={Styles.calendario}>
            <div className={Styles.calendarioHeader}>
                <button onClick={() => navegarMes(-1)}>‹</button>
                <h3>{meses[mesAtual.getMonth()]} {mesAtual.getFullYear()}</h3>
                <button onClick={() => navegarMes(1)}>›</button>
            </div>

            <div className={Styles.diasSemana}>
                {diasSemana.map(dia => (
                    <div key={dia} className={Styles.diaSemana}>{dia}</div>
                ))}
            </div>

            <div className={Styles.diasGrid}>
                {getDiasDoMes().map((dia, index) => {
                    const encomendas = getEncomendasDoDia(dia);
                    const hoje = new Date();
                    const isHoje = dia && 
                        dia === hoje.getDate() && 
                        mesAtual.getMonth() === hoje.getMonth() && 
                        mesAtual.getFullYear() === hoje.getFullYear();

                    return (
                        <div 
                            key={index} 
                            className={`${Styles.diaCell} ${isHoje ? Styles.hoje : ''} ${encomendas.length > 0 ? Styles.temEncomenda : ''}`}
                        >
                            {dia && (
                                <>
                                    <span className={Styles.numeroDia}>{dia}</span>
                                    {encomendas.map(encomenda => (
                                        <div key={encomenda.id} className={Styles.encomendaItem}>
                                            <span className={Styles.horario}>{encomenda.horario}</span>
                                            <span className={Styles.cliente}>{encomenda.cliente}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarioEncomendas;