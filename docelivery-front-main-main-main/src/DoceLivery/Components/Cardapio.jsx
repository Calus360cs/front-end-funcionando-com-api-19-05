import React, { useState, useEffect } from 'react';
import ProdutoForm from './ProdutoForm';
import ApiService from '../services/api';
import AuthService from '../services/authService';

const Cardapio = () => {
    const [produtos, setProdutos] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [produtoParaEditar, setProdutoParaEditar] = useState(null);

    const IMAGE_API_URL = "http://localhost:8080/api/fotos";

    // --- LIGAÇÃO 1: BUSCAR DADOS DO BACK-END ---
    const carregarProdutos = async () => {
        try {
            const idLogado = AuthService.getUserId();
            if (!idLogado) return;
            
            // Buscamos os produtos filtrados pelo confeiteiro logado
            // Note: ApiService já tem o prefixo /api na baseURL
            const response = await ApiService.get(`/products/confeiteiro/${idLogado}`);
            setProdutos(response); // response já é o JSON no seu ApiService
        } catch (error) {
            console.error("Erro ao carregar cardápio:", error);
        }
    };

    // Executa assim que a tela abre
    useEffect(() => {
        carregarProdutos();
    }, []);

    // --- LIGAÇÃO 2: SALVAR NO BANCO ---
    const handleSalvar = async (dadosDoForm) => {
        try {
            const idLogado = AuthService.getUserId();
            const { arquivoFoto, ...restanteDosDados } = dadosDoForm;

            const formData = new FormData();
            
            // Preparamos o objeto de dados conforme sua lógica de fallbacks
            const produtoDados = {
                ...restanteDosDados,
                estoque: restanteDosDados.estoque || 0,
                preco: restanteDosDados.preco || 0.0
                // Se você tiver categorias no futuro: categoria: { id: dadosDoForm.categoriaId }
            };
            
            // O objeto produto precisa ir como String para o @RequestPart no Spring Boot
            formData.append("produto", JSON.stringify(produtoDados));
            
            // Adicionamos o arquivo binário capturado no ProdutoForm
            if (arquivoFoto) {
                formData.append("imagem", arquivoFoto); 
            }

            if (dadosDoForm.id) {
                // Edição (PUT)
                await ApiService.put(`/products/${dadosDoForm.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Novo Cadastro (POST)
                await ApiService.post(`/products?confeiteiroId=${idLogado}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setModalAberto(false);
            carregarProdutos(); // Recarrega a lista para mostrar o novo/editado doce
            alert("Sucesso! O produto e a imagem foram salvos.");
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar. Verifique se o backend está preparado para receber 'produto' (JSON) e 'imagem' (File) via @RequestPart.");
        }
    };

    const handleToggleDisponibilidade = async (produto) => {
        try {
            const atualizado = { ...produto, disponivel: !produto.disponivel };
            await ApiService.put(`/products/${produto.id}`, atualizado);
            carregarProdutos();
        } catch (error) {
            alert("Erro ao atualizar disponibilidade.");
        }
    };

return (
    <div style={{ padding: '20px' }}>
        <h1 style={{ color: '#ff69b4', marginBottom: '20px' }}>Meu Cardápio</h1>
        
        <button 
        onClick={() => { setProdutoParaEditar(null); setModalAberto(true); }}
        style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', marginBottom: '20px', cursor: 'pointer' }}
    >
        + Adicionar Novo Doce
    </button>

        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '25px',
            marginTop: '20px' 
        }}>
            {produtos.map(p => (
                <div key={p.id} style={{ 
                    backgroundColor: '#fff',
                    border: 'none', 
                    padding: '0', 
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Exibição da Imagem do Produto vinda do Backend */}
                    <div style={{ height: '180px', overflow: 'hidden', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', backgroundColor: '#f0f0f0' }}>
                        <img 
                            src={p.fotoId ? `${IMAGE_API_URL}/${p.fotoId}` : '/images/default_placeholder.png'} 
                            alt={p.nome}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            // Fallback caso o link do banco falhe
                            onError={(e) => { e.target.src = '/images/default_placeholder.png'; }}
                        />
                    </div>
                    
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.4rem' }}>{p.nome}</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', minHeight: '40px' }}>{p.descricao}</p>
                        
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginTop: '15px'
                        }}>
                            <span style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: 'bold', 
                                color: '#ff69b4' 
                            }}>
                                R$ {parseFloat(p.preco).toFixed(2)}
                            </span>
                            
                            <button 
                                onClick={() => { setProdutoParaEditar(p); setModalAberto(true); }}
                                style={{ 
                                    padding: '8px 15px', 
                                    backgroundColor: '#f8f9fa', 
                                    border: '1px solid #ff69b4', 
                                    color: '#ff69b4',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {modalAberto && (
            <ProdutoForm 
                produto={produtoParaEditar} 
                onClose={() => setModalAberto(false)} 
                onSave={handleSalvar} 
            />
        )}
    </div>
    );
};

export default Cardapio;