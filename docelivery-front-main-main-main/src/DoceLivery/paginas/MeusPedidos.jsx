import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoArrowBack, IoReceipt, IoTimeOutline, IoCheckmarkCircle,
  IoCloseCircle, IoRestaurant, IoBicycle, IoHome, IoStar,
  IoStarOutline, IoCloseOutline, IoRefreshOutline, IoChevronDown, IoChevronUp
} from 'react-icons/io5';
import ApiService from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import Styles from './MeusPedidos.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100';

const buildImg = (raw) => {
  if (!raw) return FALLBACK_IMG;
  const s = String(raw).trim();
  if (s.startsWith('http') || s.startsWith('data:')) return s;
  const clean = s.startsWith('/') ? s.substring(1) : s;
  if (clean.startsWith('uploads/') || clean.startsWith('imagens/')) return `${API_BASE}/${clean}`;
  return `${API_BASE}/uploads/${clean}`;
};

const STATUS_CONFIG = {
  NOVO:                { label: 'Novo',           cor: '#007bff', icone: <IoReceipt size={16} />,          passo: 1 },
  PENDENTE:            { label: 'Pendente',        cor: '#f59e0b', icone: <IoTimeOutline size={16} />,      passo: 1 },
  AGUARDANDO_PAGAMENTO:{ label: 'Aguard. Pgto',   cor: '#6f42c1', icone: <IoTimeOutline size={16} />,      passo: 1 },
  PREPARANDO:          { label: 'Preparando',      cor: '#ffc107', icone: <IoRestaurant size={16} />,       passo: 2 },
  PRONTO:              { label: 'Pronto',          cor: '#28a745', icone: <IoCheckmarkCircle size={16} />,  passo: 3 },
  SAIU_PARA_ENTREGA:   { label: 'Saiu p/ Entrega', cor: '#17a2b8', icone: <IoBicycle size={16} />,         passo: 4 },
  ENTREGUE:            { label: 'Entregue',        cor: '#28a745', icone: <IoHome size={16} />,             passo: 5 },
  CANCELADO:           { label: 'Cancelado',       cor: '#dc3545', icone: <IoCloseCircle size={16} />,      passo: 0 },
};

const PASSOS = [
  { passo: 1, label: 'Recebido',   icone: <IoReceipt size={18} /> },
  { passo: 2, label: 'Preparando', icone: <IoRestaurant size={18} /> },
  { passo: 3, label: 'Pronto',     icone: <IoCheckmarkCircle size={18} /> },
  { passo: 4, label: 'Em entrega', icone: <IoBicycle size={18} /> },
  { passo: 5, label: 'Entregue',   icone: <IoHome size={18} /> },
];

