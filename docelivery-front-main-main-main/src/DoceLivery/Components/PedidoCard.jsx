import React from 'react';

const PedidoCard = ({ pedido, onAtualizarStatus }) => {
    if (!pedido) return null;

    const { id, status, cliente, valorPedido, itens, numeroPedido, agendado, dataEntregaAgendada } = pedido;
    const statusChave = status ? status.toUpperCase() : 'NOVO';

    // Cores alinhadas ao Enum e status de pagamento do Pix/Dinheiro
    const statusColors = {
        NOVO: '#007bff',          
        PREPARANDO: '#ffc107',    
        PRONTO: '#28a745',        
        AGENDADO: '#17a2b8',      
        CANCELADO: '#dc3545',     
        PENDING: '#f59e0b',       
        PENDENTE: '#f59e0b',      
        AGUARDANDO_PAGAMENTO: '#6f42c1'
    };

    const statusTexto = {
        NOVO: 'Novo Pedido',
        PREPARANDO: 'Em Preparação',
        PRONTO: 'Pronto para Retirada',
        AGENDADO: 'Agendado',
        CANCELADO: 'Cancelado',
        PENDING: 'Aguardando Pix',
        PENDENTE: 'Aguardando Pix',
        AGUARDANDO_PAGAMENTO: 'Pagar na Entrega'
    };

    const getAcoes = () => {
        switch (statusChave) {
            case 'NOVO':
            case 'AGENDADO':
            case 'PENDING':
            case 'PENDENTE':
            case 'AGUARDANDO_PAGAMENTO':
                return (
                    <>
                        <button
                            onClick={() => onAtualizarStatus(id, 'PREPARANDO')}
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
            case 'PREPARANDO':
                return (
                    <button
                        onClick={() => onAtualizarStatus(id, 'PRONTO')}
                        style={{ padding: '8px 12px', backgroundColor: '#ff69b4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                    >
                        Marcar como Pronto 🎂
                    </button>
                );
            default:
                return <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Pedido finalizado</span>;
        }
    };

    return (
        <div style={{
            border: `2px solid ${statusColors[statusChave] || '#ccc'}`,
            borderRadius: '12px',
            padding: '15px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>{numeroPedido || `Pedido #${id}`}</h4>
                <span style={{
                    backgroundColor: statusColors[statusChave] || '#6c757d',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    {statusTexto[statusChave] || statusChave}
                </span>
            </div>

            <div style={{ fontSize: '14px', color: '#555' }}>
                <p style={{ margin: '5px 0' }}><strong>Cliente:</strong> {cliente?.nome || 'Cliente não identificado'}</p>
                
                {agendado && dataEntregaAgendada && (
                    <p style={{ margin: '5px 0', color: '#d63384' }}>
                        <strong>Entrega:</strong> {new Date(dataEntregaAgendada).toLocaleString('pt-BR')}
                    </p>
                )}

                <div style={{ margin: '10px 0', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>Itens:</strong>
                    <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                        {itens?.map((item, index) => (
                            <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* 🖼️ IMAGEM BLINDADA: Substitui automaticamente caminhos errados do banco sem estourar 404 */}
                                <img 
                                    src={item.produto?.fotoUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100'} 
                                    alt="doce" 
                                    style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100';
                                    }}
                                />
                                <span>{item.quantidade}x {item.produto?.nome || 'Doce'}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <h3 style={{ margin: '15px 0', color: '#ff69b4', textAlign: 'right' }}>
                Total: R$ {valorPedido?.toFixed(2) || '0.00'}
            </h3>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'center' }}>
                {getAcoes()}
            </div>
        </div>
    );
};

export default PedidoCard;