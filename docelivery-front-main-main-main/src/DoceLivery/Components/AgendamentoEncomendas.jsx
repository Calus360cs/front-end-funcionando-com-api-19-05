import React, { useState, useMemo } from 'react';

// --- DADOS MOCK (Simulando o que viria do seu backend) ---
const mockEncomendas = [
  // Usando datas no formato YYYY-MM-DD
  { id: 10, cliente: 'Juliana P.', dataEntrega: '2025-09-27', hora: '15:00', total: 75.00, itens: 'Bolo Red Velvet' },
  { id: 11, cliente: 'Roberto M.', dataEntrega: '2025-09-27', hora: '18:30', total: 120.00, itens: '24 Brigadeiros Gourmet' },
  { id: 12, cliente: 'Alice S.', dataEntrega: '2025-09-29', hora: '10:00', total: 50.00, itens: 'Torta de Limão' },
  { id: 13, cliente: 'Felipe B.', dataEntrega: '2025-10-01', hora: '14:00', total: 95.00, itens: 'Mini Naked Cake' },
  { id: 14, cliente: 'Isabela C.', dataEntrega: '2025-10-05', hora: '17:00', total: 150.00, itens: 'Bolo de Aniversário 3kg' },
];

// --- UTILS (Funções Auxiliares) ---

// Função para formatar a data como DD/MM
const formatarData = (dataStr) => {
  const [, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}`;
};

// --- COMPONENTE PRINCIPAL ---
const AgendamentoEncomendas = () => {
  // O estado de data selecionada começa com a data de hoje (simulada)
  const [dataSelecionada, setDataSelecionada] = useState('2025-09-27'); 
  
  // Lista de datas simuladas para o "Calendário"
  // Em uma aplicação real, você geraria um mês inteiro
  const datasSimuladas = [
    '2025-09-26', '2025-09-27', '2025-09-28', '2025-09-29', '2025-09-30', 
    '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05',
  ];
  
  // Mapeia todas as encomendas por data para um acesso rápido
  const encomendasPorData = useMemo(() => {
    return mockEncomendas.reduce((acc, encomenda) => {
      acc[encomenda.dataEntrega] = acc[encomenda.dataEntrega] || [];
      acc[encomenda.dataEntrega].push(encomenda);
      return acc;
    }, {});
  }, []);

  // Filtra as encomendas para a data ativa
  const encomendasDoDia = encomendasPorData[dataSelecionada] || [];

  return (
    <div>
      <h2>Visualização de Encomendas Agendadas</h2>

      {/* 1. Calendário Simplificado / Seleção de Data */}
      <div style={{ display: 'flex', gap: '10px', padding: '15px 0', overflowX: 'auto', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
        {datasSimuladas.map(dataStr => {
          const temEncomenda = encomendasPorData[dataStr] && encomendasPorData[dataStr].length > 0;
          const isSelecionada = dataStr === dataSelecionada;

          return (
            <div
              key={dataStr}
              onClick={() => setDataSelecionada(dataStr)}
              style={{
                cursor: 'pointer',
                padding: '10px 15px',
                borderRadius: '8px',
                textAlign: 'center',
                minWidth: '70px',
                // Estilo para datas com encomendas
                backgroundColor: temEncomenda ? '#ffe6f0' : '#f8f8f8', 
                border: isSelecionada ? '2px solid #ff69b4' : '1px solid #ddd',
                fontWeight: isSelecionada ? 'bold' : 'normal',
                color: isSelecionada ? '#ff69b4' : '#333'
              }}
            >
              <div style={{ fontSize: '1.2em' }}>{formatarData(dataStr)}</div>
              {temEncomenda && (
                <small style={{ color: '#ff69b4' }}>({encomendasPorData[dataStr].length} Encomendas)</small>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Lista de Encomendas do Dia Selecionado */}
      <h3>Encomendas para {formatarData(dataSelecionada)}:</h3>
      
      {encomendasDoDia.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {encomendasDoDia.map(encomenda => (
            <div 
              key={encomenda.id} 
              style={{ padding: '15px', borderLeft: '5px solid #ff69b4', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{encomenda.itens}</p>
              <p style={{ margin: '0 0 5px 0' }}>**Cliente:** {encomenda.cliente}</p>
              <p style={{ margin: '0 0 5px 0' }}>**Horário:** {encomenda.hora}</p>
              <p style={{ margin: '0' }}>**Total:** R$ {encomenda.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', color: '#856404' }}>
          🎉 Nenhuma encomenda agendada para esta data.
        </p>
      )}
      
      {/* 3. Área para Adicionar Nova Encomenda (Simulado) */}
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <button 
          // Em um app real, isso abriria um modal de formulário
          onClick={() => alert('Abrir Modal/Formulário de Nova Encomenda')}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Agendar Nova Encomenda
        </button>
      </div>
    </div>
  );
};

export default AgendamentoEncomendas;