// ── Modal de Avaliação ──────────────────────────────────────────────────────
const ModalAvaliacao = ({ pedido, onClose, onEnviar }) => {
  const [abaAtiva, setAbaAtiva] = useState('loja');
  const [notaLoja, setNotaLoja] = useState(0);
  const [comentarioLoja, setComentarioLoja] = useState('');
  const [notaEntregador, setNotaEntregador] = useState(0);
  const [comentarioEntregador, setComentarioEntregador] = useState('');
  const [hover, setHover] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const Estrelas = ({ nota, setNota }) => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '12px 0' }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => setNota(s)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          {s <= (hover || nota)
            ? <IoStar size={32} color="#ffd700" />
            : <IoStarOutline size={32} color="#ccc" />}
        </button>
      ))}
    </div>
  );

  const handleEnviar = async () => {
    if (abaAtiva === 'loja' && notaLoja === 0) { alert('Selecione uma nota para a loja.'); return; }
    if (abaAtiva === 'entregador' && notaEntregador === 0) { alert('Selecione uma nota para o entregador.'); return; }
    setEnviando(true);
    try {
      if (notaLoja > 0) {
        await ApiService.post(`/stores/${pedido.lojaId || pedido.loja?.id}/reviews`, {
          nota: notaLoja, comentario: comentarioLoja, pedidoId: pedido.id
        }).catch(() => {});
      }
      if (notaEntregador > 0 && pedido.entregadorId) {
        await ApiService.post(`/entregador/${pedido.entregadorId}/avaliacao`, {
          nota: notaEntregador, comentario: comentarioEntregador, pedidoId: pedido.id
        }).catch(() => {});
      }
      onEnviar(pedido.id);
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={Styles.overlay} onClick={onClose}>
      <div className={Styles.modalAvaliacao} onClick={e => e.stopPropagation()}>
        <div className={Styles.modalHeader}>
          <h3>Avaliar Pedido #{pedido.id}</h3>
          <button onClick={onClose} className={Styles.btnFechar}><IoCloseOutline size={22} /></button>
        </div>

        <div className={Styles.abas}>
          <button className={`${Styles.aba} ${abaAtiva === 'loja' ? Styles.abaAtiva : ''}`} onClick={() => setAbaAtiva('loja')}>
            <IoRestaurant size={16} /> Loja
          </button>
          {pedido.entregadorId && (
            <button className={`${Styles.aba} ${abaAtiva === 'entregador' ? Styles.abaAtiva : ''}`} onClick={() => setAbaAtiva('entregador')}>
              <IoBicycle size={16} /> Entregador
            </button>
          )}
        </div>

        {abaAtiva === 'loja' && (
          <div className={Styles.abaConteudo}>
            <p className={Styles.avaliacaoNome}>{pedido.nomeLoja || pedido.loja?.nomeFantasia || 'Confeitaria'}</p>
            <Estrelas nota={notaLoja} setNota={setNotaLoja} />
            <textarea
              className={Styles.comentario}
              placeholder="Conte como foi sua experiência com a loja..."
              value={comentarioLoja}
              onChange={e => setComentarioLoja(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {abaAtiva === 'entregador' && (
          <div className={Styles.abaConteudo}>
            <p className={Styles.avaliacaoNome}>{pedido.nomeEntregador || 'Entregador'}</p>
            <Estrelas nota={notaEntregador} setNota={setNotaEntregador} />
            <textarea
              className={Styles.comentario}
              placeholder="Como foi a entrega?"
              value={comentarioEntregador}
              onChange={e => setComentarioEntregador(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className={Styles.modalFooter}>
          <button className={Styles.btnCancelar} onClick={onClose}>Cancelar</button>
          <button className={Styles.btnEnviar} onClick={handleEnviar} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar Avaliação ⭐'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Card de Pedido ──────────────────────────────────────────────────────────
const CardPedido = ({ pedido, onAvaliar, jaAvaliado }) => {
  const [expandido, setExpandido] = useState(false);
  const statusKey = (pedido.status || 'PENDENTE').toUpperCase();
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDENTE;
  const passoAtual = config.passo;
  const entregue = statusKey === 'ENTREGUE';
  const cancelado = statusKey === 'CANCELADO';
  const itens = pedido.itensPedido || pedido.itens || [];
  const total = parseFloat(pedido.valorTotal ?? pedido.valorPedido ?? pedido.total ?? 0);
  const data = pedido.dataPedido || pedido.createdAt || pedido.date || '';
  const nomeLoja = pedido.nomeLoja || pedido.loja?.nomeFantasia || 'Confeitaria';

  return (
    <div className={`${Styles.card} ${cancelado ? Styles.cardCancelado : ''}`}>
      {/* Cabeçalho */}
      <div className={Styles.cardTopo} onClick={() => setExpandido(v => !v)}>
        <div className={Styles.cardTopoEsq}>
          <span className={Styles.pedidoNum}>Pedido #{pedido.id}</span>
          <span className={Styles.lojaNome}>{nomeLoja}</span>
          {data && <span className={Styles.pedidoData}>{new Date(data).toLocaleString('pt-BR')}</span>}
        </div>
        <div className={Styles.cardTopoDireita}>
          <span className={Styles.statusBadge} style={{ background: config.cor }}>
            {config.icone} {config.label}
          </span>
          <span className={Styles.totalValor}>R$ {total.toFixed(2)}</span>
          {expandido ? <IoChevronUp size={18} color="#888" /> : <IoChevronDown size={18} color="#888" />}
        </div>
      </div>

      {/* Barra de progresso */}
      {!cancelado && (
        <div className={Styles.progressoBar}>
          {PASSOS.map((p, i) => (
            <React.Fragment key={p.passo}>
              <div className={`${Styles.progressoPasso} ${passoAtual >= p.passo ? Styles.progressoAtivo : ''} ${passoAtual === p.passo ? Styles.progressoAtual : ''}`}>
                <div className={Styles.progressoIcone}>{p.icone}</div>
                <span className={Styles.progressoLabel}>{p.label}</span>
              </div>
              {i < PASSOS.length - 1 && (
                <div className={`${Styles.progressoLinha} ${passoAtual > p.passo ? Styles.progressoLinhaAtiva : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Detalhes expandidos */}
      {expandido && (
        <div className={Styles.detalhes}>
          {itens.length > 0 && (
            <div className={Styles.itensList}>
              <strong>Itens do pedido:</strong>
              {itens.map((item, i) => {
                const nome = item.nomeProduto || item.produto?.nome || 'Produto';
                const qtd = parseInt(item.quantidade) || 1;
                const preco = parseFloat(item.precoUnitario ?? item.produto?.preco ?? 0);
                const fotoRaw = item.imagemUrl || item.imagem || item.produto?.imagemUrl || item.produto?.imagem || item.produto?.fotoUrl;
                const foto = buildImg(fotoRaw);
                return (
                  <div key={i} className={Styles.itemLinha}>
                    <img src={foto} alt={nome} className={Styles.itemFoto}
                      onError={e => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                    <span className={Styles.itemNome}>{qtd}x <strong>{nome}</strong></span>
                    <span className={Styles.itemPreco}>R$ {(preco * qtd).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {pedido.enderecoEntrega && (
            <p className={Styles.detalheInfo}><IoHome size={14} /> {pedido.enderecoEntrega}</p>
          )}
          {pedido.observacao && (
            <p className={Styles.detalheInfo}>📝 {pedido.observacao}</p>
          )}

          {entregue && !jaAvaliado && (
            <button className={Styles.btnAvaliar} onClick={() => onAvaliar(pedido)}>
              <IoStar size={16} /> Avaliar pedido
            </button>
          )}
          {entregue && jaAvaliado && (
            <p className={Styles.jaAvaliado}>✅ Você já avaliou este pedido</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Página Principal ────────────────────────────────────────────────────────
const MeusPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState(null);
  const [avaliados, setAvaliados] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pedidosAvaliados') || '[]'); } catch { return []; }
  });

  const clienteId = localStorage.getItem('userId');

  const buscarPedidos = useCallback(async () => {
    if (!clienteId) { navigate('/docelivery/cliente/login-cliente'); return; }
    try {
      setLoading(true);
      const data = await ApiService.get(`/pedidos/cliente/${clienteId}`);
      const lista = Array.isArray(data) ? data : [];
      // Ordena do mais recente para o mais antigo
      lista.sort((a, b) => new Date(b.dataPedido || b.createdAt || 0) - new Date(a.dataPedido || a.createdAt || 0));
      setPedidos(lista);
      setErro(null);
    } catch (err) {
      setErro('Não foi possível carregar seus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [clienteId, navigate]);

  useEffect(() => {
    buscarPedidos();
    // Atualiza a cada 30s para pedidos em andamento
    const interval = setInterval(buscarPedidos, 30000);
    return () => clearInterval(interval);
  }, [buscarPedidos]);

  const handleAvaliado = (pedidoId) => {
    const novos = [...avaliados, pedidoId];
    setAvaliados(novos);
    localStorage.setItem('pedidosAvaliados', JSON.stringify(novos));
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const s = (p.status || '').toUpperCase();
    if (filtro === 'andamento') return !['ENTREGUE', 'CANCELADO'].includes(s);
    if (filtro === 'entregue') return s === 'ENTREGUE';
    if (filtro === 'cancelado') return s === 'CANCELADO';
    return true;
  });

  const contadores = {
    todos: pedidos.length,
    andamento: pedidos.filter(p => !['ENTREGUE','CANCELADO'].includes((p.status||'').toUpperCase())).length,
    entregue: pedidos.filter(p => (p.status||'').toUpperCase() === 'ENTREGUE').length,
    cancelado: pedidos.filter(p => (p.status||'').toUpperCase() === 'CANCELADO').length,
  };

  return (
    <div className={Styles.pagina}>
      <div className={Styles.container}>
        {/* Header */}
        <div className={Styles.header}>
          <button className={Styles.btnVoltar} onClick={() => navigate('/docelivery/cliente/perfil')}>
            <IoArrowBack size={20} />
          </button>
          <div>
            <h1 className={Styles.titulo}>Meus Pedidos</h1>
            <p className={Styles.subtitulo}>Acompanhe todos os seus pedidos</p>
          </div>
          <button className={Styles.btnAtualizar} onClick={buscarPedidos} title="Atualizar">
            <IoRefreshOutline size={20} />
          </button>
        </div>

        {/* Filtros */}
        <div className={Styles.filtros}>
          {[
            { key: 'todos',     label: 'Todos' },
            { key: 'andamento', label: 'Em andamento' },
            { key: 'entregue',  label: 'Entregues' },
            { key: 'cancelado', label: 'Cancelados' },
          ].map(f => (
            <button key={f.key}
              className={`${Styles.filtroBotao} ${filtro === f.key ? Styles.filtroAtivo : ''}`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
              <span className={Styles.filtroBadge}>{contadores[f.key]}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {loading && <div className={Styles.loading}>Carregando seus pedidos...</div>}

        {erro && !loading && (
          <div className={Styles.erro}>
            <p>{erro}</p>
            <button onClick={buscarPedidos} className={Styles.btnTentar}>Tentar novamente</button>
          </div>
        )}

        {!loading && !erro && pedidosFiltrados.length === 0 && (
          <div className={Styles.vazio}>
            <span>🛍️</span>
            <p>Nenhum pedido encontrado.</p>
            <button className={Styles.btnComprar} onClick={() => navigate('/docelivery/cliente/Home-Page')}>
              Explorar lojas
            </button>
          </div>
        )}

        {!loading && !erro && pedidosFiltrados.map(pedido => (
          <CardPedido
            key={pedido.id}
            pedido={pedido}
            onAvaliar={setPedidoParaAvaliar}
            jaAvaliado={avaliados.includes(pedido.id)}
          />
        ))}
      </div>

      {pedidoParaAvaliar && (
        <ModalAvaliacao
          pedido={pedidoParaAvaliar}
          onClose={() => setPedidoParaAvaliar(null)}
          onEnviar={handleAvaliado}
        />
      )}
    </div>
  );
};

export default MeusPedidos;
