import React from 'react';

const PedidoCard = ({ pedido, onAtualizarStatus }) => {
    // Desestruturando as propriedades que vêm do seu Backend Java
    // Note que usamos valorPedido e numeroPedido conforme sua Entity
    const { id, status, cliente, valorPedido, itens, numeroPedido, agendado, dataEntregaAgendada } = pedido;

    // Mapeamento de status para cores (Design do DoceLivery)
    const statusColors = {
        PENDENTE: '#007bff',      // Azul
        EM_PREPARACAO: '#ffc107', // Amarelo
        PRONTO: '#28a745',        // Verde
        AGENDADO: '#17a2b8',      // Ciano
        CANCELADO: '#dc3545',     // Vermelho
    };

    // Texto amigável para exibição
    const statusTexto = {
        PENDENTE: 'Novo Pedido',
        EM_PREPARACAO: 'Em Preparação',
        PRONTO: 'Pronto para Retirada',
        AGENDADO: 'Agendado',
        CANCELADO: 'Cancelado'
    };

    const getAcoes = () => {
        switch (status.toUpperCase()) {
            case 'PENDENTE':
            case 'AGENDADO':
                return (
                    <>
                        <button
                            onClick={() => onAtualizarStatus(id, 'EM_PREPARACAO')}
                            style={{ padding: '8px 12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}
                        >
                            Aceitar / Iniciar
                        </button>
                        <button
                            onClick={() => onAtualizarStatus(id, 'CANCELADO')}
                            style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Recusar
                        </button>
                    </>
                );
            case 'EM_PREPARACAO':
                return (
                    <button
                        onClick={() => onAtualizarStatus(id, 'PRONTO')}
                        style={{ padding: '8px 12px', backgroundColor: '#ff69b4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                    >
                        Marcar como Pronto 🎂
                    </button>
                );
            default:
                return <span style={{ color: '#6c757d', fontWeight: 'italic' }}>Pedido finalizado</span>;
        }
    };

    return (
        <div style={{
            border: `2px solid ${statusColors[status] || '#ccc'}`,
            borderRadius: '12px',
            padding: '15px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>{numeroPedido}</h4>
                <span style={{
                    backgroundColor: statusColors[status] || '#6c757d',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    {statusTexto[status] || status}
                </span>
            </div>

            <div style={{ fontSize: '14px', color: '#555' }}>
                <p style={{ margin: '5px 0' }}><strong>Cliente:</strong> {cliente?.nome || 'Cliente não identificado'}</p>
                
                {/* Exibe a data se for um pedido agendado */}
                {agendado && (
                    <p style={{ margin: '5px 0', color: '#d63384' }}>
                        <strong>Entrega:</strong> {new Date(dataEntregaAgendada).toLocaleString('pt-BR')}
                    </p>
                )}

                <div style={{ margin: '10px 0', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                    <strong>Itens:</strong>
                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                        {itens?.map((item, index) => (
                            <li key={index}>
                                {item.quantidade}x {item.produto?.nome}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <h3 style={{ margin: '15px 0', color: '#ff69b4', textAlign: 'right' }}>
                Total: R$ {valorPedido?.toFixed(2)}
            </h3>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'center' }}>
                {getAcoes()}
            </div>
        </div>
    );
};

export default PedidoCard;