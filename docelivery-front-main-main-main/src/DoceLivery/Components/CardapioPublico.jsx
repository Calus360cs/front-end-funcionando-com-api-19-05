import React, { useState, useMemo, useEffect } from 'react';
import { IoAdd, IoRemove, IoCart, IoCalendar, IoTime, IoClose } from 'react-icons/io5';
import { useCartStore } from '../context/CartContext';
import { useCardapio } from '../context/CardapioContext';
import StoreService from '../services/storeService';
import { IMAGE_MAP } from '../data/imageImports';
import Styles from './CardapioPublico.module.css';

const CardapioPublico = ({ loja }) => {
    const { adicionarEncomenda } = useCardapio();
    const [produtos, setProdutos] = useState([]);
    const [combos, setCombos] = useState([]); // Inicializa como um array vazio
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMenu = async () => {
            if (loja?.id) {
                try {
                    // Chamada para a API
                    const menuResponse = await StoreService.getStoreMenu(loja.id);
                    
                    // CORREÇÃO: Em vez de criar variáveis locais, 
                    // salvamos no ESTADO do componente para serem acessíveis no JSX.
                    // Assumindo que a API retorna um objeto com { produtos, combos }
                    setProdutos(menuResponse.produtos || menuResponse || []);
                    setCombos(menuResponse.combos || []);
                    
                } catch (error) {
                    console.error("Erro ao buscar cardápio real:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchMenu();
    }, [loja]);

    if (loading) {
        return <div className={Styles.loading}>Carregando cardápio...</div>;
    }

    const { addItemToCart } = useCartStore();
    const [filtroCategoria, setFiltroCategoria] = useState('todos');
    const [showEncomendaModal, setShowEncomendaModal] = useState(false);
    const [produtoEncomenda, setProdutoEncomenda] = useState(null);
    const [encomendaData, setEncomendaData] = useState({
        data: '',
        horario: '',
        observacoes: '',
        quantidade: 1
    });

    const categorias = ['todos', 'bolos', 'cupcakes', 'doces', 'combos'];
    
    const todosProdutos = useMemo(() => [...produtos, ...combos], [produtos, combos]);

    const produtosFiltrados = useMemo(() => 
        filtroCategoria === 'todos' 
            ? todosProdutos 
            : todosProdutos.filter(p => p.categoria === filtroCategoria || p.tipo === filtroCategoria),
        [filtroCategoria, todosProdutos]
    );

    // Calcula a data mínima exigindo 2 dias de antecedência para encomendas
    const minDateString = useMemo(() => {
        const dataMinima = new Date();
        dataMinima.setDate(dataMinima.getDate() + 2);
        return dataMinima.toISOString().split('T')[0];
    }, []);

    const handleAddToCart = (produto) => {
        const lojaInfo = {
            id: loja?.id || 1,
            name: loja?.nome || 'Confeitaria',
            endereco: loja?.endereco || 'Endereço da loja'
        };
        
        addItemToCart({
            id: produto.id,
            name: produto.nome,
            price: produto.preco,
            image: produto.imagem,
            storeId: lojaInfo.id
        }, lojaInfo, 1);
    };

    const handleEncomenda = (produto) => {
        setProdutoEncomenda(produto);
        setShowEncomendaModal(true);
    };

    const updateQuantidade = (fator) => {
        setEncomendaData(prev => ({
            ...prev,
            quantidade: Math.max(1, prev.quantidade + fator)
        }));
    };

    const handleConfirmarEncomenda = () => {
        if (!encomendaData.data || !encomendaData.horario) {
            alert('Preencha data e horário para a encomenda');
            return;
        }
        
        const encomenda = {
            lojaId: loja?.id || 1,
            produto: produtoEncomenda,
            ...encomendaData,
            valorTotal: produtoEncomenda.preco * encomendaData.quantidade
        };
        
        adicionarEncomenda(encomenda);
        alert('Encomenda agendada com sucesso! A confeitaria entrará em contato.');
        setShowEncomendaModal(false);
        setEncomendaData({ data: '', horario: '', observacoes: '', quantidade: 1 });
    };

    return (
        <div className={Styles.cardapioPublico}>
            <div className={Styles.header}>
                <div className={Styles.lojaInfo}>
                    <h1>{loja?.nome || 'Confeitaria'}</h1>
                    <p>{loja?.endereco || 'Endereço da confeitaria'}</p>
                    <div className={Styles.horarioFuncionamento}>
                        <IoTime size={16} />
                        <span>Seg-Sex: 8h-18h | Sáb: 8h-16h</span>
                    </div>
                </div>
            </div>

            <div className={Styles.filtros}>
                <div className={Styles.categoriasFiltro}>
                    {categorias.map(categoria => (
                        <button
                            key={categoria}
                            className={`${Styles.categoriaBtn} ${filtroCategoria === categoria ? Styles.active : ''}`}
                            onClick={() => setFiltroCategoria(categoria)}
                        >
                            {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={Styles.opcoesPedido}>
                <div className={Styles.opcaoCard}>
                    <IoCart size={24} />
                    <h3>Pedidos para Entrega</h3>
                    <p>Produtos disponíveis para entrega imediata</p>
                </div>
                <div className={Styles.opcaoCard}>
                    <IoCalendar size={24} />
                    <h3>Encomendas</h3>
                    <p>Agende seu pedido personalizado</p>
                </div>
            </div>

            <div className={Styles.produtosGrid}>
                {produtosFiltrados.map(produto => (
                    <div key={produto.id} className={Styles.produtoCard}>
                        <div className={Styles.produtoImagem}>
                            <img 
                                src={produto.imagemCustom || IMAGE_MAP[produto.imagem] || IMAGE_MAP['brigadeiro']} 
                                alt={produto.nome} 
                            />
                            {!produto.disponivel && (
                                <div className={Styles.indisponivelOverlay}>Indisponível</div>
                            )}
                        </div>
                        
                        <div className={Styles.produtoInfo}>
                            <h3>{produto.nome}</h3>
                            <p>{produto.descricao}</p>
                            <div className={Styles.produtoMeta}>
                                <span className={Styles.preco}>R$ {produto.preco.toFixed(2)}</span>
                                <span className={Styles.tempo}>
                                    <IoTime size={14} />
                                    {produto.tempoPrep}
                                </span>
                            </div>
                        </div>
                        
                        <div className={Styles.produtoActions}>
                            <button 
                                className={Styles.addCartBtn}
                                onClick={() => handleAddToCart(produto)}
                                disabled={!produto.disponivel}
                            >
                                <IoCart size={16} />
                                Adicionar
                            </button>
                            <button 
                                className={Styles.encomendaBtn}
                                onClick={() => handleEncomenda(produto)}
                            >
                                <IoCalendar size={16} />
                                Encomendar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showEncomendaModal && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modal}>
                        <div className={Styles.modalHeader}>
                            <h3>Encomendar: {produtoEncomenda?.nome}</h3>
                            <button onClick={() => setShowEncomendaModal(false)}>
                                <IoClose size={24} />
                            </button>
                        </div>
                        
                        <div className={Styles.modalContent}>
                            <div className={Styles.produtoResumo}>
                                <img 
                                    src={produtoEncomenda?.imagemCustom || IMAGE_MAP[produtoEncomenda?.imagem] || IMAGE_MAP['brigadeiro']} 
                                    alt={produtoEncomenda?.nome} 
                                />
                                <div>
                                    <h4>{produtoEncomenda?.nome}</h4>
                                    <p>R$ {produtoEncomenda?.preco.toFixed(2)}</p>
                                    <p>Tempo de preparo: {produtoEncomenda?.tempoPrep}</p>
                                </div>
                            </div>
                            
                            <div className={Styles.formGroup}>
                                <label>Quantidade</label>
                                <div className={Styles.quantidadeControl}>
                                    <button onClick={() => updateQuantidade(-1)}>
                                        <IoRemove size={16} />
                                    </button>
                                    <span>{encomendaData.quantidade}</span>
                                    <button onClick={() => updateQuantidade(1)}>
                                        <IoAdd size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Data de Entrega *</label>
                                    <input
                                        type="date"
                                        value={encomendaData.data}
                                        onChange={(e) => setEncomendaData({...encomendaData, data: e.target.value})}
                                        min={minDateString}
                                    />
                                </div>
                                <div className={Styles.formGroup}>
                                    <label>Horário *</label>
                                    <input
                                        type="time"
                                        value={encomendaData.horario}
                                        onChange={(e) => setEncomendaData({...encomendaData, horario: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className={Styles.formGroup}>
                                <label>Observações</label>
                                <textarea
                                    value={encomendaData.observacoes}
                                    onChange={(e) => setEncomendaData({...encomendaData, observacoes: e.target.value})}
                                    placeholder="Detalhes especiais, decoração, sabores..."
                                    rows="3"
                                />
                            </div>
                            
                            <div className={Styles.totalEncomenda}>
                                <strong>Total: R$ {(produtoEncomenda?.preco * encomendaData.quantidade).toFixed(2)}</strong>
                            </div>
                        </div>
                        
                        <div className={Styles.modalActions}>
                            <button 
                                className={Styles.cancelBtn}
                                onClick={() => setShowEncomendaModal(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className={Styles.confirmBtn}
                                onClick={handleConfirmarEncomenda}
                            >
                                Confirmar Encomenda
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardapioPublico;