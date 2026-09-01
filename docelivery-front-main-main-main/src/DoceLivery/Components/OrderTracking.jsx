import React, { useState, useEffect } from 'react';
import { IoCheckmarkCircleOutline, IoTimeOutline, IoLocationOutline, IoCardOutline } from 'react-icons/io5';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import OrderCompletion from './OrderCompletion';
import Styles from './OrderTracking.module.css';
import api from '../services/api';

const motoboyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const OrderTracking = ({ orderId, order: orderProp, onRatingSubmit }) => {
  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localCheckout, setLocalCheckout] = useState(null);
  const [posicaoMotoboy, setPosicaoMotoboy] = useState(null);

  const resolvedOrderId = orderId || orderProp?.id || pedido?.id || pedido?.pedidoId;

  useEffect(() => {
    // 1. Resgata os dados salvos do carrinho antes da limpeza do checkout (Garantia mestre contra R$ 0.00)
    const checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}');
    setLocalCheckout(checkoutData);

    if (orderProp && !orderId) {
      setPedido(orderProp);
      setCarregando(false);
    }

    const currentOrder = JSON.parse(localStorage.getItem('currentOrder') || '{}');
    // 🟢 BUSCA INTELIGENTE DE ID: Tenta capturar todas as variantes de chaves que o Java devolve no checkout
    const idBusca = orderId || orderProp?.id || currentOrder.id || currentOrder.pedidoId || currentOrder.idRef;

    console.log("🔍 Tentando iniciar rastreamento para o ID do Pedido:", idBusca);

    if (!idBusca) {
      setErro('ID do pedido não informado.');
      setCarregando(false);
      return;
    }

    const buscarDadosDoPedido = async () => {
      try {
        console.log("📡 Buscando dados atualizados do pedido #" + idBusca + " no servidor...");
        const dados = await api.get(`/pedidos/${idBusca}`);
        console.log("📦 Dados recebidos do Java:", dados);

        if (dados && dados.status !== 'ERRO') {
          setPedido(dados);
          setErro(null);
        } else {
          setErro('Não foi possível obter os dados válidos do pedido.');
        }
      } catch (err) {
        console.error("❌ Erro ao buscar rastreamento do pedido:", err);
        setErro('Ocorreu um erro na comunicação com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    const buscarPosicaoMotoboy = async () => {
      const idBuscaAtual = orderId || orderProp?.id || JSON.parse(localStorage.getItem('currentOrder') || '{}').id;
      if (!idBuscaAtual) return;
      try {
        const pos = await api.get(`/pedidos/${idBuscaAtual}/motoboy/localizacao`);
        if (pos?.lat && pos?.lng) setPosicaoMotoboy(pos);
      } catch {
        // posição indisponível
      }
    };

    buscarDadosDoPedido();
    buscarPosicaoMotoboy();
    const intervaloId = setInterval(() => {
      buscarDadosDoPedido();
      buscarPosicaoMotoboy();
    }, 5000);

    return () => clearInterval(intervaloId);
  }, [resolvedOrderId, orderId, orderProp]);

  useEffect(() => {
    if (!pedido || !pedido.status) return;

    switch (pedido.status.toUpperCase()) {
      case 'AGUARDANDO_PAGAMENTO': setProgress(10); break;
      case 'NOVO':
      case 'PAGO': setProgress(30); break;
      case 'PREPARANDO':
      case 'EM_PREPARACAO': setProgress(60); break;
      case 'SAIU_PARA_ENTREGA': setProgress(85); break;
      case 'CONCLUIDO':
      case 'ENTREGUE': setProgress(100); break;
      default: setProgress(0);
    }
  }, [pedido]);

  const getStatusText = () => {
    if (!pedido || !pedido.status) return 'Processando...';
    switch (pedido.status.toUpperCase()) {
      case 'AGUARDANDO_PAGAMENTO': return 'Aguardando pagamento do PIX...';
      case 'NOVO':
      case 'PAGO': return 'Pagamento aprovado! Pedido recebido.';
      case 'PREPARANDO':
      case 'EM_PREPARACAO': return 'A confeitaria já está preparando seus doces! 👩‍🍳';
      case 'SAIU_PARA_ENTREGA': return 'O motoboy retirou seu pedido e saiu para entrega! 🛵';
      case 'CONCLUIDO':
      case 'ENTREGUE': return 'Seu pedido foi entregue com sucesso! 🎉';
      default: return `Status: ${pedido.status}`;
    }
  };

  const getStatusIcon = () => {
    if (!pedido || !pedido.status) return <IoTimeOutline className={Styles.status_icon_preparing} />;
    switch (pedido.status.toUpperCase()) {
      case 'AGUARDANDO_PAGAMENTO': return <IoCardOutline className={Styles.status_icon_preparing} />;
      case 'SAIU_PARA_ENTREGA': return <IoLocationOutline className={Styles.status_icon_delivering} />;
      case 'CONCLUIDO':
      case 'ENTREGUE': return <IoCheckmarkCircleOutline className={Styles.status_icon_delivered} />;
      default: return <IoTimeOutline className={Styles.status_icon_preparing} />;
    }
  };

  if (carregando) return <div className={Styles.tracking_container}><p>Carregando...</p></div>;
  if (erro || !pedido) return <div className={Styles.tracking_container}><p className={Styles.error_message}>{erro}</p></div>;

  const isDelivered = pedido.status?.toUpperCase() === 'CONCLUIDO' || pedido.status?.toUpperCase() === 'ENTREGUE';

  // 🟢 COMPATIBILIDADE DE ATRIBUTOS: Mapeia chaves do DTO ou da Entidade Bruta do Java sem quebrar
  const currentOrderMemoria = JSON.parse(localStorage.getItem('currentOrder') || '{}');
  const idExibicao = pedido.id || pedido.pedidoId || currentOrderMemoria.id || currentOrderMemoria.pedidoId;
  const precoTotalRenderizado = pedido.total || pedido.valorPedido || localCheckout?.total || 0;
  const itensRenderizados = pedido.itens && pedido.itens.length > 0 ? pedido.itens : (localCheckout?.cartItems || []);

  return (
    <div className={Styles.tracking_container}>
      <div className={Styles.tracking_header}>
        <button onClick={() => window.location.href = '/docelivery/cliente/Home-Page'} style={{ float: 'left', background: 'none', border: 'none', color: '#ff69b4', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Voltar
        </button>
        <h2>Acompanhe seu pedido</h2>
        <p>Pedido #{idExibicao} - {pedido.nomeCliente || 'Cliente'}</p>
      </div>

      <div className={Styles.status_section}>
        <div className={Styles.status_icon}>{getStatusIcon()}</div>
        <h3>{getStatusText()}</h3>
        <div className={Styles.progress_bar}>
          <div className={Styles.progress_fill} style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className={Styles.order_details}>
        <h4>Itens do pedido:</h4>
        {itensRenderizados.map((item, index) => {
          // Extrai os nomes das propriedades se vierem aninhadas ou diretas do DTO do Java
          const nomeDoDoce = item.nomeProduto || item.name || item.title || item.produto?.nome || 'Doce';
          const qtdDoDoce = item.quantidade || item.quantity || 1;
          const precoDoDoce = item.precoUnitario || item.price || item.produto?.preco || 0;

          return (
            <div key={item.id || index} className={Styles.order_item}>
              <div className={Styles.item_info}>
                <span className={Styles.item_name}>{nomeDoDoce}</span>
                <span className={Styles.item_quantity}>Qtd: {qtdDoDoce}</span>
              </div>
              <span className={Styles.item_price}>
                R$ {(parseFloat(precoDoDoce) * parseInt(qtdDoDoce)).toFixed(2)}
              </span>
            </div>
          );
        })}
        <div className={Styles.order_total}>
          <strong>Total: R$ {parseFloat(precoTotalRenderizado).toFixed(2)}</strong>
        </div>
      </div>

      {posicaoMotoboy && (
        <div className={Styles.map_section}>
          <h4>📍 Localização do entregador</h4>
          <MapContainer
            center={[posicaoMotoboy.lat, posicaoMotoboy.lng]}
            zoom={15}
            style={{ height: '300px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[posicaoMotoboy.lat, posicaoMotoboy.lng]} icon={motoboyIcon}>
              <Popup>Entregador</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {isDelivered && (
        <div className={Styles.delivery_message}>
          <IoCheckmarkCircleOutline className={Styles.success_icon} />
          <p>Seu pedido foi entregue com sucesso!</p>
          <button className={Styles.rate_now_btn} onClick={() => setShowRatingModal(true)}>Avaliar Pedido</button>
        </div>
      )}

      {showRatingModal && (
        <OrderCompletion
          order={pedido}
          onClose={() => setShowRatingModal(false)}
          onSubmitRating={(ratingData) => {
            if (typeof onRatingSubmit === 'function') onRatingSubmit(ratingData);
            setShowRatingModal(false);
          }}
        />
      )}
    </div>
  );
};

export default OrderTracking;