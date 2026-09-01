import React, { useState, useEffect, useCallback } from 'react';
import { IoHeadset, IoChatbubbleEllipses, IoCall, IoMail, IoChevronDown, IoChevronUp, IoPaperPlane, IoCheckmarkCircle, IoStorefront } from 'react-icons/io5';
import AuthService from '../services/authService';
import api from '../services/api';
import Styles from './Suporte.module.css';

const FAQ = [
    {
        categoria: 'Pedidos',
        itens: [
            { p: 'Como aceito um novo pedido?', r: 'Na aba "Pedidos" do seu painel, clique em "Aceitar" no card do pedido recebido. O status muda automaticamente para "Preparando".' },
            { p: 'Posso cancelar um pedido já aceito?', r: 'Sim. Abra o pedido, clique em "Cancelar" e informe o motivo. O cliente será notificado automaticamente.' },
            { p: 'Como marco um pedido como pronto?', r: 'No card do pedido em "Preparando", clique em "Marcar como Pronto". O entregador será acionado.' },
        ],
    },
    {
        categoria: 'Agendamentos',
        itens: [
            { p: 'Como agendar uma encomenda manual?', r: 'Vá em "Agendamentos" e clique em "Nova Encomenda". Preencha os dados do cliente (mesmo sem conta na plataforma), produto e data de entrega.' },
            { p: 'O cliente não tem conta. Posso agendar assim mesmo?', r: 'Sim! Basta informar o nome e telefone do cliente no formulário de agendamento. Não é necessário ter conta.' },
            { p: 'Como cancelo um agendamento?', r: 'Na lista de "Próximas Entregas", clique no botão "Cancelar" do agendamento desejado e confirme.' },
        ],
    },
    {
        categoria: 'Financeiro',
        itens: [
            { p: 'Por que meu faturamento está zerado?', r: 'O painel financeiro considera apenas pedidos com status ENTREGUE, CONCLUÍDO ou PAGO. Pedidos em andamento não entram no cálculo.' },
            { p: 'Quando recebo meu pagamento?', r: 'Os repasses são processados automaticamente após a confirmação de entrega. O prazo varia conforme a forma de pagamento do pedido.' },
            { p: 'Como vejo o histórico de transações?', r: 'No "Painel Financeiro", role até a seção "Transações Recentes" para ver todas as movimentações.' },
        ],
    },
    {
        categoria: 'Cardápio',
        itens: [
            { p: 'Como adiciono um novo produto?', r: 'Vá em "Cardápio" e clique em "Adicionar Produto". Preencha nome, descrição, preço e foto.' },
            { p: 'Como desativo um produto temporariamente?', r: 'No card do produto, use o toggle de ativo/inativo. O produto some do cardápio público sem ser excluído.' },
        ],
    },
    {
        categoria: 'Plataforma',
        itens: [
            { p: 'Como atualizo os dados da minha loja?', r: 'Acesse "Perfil da Loja" no menu lateral e edite as informações. Clique em "Salvar" para confirmar.' },
            { p: 'Não consigo fazer login. O que faço?', r: 'Verifique se o e-mail e senha estão corretos. Se o problema persistir, use "Esqueci minha senha" na tela de login.' },
        ],
    },
];

const ASSUNTOS = [
    'Problema com pedido',
    'Dúvida sobre agendamento',
    'Problema financeiro / pagamento',
    'Erro na plataforma',
    'Dúvida sobre cardápio',
    'Outros',
];

