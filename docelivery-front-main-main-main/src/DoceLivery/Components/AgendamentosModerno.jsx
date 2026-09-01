import { useState, useEffect, useCallback } from 'react';
import { IoTime, IoNotifications, IoAdd, IoClose, IoTrash, IoCalendar } from 'react-icons/io5';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import OrderService from '../services/orderService';
import AuthService from '../services/authService';
import Styles from './AgendamentosModerno.module.css';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const MESSAGES_PT = {
    next: 'Próximo',
    previous: 'Anterior',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Nenhuma encomenda no período.',
    showMore: (total) => `+${total} mais`,
};

const FORMATS_PT = {
    monthHeaderFormat: (date) =>
        date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            .replace(/^(\w)/, (c) => c.toUpperCase()),
    weekHeaderFormat: ({ start, end }) =>
        `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
    dayHeaderFormat: (date) =>
        date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
            .replace(/^(\w)/, (c) => c.toUpperCase()),
    dayRangeHeaderFormat: ({ start, end }) =>
        `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
    weekdayFormat: (date) =>
        date.toLocaleDateString('pt-BR', { weekday: 'short' })
            .replace('.', '')
            .replace(/^(\w)/, (c) => c.toUpperCase()),
    dayFormat: (date) =>
        date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
            .replace(/^(\w)/, (c) => c.toUpperCase()),
    agendaDateFormat: (date) =>
        date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
    agendaTimeFormat: (date) =>
        date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    agendaTimeRangeFormat: ({ start, end }) =>
        `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    timeGutterFormat: (date) =>
        date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
};

const CATEGORIAS_PRODUTO = [
    ['Bolos', '🎂'],
    ['Cupcakes', '🧁'],
    ['Doces', '🍬'],
    ['Tortas', '🥧'],
    ['Churros', '🥖'],
    ['Brigadeiros', '🟤'],
    ['Brownies', '🍫'],
    ['Cookies', '🍪'],
    ['Pães de Mel', '🍯'],
    ['Bebidas', '🥤'],
    ['Doces Finos', '💎'],
    ['Kit Festa', '🎁'],
    ['Copo da Felicidade', '🍨'],
];

const ESTADO_INICIAL = {
    clienteNome: '',
    telefone: '',
    enderecoEntrega: '',
    categoriaProduto: '',
    descricaoPedido: '',
    data: '',
    horario: '09:00',
    valor: '',
};

const normalizarLista = (r) => {
    if (Array.isArray(r)) return r;
    if (Array.isArray(r?.content)) return r.content;
    if (Array.isArray(r?.data)) return r.data;
    return [];
};

const formatarDataInput = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AgendamentosModerno = () => {
    const confeiteiroId = AuthService.getUserId();
    const [agendamentos, setAgendamentos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showCancelarModal, setShowCancelarModal] = useState(false);
    const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    const [form, setForm] = useState(ESTADO_INICIAL);
    const [lojaId, setLojaId] = useState(null);

    // Busca o lojaId real do confeiteiro no localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('user') || localStorage.getItem('dadosConfeiteiro');
            if (raw) {
                const parsed = JSON.parse(raw);
                const base = parsed?.user || parsed?.data || parsed;
                const id = base?.loja?.id || base?.lojaId || base?.confeiteiro?.loja?.id;
                if (id) setLojaId(String(id));
            }
        } catch (_) { /* usa confeiteiroId como fallback */ }
    }, []);

    const carregarAgendamentos = useCallback(async () => {
        if (!confeiteiroId) return;
        try {
            const [fila, historico] = await Promise.allSettled([
                OrderService.getFilaTrabalho(confeiteiroId),
                OrderService.getTodosPedidos(confeiteiroId),
            ]);
            const lista = [
                ...normalizarLista(fila.status === 'fulfilled' ? fila.value : []),
                ...normalizarLista(historico.status === 'fulfilled' ? historico.value : []),
            ];
            const unicos = new Map();
            lista.forEach((p) => { if (p?.id != null) unicos.set(p.id, p); });
            const agendados = Array.from(unicos.values()).filter((p) => {
                const status = (p?.status || '').toUpperCase();
                return p?.agendado === true || status === 'AGENDADO' || !!p?.dataEntregaAgendada;
            });
            // Ordena por data de entrega
            agendados.sort((a, b) => new Date(a.dataEntregaAgendada) - new Date(b.dataEntregaAgendada));
            setAgendamentos(agendados);
        } catch (err) {
            console.error('Erro ao carregar agendamentos:', err);
        }
    }, [confeiteiroId]);

    useEffect(() => { carregarAgendamentos(); }, [carregarAgendamentos]);

    const abrirModal = (date = null) => {
        setForm({ ...ESTADO_INICIAL, data: formatarDataInput(date || new Date()) });
        setShowModal(true);
    };

    const fecharModal = () => { setShowModal(false); setForm(ESTADO_INICIAL); };

    const handleSalvar = async () => {
        if (salvando) return;
        const { clienteNome, data, horario, categoriaProduto, descricaoPedido, valor } = form;
        if (!clienteNome.trim() || !data || !horario || !categoriaProduto || !descricaoPedido.trim()) {
            alert('Preencha: nome do cliente, categoria, descrição, data e horário.');
            return;
        }
        const valorNum = parseFloat(valor);
        if (Number.isNaN(valorNum) || valorNum <= 0) {
            alert('Informe um valor válido maior que zero.');
            return;
        }

        try {
            setSalvando(true);
            const idLoja = lojaId || confeiteiroId;
            const payload = {
                nomeCliente: clienteNome.trim(),
                telefoneCliente: form.telefone || '',
                enderecoEntrega: form.enderecoEntrega || 'Retirada no Balcão',
                lojaId: Number(idLoja),
                total: valorNum,
                valorPedido: valorNum,
                formaPagamento: 'MANUAL',
                status: 'AGENDADO',
                agendado: true,
                dataEntregaAgendada: `${data}T${horario}:00`,
                observacao: `${categoriaProduto}: ${descricaoPedido.trim()}`,
                itens: [{
                    nomeProduto: categoriaProduto,
                    quantidade: 1,
                    precoUnitario: valorNum,
                    categoria: categoriaProduto,
                    descricao: descricaoPedido.trim(),
                }],
            };

            const criado = await OrderService.createOrder(payload);
            window.dispatchEvent(new CustomEvent('pedidoCriado', { detail: criado }));
            alert('Encomenda agendada com sucesso!');
            fecharModal();
            await carregarAgendamentos();
        } catch (err) {
            console.error('Erro ao salvar encomenda:', err);
            const msg = err.response?.data;
            alert(typeof msg === 'string' ? msg : 'Erro ao salvar. Verifique os dados e tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    const abrirCancelar = (agendamento) => {
        setAgendamentoSelecionado(agendamento);
        setShowCancelarModal(true);
    };

    const handleCancelar = async () => {
        if (!agendamentoSelecionado || cancelando) return;
        try {
            setCancelando(true);
            await OrderService.atualizarStatus(agendamentoSelecionado.id, 'CANCELADO');
            window.dispatchEvent(new CustomEvent('pedidoAtualizado', { detail: { id: agendamentoSelecionado.id } }));
            setShowCancelarModal(false);
            setAgendamentoSelecionado(null);
            await carregarAgendamentos();
        } catch (err) {
            console.error('Erro ao cancelar agendamento:', err);
            alert('Erro ao cancelar. Tente novamente.');
        } finally {
            setCancelando(false);
        }
    };

    const events = agendamentos
        .filter((p) => p?.dataEntregaAgendada)
        .map((p) => {
            const start = new Date(p.dataEntregaAgendada);
            if (Number.isNaN(start.getTime())) return null;
            return {
                id: p.id,
                title: `${p.nomeCliente || p.cliente?.nome || 'Cliente'} — ${p.observacao?.split(':')[0] || 'Encomenda'}`,
                start,
                end: new Date(start.getTime() + 60 * 60 * 1000),
                resource: p,
            };
        })
        .filter(Boolean);

    const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

    return (
        <div className={Styles.agendamentosModerno}>
            {/* Header */}
            <div className={Styles.header}>
                <div className={Styles.headerContent}>
                    <h1>Gestão de Encomendas</h1>
                    <p>Calendário de produção e entregas futuras</p>
                </div>
                <div className={Styles.headerActions}>
                    <button className={Styles.addBtn} onClick={() => abrirModal(new Date())}>
                        <IoAdd size={20} /> Nova Encomenda
                    </button>
                </div>
            </div>

            {/* Calendário react-big-calendar */}
            <div className={Styles.calendarioContainer}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    selectable
                    onSelectSlot={(slot) => abrirModal(slot.start)}
                    onSelectEvent={(event) => abrirCancelar(event.resource)}
                    views={['month', 'week', 'day']}
                    messages={MESSAGES_PT}
                    formats={FORMATS_PT}
                    eventPropGetter={() => ({
                        style: { background: 'linear-gradient(135deg, #ff69b4, #8a2be2)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' },
                    })}
                />
            </div>

            {/* Lista de próximas entregas */}
            <div className={Styles.detalhesContainer}>
                <h3><IoCalendar size={20} /> Próximas Entregas ({agendamentos.length})</h3>
                <div className={Styles.encomendasList}>
                    {agendamentos.length === 0 ? (
                        <p className={Styles.semEncomendas}>Nenhuma encomenda agendada. Clique em "Nova Encomenda" para adicionar.</p>
                    ) : agendamentos.map((enc) => (
                        <div key={enc.id} className={Styles.encomendaCard}>
                            <div className={Styles.encomendaHeader}>
                                <h4>{enc.nomeCliente || enc.cliente?.nome || 'Cliente Balcão'}</h4>
                                <span className={Styles.valor}>R$ {parseFloat(enc.valorPedido || enc.total || 0).toFixed(2)}</span>
                            </div>
                            {enc.observacao && <div className={Styles.produto}>{enc.observacao}</div>}
                            {enc.telefoneCliente && (
                                <div className={Styles.detalheItem}>📞 {enc.telefoneCliente}</div>
                            )}
                            <div className={Styles.detalhes}>
                                <span className={Styles.detalheItem}>
                                    <IoTime /> {enc.dataEntregaAgendada ? new Date(enc.dataEntregaAgendada).toLocaleString('pt-BR') : '—'}
                                </span>
                                <span className={Styles.statusBadge} style={{ backgroundColor: '#8a2be2' }}>
                                    {enc.status}
                                </span>
                                <button
                                    className={Styles.cancelarBtn}
                                    onClick={() => abrirCancelar(enc)}
                                    title="Cancelar agendamento"
                                >
                                    <IoTrash size={14} /> Cancelar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Nova Encomenda */}
            {showModal && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modal}>
                        <div className={Styles.modalHeader}>
                            <h3>Agendar Nova Encomenda</h3>
                            <button onClick={fecharModal}><IoClose size={24} /></button>
                        </div>
                        <div className={Styles.modalContent}>
                            <div className={Styles.infoBanner}>
                                Preencha os dados do cliente e da encomenda. Clientes sem conta na plataforma são bem-vindos!
                            </div>

                            <div className={Styles.formGroup}>
                                <label>Nome do Cliente *</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Maria Souza"
                                    value={form.clienteNome}
                                    onChange={(e) => setField('clienteNome', e.target.value)}
                                />
                            </div>

                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        placeholder="(11) 99999-9999"
                                        value={form.telefone}
                                        onChange={(e) => setField('telefone', e.target.value)}
                                    />
                                </div>
                                <div className={Styles.formGroup}>
                                    <label>Valor Total (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="Ex: 85.00"
                                        value={form.valor}
                                        onChange={(e) => setField('valor', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={Styles.formGroup}>
                                <label>Endereço de Entrega</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Retirada no Balcão ou Rua das Flores, 123"
                                    value={form.enderecoEntrega}
                                    onChange={(e) => setField('enderecoEntrega', e.target.value)}
                                />
                            </div>

                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Categoria do Produto *</label>
                                    <select
                                        value={form.categoriaProduto}
                                        onChange={(e) => setField('categoriaProduto', e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {CATEGORIAS_PRODUTO.map(([nome, icone]) => (
                                            <option key={nome} value={nome}>{icone} {nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={Styles.formGroup}>
                                    <label>Descrição do Produto *</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ex: Bolo de chocolate com morangos, 2kg"
                                        value={form.descricaoPedido}
                                        onChange={(e) => setField('descricaoPedido', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={Styles.formRow}>
                                <div className={Styles.formGroup}>
                                    <label>Data da Entrega *</label>
                                    <input
                                        type="date"
                                        value={form.data}
                                        min={formatarDataInput(new Date())}
                                        onChange={(e) => setField('data', e.target.value)}
                                    />
                                </div>
                                <div className={Styles.formGroup}>
                                    <label>Horário *</label>
                                    <input
                                        type="time"
                                        value={form.horario}
                                        onChange={(e) => setField('horario', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={Styles.modalActions}>
                            <button className={Styles.cancelBtn} onClick={fecharModal}>Cancelar</button>
                            <button className={Styles.confirmBtn} onClick={handleSalvar} disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Agendar Encomenda'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Cancelamento */}
            {showCancelarModal && agendamentoSelecionado && (
                <div className={Styles.modalOverlay}>
                    <div className={Styles.modal} style={{ maxWidth: '420px' }}>
                        <div className={Styles.modalHeader}>
                            <h3>Cancelar Agendamento</h3>
                            <button onClick={() => setShowCancelarModal(false)}><IoClose size={24} /></button>
                        </div>
                        <div className={Styles.modalContent}>
                            <p>Deseja cancelar a encomenda de <strong>{agendamentoSelecionado.nomeCliente || agendamentoSelecionado.cliente?.nome || 'Cliente'}</strong>?</p>
                            <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                                {agendamentoSelecionado.observacao} — {agendamentoSelecionado.dataEntregaAgendada ? new Date(agendamentoSelecionado.dataEntregaAgendada).toLocaleString('pt-BR') : ''}
                            </p>
                        </div>
                        <div className={Styles.modalActions}>
                            <button className={Styles.cancelBtn} onClick={() => setShowCancelarModal(false)}>Voltar</button>
                            <button
                                className={Styles.confirmBtn}
                                style={{ background: '#ef4444' }}
                                onClick={handleCancelar}
                                disabled={cancelando}
                            >
                                {cancelando ? 'Cancelando...' : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendamentosModerno;
