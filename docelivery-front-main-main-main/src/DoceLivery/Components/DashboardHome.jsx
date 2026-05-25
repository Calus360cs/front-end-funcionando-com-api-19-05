// src/Components/DashboardHome.jsx

import React, { useState, useEffect } from 'react';
import Styles from '../Components/DashboardHome.module.css';
import { FaBoxOpen, FaChartLine, FaCalendarAlt, FaShoppingCart, FaExclamationTriangle, FaClock, FaEdit } from 'react-icons/fa';
import { useStore } from '../context/StoreContext';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';
import SalesChart from './SalesChart';
import VendasTempoReal from './VendasTempoReal';

const DashboardHome = ({ editMode, userData }) => {
    const { storeData, updateStoreData } = useStore();
    const [editingField, setEditingField] = useState(null);
    
    // ESTADOS REAIS DA API
    const [pedidosBanco, setPedidosBanco] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confeiteiroId, setConfeiteiroId] = useState(null);

    // 1. Garante a captura do ID do Confeiteiro de forma segura
    useEffect(() => {
        const id = AuthService.getUserId();
        if (id) {
            setConfeiteiroId(id);
        }
    }, []);

    // 2. ESTADO INICIAL BASEADO NAS PROPS REAIS DO PAI OU FALLBACK
    const [displayStoreData, setDisplayStoreData] = useState({
        nomeConfeiteiro: 'Confeiteiro',
        name: 'Minha Confeitaria', 
        description: 'Adicione uma descrição para a sua loja.', 
        email: '',
        phone: '',
        address: '' 
    });

    // 3. CARREGAR DADOS DE PEDIDOS DO BACKEND (Dispara assim que o ID for validado)
    useEffect(() => {
        const buscarDadosDashboard = async () => {
            try {
                setLoading(true);
                console.log("Buscando fila de trabalho para o confeiteiro:", confeiteiroId);
                const dados = await OrderService.getFilaTrabalho(confeiteiroId);
                setPedidosBanco(dados || []);
            } catch (error) {
                console.error("Erro ao alimentar o painel com a API:", error);
            } finally {
                setLoading(false);
            }
        };

        if (confeiteiroId) {
            buscarDadosDashboard();
        } else {
            // Se não tem ID ainda, não deixa a tela travada no loading para sempre
            setLoading(false);
        }
    }, [confeiteiroId]);

    // 4. SINCRONIZAR PROPS EM TEMPO REAL (Evita que o localStorage antigo sobrescreva o banco)
    useEffect(() => {
        const recompute = () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Arquitetura: Prioriza StoreContext para evitar conflitos com LojaContext
            const lojaObjeto = storeData || savedUser.loja || {};

            // Se o pai passou a loja direto como string, usamos ela, senão pegamos o nomeFantasia do objeto
            const nomeLojaValido = typeof userData?.loja === 'string' 
                ? userData.loja 
                : (lojaObjeto.nomeFantasia || 'Minha Confeitaria');

            setDisplayStoreData({
                nomeConfeiteiro: userData?.nome || savedUser.nome || 'Confeiteiro',
                name: nomeLojaValido, 
                description: lojaObjeto.descricao || 'Adicione uma descrição para a sua loja.', 
                email: userData?.email || savedUser.email || '',
                phone: lojaObjeto.telefone || savedUser.telefone || '',
                address: lojaObjeto.endereco || '' 
            });
        };

        recompute();
        window.addEventListener('localStorageUpdate', recompute);
        return () => window.removeEventListener('localStorageUpdate', recompute);
    }, [storeData, userData]);

    // 2. PROCESSAMENTO MATEMÁTICO REAL DOS PEDIDOS DO BANCO
    const kpisCalculados = React.useMemo(() => {
        // const hojeStr = new Date().toISOString().split('T')[0];

        const novosEPendentes = pedidosBanco.filter(p => p.status === 'NOVO' || p.status === 'PENDENTE');
        const agendadosProximos = pedidosBanco.filter(p => p.agendado === true);
        
        const totalVendasHoje = pedidosBanco
            .filter(p => p.status !== 'CANCELADO')
            .reduce((acc, p) => acc + (p.valorPedido || 0), 0);

        const ticketMedio = pedidosBanco.length > 0 ? (totalVendasHoje / pedidosBanco.length) : 0;

        return {
            pedidosHoje: pedidosBanco.length,
            pedidosPendentesCount: novosEPendentes.length,
            vendasHojeValor: totalVendasHoje,
            ticketMedioValor: ticketMedio,
            agendamentosContagem: agendadosProximos.length,
            listaRecentes: pedidosBanco.slice(0, 5),
            listaAgendados: agendadosProximos.slice(0, 3)
        };
    }, [pedidosBanco]);

    const dadosGraficoVendas = [
        { name: 'Seg', vendas: kpisCalculados.vendasHojeValor * 0.1 },
        { name: 'Ter', vendas: kpisCalculados.vendasHojeValor * 0.3 },
        { name: 'Qua', vendas: kpisCalculados.vendasHojeValor * 0.2 },
        { name: 'Qui', vendas: kpisCalculados.vendasHojeValor * 0.4 },
        { name: 'Sex', vendas: kpisCalculados.vendasHojeValor * 0.6 },
        { name: 'Sáb', vendas: kpisCalculados.vendasHojeValor * 0.9 },
        { name: 'Dom', vendas: kpisCalculados.vendasHojeValor }
    ];

    const handleEdit = (field, value) => {
        updateStoreData({ [field]: value });
        setEditingField(null);
    };

    const EditableField = ({ field, value, type = 'text', className = '' }) => {
        const isEditing = editingField === field;
        if (!editMode) return <span className={className}>{value}</span>;
        
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
            <span className={`${className} ${Styles.editable}`} onClick={() => setEditingField(field)}>
                {value} <FaEdit size={12} className={Styles.editIcon} />
            </span>
        );
    };

    if (loading) return <p style={{ padding: '20px' }}>Sincronizando painel com banco de dados...</p>;

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
            
            {/* GRID DE KPIS */}
            <div className={Styles.kpiGrid}>
                <div className={Styles.kpiCard + ' ' + Styles.pedidosCard}>
                    <div className={Styles.cardContent}>
                        <h3>Pedidos na Fila</h3>
                        <span className={Styles.kpiValue}>{kpisCalculados.pedidosHoje}</span>
                        <small>{kpisCalculados.pedidosPendentesCount} pendentes</small>
                    </div>
                    <div className={Styles.cardIcon}><FaBoxOpen /></div>
                </div>
                
                <div className={Styles.kpiCard + ' ' + Styles.vendasCard}>
                    <div className={Styles.cardContent}>
                        <h3>Faturamento Bruto</h3>
                        <span className={Styles.kpiValue}>R$ {kpisCalculados.vendasHojeValor.toFixed(2)}</span>
                        <small>Ticket médio: R$ {kpisCalculados.ticketMedioValor.toFixed(2)}</small>
                    </div>
                    <div className={Styles.cardIcon}><FaChartLine /></div>
                </div>
                
                <div className={Styles.kpiCard + ' ' + Styles.clientesCard}>
                    <div className={Styles.cardContent}>
                        <h3>Produtos em Uso</h3>
                        <span className={Styles.kpiValue}>{pedidosBanco.length > 0 ? 'Ativo' : '0'}</span>
                        <small>Sincronizado via HTTP</small>
                    </div>
                    <div className={Styles.cardIcon}><FaShoppingCart /></div>
                </div>
                
                <div className={Styles.kpiCard + ' ' + Styles.agendamentosCard}>
                    <div className={Styles.cardContent}>
                        <h3>Agendamentos</h3>
                        <span className={Styles.kpiValue}>{kpisCalculados.agendamentosContagem}</span>
                        <small>Pedidos agendados no banco</small>
                    </div>
                    <div className={Styles.cardIcon}><FaCalendarAlt /></div>
                </div>
            </div>
            
            <div className={Styles.chartSection}>
                <SalesChart salesData={dadosGraficoVendas} />
                <VendasTempoReal />
            </div>

            <div className={Styles.dashboardGrid}>
                <div className={Styles.recentActivity}>
                    <h3>Pedidos Recentes (API)</h3>
                    <ul className={Styles.pedidosList}>
                        {kpisCalculados.listaRecentes.map(pedido => (
                            <li key={pedido.id} className={Styles.pedidoItem}>
                                <div className={Styles.pedidoInfo}>
                                    <strong>#{pedido.id}</strong> - {pedido.cliente?.nome || 'Cliente Balcão'}
                                    <span className={Styles.produto}>
                                        {pedido.itens?.map(i => `${i.quantidade}x ${i.produto?.nome}`).join(', ') || 'Doce Variado'}
                                    </span>
                                </div>
                                <div className={Styles.pedidoMeta}>
                                    <span className={Styles.valor}>R$ {pedido.valorPedido?.toFixed(2)}</span>
                                    <span className={`${Styles.statusTag} ${Styles[pedido.status || 'NOVO']}`}>{pedido.status}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className={Styles.upcomingEvents}>
                    <h3>Próximos Agendamentos</h3>
                    <div className={Styles.eventsList}>
                        {kpisCalculados.listaAgendados.map(evento => (
                            <div key={evento.id} className={Styles.eventItem}>
                                <div className={Styles.eventDate}>
                                    <FaClock size={16} />
                                    {evento.dataEntregaAgendada ? new Date(evento.dataEntregaAgendada).toLocaleDateString('pt-BR') : 'Sem data'}
                                </div>
                                <div className={Styles.eventInfo}>
                                    <strong>{evento.cliente?.nome || 'Agendado Manual'}</strong>
                                    <span>{evento.itens?.map(i => i.produto?.nome).join(', ') || 'Encomenda'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className={Styles.financialSummary}>
                    <h3>Resumo Financeiro</h3>
                    <div className={Styles.financialItem}>
                        <span>Total Líquido Estimado:</span>
                        <strong>R$ {(kpisCalculados.vendasHojeValor * 0.7).toFixed(2)}</strong>
                    </div>
                    <div className={Styles.financialItem}>
                        <span>Faturamento Bruto Total:</span>
                        <strong>R$ {kpisCalculados.vendasHojeValor.toFixed(2)}</strong>
                    </div>
                </div>
                
                <div className={Styles.alerts}>
                    <h3>Alertas Ativos</h3>
                    <div className={Styles.alertItem}>
                        <FaExclamationTriangle className={Styles.alertIcon} />
                        <span>{kpisCalculados.pedidosPendentesCount} novos pedidos aguardando aceite</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;