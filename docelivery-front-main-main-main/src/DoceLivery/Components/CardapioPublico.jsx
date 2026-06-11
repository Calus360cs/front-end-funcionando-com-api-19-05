import React, { useState, useEffect } from 'react';
import ProductService from '../services/produtoService';
import Styles from './CardapioPublico.module.css';
import { useCartStore } from '../context/CartContext.jsx';
import { IoCartOutline, IoCalendarOutline, IoCloseOutline, IoInformationCircleOutline, IoStorefront } from 'react-icons/io5';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const IMAGE_URL = `${API_BASE_URL}/uploads`;

const CardapioPublico = ({ loja, onOpenEncomendaModal }) => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [produtoDetalhe, setProdutoDetalhe] = useState(null);
    const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');

    const { addItemToCart, toggleCart } = useCartStore();

    useEffect(() => {
        const fetchMenu = async () => {
            const lojaId = Number(loja?.id || loja?.confeiteiroId);
            if (!lojaId) { setLoading(false); return; }
            try {
                setLoading(true);
                const data = await ProductService.getProdutosDaLoja(lojaId);
                setProdutos(data || []);
            } catch (error) {
                console.error('Erro ao carregar cardápio público:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [loja]);

    const produtosDisponiveis = produtos.filter(p => p.disponivel !== false);

    // Monta lista de categorias únicas a partir dos produtos
    const categorias = ['Todos', ...new Set(
        produtosDisponiveis
            .map(p => {
                if (typeof p.categoria === 'object') return p.categoria?.nome;
                return p.categoria || 'Outros';
            })
            .filter(Boolean)
    )];

    const produtosFiltrados = categoriaAtiva === 'Todos'
        ? produtosDisponiveis
        : produtosDisponiveis.filter(p => {
            const cat = typeof p.categoria === 'object' ? p.categoria?.nome : p.categoria;
            return cat === categoriaAtiva;
        });

    const getImageSrc = (produto) => {
        if (!produto.imagemUrl) return null;
        return String(produto.imagemUrl).startsWith('http')
            ? produto.imagemUrl
            : `${IMAGE_URL}/${produto.imagemUrl}`;
    };

    const handleAdicionarAoCarrinho = (produto) => {
        addItemToCart(
            {
                id: produto.id,
                name: produto.nome,
                price: produto.preco,
                imageUrl: getImageSrc(produto),
            },
            { id: loja.id, name: loja.nome },
            1
        );
        toggleCart();
    };

    if (loading) {
        return (
            <div className={Styles.loadingWrapper}>
                <div className={Styles.loadingSpinner}></div>
                <p>Carregando cardápio...</p>
            </div>
        );
    }

    return (
        <div className={Styles.cardapioContainer}>

            {/* CABEÇALHO DA LOJA */}
            <div className={Styles.lojaHeader}>
                <div className={Styles.lojaHeaderContent}>
                    <IoStorefront size={22} className={Styles.lojaIcon} />
                    <div>
                        <h2 className={Styles.lojaNome}>{loja?.nome || 'Cardápio'}</h2>
                        {loja?.descricao && <p className={Styles.lojaDesc}>{loja.descricao}</p>}
                    </div>
                </div>
            </div>

            {/* BOTÕES DE AÇÃO PRINCIPAL */}
            <div className={Styles.actionBar}>
                <button className={Styles.actionBtnPrimary} onClick={toggleCart}>
                    <IoCartOutline size={20} />
                    <div className={Styles.actionBtnText}>
                        <strong>Pronta Entrega</strong>
                        <small>adicione ao carrinho e receba hoje</small>
                    </div>
                </button>

                <button className={Styles.actionBtnSecondary} onClick={() => onOpenEncomendaModal(true)}>
                    <IoCalendarOutline size={20} />
                    <div className={Styles.actionBtnText}>
                        <strong>Encomendar</strong>
                        <small>agende um pedido personalizado</small>
                    </div>
                </button>
            </div>

            {/* FILTRO POR CATEGORIA */}
            {categorias.length > 1 && (
                <div className={Styles.categoriaBar}>
                    {categorias.map(cat => (
                        <button
                            key={cat}
                            className={`${Styles.categoriaBtn} ${categoriaAtiva === cat ? Styles.categoriaBtnAtivo : ''}`}
                            onClick={() => setCategoriaAtiva(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* GRID DE PRODUTOS */}
            <div className={Styles.menuSection}>
                <h3 className={Styles.sectionTitle}>
                    {categoriaAtiva === 'Todos' ? 'Todos os Produtos' : categoriaAtiva}
                    <span className={Styles.countBadge}>{produtosFiltrados.length}</span>
                </h3>

                {produtosFiltrados.length > 0 ? (
                    <div className={Styles.grid}>
                        {produtosFiltrados.map(produto => (
                            <div key={produto.id} className={Styles.card}>
                                <div className={Styles.imageWrapper}>
                                    {getImageSrc(produto) ? (
                                        <img
                                            src={getImageSrc(produto)}
                                            alt={produto.nome}
                                            onError={(e) => { e.target.parentElement.innerHTML = '<div class="imgFallback">🧁</div>'; }}
                                        />
                                    ) : (
                                        <div className={Styles.imgFallback}>🧁</div>
                                    )}
                                    <div className={Styles.disponibilidadeBadge}>
                                        ✅ Disponível
                                    </div>
                                </div>

                                <div className={Styles.cardBody}>
                                    <div>
                                        <h4 className={Styles.produtoNome}>{produto.nome}</h4>
                                        {produto.descricao && (
                                            <p className={Styles.produtoDesc}>{produto.descricao}</p>
                                        )}
                                        {produto.categoria && (
                                            <span className={Styles.categoriaPill}>
                                                {typeof produto.categoria === 'object'
                                                    ? produto.categoria?.nome
                                                    : produto.categoria}
                                            </span>
                                        )}
                                    </div>

                                    <div className={Styles.cardFooter}>
                                        <span className={Styles.preco}>
                                            R$ {Number(produto.preco).toFixed(2)}
                                        </span>
                                        <div className={Styles.cardButtons}>
                                            <button
                                                className={Styles.btnDetalhes}
                                                onClick={() => setProdutoDetalhe(produto)}
                                                title="Ver detalhes"
                                            >
                                                <IoInformationCircleOutline size={16} />
                                                Detalhes
                                            </button>
                                            <button
                                                className={Styles.btnAdicionar}
                                                onClick={() => handleAdicionarAoCarrinho(produto)}
                                            >
                                                <IoCartOutline size={16} />
                                                Adicionar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={Styles.emptyState}>
                        <span>🍬</span>
                        <p>Nenhum produto disponível nesta categoria.</p>
                    </div>
                )}
            </div>

            {/* MODAL DE DETALHES DO PRODUTO */}
            {produtoDetalhe && (
                <div className={Styles.modalOverlay} onClick={() => setProdutoDetalhe(null)}>
                    <div className={Styles.modal} onClick={e => e.stopPropagation()}>
                        <button className={Styles.modalClose} onClick={() => setProdutoDetalhe(null)}>
                            <IoCloseOutline size={24} />
                        </button>

                        {getImageSrc(produtoDetalhe) ? (
                            <img
                                src={getImageSrc(produtoDetalhe)}
                                alt={produtoDetalhe.nome}
                                className={Styles.modalImg}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className={Styles.modalImgFallback}>🧁</div>
                        )}

                        <div className={Styles.modalBody}>
                            <div className={Styles.modalHeader}>
                                <h3>{produtoDetalhe.nome}</h3>
                                <span className={Styles.modalPreco}>
                                    R$ {Number(produtoDetalhe.preco).toFixed(2)}
                                </span>
                            </div>

                            {produtoDetalhe.descricao && (
                                <p className={Styles.modalDesc}>{produtoDetalhe.descricao}</p>
                            )}

                            <div className={Styles.modalInfoGrid}>
                                {produtoDetalhe.categoria && (
                                    <div className={Styles.modalInfoItem}>
                                        <span className={Styles.modalInfoLabel}>Categoria</span>
                                        <span className={Styles.modalInfoValue}>
                                            {typeof produtoDetalhe.categoria === 'object'
                                                ? produtoDetalhe.categoria?.nome
                                                : produtoDetalhe.categoria}
                                        </span>
                                    </div>
                                )}
                                {produtoDetalhe.estoque !== undefined && (
                                    <div className={Styles.modalInfoItem}>
                                        <span className={Styles.modalInfoLabel}>Estoque</span>
                                        <span className={Styles.modalInfoValue}>{produtoDetalhe.estoque} un.</span>
                                    </div>
                                )}
                                <div className={Styles.modalInfoItem}>
                                    <span className={Styles.modalInfoLabel}>Disponibilidade</span>
                                    <span className={`${Styles.modalInfoValue} ${Styles.disponivel}`}>
                                        ✅ Disponível
                                    </span>
                                </div>
                                <div className={Styles.modalInfoItem}>
                                    <span className={Styles.modalInfoLabel}>Loja</span>
                                    <span className={Styles.modalInfoValue}>{loja?.nome}</span>
                                </div>
                            </div>

                            <div className={Styles.modalActions}>
                                <button
                                    className={Styles.modalBtnEncomenda}
                                    onClick={() => { setProdutoDetalhe(null); onOpenEncomendaModal(true); }}
                                >
                                    <IoCalendarOutline size={18} />
                                    Encomendar
                                </button>
                                <button
                                    className={Styles.modalBtnCarrinho}
                                    onClick={() => { handleAdicionarAoCarrinho(produtoDetalhe); setProdutoDetalhe(null); }}
                                >
                                    <IoCartOutline size={18} />
                                    Adicionar ao Carrinho
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardapioPublico;
