// Catalogo.js

import React, { useState } from 'react';

// Dados simulados de Produtos
const produtosIniciais = [
{ id: 1, nome: "Bolo de Cenoura com Brigadeiro", preco: 75.00, status: "Disponível" },
  { id: 2, nome: "Caixa de 50 Brigadeiros Gourmet", preco: 95.00, status: "Disponível" },
  { id: 3, nome: "Torta de Limão", preco: 60.00, status: "Esgotado" },
];

const Catalogo = () => {
  const [produtos, setProdutos] = useState(produtosIniciais);
  const [novoProduto, setNovoProduto] = useState({ nome: '', preco: '', status: 'Disponível' });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoProduto(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionarProduto = (e) => {
    e.preventDefault();
    if (novoProduto.nome && novoProduto.preco) {
      const produto = {
        id: Date.now(), // ID único (simulado)
        nome: novoProduto.nome,
        preco: parseFloat(novoProduto.preco),
        status: novoProduto.status,
      };
      setProdutos([...produtos, produto]);
      setNovoProduto({ nome: '', preco: '', status: 'Disponível' }); // Limpa o formulário
    }
  };

  const formStyle = { 
    display: 'flex', 
    gap: '10px', 
    marginBottom: '20px', 
    padding: '15px', 
    border: '1px solid #E6E6FA', 
    borderRadius: '8px' 
  };
  const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
  const buttonStyle = { padding: '8px 15px', borderRadius: '4px', border: 'none', backgroundColor: '#8A2BE2', color: 'white', cursor: 'pointer' };

  return (
    <div>
      <h1 style={{ color: '#8A2BE2' }}>Gerenciamento de Catálogo</h1>
      <p>Adicione, edite ou remova produtos do seu cardápio DoceLivery.</p>

      {/* Formulário de Adição */}
      <h2 style={{ marginTop: '30px' }}>Adicionar Novo Produto</h2>
      <form onSubmit={handleAdicionarProduto} style={formStyle}>
        <input
          name="nome"
          placeholder="Nome do Produto (Ex: Bolo Red Velvet)"
          value={novoProduto.nome}
          onChange={handleInputChange}
          required
          style={{ ...inputStyle, flexGrow: 2 }}
        />
        <input
          name="preco"
          type="number"
          placeholder="Preço (R$)"
          value={novoProduto.preco}
          onChange={handleInputChange}
          required
          style={{ ...inputStyle, width: '100px' }}
        />
        <select
          name="status"
          value={novoProduto.status}
          onChange={handleInputChange}
          style={inputStyle}
        >
          <option value="Disponível">Disponível</option>
          <option value="Esgotado">Esgotado</option>
        </select>
        <button type="submit" style={buttonStyle}>Adicionar</button>
      </form>

      {/* Tabela de Produtos */}
      <h2 style={{ marginTop: '30px' }}>Seus Produtos Atuais ({produtos.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#F0E6EF' }}>
            <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Nome</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Preço</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Status</th>
            <th style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map(produto => (
            <tr key={produto.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{produto.nome}</td>
              <td style={{ padding: '10px' }}>R$ {produto.preco.toFixed(2)}</td>
              <td style={{ padding: '10px', color: produto.status === 'Disponível' ? 'green' : 'red' }}>{produto.status}</td>
              <td style={{ padding: '10px' }}>
                {/* Ações de Edição/Exclusão simuladas */}
                <button style={{ ...buttonStyle, backgroundColor: '#ADD8E6', color: 'black', marginRight: '5px' }} onClick={() => alert(`Editar ${produto.nome}`)}>Editar</button>
                <button style={{ ...buttonStyle, backgroundColor: '#FA8072' }} onClick={() => setProdutos(produtos.filter(p => p.id !== produto.id))}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Catalogo;