import React, { useState, useEffect } from 'react';
import ProductService from '../services/produtoService';
import Styles from './CardapioPublico.module.css';
import { useCartStore } from '../context/CartContext.jsx';

const CardapioPublico = ({ loja, onOpenEncomendaModal }) => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addItemToCart, toggleCart, setActiveStore } = useCartStore();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const IMAGE_URL = `${API_BASE_URL}/uploads`;

    useEffect(() => {
        const fetchMenu = async () => {
            const lojaId = Number(loja?.id || loja?.confeiteiroId);
            if (lojaId) {
                try {
                    setLoading(true);
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

    const produtosDisponiveis = produtos.filter(p => p.disponivel);

    return (
        <div className={Styles.cardapioContainer}>
            
            

            {/* Seletores centrais baseados na imagem do cliente */}
            <div className={Styles.orderTypeSelector}>
                <button className={Styles.selectorBtn} onClick={toggleCart}>
                    <span className={Styles.btnIcon}>🛒</span>
                    <div className={Styles.btnTextWrapper}>
                        <strong>Pedidos para Entrega</strong>
                        <small>receba direto na sua casa</small>
                    </div>
                </button>
                
                <button className={Styles.selectorBtn} onClick={() => onOpenEncomendaModal(true)}>
                    <span className={Styles.btnIcon}>🎁</span>
                    <div className={Styles.btnTextWrapper}>
                        <strong>Encomendas</strong>
                        <small>agende seu pedido personalizado</small>
                    </div>
                </button>
            </div>

            {/* Seção Grid de Produtos */}
            <div className={Styles.menuSection}>
                <h3 className={Styles.seccionTitle}>Produtos</h3>
                
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
                                        <p className={Styles.descricao}>{produto.descricao}</p>
                                    </div>
                                    
                                    <span className={Styles.preco}>R$ {Number(produto.preco).toFixed(2)}</span>
                                    
                                    <div className={Styles.cardButtons}>
                                        <button className={Styles.btnSecondary} onClick={() => alert(`Detalhes do produto: ${produto.nome}`)}>Detalhes</button> 
                                        <button
                                            className={Styles.btnPrimary}
                                            onClick={() => {
                                                if (setActiveStore && loja) {
                                                    setActiveStore({ id: loja.id, name: loja.nome });
                                                }
                                                addItemToCart({
                                                    id: produto.id,
                                                    name: produto.nome,
                                                    price: produto.preco,
                                                    imageUrl: produto.imagemUrl ? `${IMAGE_URL}/${produto.imagemUrl}` : "/placeholder.png"
                                                }, loja, 1);
                                            }}
                                        >Encomendar</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={Styles.emptyState}>Esta loja ainda não possui produtos cadastrados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CardapioPublico;