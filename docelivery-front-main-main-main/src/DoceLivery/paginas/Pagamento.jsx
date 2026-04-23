import React, { useState } from 'react';
import { IoArrowBack, IoCardOutline, IoWallet } from 'react-icons/io5';
import { useCartStore } from '../context/CartContext';
import { useDashboard } from '../context/DashboardContext';
import Styles from './Pagamento.module.css';

const Pagamento = () => {
    const { clearCart, finalizarPedido } = useCartStore();
    const { adicionarVenda } = useDashboard();
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCardForm, setShowCardForm] = useState(false);
    const [showPixCode, setShowPixCode] = useState(false);
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [savedCards] = useState([
        { id: 1, name: 'Cartão Principal', number: '**** **** **** 1234', type: 'Visa' },
        { id: 2, name: 'Cartão Secundário', number: '**** **** **** 5678', type: 'Mastercard' }
    ]);
    const [selectedSavedCard, setSelectedSavedCard] = useState(null);
    
    // Recuperar dados do localStorage
    const checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}');
    console.log('Dados recuperados do checkout:', checkoutData);
    const { cartItems = [], activeStore = null, subtotal = 0, deliveryFee = 5.00 } = checkoutData;
    
    console.log('Subtotal do localStorage:', subtotal);
    console.log('CartItems do localStorage:', cartItems);
    
    // Sempre recalcular o subtotal baseado nos itens
    const calculatedSubtotal = cartItems.reduce((acc, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        console.log(`Item: ${item.name}, Preço: ${price}, Quantidade: ${quantity}, Subtotal: ${price * quantity}`);
        return acc + (price * quantity);
    }, 0);
    
    const calculatedDeliveryFee = parseFloat(deliveryFee) || 0;
    const finalTotal = calculatedSubtotal + calculatedDeliveryFee;
    
    console.log('Valores finais calculados:', { calculatedSubtotal, calculatedDeliveryFee, finalTotal });

    const handlePaymentMethodSelect = (method) => {
        setPaymentMethod(method);
        if (method === 'credit' || method === 'debit') {
            setShowCardForm(false);
            setShowPixCode(false);
            setSelectedSavedCard(null);
        } else if (method === 'pix') {
            setShowPixCode(true);
            setShowCardForm(false);
        }
    };

    const handlePayment = async () => {
        if (!paymentMethod) {
            alert('Selecione uma forma de pagamento');
            return;
        }

        if ((paymentMethod === 'credit' || paymentMethod === 'debit') && !selectedSavedCard && (!cardData.number || !cardData.name)) {
            alert('Selecione um cartão salvo ou preencha os dados do cartão');
            return;
        }

        setIsProcessing(true);
        
        setTimeout(() => {
            const pedidoFinalizado = finalizarPedido((valorVenda) => {
                adicionarVenda(valorVenda);
            });
            if (pedidoFinalizado) {
                // Salvar dados do pedido para o tracking
                const orderData = {
                    id: Date.now().toString(),
                    storeName: activeStore?.name || 'Loja',
                    items: cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        imageUrl: item.imageUrl || item.image
                    })),
                    total: finalTotal,
                    paymentMethod,
                    orderTime: new Date().toISOString(),
                    status: 'pendente',
                    customerName: localStorage.getItem('nomeCliente') || 'Cliente'
                };
                localStorage.setItem('currentOrder', JSON.stringify(orderData));
                
                // Salvar pedido para o confeiteiro
                const existingOrders = JSON.parse(localStorage.getItem('confeiteiroPedidos') || '[]');
                existingOrders.push(orderData);
                localStorage.setItem('confeiteiroPedidos', JSON.stringify(existingOrders));
                
                clearCart();
                alert('Pagamento realizado com sucesso!');
                window.location.href = '/docelivery/cliente/pedido-status';
            } else {
                alert('Erro ao finalizar pedido.');
            }
            setIsProcessing(false);
        }, 2000);
    };

    return (
        <div className={Styles.payment_container}>
            <div className={Styles.payment_header}>
                <button className={Styles.back_btn} onClick={() => window.history.back()}>
                    <IoArrowBack size={24} />
                </button>
                <h2>Finalizar Pedido</h2>
            </div>

            <div className={Styles.order_summary}>
                <h3>Resumo do Pedido</h3>
                <div className={Styles.store_info}>
                    <strong>{activeStore?.name}</strong>
                </div>
                
                {cartItems.map(item => (
                    <div key={item.id} className={Styles.order_item}>
                        <span>{item.quantity}x {item.name}</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                
                <div className={Styles.order_totals}>
                    <div className={Styles.total_line}>
                        <span>Subtotal:</span>
                        <span>R$ {calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className={Styles.total_line}>
                        <span>Taxa de entrega:</span>
                        <span>R$ {calculatedDeliveryFee.toFixed(2)}</span>
                    </div>
                    <div className={Styles.final_total}>
                        <span>Total:</span>
                        <span>R$ {finalTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className={Styles.payment_methods}>
                <h3>Forma de Pagamento</h3>
                
                <div className={Styles.payment_options}>
                    <label className={`${Styles.payment_option} ${paymentMethod === 'credit' ? Styles.selected : ''}`}>
                        <input 
                            type="radio" 
                            value="credit" 
                            checked={paymentMethod === 'credit'}
                            onChange={(e) => handlePaymentMethodSelect(e.target.value)}
                        />
                        <IoCardOutline size={24} />
                        <span>Cartão de Crédito</span>
                    </label>

                    <label className={`${Styles.payment_option} ${paymentMethod === 'debit' ? Styles.selected : ''}`}>
                        <input 
                            type="radio" 
                            value="debit" 
                            checked={paymentMethod === 'debit'}
                            onChange={(e) => handlePaymentMethodSelect(e.target.value)}
                        />
                        <IoCardOutline size={24} />
                        <span>Cartão de Débito</span>
                    </label>

                    <label className={`${Styles.payment_option} ${paymentMethod === 'pix' ? Styles.selected : ''}`}>
                        <input 
                            type="radio" 
                            value="pix" 
                            checked={paymentMethod === 'pix'}
                            onChange={(e) => handlePaymentMethodSelect(e.target.value)}
                        />
                        <IoWallet size={24} />
                        <span>PIX</span>
                    </label>
                </div>
            </div>

            {showCardForm && (
                <div className={Styles.card_form}>
                    <h3>Dados do Cartão</h3>
                    <input
                        type="text"
                        placeholder="Número do cartão"
                        value={cardData.number}
                        onChange={(e) => setCardData({...cardData, number: e.target.value})}
                        className={Styles.card_input}
                    />
                    <input
                        type="text"
                        placeholder="Nome no cartão"
                        value={cardData.name}
                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                        className={Styles.card_input}
                    />
                    <div className={Styles.card_row}>
                        <input
                            type="text"
                            placeholder="MM/AA"
                            value={cardData.expiry}
                            onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                            className={Styles.card_input_small}
                        />
                        <input
                            type="text"
                            placeholder="CVV"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                            className={Styles.card_input_cvv}
                            maxLength="4"
                        />
                    </div>
                </div>
            )}

            {showPixCode && (
                <div className={Styles.pix_section}>
                    <h3>Pagamento PIX</h3>
                    <div className={Styles.pix_code}>
                        <p>Escaneie o QR Code ou copie o código PIX:</p>
                        <div className={Styles.qr_placeholder}>📱 QR CODE</div>
                        <div className={Styles.pix_key}>
                            <code>00020126580014BR.GOV.BCB.PIX013636...</code>
                            <button className={Styles.copy_btn}>Copiar</button>
                        </div>
                    </div>
                </div>
            )}

            {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
                <div className={Styles.saved_cards}>
                    <h3>Cartões Salvos</h3>
                    {savedCards.map(card => (
                        <label key={card.id} className={`${Styles.saved_card} ${selectedSavedCard === card.id ? Styles.selected : ''}`}>
                            <input 
                                type="radio" 
                                name="savedCard" 
                                value={card.id}
                                onChange={() => {
                                    setSelectedSavedCard(card.id);
                                    setShowCardForm(false);
                                }}
                            />
                            <div className={Styles.card_info}>
                                <span className={Styles.card_name}>{card.name}</span>
                                <span className={Styles.card_number}>{card.number}</span>
                                <span className={Styles.card_type}>{card.type}</span>
                            </div>
                        </label>
                    ))}
                    <button 
                        className={Styles.new_card_btn}
                        onClick={() => {
                            setSelectedSavedCard(null);
                            setShowCardForm(true);
                        }}
                    >
                        + Adicionar Novo Cartão
                    </button>
                </div>
            )}

            <button 
                className={Styles.confirm_btn}
                onClick={handlePayment}
                disabled={isProcessing}
            >
                {isProcessing ? 'Processando...' : `Confirmar Pedido - R$ ${finalTotal.toFixed(2)}`}
            </button>
        </div>
    );
};

export default Pagamento;