import React, { useState, useEffect, useCallback } from 'react';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';
import PedidoCard from './PedidoCard';

// Importações oficiais para o funcionamento do tempo real
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const abas = [
    { id: 'NOVO', nome: 'Novos' },
    { id: 'PREPARANDO', nome: 'Em Preparação' },
    { id: 'PRONTO', nome: 'Prontos' },
    { id: 'SAIU_PARA_ENTREGA', nome: 'Em Entrega' },
    { id: 'ENTREGUE', nome: 'Histórico' },
];

const Pedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('NOVO');
    const confeiteiroId = AuthService.getUserId();

    const carregarPedidos = useCallback(async (abaAtiva = 'NOVO') => {
        try {
            setLoading(true);
            const STATUS_HISTORICO = ['ENTREGUE', 'CONCLUIDO', 'CANCELADO'];
            if (STATUS_HISTORICO.includes(abaAtiva)) {
                const dados = await OrderService.getTodosPedidos(confeiteiroId);
                const finalizados = (dados || []).filter(p =>
                    STATUS_HISTORICO.includes(p.status?.toUpperCase())
                );
                setPedidos(finalizados);
            } else {
                const dados = await OrderService.getFilaTrabalho(confeiteiroId);
                setPedidos(dados || []);
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoading(false);
        }
    }, [confeiteiroId]);

    useEffect(() => {
        carregarPedidos(filtro);
    }, [carregarPedidos, filtro]);

    // 🔴 ESCUTADOR WEBSOCKET EM TEMPO REAL INTEGRADO ÀS ABAS
    useEffect(() => {
        if (!confeiteiroId) return;

        const socket = new SockJS('http://localhost:8080/ws-docelivery');
        const stompClient = Stomp.over(socket);
        stompClient.debug = null; // Limpa o console de logs poluídos do Stomp

        const token = localStorage.getItem('userToken') || localStorage.getItem('token') || '';
        stompClient.connect({ Authorization: `Bearer ${token}` }, () => {
            console.log("✅ WebSocket conectado com sucesso no painel de produção!");

            // Se inscreve na fila mestre enviada pelo backend Java
            stompClient.subscribe('/topico/pedidos', (notificacao) => {
                const pedidoWebSocket = JSON.parse(notificacao.body);

                setPedidos((filaAtual) => {
                    const existeNaTela = filaAtual.some(p => p.id === pedidoWebSocket.id);

                    if (existeNaTela) {
                        // Se o pedido mudou para um status finalizador, tira da fila de trabalho
                        if (pedidoWebSocket.status === 'ENTREGUE' || pedidoWebSocket.status === 'CANCELADO') {
                            return filaAtual.filter(p => p.id !== pedidoWebSocket.id);
                        }
                        // Se mudou de status interno, atualiza o card na aba correspondente
                        return filaAtual.map(p => p.id === pedidoWebSocket.id ? pedidoWebSocket : p);
                    } else {
                        const statusUpper = pedidoWebSocket.status?.toUpperCase();
                        
                        // Captura Pix Pendente, Dinheiro ou novos pedidos
                        if (['NOVO', 'AGUARDANDO_PAGAMENTO', 'PENDING', 'PENDENTE'].includes(statusUpper)) {
                            // Campainha de novo pedido na cozinha! 🔔
                            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav').play().catch(() => {});
                            return [pedidoWebSocket, ...filaAtual];
                        }
                        return filaAtual;
                    }
                });
            });
        }, (error) => {
            console.error("❌ Erro de conexão no WebSocket, tentando restabelecer...", error);
        });

        return () => {
            if (stompClient && stompClient.connected) {
                stompClient.disconnect();
            }
        };
    }, [confeiteiroId]);

    const handleAtualizarStatus = async (id, novoStatus) => {
        try {
            await OrderService.atualizarStatus(id, novoStatus);
            carregarPedidos(filtro);
            window.dispatchEvent(new Event('pedidoAtualizado'));
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status.');
        }
    };

    const handleDespachar = async (id) => {
        try {
            await OrderService.despacharPedido(id);
            carregarPedidos(filtro);
            window.dispatchEvent(new Event('pedidoAtualizado'));
        } catch (error) {
            console.error('Erro ao despachar pedido:', error);
            alert('Erro ao despachar pedido.');
        }
    };

    // Filtra os pedidos mapeando Pix/Dinheiro de forma correta para a aba "Novos"
    const pedidosFiltrados = pedidos.filter(p => {
        const statusAtual = p.status?.toUpperCase();
        if (filtro === 'NOVO') {
            return ['NOVO', 'AGUARDANDO_PAGAMENTO', 'PENDING', 'PENDENTE'].includes(statusAtual);
        }
        return statusAtual === filtro;
    });

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ color: '#333' }}>Fila de Produção em Tempo Real 🔴</h2>
            
            {/* Abas de Navegação */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', marginTop: '15px' }}>
                {abas.map(aba => {
                    const totalAba = pedidos.filter(p => {
                        const s = p.status?.toUpperCase();
                        return aba.id === 'NOVO' 
                            ? ['NOVO', 'AGUARDANDO_PAGAMENTO', 'PENDING', 'PENDENTE'].includes(s)
                            : s === aba.id;
                    }).length;

                    return (
                        <button
                            key={aba.id}
                            onClick={() => { setFiltro(aba.id); carregarPedidos(aba.id); }}
                            style={{
                                padding: '10px 15px',
                                marginRight: '10px',
                                border: 'none',
                                backgroundColor: filtro === aba.id ? '#ff69b4' : '#eee',
                                color: filtro === aba.id ? '#fff' : '#333',
                                cursor: 'pointer',
                                borderRadius: '4px 4px 0 0',
                                fontWeight: 'bold'
                            }}
                        >
                            {aba.nome} ({totalAba})
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <p>Carregando fila de doces...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {pedidosFiltrados.length > 0 ? (
                        pedidosFiltrados.map(pedido => (
                            <PedidoCard
                                key={pedido.id}
                                pedido={pedido}
                                onAtualizarStatus={handleAtualizarStatus}
                                onDespachar={handleDespachar}
                            />
                        ))
                    ) : (
                        <p style={{ fontStyle: 'italic', color: '#666' }}>Nenhum doce nesta categoria.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Pedidos;