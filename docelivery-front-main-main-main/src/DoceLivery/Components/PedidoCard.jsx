import React from 'react';
import { resolveImageUrl } from '../utils/imageUrl';
import MapaRastreamentoConfeiteiro from './MapaRastreamentoConfeiteiro';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100';

// Mesma lógica usada no CardapioPublico e CardapioManager
const buildImageSrc = (raw) => {
    if (!raw) return null;
    const src = String(raw).trim();
    if (!src) return null;
    if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return src;
    const cleanPath = src.startsWith('/') ? src.substring(1) : src;
    if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('imagens/')) {
        return `${API_BASE}/${cleanPath}`;
    }
    return `${API_BASE}/uploads/${cleanPath}`;
};

const getProdutoFoto = (item) => {
    // Tenta todos os campos possíveis: no item direto e no objeto produto aninhado
    const raw =
        item.imagemUrl || item.imagem || item.fotoUrl || item.imageUrl ||
        item.produto?.imagemUrl || item.produto?.imagem || item.produto?.fotoUrl || item.produto?.imageUrl ||
        item.produto?.foto || item.fotoUrl;
    return buildImageSrc(raw) || FALLBACK_IMG;
};

const PedidoCard = ({ pedido, onAtualizarStatus, onDespachar }) => {
    if (!pedido) return null;

    const {
        id, status, cliente, valorPedido, valorTotal, total,
        itens, itensPedido, numeroPedido, agendado, dataEntregaAgendada,
        nomeCliente, telefoneCliente, enderecoEntrega
    } = pedido;

    const statusChave = status ? status.toUpperCase() : 'NOVO';

    // Nome do cliente: suporta objeto aninhado ou campo flat do back-end
    const nomeClienteFinal = cliente?.nome || nomeCliente || 'Cliente não identificado';
    const telefoneClienteFinal = cliente?.telefone || telefoneCliente || null;

    // Valor total: suporta os três nomes possíveis que o back-end pode enviar
    const valorFinal = valorPedido ?? valorTotal ?? total ?? 0;

    // Itens: suporta 'itens' ou 'itensPedido'
    const listaItens = itens || itensPedido || [];

    // Cores alinhadas ao Enum e status de pagamento do Pix/Dinheiro
    const statusColors = {
        NOVO: '#007bff',
        PREPARANDO: '#ffc107',
        PRONTO: '#28a745',
        SAIU_PARA_ENTREGA: '#17a2b8',
        AGENDADO: '#17a2b8',
        ENTREGUE: '#28a745',
        CONCLUIDO: '#28a745',
        CANCELADO: '#dc3545',
        PENDING: '#f59e0b',
        PENDENTE: '#f59e0b',
        AGUARDANDO_PAGAMENTO: '#6f42c1'
    };

    const statusTexto = {
        NOVO: 'Novo Pedido',
        PREPARANDO: 'Em Preparação',
        PRONTO: 'Pronto para Retirada',
        SAIU_PARA_ENTREGA: 'Saiu para Entrega',
        AGENDADO: 'Agendado',
        ENTREGUE: 'Entregue ✅',
        CONCLUIDO: 'Concluído ✅',
        CANCELADO: 'Cancelado',
        PENDING: 'Aguardando Pix',
        PENDENTE: 'Aguardando Pix',
        AGUARDANDO_PAGAMENTO: 'Pagar na Entrega'
    };

    const getAcoes = () => {
        switch (statusChave) {
            case 'NOVO':
            case 'AGENDADO':
            case 'PENDING':
            case 'PENDENTE':
            case 'AGUARDANDO_PAGAMENTO':
                return (
                    <>
                        <button
                            onClick={() => onAtualizarStatus(id, 'PREPARANDO')}
                            style={{ padding: '8px 12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}
                        >
                            Aceitar / Iniciar
                        </button>
                        <button
                            onClick={() => onAtualizarStatus(id, 'CANCELADO')}
                            style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Recusar
                        </button>
                    </>
                );
            case 'PREPARANDO':
                return (
                    <button
                        onClick={() => onAtualizarStatus(id, 'PRONTO')}
                        style={{ padding: '8px 12px', backgroundColor: '#ff69b4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                    >
                        Marcar como Pronto 🎂
                    </button>
                );
            case 'PRONTO':
                return (
                    <button
                        onClick={() => onDespachar ? onDespachar(id) : onAtualizarStatus(id, 'SAIU_PARA_ENTREGA')}
                        style={{ padding: '8px 12px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold', fontSize: '15px' }}
                    >
                        🛵 Enviar para Entrega
                    </button>
                );
            default:
                return <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Pedido finalizado</span>;
        }
    };

    return (
        <div style={{
            border: `2px solid ${statusColors[statusChave] || '#ccc'}`,
            borderRadius: '12px',
            padding: '15px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>{numeroPedido || `Pedido #${id}`}</h4>
                <span style={{
                    backgroundColor: statusColors[statusChave] || '#6c757d',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    {statusTexto[statusChave] || statusChave}
                </span>
            </div>

            <div style={{ fontSize: '14px', color: '#555' }}>
                <p style={{ margin: '5px 0' }}><strong>Cliente:</strong> {nomeClienteFinal}</p>
                {telefoneClienteFinal && (
                    <p style={{ margin: '5px 0' }}><strong>Telefone:</strong> {telefoneClienteFinal}</p>
                )}
                {enderecoEntrega && (
                    <p style={{ margin: '5px 0' }}><strong>Entrega:</strong> {enderecoEntrega}</p>
                )}
                
                {agendado && dataEntregaAgendada && (
                    <p style={{ margin: '5px 0', color: '#d63384' }}>
                        <strong>Entrega:</strong> {new Date(dataEntregaAgendada).toLocaleString('pt-BR')}
                    </p>
                )}

                <div style={{ margin: '10px 0', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>Itens:</strong>
                    <div className="itens-pedido">
                        {listaItens.map((item, index) => {
                            const nome = item.nomeProduto || item.produto?.nome || 'Doce';
                            const preco = parseFloat(item.precoUnitario ?? item.produto?.preco ?? 0);
                            const qtd = parseInt(item.quantidade) || 1;
                            const foto = getProdutoFoto(item);
                            return (
                                <div key={index} className="item-linha" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img
                                            src={foto}
                                            alt={nome}
                                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                                            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                                        />
                                        {qtd}x <strong>{nome}</strong>
                                    </span>
                                    <span style={{ color: '#ff69b4', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                        R$ {(preco * qtd).toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <h3 style={{ margin: '15px 0', color: '#ff69b4', textAlign: 'right' }}>
                Total: R$ {parseFloat(valorFinal).toFixed(2)}
            </h3>

            {statusChave === 'SAIU_PARA_ENTREGA' && (
              <MapaRastreamentoConfeiteiro
                pedidoId={id}
                coordsLoja={pedido.coordsLoja || null}
                coordsCliente={pedido.coordsCliente || null}
              />
            )}

            <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'center' }}>
                {getAcoes()}
            </div>
        </div>
    );
};

export default PedidoCard;