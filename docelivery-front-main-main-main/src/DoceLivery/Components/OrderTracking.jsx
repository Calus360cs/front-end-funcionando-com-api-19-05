import React, { useState, useEffect } from 'react';
import { IoCheckmarkCircleOutline, IoTimeOutline, IoLocationOutline } from 'react-icons/io5';
import OrderCompletion from './OrderCompletion';
import Styles from './OrderTracking.module.css';

const OrderTracking = ({ order, onRatingSubmit }) => {
  const [orderStatus, setOrderStatus] = useState('preparing'); // preparing, delivering, delivered
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular progresso do pedido
    const timer = setTimeout(() => {
      if (orderStatus === 'preparing') {
        setOrderStatus('delivering');
        setProgress(50);
      } else if (orderStatus === 'delivering') {
        setOrderStatus('delivered');
        setProgress(100);
        // Mostrar modal de avaliação após 2 segundos
        setTimeout(() => {
          setShowRatingModal(true);
        }, 2000);
      }
    }, 5000); // 5 segundos para cada etapa

    return () => clearTimeout(timer);
  }, [orderStatus]);

  useEffect(() => {
    // Atualizar barra de progresso
    if (orderStatus === 'preparing') setProgress(25);
    else if (orderStatus === 'delivering') setProgress(75);
    else if (orderStatus === 'delivered') setProgress(100);
  }, [orderStatus]);

  const getStatusText = () => {
    switch (orderStatus) {
      case 'preparing':
        return 'Preparando seu pedido...';
      case 'delivering':
        return 'Saiu para entrega!';
      case 'delivered':
        return 'Pedido entregue!';
      default:
        return 'Processando...';
    }
  };

  const getStatusIcon = () => {
    switch (orderStatus) {
      case 'preparing':
        return <IoTimeOutline className={Styles.status_icon_preparing} />;
      case 'delivering':
        return <IoLocationOutline className={Styles.status_icon_delivering} />;
      case 'delivered':
        return <IoCheckmarkCircleOutline className={Styles.status_icon_delivered} />;
      default:
        return <IoTimeOutline className={Styles.status_icon_preparing} />;
    }
  };

  return (
    <div className={Styles.tracking_container}>
      <div className={Styles.tracking_header}>
        <h2>Acompanhe seu pedido</h2>
        <p>Pedido #{order.id} - {order.storeName}</p>
      </div>

      <div className={Styles.status_section}>
        <div className={Styles.status_icon}>
          {getStatusIcon()}
        </div>
        <h3>{getStatusText()}</h3>
        
        <div className={Styles.progress_bar}>
          <div 
            className={Styles.progress_fill}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className={Styles.order_details}>
        <h4>Itens do pedido:</h4>
        {order.items.map((item) => (
          <div key={item.id} className={Styles.order_item}>
            <img src={item.imageUrl} alt={item.name} className={Styles.item_image} />
            <div className={Styles.item_info}>
              <span className={Styles.item_name}>{item.name}</span>
              <span className={Styles.item_quantity}>Qtd: {item.quantity}</span>
            </div>
            <span className={Styles.item_price}>
              R$ {(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        
        <div className={Styles.order_total}>
          <strong>Total: R$ {order.total.toFixed(2)}</strong>
        </div>
      </div>

      {orderStatus === 'delivered' && (
        <div className={Styles.delivery_message}>
          <IoCheckmarkCircleOutline className={Styles.success_icon} />
          <p>Seu pedido foi entregue com sucesso!</p>
          <button 
            className={Styles.rate_now_btn}
            onClick={() => setShowRatingModal(true)}
          >
            Avaliar Pedido
          </button>
        </div>
      )}

      {showRatingModal && (
        <OrderCompletion
          order={order}
          onClose={() => setShowRatingModal(false)}
          onSubmitRating={(ratingData) => {
            onRatingSubmit(ratingData);
            setShowRatingModal(false);
          }}
        />
      )}
    </div>
  );
};

export default OrderTracking;