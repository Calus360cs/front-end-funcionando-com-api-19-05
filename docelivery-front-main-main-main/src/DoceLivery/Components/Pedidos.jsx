import React, { useState } from 'react';
import PedidoCard from './PedidoCard'; // Componente para cada pedido

// Dados simulados
const pedidosMock = [
  { id: 1, status: 'novo', cliente: 'Ana C.', valor: 55.00, itens: 3 },
  { id: 2, status: 'em_preparacao', cliente: 'Bruno S.', valor: 89.50, itens: 5 },
  { id: 3, status: 'novo', cliente: 'Carlos P.', valor: 32.00, itens: 2 },
  { id: 4, status: 'pronto', cliente: 'Daniela R.', valor: 120.00, itens: 8 },
];

const Pedidos = () => {
  const [filtro, setFiltro] = useState('novo');
  
  // Lógica de filtragem
  const pedidosFiltrados = pedidosMock.filter(p => p.status === filtro);
  
  const handleAtualizarStatus = (id, novoStatus) => {
    // Lógica para atualizar o status do pedido no backend (API)
    console.log(`Pedido ${id} atualizado para: ${novoStatus}`);
    // Na vida real, você faria um fetch/axios call aqui e atualizaria o estado principal dos pedidos
  };

  const abas = [
    { id: 'novo', nome: 'Novos' },
    { id: 'em_preparacao', nome: 'Em Preparação' },
    { id: 'pronto', nome: 'Prontos' },
    { id: 'historico', nome: 'Histórico' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        {abas.map(aba => (
          <button
            key={aba.id}
            onClick={() => setFiltro(aba.id)}
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
            {aba.nome} ({pedidosMock.filter(p => p.status === aba.id).length})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {pedidosFiltrados.length > 0 ? (
          pedidosFiltrados.map(pedido => (
            <PedidoCard 
              key={pedido.id} 
              pedido={pedido} 
              onAtualizarStatus={handleAtualizarStatus} 
            />
          ))
        ) : (
          <p>Nenhum pedido encontrado no status "{filtro}".</p>
        )}
      </div>
    </div>
  );
};

export default Pedidos;