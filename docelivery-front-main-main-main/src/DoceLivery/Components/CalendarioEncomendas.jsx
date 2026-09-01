import React, { useState, useEffect, useCallback } from 'react';
import { IoAdd } from 'react-icons/io5';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';
import Styles from './CalendarioEncomendas.module.css';

const normalizarLista = (r) => {
    if (Array.isArray(r)) return r;
    if (Array.isArray(r?.content)) return r.content;
    if (Array.isArray(r?.data)) return r.data;
    return [];
};

const CalendarioEncomendas = ({ onNovaEncomenda }) => {
    const [mesAtual, setMesAtual] = useState(new Date());
    const [encomendasAgendadas, setEncomendasAgendadas] = useState([]);
    const confeiteiroId = AuthService.getUserId();

    const carregarAgendamentos = useCallback(async () => {
        if (!confeiteiroId) return;
        try {
            const [fila, historico] = await Promise.allSettled([
                OrderService.getFilaTrabalho(confeiteiroId),
                OrderService.getTodosPedidos(confeiteiroId),
            ]);
            const lista = [
                ...normalizarLista(fila.status === 'fulfilled' ? fila.value : []),
                ...normalizarLista(historico.status === 'fulfilled' ? historico.value : []),
            ];
            const unicos = new Map();
            lista.forEach((p) => { if (p?.id != null) unicos.set(p.id, p); });

            const formatados = Array.from(unicos.values())
                .filter((p) => {
                    const status = (p?.status || '').toUpperCase();
                    return (p?.agendado === true || status === 'AGENDADO' || !!p?.dataEntregaAgendada)
                        && status !== 'CANCELADO';
                })
                .map((p) => {
                    if (!p.dataEntregaAgendada) return null;
                    const partes = p.dataEntregaAgendada.split('T');
                    return {
                        id: p.id,
                        data: partes[0],
                        cliente: p.nomeCliente || p.cliente?.nome || 'Cliente',
                        horario: partes[1]?.slice(0, 5) || '',
                        observacao: p.observacao || '',
                    };
                })
                .filter(Boolean);

            setEncomendasAgendadas(formatados);
        } catch (err) {
            console.error('Erro ao carregar calendário:', err);
        }
    }, [confeiteiroId]);

    useEffect(() => { carregarAgendamentos(); }, [carregarAgendamentos]);

    // Recarrega quando um pedido é criado/atualizado
    useEffect(() => {
        const handler = () => carregarAgendamentos();
        window.addEventListener('pedidoCriado', handler);
        window.addEventListener('pedidoAtualizado', handler);
        return () => {
            window.removeEventListener('pedidoCriado', handler);
            window.removeEventListener('pedidoAtualizado', handler);
        };
    }, [carregarAgendamentos]);

    const getDiasDoMes = () => {
        const ano = mesAtual.getFullYear();
        const mes = mesAtual.getMonth();
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        const dias = [];
        for (let i = 0; i < primeiroDia.getDay(); i++) dias.push(null);
        for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(d);
        return dias;
    };

    const getEncomendasDoDia = (dia) => {
        if (!dia) return [];
        const dataStr = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        return encomendasAgendadas.filter((e) => e.data === dataStr);
    };

    const navegarMes = (dir) => {
        const novo = new Date(mesAtual);
        novo.setMonth(mesAtual.getMonth() + dir);
        setMesAtual(novo);
    };

    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const hoje = new Date();

    return (
        <div className={Styles.calendario}>
            <div className={Styles.calendarioHeader}>
                <button onClick={() => navegarMes(-1)}>‹</button>
                <h3>{meses[mesAtual.getMonth()]} {mesAtual.getFullYear()}</h3>
                <button onClick={() => navegarMes(1)}>›</button>
            </div>

            {onNovaEncomenda && (
                <button
                    onClick={onNovaEncomenda}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'linear-gradient(135deg, #ff69b4, #8a2be2)',
                        color: '#fff', border: 'none', borderRadius: '8px',
                        padding: '8px 14px', fontWeight: 600, cursor: 'pointer',
                        marginBottom: '12px', fontSize: '0.875rem',
                    }}
                >
                    <IoAdd size={16} /> Nova Encomenda
                </button>
            )}

            <div className={Styles.diasSemana}>
                {diasSemana.map((d) => (
                    <div key={d} className={Styles.diaSemana}>{d}</div>
                ))}
            </div>

            <div className={Styles.diasGrid}>
                {getDiasDoMes().map((dia, idx) => {
                    const encomendas = getEncomendasDoDia(dia);
                    const isHoje = dia &&
                        dia === hoje.getDate() &&
                        mesAtual.getMonth() === hoje.getMonth() &&
                        mesAtual.getFullYear() === hoje.getFullYear();

                    return (
                        <div
                            key={idx}
                            className={`${Styles.diaCell} ${isHoje ? Styles.hoje : ''} ${encomendas.length > 0 ? Styles.temEncomenda : ''}`}
                            onClick={() => dia && onNovaEncomenda && onNovaEncomenda(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia))}
                        >
                            {dia && (
                                <>
                                    <span className={Styles.numeroDia}>{dia}</span>
                                    {encomendas.slice(0, 2).map((enc) => (
                                        <div key={enc.id} className={Styles.encomendaItem} title={enc.observacao}>
                                            <span className={Styles.horario}>{enc.horario}</span>
                                            <span className={Styles.cliente}>{enc.cliente}</span>
                                        </div>
                                    ))}
                                    {encomendas.length > 2 && (
                                        <div className={Styles.encomendaItem} style={{ background: '#6b7280' }}>
                                            +{encomendas.length - 2} mais
                                        </div>
                                    )}
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
