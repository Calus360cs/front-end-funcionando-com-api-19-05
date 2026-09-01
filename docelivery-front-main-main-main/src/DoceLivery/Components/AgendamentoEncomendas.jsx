import React, { useState, useEffect, useMemo, useCallback } from 'react';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';

const normalizarLista = (r) => {
    if (Array.isArray(r)) return r;
    if (Array.isArray(r?.content)) return r.content;
    if (Array.isArray(r?.data)) return r.data;
    return [];
};

const AgendamentoEncomendas = ({ onNovaEncomenda }) => {
    const [encomendas, setEncomendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const confeiteiroId = AuthService.getUserId();
    const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);

    const carregarAgendamentos = useCallback(async () => {
        if (!confeiteiroId) return;
        try {
            setLoading(true);
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
            const agendados = Array.from(unicos.values()).filter((p) => {
                const status = (p?.status || '').toUpperCase();
                return (p?.agendado === true || status === 'AGENDADO' || !!p?.dataEntregaAgendada)
                    && status !== 'CANCELADO';
            });
            setEncomendas(agendados);
        } catch (err) {
            console.error('Erro ao carregar agendamentos:', err);
        } finally {
            setLoading(false);
        }
    }, [confeiteiroId]);

    useEffect(() => { carregarAgendamentos(); }, [carregarAgendamentos]);

    useEffect(() => {
        const handler = () => carregarAgendamentos();
        window.addEventListener('pedidoCriado', handler);
        window.addEventListener('pedidoAtualizado', handler);
        return () => {
            window.removeEventListener('pedidoCriado', handler);
            window.removeEventListener('pedidoAtualizado', handler);
        };
    }, [carregarAgendamentos]);

    const encomendasDoDia = useMemo(() => {
        return encomendas.filter((e) => {
            if (!e.dataEntregaAgendada) return false;
            return e.dataEntregaAgendada.split('T')[0] === dataSelecionada;
        });
    }, [encomendas, dataSelecionada]);

    if (loading) return <p style={{ padding: '20px' }}>Carregando agenda...</p>;

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center', color: '#ff69b4' }}>📅 Agenda de Encomendas</h2>

            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label htmlFor="data-filtro" style={{ fontWeight: 'bold', color: '#555' }}>Escolha uma data:</label>
                <input
                    id="data-filtro"
                    type="date"
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                />
            </div>

            <h3 style={{ paddingBottom: '5px', color: '#333' }}>
                Encomendas para: {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR')}
            </h3>

            {encomendasDoDia.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {encomendasDoDia.map((enc) => (
                        <div key={enc.id} style={{ padding: '15px', borderLeft: '5px solid #ff69b4', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                                {enc.observacao || enc.itens?.map((i) => `${i.quantidade}x ${i.nomeProduto || i.produto?.nome}`).join(', ') || 'Encomenda'}
                            </p>
                            <p style={{ margin: '0 0 5px 0' }}><strong>Cliente:</strong> {enc.nomeCliente || enc.cliente?.nome || 'Não informado'}</p>
                            {enc.telefoneCliente && <p style={{ margin: '0 0 5px 0' }}><strong>Telefone:</strong> {enc.telefoneCliente}</p>}
                            <p style={{ margin: '0 0 5px 0' }}><strong>Horário:</strong> {enc.dataEntregaAgendada?.split('T')[1]?.slice(0, 5) || '--:--'}</p>
                            <p style={{ margin: '0' }}><strong>Total:</strong> R$ {parseFloat(enc.valorPedido || enc.total || 0).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', color: '#856404' }}>
                    🎉 Nenhuma encomenda agendada para esta data.
                </p>
            )}

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <button
                    onClick={() => onNovaEncomenda ? onNovaEncomenda() : null}
                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ff69b4, #8a2be2)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    ➕ Registrar Pedido Manual (Balcão / WhatsApp)
                </button>
            </div>
        </div>
    );
};

export default AgendamentoEncomendas;
