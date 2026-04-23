// src/Confeiteiro/components/Header.jsx

import React from 'react';

const HeaderConfeiteiro = ({ nomeLoja }) => {
  // Dados simulados para o canto superior (ex: Confeiteiro logado e notificações)
const usuarioLogado = {
    nome: 'Maria Silva',
    notificacoes: 2 // Por exemplo, 2 novos pedidos
};

return (
    <header style={{
    padding: '20px 30px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
    }}>

      {/* Nome da Loja ou Título da Página */}
    <h2 style={{ margin: 0, color: '#ff69b4' }}>
        {nomeLoja || 'Dashboard do Confeiteiro'}
    </h2>

      {/* Perfil e Notificações */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Ícone de Notificação */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
        🔔
        {usuarioLogado.notificacoes > 0 && (
            <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '0.7em'
            }}>
            {usuarioLogado.notificacoes}
            </span>
          )} {/* <--- A tag <span> e o bloco condicional foram fechados aqui */}
        </div> {/* <--- A tag <div> do Ícone de Notificação foi fechada aqui */}

        {/* Nome do Usuário */}
        <span style={{ fontWeight: 'bold' }}>
        Olá, {usuarioLogado.nome.split(' ')[0]}
        </span>
      </div> {/* <--- A tag <div> de Perfil e Notificações foi fechada aqui */}
    </header>
);
};

export default HeaderConfeiteiro;