import React, { useState, useEffect } from 'react';
import ProductService from '../services/produtoService';
import Styles from './CardapioPublico.module.css';
import { IoCartOutline } from 'react-icons/io5';

const CardapioPublico = ({ loja }) => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const IMAGE_URL = `${API_BASE_URL}/uploads`;

    useEffect(() => {
        const fetchMenu = async () => {
            const lojaId = Number(loja?.id || loja?.confeiteiroId);
            if (lojaId) {
                try {
                    setLoading(true);
                    // Nome corrigido para bater com o produtoService.js
                    const data = await ProductService.getProdutosDaLoja(lojaId);
                    setProdutos(data || []);
                } catch (error) {
                    console.error("Erro ao carregar cardápio público:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchMenu();
    }, [loja]);

    if (loading) return <div className={Styles.loading}>Carregando cardápio...</div>;

    // Filtramos antes de renderizar para garantir que o estado vazio funcione
    const produtosDisponiveis = produtos.filter(p => p.disponivel);

    return (
        <div className={Styles.cardapioContainer}>
            <h3>Produtos Disponíveis</h3>
            <div className={Styles.grid}>
                {produtosDisponiveis.length > 0 ? (
                    produtosDisponiveis.map(produto => (
                        <div key={produto.id} className={Styles.card}>
                            <div className={Styles.imageWrapper}>
                                <img 
                                    src={produto.imagemUrl ? `${IMAGE_URL}/${produto.imagemUrl}` : "/placeholder.png"} 
                                    alt={produto.nome}
                                    onError={(e) => e.target.src = "/placeholder.png"}
                                />
                            </div>
                            <div className={Styles.info}>
                                <div className={Styles.mainInfo}>
                                    <h4>{produto.nome}</h4>
                                    <p>{produto.descricao}</p>
                                </div>
                                <div className={Styles.cardFooter}>
                                    <span className={Styles.preco}>R$ {Number(produto.preco).toFixed(2)}</span>
                                    <button className={Styles.addBtn} title="Adicionar ao carrinho">
                                        <IoCartOutline size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Esta loja ainda não possui produtos cadastrados.</p>
                )}
            </div>
        </div>
    );
};

export default CardapioPublico;