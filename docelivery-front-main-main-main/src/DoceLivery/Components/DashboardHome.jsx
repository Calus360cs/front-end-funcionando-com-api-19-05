// src/Components/DashboardHome.jsx

import React, { useState } from 'react';
import Styles from '../Components/DashboardHome.module.css';
import { FaBoxOpen, FaChartLine, FaUsers, FaEdit, FaClock, FaCalendarAlt, FaShoppingCart, FaExclamationTriangle } from 'react-icons/fa';
import { useStore } from '../context/StoreContext';
import { useDashboard } from '../context/DashboardContext';
import SalesChart from './SalesChart';
import VendasTempoReal from './VendasTempoReal';

// Componente KpiCard: Definido aqui para garantir que esteja acessível
const KpiCard = ({ title, value, icon, className }) => (
    <div className={Styles.kpiCard + ' ' + className}>
        <div className={Styles.cardContent}>
            <h3>{title}</h3>
            <span>{value}</span>
        </div>
        <div className={Styles.cardIcon}>
            {icon}
        </div>
    </div>
);


const DashboardHome = ({ editMode }) => {
    const { storeData, updateStoreData } = useStore();
    const { dashboardData, getVendasSemanais, adicionarVenda } = useDashboard();
    const [editingField, setEditingField] = useState(null);
    const [displayStoreData, setDisplayStoreData] = useState(() => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        return {
            ...storeData,
            nomeConfeiteiro: savedUser.nome || 'Confeiteiro',
            name: savedUser.nomeLoja || 'Minha Confeitaria',
            description: savedUser.loja?.descricao || storeData.description,
            email: savedUser.email || '',
            phone: savedUser.telefone || '',
            address: savedUser.loja?.endereco || ''
        };
    });

    // Atualiza displayStoreData quando storeData ou localStorage mudar (ex.: login/logout)
    React.useEffect(() => {
        const recompute = () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setDisplayStoreData({
                ...storeData,
                nomeConfeiteiro: savedUser.nome || 'Confeiteiro',
                name: savedUser.nomeLoja || 'Minha Confeitaria',
                description: savedUser.loja?.descricao || storeData.description,
                email: savedUser.email || '',
                phone: savedUser.telefone || '',
                address: savedUser.loja?.endereco || ''
            });
        };

        recompute();
        window.addEventListener('localStorageUpdate', recompute);
        return () => window.removeEventListener('localStorageUpdate', recompute);
    }, [storeData]);

    const handleEdit = (field, value) => {
        updateStoreData({ [field]: value });
        setEditingField(null);
    };
    
    // Função para simular um novo pedido (para teste)
    const simularNovoPedido = () => {
        const valorPedido = Math.random() * 100 + 20; // Valor entre R$ 20 e R$ 120
        adicionarVenda(valorPedido);
    };
    
    // Dados reais do gráfico vindos do contexto
    const dadosGraficoVendas = getVendasSemanais();


    const EditableField = ({ field, value, type = 'text', className = '' }) => {
        const isEditing = editingField === field;
        
        if (!editMode) {
            return <span className={className}>{value}</span>;
        }
        
        if (isEditing) {
            return (
                <input
                    type={type}
                    defaultValue={value}
                    onBlur={(e) => handleEdit(field, e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEdit(field, e.target.value)}
                    autoFocus
                    className={`${Styles.editInput} ${className}`}
                />
            );
        }
        
        return (
            <span 
                className={`${className} ${Styles.editable}`}
                onClick={() => setEditingField(field)}
            >
                {value} <FaEdit size={12} className={Styles.editIcon} />
            </span>
        );
    };

    return (
        <div className={Styles.dashboardHome}>
            <div className={Styles.welcomeSection}>
                <h1>Bem-vindo de volta, {displayStoreData.nomeConfeiteiro}!</h1>
                <p>Gerencie seus kits, produtos e pedidos da loja <strong>{displayStoreData.name || "não identificada"}</strong>.</p>
                <div className={Styles.storeInfo}>
                    <h3>
                        <EditableField 
                            field="name" 
                            value={displayStoreData.name}
                            className={Styles.storeName}
                        />
                    </h3>
                    {displayStoreData.email && <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#666' }}>📧 {displayStoreData.email}</p>}
                    {displayStoreData.phone && <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#666' }}>📞 {displayStoreData.phone}</p>}
                    {displayStoreData.address && displayStoreData.address !== 'Rua das Flores, 123 - Centro' && (
                        <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#666' }}>📍 {displayStoreData.address}</p>
                    )}
                    <p>
                        <EditableField 
                            field="description" 
                            value={displayStoreData.description}
                            className={Styles.storeDescription}
                        />
                    </p>
                </div>
            </div>
            
            <div className={Styles.kpiGrid}>
                <div className={Styles.kpiCard + ' ' + Styles.pedidosCard}>
                    <div className={Styles.cardContent}>
                        <h3>Pedidos Hoje</h3>
                        <span className={Styles.kpiValue}>{dashboardData.pedidos.hoje}</span>
                        <small>{dashboardData.pedidos.pendentes} pendentes</small>
                    </div>
                    <div className={Styles.cardIcon}>
                        <FaBoxOpen />
                    </div>
                </div>
                
                <div className={Styles.kpiCard + ' ' + Styles.vendasCard}>
                    <div className={Styles.cardContent}>
                        <h3>Vendas Hoje</h3>
                        <span className={Styles.kpiValue}>R$ {dashboardData.financeiro.vendasHoje.toFixed(2)}</span>
                        <small>Ticket médio: R$ {dashboardData.financeiro.ticketMedio.toFixed(2)}</small>
                    </div>
                    <div className={Styles.cardIcon}>
                        <FaChartLine />
                    </div>
                </div>
                
                <div className={Styles.kpiCard + ' ' + Styles.clientesCard}>
                    <div className={Styles.cardContent}>
                        <h3>Produtos Ativos</h3>
                        <span className={Styles.kpiValue}>{dashboardData.cardapio.produtosAtivos}</span>
                        <small>{dashboardData.cardapio.produtosBaixoEstoque} baixo estoque</small>
                    </div>
                    <div className={Styles.cardIcon}>
                        <FaShoppingCart />
                    </div>
                </div>
                
                <div className={Styles.kpiCard + ' ' + Styles.agendamentosCard}>
                    <div className={Styles.cardContent}>
                        <h3>Agendamentos</h3>
                        <span className={Styles.kpiValue}>{dashboardData.agendamentos.hoje}</span>
                        <small>{dashboardData.agendamentos.semana} esta semana</small>
                    </div>
                    <div className={Styles.cardIcon}>
                        <FaCalendarAlt />
                    </div>
                </div>
            </div>
            
            {/* Gráfico de Vendas da Semana */}
            <div className={Styles.chartSection}>
                <SalesChart salesData={dadosGraficoVendas} />
                <VendasTempoReal />
                <button 
                    onClick={simularNovoPedido} 
                    className={Styles.testButton}
                    style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#8B5CF6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Simular Novo Pedido (Teste)
                </button>
            </div>

            <div className={Styles.dashboardGrid}>
                {/* Pedidos Recentes */}
                <div className={Styles.recentActivity}>
                    <h3>Pedidos Recentes</h3>
                    <ul className={Styles.pedidosList}>
                        {dashboardData.pedidos.recentes.map(pedido => (
                            <li key={pedido.id} className={Styles.pedidoItem}>
                                <div className={Styles.pedidoInfo}>
                                    <strong>#{pedido.id}</strong> - {pedido.cliente}
                                    <span className={Styles.produto}>{pedido.produto}</span>
                                </div>
                                <div className={Styles.pedidoMeta}>
                                    <span className={Styles.valor}>R$ {pedido.valor.toFixed(2)}</span>
                                    <span className={`${Styles.statusTag} ${Styles[pedido.status.replace(/\s/g, '')]}`}>{pedido.status}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Próximos Agendamentos */}
                <div className={Styles.upcomingEvents}>
                    <h3>Próximos Agendamentos</h3>
                    <div className={Styles.eventsList}>
                        {dashboardData.agendamentos.proximos.map(evento => (
                            <div key={evento.id} className={Styles.eventItem}>
                                <div className={Styles.eventDate}>
                                    <FaClock size={16} />
                                    {new Date(evento.data).toLocaleDateString('pt-BR')}
                                </div>
                                <div className={Styles.eventInfo}>
                                    <strong>{evento.cliente}</strong>
                                    <span>{evento.produto}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Resumo Financeiro */}
                <div className={Styles.financialSummary}>
                    <h3>Resumo Financeiro</h3>
                    <div className={Styles.financialItem}>
                        <span>Vendas da Semana:</span>
                        <strong>R$ {dashboardData.financeiro.vendasSemana.toFixed(2)}</strong>
                    </div>
                    <div className={Styles.financialItem}>
                        <span>Vendas do Mês:</span>
                        <strong>R$ {dashboardData.financeiro.vendasMes.toFixed(2)}</strong>
                    </div>
                    <div className={Styles.financialItem}>
                        <span>Produto Mais Vendido:</span>
                        <strong>{dashboardData.financeiro.produtoMaisVendido}</strong>
                    </div>
                </div>
                
                {/* Alertas */}
                <div className={Styles.alerts}>
                    <h3>Alertas</h3>
                    <div className={Styles.alertItem}>
                        <FaExclamationTriangle className={Styles.alertIcon} />
                        <span>{dashboardData.pedidos.pendentes} pedidos pendentes</span>
                    </div>
                    <div className={Styles.alertItem}>
                        <FaExclamationTriangle className={Styles.alertIcon} />
                        <span>{dashboardData.cardapio.produtosBaixoEstoque} produtos com baixo estoque</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;