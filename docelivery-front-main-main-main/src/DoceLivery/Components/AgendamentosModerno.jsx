import React, { useState, useEffect } from 'react';
import { IoCalendar, IoTime, IoLocation, IoNotifications, IoAdd, IoEye, IoAlert, IoClose } from 'react-icons/io5';
import { useCardapio } from '../context/CardapioContext';
import Styles from './AgendamentosModerno.module.css';

const AgendamentosModerno = () => {
    const { encomendas } = useCardapio();
    const [mesAtual, setMesAtual] = useState(new Date());
    const [diaSelecionado, setDiaSelecionado] = useState(null);
    const [alertas, setAlertas] = useState([]);
    const [showAlertas, setShowAlertas] = useState(false);
    const [showNovaEncomenda, setShowNovaEncomenda] = useState(false);
    const [novaEncomenda, setNovaEncomenda] = useState({
        cliente: '',
        produto: '',
        data: '',
        horario: '',
        endereco: '',
        valor: '',
        status: 'Pendente'
    });

    const [encomendasMock, setEncomendasMock] = useState([
        { id: 1, cliente: 'Ana Silva', produto: 'Bolo de Aniversário', data: '2024-01-20', horario: '14:00', endereco: 'Rua das Flores, 123', valor: 85.00, status: 'Confirmado' },
        { id: 2, cliente: 'João Santos', produto: 'Kit Festa Infantil', data: '2024-01-22', horario: '16:00', endereco: 'Av. Principal, 456', valor: 150.00, status: 'Pendente' },
        { id: 3, cliente: 'Maria Lima', produto: 'Torta de Limão', data: '2024-01-25', horario: '10:00', endereco: 'Praça Central, 789', valor: 65.00, status: 'Confirmado' },
        { id: 4, cliente: 'Pedro Costa', produto: '50 Brigadeiros', data: '2024-01-28', horario: '18:00', endereco: 'Rua do Comércio, 321', valor: 120.00, status: 'Em Preparo' }
    ]);

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const getDiasDoMes = () => {
        const ano = mesAtual.getFullYear();
        const mes = mesAtual.getMonth();
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        const diasDoMes = [];

        for (let i = 0; i < primeiroDia.getDay(); i++) {
            diasDoMes.push(null);
        }

        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            diasDoMes.push(dia);
        }

        return diasDoMes;
    };

    const getEncomendasDoDia = (dia) => {
        if (!dia) return [];
        const dataFormatada = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        return encomendasMock.filter(encomenda => encomenda.data === dataFormatada);
    };

    const navegarMes = (direcao) => {
        const novoMes = new Date(mesAtual);
        novoMes.setMonth(mesAtual.getMonth() + direcao);
        setMesAtual(novoMes);
    };

    const verificarAlertas = () => {
        const hoje = new Date();
        const alertasHoje = encomendasMock.filter(encomenda => {
            const dataEncomenda = new Date(encomenda.data);
            const diffTime = dataEncomenda.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 1 && diffDays >= 0;
        });
        setAlertas(alertasHoje);
    };

    useEffect(() => {
        verificarAlertas();
        const interval = setInterval(verificarAlertas, 60000); // Verifica a cada minuto
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Confirmado': return '#10B981';
            case 'Pendente': return '#F59E0B';
            case 'Em Preparo': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const handleNovaEncomenda = () => {
        if (!novaEncomenda.cliente || !novaEncomenda.produto || !novaEncomenda.data || !novaEncomenda.horario) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        const encomenda = {
            id: Date.now(),
            ...novaEncomenda,
            valor: parseFloat(novaEncomenda.valor) || 0
        };

        setEncomendasMock([...encomendasMock, encomenda]);
        setNovaEncomenda({
            cliente: '',
            produto: '',
            data: '',
            horario: '',
            endereco: '',
            valor: '',
            status: 'Pendente'
        });
        setShowNovaEncomenda(false);
        alert('Encomenda agendada com sucesso!');
    };

    const marcarComoLido = (alertaId) => {
        setAlertas(alertas.filter(alerta => alerta.id !== alertaId));
    };

    return (
        <div className={Styles.agendamentosModerno}>
            <div className={Styles.header}>
                <div className={Styles.headerContent}>
                    <h1>Agenda de Encomendas</h1>
                    <p>Gerencie seus agendamentos e entregas</p>
                </div>
                <div className={Styles.headerActions}>
                    <button 
                        className={`${Styles.alertasBtn} ${alertas.length > 0 ? Styles.hasAlertas : ''}`}
                        onClick={() => setShowAlertas(!showAlertas)}
                    >
                        <IoNotifications size={20} />
                        {alertas.length > 0 && <span className={Styles.alertaBadge}>{alertas.length}</span>}
                        Alertas
                    </button>
                    <button 
                        className={Styles.addBtn}
                        onClick={() => setShowNovaEncomenda(true)}
                    >
                        <IoAdd size={20} />
                        Nova Encomenda
                    </button>
                </div>
            </div>

            {showAlertas && alertas.length > 0 && (
                <div className={Styles.alertasPanel}>
                    <h3>
                        <IoAlert size={20} />
                        Alertas de Entrega
                    </h3>
                    {alertas.map(alerta => (
                        <div key={alerta.id} className={Styles.alertaItem}>
                            <div className={Styles.alertaInfo}>
                                <strong>{alerta.cliente}</strong>
                                <span>{alerta.produto}</span>
                                <div className={Styles.alertaDetalhes}>
                                    <span><IoTime size={14} /> {alerta.horario}</span>
                                    <span><IoLocation size={14} /> {alerta.endereco}</span>
                                </div>
                            </div>
                            <div className={Styles.alertaActions}>
                                <div className={Styles.alertaValor}>R$ {alerta.valor.toFixed(2)}</div>
                                <button 
                                    className={Styles.marcarLidoBtn}
                                    onClick={() => marcarComoLido(alerta.id)}
                                    title="Marcar como lido"
                                >
                                    ✓
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={Styles.calendarioContainer}>
                <div className={Styles.calendarioHeader}>
                    <button onClick={() => navegarMes(-1)}>‹</button>
                    <h2>{meses[mesAtual.getMonth()]} {mesAtual.getFullYear()}</h2>
                    <button onClick={() => navegarMes(1)}>›</button>
                </div>

                <div className={Styles.diasSemana}>
                    {diasSemana.map(dia => (
                        <div key={dia} className={Styles.diaSemana}>{dia}</div>
                    ))}
                </div>

                <div className={Styles.diasGrid}>
                    {getDiasDoMes().map((dia, index) => {
                        const encomendas = getEncomendasDoDia(dia);
                        const hoje = new Date();
                        const isHoje = dia && 
                            dia === hoje.getDate() && 
                            mesAtual.getMonth() === hoje.getMonth() && 
                            mesAtual.getFullYear() === hoje.getFullYear();

                        return (
                            <div 
                                key={index} 
                                className={`${Styles.diaCell} ${isHoje ? Styles.hoje : ''} ${encomendas.length > 0 ? Styles.temEncomenda : ''} ${diaSelecionado === dia ? Styles.selecionado : ''}`}
                                onClick={() => dia && setDiaSelecionado(dia)}
                            >
                                {dia && (
                                    <>
                                        <span className={Styles.numeroDia}>{dia}</span>
                                        {encomendas.length > 0 && (
                                            <div className={Styles.indicadorEncomendas}>
                                                {encomendas.length}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {diaSelecionado && (
                <div className={Styles.detalhesContainer}>
                    <h3>
                        <IoCalendar size={20} />
                        Encomendas para {diaSelecionado}/{mesAtual.getMonth() + 1}
                    </h3>
                    
                    {getEncomendasDoDia(diaSelecionado).length > 0 ? (
                        <div className={Styles.encomendasList}>
                            {getEncomendasDoDia(diaSelecionado).map(encomenda => (
                                <div key={encomenda.id} className={Styles.encomendaCard}>
                                    <div className={Styles.encomendaHeader}>
                                        <div className={Styles.clienteInfo}>
                                            <h4>{encomenda.cliente}</h4>
                                            <span 
                                                className={Styles.statusBadge}
                                                style={{ backgroundColor: getStatusColor(encomenda.status) }}
                                            >
                                                {encomenda.status}
                                            </span>
                                        </div>
                                        <div className={Styles.valor}>R$ {encomenda.valor.toFixed(2)}</div>
                                    </div>
                                    
                                    <div className={Styles.encomendaContent}>
                                        <p className={Styles.produto}>{encomenda.produto}</p>
                                        <div className={Styles.detalhes}>
                                            <div className={Styles.detalheItem}>
                                                <IoTime size={16} />
                                                <span>{encomenda.horario}</span>
                                            </div>
                                            <div className={Styles.detalheItem}>
                                                <IoLocation size={16} />
                                                <span>{encomenda.endereco}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={Styles.encomendaActions}>
                                        <button className={Styles.viewBtn}>
                                            <IoEye size={16} />
                                            Ver Detalhes
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={Styles.semEncomendas}>
                            <IoCalendar size={48} />
                            <p>Nenhuma encomenda agendada para este dia</p>
                        </div>
                    )}
                </div>
            )}

            {showNovaEncomenda && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modal}>
                        <div className={Styles.modalHeader}>
                            <h3>Nova Encomenda</h3>
                            <button 
                                className={Styles.closeBtn}
                                onClick={() => setShowNovaEncomenda(false)}
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
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                
                                <div className={Styles.formGroup}>
                                    <label>Horário *</label>
                                    <input
                                        type="time"
                                        value={novaEncomenda.horario}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, horario: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className={Styles.formGroup}>
                                <label>Endereço de Entrega</label>
                                <input
                                    type="text"
                                    value={novaEncomenda.endereco}
                                    onChange={(e) => setNovaEncomenda({...novaEncomenda, endereco: e.target.value})}
                                    placeholder="Endereço completo"
                                />
                            </div>
                            
                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Valor</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={novaEncomenda.valor}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, valor: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                
                                <div className={Styles.formGroup}>
                                    <label>Status</label>
                                    <select
                                        value={novaEncomenda.status}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, status: e.target.value})}
                                    >
                                        <option value="Pendente">Pendente</option>
                                        <option value="Confirmado">Confirmado</option>
                                        <option value="Em Preparo">Em Preparo</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className={Styles.modalActions}>
                            <button 
                                className={Styles.cancelBtn}
                                onClick={() => setShowNovaEncomenda(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className={Styles.confirmBtn}
                                onClick={handleNovaEncomenda}
                            >
                                Agendar Encomenda
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendamentosModerno;