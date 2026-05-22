import React, { useState, useEffect } from 'react';
import { IoCalendar, IoTime, IoLocation, IoNotifications, IoAdd, IoEye, IoAlert, IoClose } from 'react-icons/io5';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';
import Styles from './AgendamentosModerno.module.css';

// Configura o moment para usar o idioma e fuso horário local
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const AgendamentosModerno = () => {
    const [mesAtual, setMesAtual] = useState(new Date());
    const [diaSelecionado, setDiaSelecionado] = useState(null);
    const [alertas, setAlertas] = useState([]);
    const [showAlertas, setShowAlertas] = useState(false);
    const [showNovaEncomenda, setShowNovaEncomenda] = useState(false);
    const confeiteiroId = AuthService.getUserId();

    // Estado da API real
    const [encomendasReal, setEncomendasReal] = useState([]);

    const [novaEncomenda, setNovaEncomenda] = useState({
        clienteNome: '',
        produtoId: '',
        data: '',
        horario: '',
        valor: '',
        status: 'AGENDADO' // Ajustado para Enum do Java
    });

    useEffect(() => {
        carregarAgendamentosDoBanco();
    }, [confeiteiroId]);

    const carregarAgendamentosDoBanco = async () => {
        try {
            const dados = await OrderService.getFilaTrabalho(confeiteiroId);
            const agendados = (dados || []).filter(p => p.agendado === true);
            setEncomendasReal(agendados);
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        }
    };

    // CORRIGIDO: Envia o cadastro manual para o banco de dados real
    const handleNovaEncomenda = async () => {
        if (!novaEncomenda.clienteNome || !novaEncomenda.data || !novaEncomenda.horario) {
            alert('Preencha os campos obrigatórios!');
            return;
        }

        const payloadPedido = {
            cliente: { nome: novaEncomenda.clienteNome },
            agendado: true,
            status: "AGENDADO",
            dataEntregaAgendada: `${novaEncomenda.data}T${novaEncomenda.horario}:00`,
            valorPedido: parseFloat(novaEncomenda.valor || 0),
            itens: [
                {
                    produto: { id: parseInt(novaEncomenda.produtoId || 1) },
                    quantidade: 1
                }
            ]
        };

        try {
            // Chama a rota HTTP POST que criamos juntos no Java
            const resposta = await fetch(`http://localhost:8080/api/pedidos/confeiteiro/${confeiteiroId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadPedido)
            });

            if (resposta.ok) {
                alert('Encomenda agendada com sucesso no banco!');
                setShowNovaEncomenda(false);
                carregarAgendamentosDoBanco(); // Recarrega o grid
            }
        } catch (error) {
            alert('Erro ao salvar no backend.');
        }
    };

    const events = encomendasReal.map(pedido => ({
        title: `Encomenda: ${pedido.cliente?.nome || 'WhatsApp'}`,
        start: new Date(pedido.dataEntregaAgendada),
        end: new Date(pedido.dataEntregaAgendada),
        allDay: false
    }));

    return (
        <div className={Styles.container}>
            {/* Header */}
            <div className={Styles.header}>
                <div>
                    <h1>Gestão de Encomendas</h1>
                    <p>Calendário de produção e entregas futuras</p>
                </div>
                <div className={Styles.actions}>
                    <button className={Styles.alertBtn} onClick={() => setShowAlertas(!showAlertas)}>
                        <IoNotifications size={20} />
                        {alertas.length > 0 && <span className={Styles.badge}>{alertas.length}</span>}
                    </button>
                    <button className={Styles.addBtn} onClick={() => setShowNovaEncomenda(true)}>
                        <IoAdd size={20} /> Nova Encomenda
                    </button>
                </div>
            </div>

            {/* Calendário de Produção Visual */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginTop: '20px', height: '550px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'day']}
                />
            </div>

            {/* Listagem Simplificada usando dados reais vindos da API */}
            <div className={Styles.gridOtimizado} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h3>Listagem de Encomendas na API</h3>
                {encomendasReal.map(enc => (
                    <div key={enc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                        <span><strong>{enc.cliente?.nome || 'Balcão'}</strong></span>
                        <span>{enc.dataEntregaAgendada ? new Date(enc.dataEntregaAgendada).toLocaleString('pt-BR') : 'Sem data'}</span>
                        <span style={{ color: '#ff69b4', fontWeight: 'bold' }}>R$ {enc.valorPedido?.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Modal de Nova Encomenda */}
            {showNovaEncomenda && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modal}>
                        <div className={Styles.modalHeader}>
                            <h2>Agendar Nova Encomenda</h2>
                            <button onClick={() => setShowNovaEncomenda(false)}><IoClose size={24} /></button>
                        </div>
                        
                        <div className={Styles.modalBody}>
                            <div className={Styles.formGroup}>
                                <label>Nome do Cliente</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Maria Souza"
                                    value={novaEncomenda.clienteNome}
                                    onChange={(e) => setNovaEncomenda({...novaEncomenda, clienteNome: e.target.value})}
                                />
                            </div>
                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>ID do Produto</label>
                                    <input 
                                        type="number" 
                                        placeholder="ID do doce"
                                        value={novaEncomenda.produtoId}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, produtoId: e.target.value})}
                                    />
                                </div>
                                <div className={Styles.formGroup}>
                                    <label>Valor (R$)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={novaEncomenda.valor}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, valor: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Data da Entrega</label>
                                    <input 
                                        type="date"
                                        value={novaEncomenda.data}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, data: e.target.value})}
                                    />
                                </div>
                                <div className={Styles.formGroup}>
                                    <label>Horário</label>
                                    <input 
                                        type="time"
                                        value={novaEncomenda.horario}
                                        onChange={(e) => setNovaEncomenda({...novaEncomenda, horario: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className={Styles.modalActions}>
                            <button className={Styles.cancelBtn} onClick={() => setShowNovaEncomenda(false)}>Cancelar</button>
                            <button className={Styles.confirmBtn} onClick={handleNovaEncomenda}>Agendar Encomenda</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendamentosModerno;