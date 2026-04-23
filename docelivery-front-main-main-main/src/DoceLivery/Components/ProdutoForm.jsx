import React, { useState } from 'react';

const ProdutoForm = ({ produto, onClose, onSave }) => {
  // Inicializa o estado com dados vazios ou do produto existente
const [dados, setDados] = useState({
    id: produto ? produto.id : null,
    nome: produto ? produto.nome : '',
    preco: produto ? produto.preco : '',
    descricao: produto ? produto.descricao : '',
    disponivel: produto ? produto.disponivel : true,
    fotoId: produto ? produto.fotoId : '',
    estoque: produto ? produto.estoque : 0,
});

const [arquivo, setArquivo] = useState(null);

const handleFileChange = (e) => {
    setArquivo(e.target.files[0]); // Captura o arquivo físico
};

const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDados({
    ...dados,
    [name]: type === 'checkbox' ? checked : value,
    });
};

const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!dados.nome || !dados.preco) {
        alert('Nome e Preço são obrigatórios!');
        return;
    }

    const dadosFormatados = {
        ...dados,
        preco: parseFloat(dados.preco) // Garante que é um número
    };
    // Enviamos os dados do produto e o arquivo selecionado
    onSave({ ...dadosFormatados, arquivoFoto: arquivo });
};

return (
    // Simples estilização de Modal para focar no conteúdo
    <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
    }}>
    <div style={{
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        width: '400px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
        <h2 style={{ color: '#ff69b4', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>
        {produto ? 'Editar Produto' : 'Adicionar Novo Produto'}
        </h2>
        
        <form onSubmit={handleSubmit}>
        
        <div style={{ marginBottom: '15px' }}>
            <label>Nome do Doce:</label>
            <input
            type="text"
            name="nome"
            value={dados.nome}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
            />
        </div>

        <div style={{ marginBottom: '15px' }}>
            <label>Foto do Doce (Real):</label>
            <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
            />
            {arquivo && <p style={{ fontSize: '0.8rem', color: '#666' }}>Selecionado: {arquivo.name}</p>}
        </div>

        <div style={{ marginBottom: '15px' }}>
            <label>Estoque Atual:</label>
            <input
            type="number"
            name="estoque"
            value={dados.estoque}
            onChange={handleChange}
            min="0"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
            />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
            <label>Preço (R$):</label>
            <input
            type="number"
            name="preco"
            value={dados.preco}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px' }}
            />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
            <label>Descrição:</label>
            <textarea
            name="descricao"
            value={dados.descricao}
            onChange={handleChange}
            rows="3"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '5px', resize: 'vertical' }}
            />
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
            <input
            type="checkbox"
            id="disponivel"
            name="disponivel"
            checked={dados.disponivel}
            onChange={handleChange}
            style={{ marginRight: '10px' }}
            />
            <label htmlFor="disponivel">Disponível para venda</label>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
            Cancelar
            </button>
            <button
            type="submit"
            style={{ padding: '10px 15px', backgroundColor: '#ff69b4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
            Salvar Produto
            </button>
        </div>
        </form>
    </div>
    </div>
);
};

export default ProdutoForm;