const ConfeiteiroSuporte = () => {
    const [categoriaAtiva, setCategoriaAtiva] = useState('Pedidos');
    const [faqAberto, setFaqAberto] = useState(null);
    const [assunto, setAssunto] = useState(ASSUNTOS[0]);
    const [mensagem, setMensagem] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [erro, setErro] = useState('');
    const [tickets, setTickets] = useState([]);

    const userId = AuthService.getUserId();
    const nomeUsuario = AuthService.getCurrentUser()?.nome || 'Confeiteiro';

    const carregarTickets = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await api.get(`/suporte/tickets/usuario/${userId}`).catch(() => null);
            const lista = Array.isArray(res) ? res : Array.isArray(res?.content) ? res.content : [];
            setTickets(lista.slice(0, 5));
        } catch (_) { /* silencioso */ }
    }, [userId]);

    useEffect(() => { carregarTickets(); }, [carregarTickets]);

    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!mensagem.trim()) { setErro('Descreva sua dúvida antes de enviar.'); return; }
        setEnviando(true);
        setErro('');
        try {
            await api.post('/suporte/tickets', {
                assunto,
                mensagem: mensagem.trim(),
                tipoUsuario: 'CONFEITEIRO',
                usuarioId: userId,
                prioridade: 'media',
                status: 'ABERTO',
            });
            setSucesso(true);
            setMensagem('');
            setTimeout(() => setSucesso(false), 5000);
            carregarTickets();
        } catch (_) {
            setErro('Não foi possível enviar. Tente novamente em instantes.');
        } finally {
            setEnviando(false);
        }
    };

    const statusClass = (s) => {
        const v = (s || '').toLowerCase();
        if (v.includes('resol')) return Styles.statusResolvido;
        if (v.includes('andamento') || v.includes('pend')) return Styles.statusAndamento;
        return Styles.statusAberto;
    };

    const statusLabel = (s) => {
        const v = (s || '').toLowerCase();
        if (v.includes('resol')) return 'Resolvido';
        if (v.includes('andamento') || v.includes('pend')) return 'Em andamento';
        return 'Aberto';
    };

    const faqAtual = FAQ.find(f => f.categoria === categoriaAtiva)?.itens || [];

    return (
        <div className={Styles.pagina} style={{ '--cor-primaria': '#8a2be2', '--cor-secundaria': '#ff69b4' }}>
            {/* Hero */}
            <div className={Styles.hero}>
                <div className={Styles.heroInner}>
                    <div className={Styles.heroIcone}><IoHeadset size={28} /></div>
                    <div className={Styles.heroTexto}>
                        <h1>Central de Ajuda</h1>
                        <p>Olá, {nomeUsuario}! Como podemos ajudar você hoje?</p>
                        <div className={Styles.statusOnline}>
                            <span className={Styles.dot} />
                            Suporte online · resposta em até 5 min
                        </div>
                    </div>
                </div>
            </div>

            <div className={Styles.corpo}>
                {/* Canais rápidos */}
                <div className={Styles.canais}>
                    <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className={Styles.canal}>
                        <div className={Styles.canalIcone} style={{ background: '#dcfce7' }}>💬</div>
                        <strong>WhatsApp</strong>
                        <span>Resposta rápida</span>
                    </a>
                    <a href="mailto:suporte@docelivery.com.br" className={Styles.canal}>
                        <div className={Styles.canalIcone} style={{ background: '#ede9fe' }}><IoMail size={20} color="#7c3aed" /></div>
                        <strong>E-mail</strong>
                        <span>Até 24h</span>
                    </a>
                    <div className={Styles.canal}>
                        <div className={Styles.canalIcone} style={{ background: '#fce7f3' }}><IoCall size={20} color="#be185d" /></div>
                        <strong>Telefone</strong>
                        <span>Seg–Sex 9h–18h</span>
                    </div>
                </div>

                {/* FAQ */}
                <div className={Styles.secao}>
                    <div className={Styles.secaoTitulo}>
                        <IoStorefront size={18} /> Perguntas frequentes
                    </div>
                    <div className={Styles.faqCategorias}>
                        {FAQ.map(f => (
                            <button
                                key={f.categoria}
                                className={`${Styles.faqCategoria} ${categoriaAtiva === f.categoria ? Styles.ativa : ''}`}
                                onClick={() => { setCategoriaAtiva(f.categoria); setFaqAberto(null); }}
                            >
                                {f.categoria}
                            </button>
                        ))}
                    </div>
                    <div className={Styles.faqLista}>
                        {faqAtual.map((item, i) => (
                            <div key={i} className={Styles.faqItem}>
                                <button className={Styles.faqPergunta} onClick={() => setFaqAberto(faqAberto === i ? null : i)}>
                                    {item.p}
                                    {faqAberto === i ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
                                </button>
                                {faqAberto === i && <div className={Styles.faqResposta}>{item.r}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Abrir ticket */}
                <div className={Styles.secao}>
                    <div className={Styles.secaoTitulo}>
                        <IoChatbubbleEllipses size={18} /> Abrir chamado
                    </div>
                    <form className={Styles.form} onSubmit={handleEnviar}>
                        <div className={Styles.formGrupo}>
                            <label>Assunto</label>
                            <select value={assunto} onChange={e => setAssunto(e.target.value)}>
                                {ASSUNTOS.map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className={Styles.formGrupo}>
                            <label>Descreva o problema</label>
                            <textarea
                                placeholder="Explique com detalhes o que está acontecendo..."
                                value={mensagem}
                                onChange={e => setMensagem(e.target.value)}
                            />
                        </div>
                        {erro && <div className={Styles.feedbackErro}>{erro}</div>}
                        {sucesso && (
                            <div className={Styles.feedbackSucesso}>
                                <IoCheckmarkCircle size={18} /> Chamado enviado! Nossa equipe responderá em breve.
                            </div>
                        )}
                        <button type="submit" className={Styles.btnEnviar} disabled={enviando}>
                            <IoPaperPlane size={16} />
                            {enviando ? 'Enviando...' : 'Enviar chamado'}
                        </button>
                    </form>
                </div>

                {/* Tickets anteriores */}
                <div className={Styles.secao}>
                    <div className={Styles.secaoTitulo}>
                        <IoCheckmarkCircle size={18} /> Meus chamados
                    </div>
                    <div className={Styles.ticketLista}>
                        {tickets.length === 0 ? (
                            <p className={Styles.semTickets}>Nenhum chamado aberto ainda.</p>
                        ) : tickets.map((t, i) => (
                            <div key={t.id || i} className={Styles.ticketItem}>
                                <div className={Styles.ticketInfo}>
                                    <strong>{t.assunto || t.issue || 'Chamado'}</strong>
                                    <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR') : '—'}</span>
                                </div>
                                <span className={`${Styles.ticketStatus} ${statusClass(t.status)}`}>
                                    {statusLabel(t.status)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfeiteiroSuporte;
