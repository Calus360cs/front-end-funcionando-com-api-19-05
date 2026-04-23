import React from 'react';

const PedidoCard = ({ pedido, onAtualizarStatus }) => {
const { id, status, cliente, valor, itens } = pedido;

  // Mapeamento de status para cores
const statusColors = {
    novo: '#007bff', // Azul
    em_preparacao: '#ffc107', // Amarelo
    pronto: '#28a745', // Verde
    historico: '#6c757d', // Cinza
};

const statusTexto = {
novo: 'Novo Pedido',
    em_preparacao: 'Em Preparação',
    pronto: 'Pronto para Retirada/Entrega',
};

const getAcoes = () => {
    switch (status) {
    case 'novo':
        return (
        <>
            <button
            onClick={() => onAtualizarStatus(id, 'em_preparacao')}
            style={{ padding: '8px 12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
            >
            Aceitar
            </button>
            <button
            onClick={() => onAtualizarStatus(id, 'cancelado')}
            style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
            Recusar
            </button>
        </>
        );
    case 'em_preparacao':
        return (
        <button
            onClick={() => onAtualizarStatus(id, 'pronto')}
            style={{ padding: '8px 12px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
            Marcar como Pronto
        </button>
        );
    default:
        return <span style={{ color: '#6c757d' }}>Ações Concluídas</span>;
    }
};

return (
    <div style={{
    border: `1px solid ${statusColors[status] || '#ccc'}`,
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>Pedido #{id}</h4>
        <span style={{
        backgroundColor: statusColors[status] || '#6c757d',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        }}>
        {statusTexto[status] || status}
        </span>
    </div>
    
    <p style={{ margin: '5px 0' }}>**Cliente:** {cliente}</p>
    <p style={{ margin: '5px 0' }}>**Itens:** {itens}</p>
    <h3 style={{ margin: '10px 0 15px 0', color: '#ff69b4' }}>Total: R$ {valor.toFixed(2)}</h3>

    <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
        {getAcoes()}
    </div>
    
      {/* Botão de detalhes em uma implementação real abriria um Modal */}
    <button style={{ marginTop: '10px', width: '100%', padding: '5px', backgroundColor: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Ver Detalhes
    </button>
    </div>
);
};

export default PedidoCard;