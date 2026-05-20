import React, { useState, useEffect } from 'react';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';
import PedidoCard from './PedidoCard';
import Styles from './PedidosPage.module.css';

// Importação das bibliotecas de WebSocket
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const PedidosPage = () => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const confeiteiroId = AuthService.getUserId();

    // 1. Carregamento inicial da fila via HTTP (Mantido seu código original)
    useEffect(() => {
        carregarPedidos();
    }, []);

    // 2. CONEXÃO EM TEMPO REAL (Adicionado)
    useEffect(() => {
        if (!confeiteiroId) return;

        // Abre conexão com o endpoint do seu WebSocketConfig Java
        const socket = new SockJS('http://localhost:8080/ws-docelivery');
        const stompClient = Stomp.over(socket);

        // Desativa os logs repetitivos do Stomp no console (opcional, deixa o console mais limpo)
        stompClient.debug = null; 

        stompClient.connect({}, () => {
            console.log(`✅ Conectado ao canal de tempo real do Confeiteiro: ${confeiteiroId}`);

            // Se inscreve exatamente no canal configurado no seu PedidoService Java
            stompClient.subscribe(`/topico/confeiteiro/${confeiteiroId}/pedidos`, (notificacao) => {
                const pedidoWebSocket = JSON.parse(notificacao.body);

                setPedidos((filaAtual) => {
                    // Verifica se o pedido recebido já está aparecendo na tela
                    const existeNaTela = filaAtual.some(p => p.id === pedidoWebSocket.id);

                    if (existeNaTela) {
                        // Se o pedido mudou para um status finalizador, removemos ele da fila ativa
                        if (pedidoWebSocket.status === 'ENTREGUE' || pedidoWebSocket.status === 'CANCELADO') {
                            return filaAtual.filter(p => p.id !== pedidoWebSocket.id);
                        }
                        // Se foi apenas uma mudança interna (ex: PENDENTE -> EM_PREPARACAO), atualiza o card
                        return filaAtual.map(p => p.id === pedidoWebSocket.id ? pedidoWebSocket : p);
                    } else {
                        // Se é um pedido totalmente novo que acabou de ser criado pelo cliente
                        if (pedidoWebSocket.status === 'PENDENTE') {
                            // Toca um alerta sonoro de cozinha (Link de áudio público de um 'ping')
                            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav').play().catch(() => {});
                            // Coloca o novo pedido no topo da lista
                            return [pedidoWebSocket, ...filaAtual];
                        }
                        return filaAtual;
                    }
                });
            });
        }, (error) => {
            console.error("❌ Erro na conexão do WebSocket, tentando reconectar em 5s...", error);
        });

        // IMPORTANTE: Limpa a conexão caso o confeiteiro saia dessa página
        return () => {
            // 🚨 Só desconecta se o stompClient existir E estiver conectado de fato
            if (stompClient && stompClient.connected) {
              stompClient.disconnect(() => {
                 console.log("WebSocket desconectado com sucesso!");
              });
            }
        };
    }, [confeiteiroId]);

    const carregarPedidos = async () => {
        try {
            setLoading(true);
            const dados = await OrderService.getFilaTrabalho(confeiteiroId);
            setPedidos(dados || []);
        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
            alert("Erro ao conectar com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (pedidoId, novoStatus) => {
        try {
            // Removeu o carregarPedidos() daqui de dentro! 
            // Motivo: O seu backend Java já dispara o evento via WebSocket no atualizarStatus.
            // A própria resposta da rede vai atualizar a tela para você sem dar "piscar" de carregando.
            await OrderService.atualizarStatus(pedidoId, novoStatus);
        } catch (error) {
            alert("Erro ao atualizar status.");
        }
    };

    if (loading) return <p>Carregando pedidos...</p>;

    return (
        <div className={Styles.pedidosPage}>
            <div className={Styles.pageHeader}>
                <h2>Fila de Produção Real-Time 🔴</h2>
                <button onClick={carregarPedidos} className={Styles.refreshBtn}>Atualizar Lista</button>
            </div>

            <div className={Styles.pedidosGrid}>
                {pedidos.length > 0 ? (
                    pedidos.map(pedido => (
                        <PedidoCard 
                            key={pedido.id} 
                            pedido={pedido} 
                            onAtualizarStatus={handleStatusChange} 
                        />
                    ))
                ) : (
                    <p>Não há pedidos pendentes no momento.</p>
                )}
            </div>
        </div>
    );
};

export default PedidosPage;