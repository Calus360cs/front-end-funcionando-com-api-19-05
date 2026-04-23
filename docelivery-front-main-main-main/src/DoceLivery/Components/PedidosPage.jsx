import React, { useState } from 'react';
import { IoAdd, IoCalendar, IoFilter, IoSearch, IoEye, IoCheckmark, IoClose, IoGrid, IoList } from 'react-icons/io5';
import { useDashboard } from '../context/DashboardContext';
import CalendarioEncomendas from './CalendarioEncomendas';
import HistoricoPedido from './HistoricoPedido';
import Styles from './PedidosPage.module.css';

const PedidosPage = () => {
    const { dashboardData, updatePedidos } = useDashboard();
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [busca, setBusca] = useState('');
    const [showAgendarModal, setShowAgendarModal] = useState(false);
    const [showHistorico, setShowHistorico] = useState(false);
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
    const [visualizacao, setVisualizacao] = useState('lista'); // 'lista' ou 'calendario'
    const [novaEncomenda, setNovaEncomenda] = useState({
        cliente: '',
        produto: '',
        data: '',
        valor: '',
        observacoes: ''
    });

    const pedidosDoLocalStorage = JSON.parse(localStorage.getItem('confeiteiroPedidos') || '[]');
    const pedidosCompletos = [
        ...dashboardData.pedidos.recentes,
        ...pedidosDoLocalStorage.map(pedido => ({
            id: pedido.id,
            cliente: pedido.customerName,
            produto: pedido.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
            valor: pedido.total,
            status: pedido.status === 'pendente' ? 'Novo' : pedido.status,
            data: new Date(pedido.orderTime).toLocaleDateString('pt-BR')
        })),
        { id: 104, cliente: 'Carlos Silva', produto: 'Torta de Chocolate', valor: 65.00, status: 'Pendente', data: '2024-01-10' },
        { id: 105, cliente: 'Lucia Santos', produto: 'Cupcakes Personalizados', valor: 48.00, status: 'Em Preparo', data: '2024-01-10' },
        { id: 106, cliente: 'Pedro Lima', produto: 'Bolo de Casamento', valor: 250.00, status: 'Agendado', data: '2024-01-15' }
    ];

    const pedidosFiltrados = pedidosCompletos.filter(pedido => {
        const matchStatus = filtroStatus === 'todos' || pedido.status.toLowerCase().includes(filtroStatus.toLowerCase());
        const matchBusca = pedido.cliente.toLowerCase().includes(busca.toLowerCase()) || 
                          pedido.produto.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    const handleStatusChange = (pedidoId, novoStatus) => {
        console.log(`Alterando status do pedido ${pedidoId} para ${novoStatus}`);
    };

    const handleVerHistorico = (pedido) => {
        setPedidoSelecionado(pedido);
        setShowHistorico(true);
    };

    const handleAgendarEncomenda = () => {
        if (!novaEncomenda.cliente || !novaEncomenda.produto || !novaEncomenda.data) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }
        
        console.log('Nova encomenda agendada:', novaEncomenda);
        setShowAgendarModal(false);
        setNovaEncomenda({ cliente: '', produto: '', data: '', valor: '', observacoes: '' });
        alert('Encomenda agendada com sucesso!');
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'novo': return '#3B82F6';
            case 'pendente': return '#F59E0B';
            case 'em preparo': return '#8B5CF6';
            case 'concluído': return '#10B981';
            case 'agendado': return '#06B6D4';
            default: return '#6B7280';
        }
    };

    return (
        <div className={Styles.pedidosPage}>
            <div className={Styles.pageHeader}>
                <div className={Styles.headerLeft}>
                    <h2>Gerenciar Pedidos</h2>
                    <p>Visualize e gerencie todos os pedidos da sua confeitaria</p>
                </div>
                <div className={Styles.headerActions}>
                    <div className={Styles.viewToggle}>
                        <button 
                            className={`${Styles.toggleBtn} ${visualizacao === 'lista' ? Styles.active : ''}`}
                            onClick={() => setVisualizacao('lista')}
                        >
                            <IoList size={20} />
                        </button>
                        <button 
                            className={`${Styles.toggleBtn} ${visualizacao === 'calendario' ? Styles.active : ''}`}
                            onClick={() => setVisualizacao('calendario')}
                        >
                            <IoGrid size={20} />
                        </button>
                    </div>
                    <button 
                        className={Styles.agendarBtn}
                        onClick={() => setShowAgendarModal(true)}
                    >
                        <IoCalendar size={20} />
                        Agendar Encomenda
                    </button>
                </div>
            </div>

            <div className={Styles.filters}>
                <div className={Styles.searchBox}>
                    <IoSearch size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou produto..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>
                
                <div className={Styles.statusFilter}>
                    <IoFilter size={20} />
                    <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                        <option value="todos">Todos os Status</option>
                        <option value="novo">Novo</option>
                        <option value="pendente">Pendente</option>
                        <option value="em preparo">Em Preparo</option>
                        <option value="concluído">Concluído</option>
                        <option value="agendado">Agendado</option>
                    </select>
                </div>
            </div>

            {visualizacao === 'lista' ? (
                <div className={Styles.pedidosGrid}>
                    {pedidosFiltrados.map(pedido => (
                        <div key={pedido.id} className={Styles.pedidoCard}>
                            <div className={Styles.cardHeader}>
                                <span className={Styles.pedidoId}>#{pedido.id}</span>
                                <span 
                                    className={Styles.statusBadge}
                                    style={{ backgroundColor: getStatusColor(pedido.status) }}
                                >
                                    {pedido.status}
                                </span>
                            </div>
                            
                            <div className={Styles.cardContent}>
                                <h3>{pedido.cliente}</h3>
                                <p>{pedido.produto}</p>
                                <div className={Styles.pedidoMeta}>
                                    <span className={Styles.valor}>R$ {pedido.valor.toFixed(2)}</span>
                                    {pedido.data && <span className={Styles.data}>{pedido.data}</span>}
                                </div>
                            </div>
                            
                            <div className={Styles.cardActions}>
                                <button 
                                    className={Styles.viewBtn}
                                    onClick={() => handleVerHistorico(pedido)}
                                    title="Ver Histórico"
                                >
                                    <IoEye size={16} />
                                </button>
                                <button 
                                    className={Styles.approveBtn}
                                    onClick={() => handleStatusChange(pedido.id, 'Em Preparo')}
                                    title="Aprovar Pedido"
                                >
                                    <IoCheckmark size={16} />
                                </button>
                                <button className={Styles.rejectBtn} title="Rejeitar Pedido">
                                    <IoClose size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <CalendarioEncomendas />
            )}

            {showAgendarModal && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modal}>
                        <div className={Styles.modalHeader}>
                            <h3>Agendar Nova Encomenda</h3>
                            <button 
                                className={Styles.closeBtn}
                                onClick={() => setShowAgendarModal(false)}
                            >
                                <IoClose size={24} />
                            </button>
                        </div>
                        
                        <div className={Styles.modalContent}>
                            <div className={Styles.formGroup}>
                                <label>Cliente *</label>
                                <input
                                    type="text"
                                    value={novaEncomenda.cliente}
                                    onChange={(e) => setNovaEncomenda({...novaEncomenda, cliente: e.target.value})}
                                    placeholder="Nome do cliente"
                                />
                            </div>
                            
                            <div className={Styles.formGroup}>
                                <label>Produto *</label>
                                <input
                                    type="text"
                                    value={novaEncomenda.produto}
                                    onChange={(e) => setNovaEncomenda({...novaEncomenda, produto: e.target.value})}
                                    placeholder="Descrição do produto"
                                />
                            </div>
                            
                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Data de Entrega *</label>
                                    <input
                                        type="date"
                                        value={novaEncomenda.data}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, data: e.target.value})}
                                    />
                                </div>
                                
                                <div className={Styles.formGroup}>
                                    <label>Valor</label>
                                    <input
                                        type="number"
                                        value={novaEncomenda.valor}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, valor: e.target.value})}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            <div className={Styles.formGroup}>
                                <label>Observações</label>
                                <textarea
                                    value={novaEncomenda.observacoes}
                                    onChange={(e) => setNovaEncomenda({...novaEncomenda, observacoes: e.target.value})}
                                    placeholder="Detalhes adicionais sobre a encomenda..."
                                    rows="3"
                                />
                            </div>
                        </div>
                        
                        <div className={Styles.modalActions}>
                            <button 
                                className={Styles.cancelBtn}
                                onClick={() => setShowAgendarModal(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className={Styles.confirmBtn}
                                onClick={handleAgendarEncomenda}
                            >
                                Agendar Encomenda
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHistorico && pedidoSelecionado && (
                <HistoricoPedido 
                    pedido={pedidoSelecionado}
                    onClose={() => {
                        setShowHistorico(false);
                        setPedidoSelecionado(null);
                    }}
                />
            )}
        </div>
    );
};

export default PedidosPage;