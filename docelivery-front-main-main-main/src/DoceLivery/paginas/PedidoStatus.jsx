import React, { useState, useEffect } from 'react';
import { IoArrowBack, IoCheckmarkCircle, IoTimeOutline } from 'react-icons/io5';
import Styles from './PedidoStatus.module.css';

const PedidoStatus = () => {
    const [orderData, setOrderData] = useState(null);
    const [localCheckout, setLocalCheckout] = useState(null);

    useEffect(() => {
        const currentOrder = JSON.parse(localStorage.getItem('currentOrder') || '{}');
        const checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}');
        
        setOrderData(currentOrder);
        setLocalCheckout(checkoutData);
    }, []);

    // ✅ CORRIGIDO: Mapeamento dinâmico para evitar total zerado e itens em branco na tela
    const idPedido = orderData?.id || orderData?.pedidoId;
    const itensPedido = localCheckout?.cartItems || orderData?.items || [];
    const totalPedido = localCheckout?.total || orderData?.total || 0;

    if (!idPedido) {
        return (
            <div className={Styles.container}>
                <div className={Styles.header}>
                    <button onClick={() => window.location.href = '/docelivery/cliente/Home-Page'}>
                        <IoArrowBack size={24} />
                    </button>
                    <h2>Pedido não encontrado</h2>
                </div>
            </div>
        );
    }

    return (
        <div className={Styles.container}>
            <div className={Styles.header}>
                <button onClick={() => window.location.href = '/docelivery/cliente/Home-Page'}>
                    <IoArrowBack size={24} />
                </button>
                <h2>Status do Pedido</h2>
            </div>

            <div className={Styles.orderInfo}>
                <div className={Styles.statusIcon}>
                    <IoCheckmarkCircle size={48} color="#10b981" />
                </div>
                <h3>Pedido Confirmado!</h3>
                <p>Pedido #{idPedido}</p>
                <p>{localCheckout?.activeStore?.name || 'Confeitaria'}</p>
            </div>

            <div className={Styles.orderDetails}>
                <h4>Itens do Pedido</h4>
                {itensPedido.map((item, index) => (
                    <div key={item.id || index} className={Styles.orderItem}>
                        <span>{item.quantity}x {item.name || item.title}</span>
                        <span>R$ {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                    </div>
                ))}
                
                <div className={Styles.total}>
                    <strong>Total: R$ {parseFloat(totalPedido).toFixed(2)}</strong>
                </div>
            </div>

            <div className={Styles.statusTimeline}>
                <div className={Styles.timelineItem}>
                    <IoCheckmarkCircle size={20} color="#10b981" />
                    <span>Pedido recebido com sucesso</span>
                </div>
                <div className={Styles.timelineItem}>
                    <IoTimeOutline size={20} color="#f59e0b" />
                    <span>Aguardando confirmação de preparo na cozinha</span>
                </div>
            </div>

            <button 
                className={Styles.backBtn}
                onClick={() => window.location.href = '/docelivery/cliente/Home-Page'}
            >
                Voltar ao Início
            </button>
        </div>
    );
};

export default PedidoStatus;