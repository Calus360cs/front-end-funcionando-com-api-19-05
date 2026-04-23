import React, { useState, useEffect } from 'react';
import { IoAdd, IoCreate, IoTrash, IoGrid, IoList, IoSearch, IoFilter } from 'react-icons/io5';
import { IMAGE_MAP } from '../data/imageImports';
import ProductService from '../services/productService';
import AuthService from '../services/authService';
import ImageUploader from './ImageUploader';
import Styles from './CardapioManager.module.css';

const CardapioManager = ({ lojaId = 1 }) => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [filtroCategoria, setFiltroCategoria] = useState('todos');
    const [busca, setBusca] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        preco: '',
        categoria: 'bolos',
        imagem: '',
        imagemCustom: null,
        descricao: '',
        disponivel: true
    });

    const categorias = ['bolos', 'cupcakes', 'doces', 'tortas'];

    const carregarDados = async () => {
        setLoading(true);
        try {
            const idLogado = AuthService.getUserId() || lojaId;
            // Busca apenas os Produtos, que é o que você tem no banco
            const dataProdutos = await ProductService.getStoreProducts(idLogado);
            setProdutos(dataProdutos || []);
        } catch (error) {
            console.error("Erro ao carregar dados do cardápio:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [lojaId]);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData({
                ...item,
                categoria: item.categoria?.nome || item.categoria || 'bolos',
            });
        } else {
            setFormData({
                nome: '',
                preco: '',
                categoria: 'bolos',
                imagem: '',
                imagemCustom: null,
                descricao: '',
                disponivel: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.nome || !formData.preco) {
            alert('Por favor, preencha nome e preço.');
            return;
        }

        const categoriaMap = { 'bolos': 1, 'cupcakes': 2, 'doces': 3, 'tortas': 4 };

        const payload = {
            ...formData,
            preco: parseFloat(formData.preco),
            categoria: { id: categoriaMap[formData.categoria] || 1 },
            confeiteiroId: parseInt(AuthService.getUserId() || lojaId)
        };

        try {
            if (editingItem) {
                await ProductService.updateProduct(editingItem.id, payload);
            } else {
                await ProductService.createProduct(payload);
            }
            setShowModal(false);
            await carregarDados();
            alert("Salvo com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar no banco. Verifique o console do Java.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deseja excluir permanentemente este produto?')) {
            try {
                await ProductService.deleteProduct(id);
                carregarDados();
            } catch (error) {
                alert("Erro ao excluir.");
            }
        }
    };

    const toggleDisponibilidade = async (produto) => {
        try {
            const atualizado = { 
                ...produto, 
                disponivel: !produto.disponivel,
                categoria: { id: produto.categoria?.id || 1 }
            };
            await ProductService.updateProduct(produto.id, atualizado);
            carregarDados();
        } catch (error) {
            alert("Erro ao atualizar status.");
        }
    };

    const produtosFiltrados = produtos.filter(p => {
        const nomeCat = p.categoria?.nome || p.categoria || '';
        const matchCategoria = filtroCategoria === 'todos' || nomeCat.toLowerCase() === filtroCategoria.toLowerCase();
        const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
        return matchCategoria && matchBusca;
    });

    if (loading) return <div className={Styles.loading}>Carregando cardápio...</div>;

    return (
        <div className={Styles.cardapioManager}>
            <div className={Styles.header}>
                <div className={Styles.headerLeft}>
                    <h2>Gerenciar Cardápio</h2>
                    <p>Controle seus produtos do DoceLivery</p>
                </div>
                <div className={Styles.headerActions}>
                    <div className={Styles.viewToggle}>
                        <button className={`${Styles.toggleBtn} ${viewMode === 'grid' ? Styles.active : ''}`} onClick={() => setViewMode('grid')}><IoGrid size={20} /></button>
                        <button className={`${Styles.toggleBtn} ${viewMode === 'list' ? Styles.active : ''}`} onClick={() => setViewMode('list')}><IoList size={20} /></button>
                    </div>
                    <button className={Styles.addBtn} onClick={() => handleOpenModal()}><IoAdd size={20} /> Novo Produto</button>
                </div>
            </div>

            <div className={Styles.filters}>
                <div className={Styles.searchBox}>
                    <IoSearch size={20} />
                    <input type="text" placeholder="Buscar no cardápio..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className={Styles.categoryFilter}>
                    <IoFilter size={20} />
                    <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                        <option value="todos">Todas Categorias</option>
                        {categorias.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            <div className={`${Styles.produtosGrid} ${viewMode === 'list' ? Styles.listView : ''}`}>
                {produtosFiltrados.map(produto => (
                    <div key={produto.id} className={`${Styles.produtoCard} ${!produto.disponivel ? Styles.indisponivel : ''}`}>
                        <div className={Styles.produtoImagem}>
                            <img src={produto.imagemCustom || IMAGE_MAP[produto.imagem] || IMAGE_MAP['brigadeiro']} alt={produto.nome} />
                            {!produto.disponivel && <div className={Styles.indisponivelOverlay}>Indisponível</div>}
                        </div>
                        <div className={Styles.produtoInfo}>
                            <h3>{produto.nome}</h3>
                            <p>{produto.descricao}</p>
                            <div className={Styles.produtoMeta}>
                                <span className={Styles.preco}>R$ {Number(produto.preco).toFixed(2)}</span>
                            <span className={Styles.categoriaTag}>
                                    {typeof produto.categoria === 'object' 
                                    ? (produto.categoria.nome || "Sem Categoria") 
                                    : produto.categoria}
                                </span>
                            </div>
                        </div>
                        <div className={Styles.produtoActions}>
                            <button className={Styles.statusBtn} onClick={() => toggleDisponibilidade(produto)}>
                                {produto.disponivel ? 'Pausar' : 'Ativar'}
                            </button>
                            <button className={Styles.editBtn} onClick={() => handleOpenModal(produto)}><IoCreate size={16} /></button>
                            <button className={Styles.deleteBtn} onClick={() => handleDelete(produto.id)}><IoTrash size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modal}>
                        <div className={Styles.modalHeader}>
                            <h3>{editingItem ? 'Editar' : 'Novo'} Produto</h3>
                            <button onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className={Styles.modalContent}>
                            <div className={Styles.formGroup}>
                                <label>Nome do Produto</label>
                                <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                            </div>
                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Preço (R$)</label>
                                    <input type="number" step="0.01" value={formData.preco} onChange={(e) => setFormData({...formData, preco: e.target.value})} />
                                </div>
                                <div className={Styles.formGroup}>
                                    <label>Categoria</label>
                                    <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})}>
                                        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className={Styles.formGroup}>
                                <label>Imagem</label>
                                <ImageUploader onImageSelect={(url) => setFormData({...formData, imagemCustom: url})} currentImage={formData.imagemCustom} />
                            </div>
                            <div className={Styles.formGroup}>
                                <label>Descrição</label>
                                <textarea rows="3" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} />
                            </div>
                        </div>
                        <div className={Styles.modalActions}>
                            <button className={Styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className={Styles.saveBtn} onClick={handleSave}>Salvar no Banco</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardapioManager;