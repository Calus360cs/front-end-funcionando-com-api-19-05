/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useCartStore } from "../context/CartContext.jsx";
import OrderService from "../services/OrderService"; // Importe o serviço de pedidos
import Styles from "./CartComponent.module.css";
import { IoCloseCircleOutline, IoTrashOutline, IoAddCircleOutline, IoRemoveCircleOutline } from 'react-icons/io5';

const CartComponent = () => {
    // ESTADOS PARA O AGENDAMENTO
    const [isAgendado, setIsAgendado] = useState(false);
    const [dataAgendamento, setDataAgendamento] = useState("");
    const [loading, setLoading] = useState(false);

    const formatPrice = (value) => {
        const safeValue = value || 0;
        return safeValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    };

    const {
        cartItems,
        activeStore,
        removeItemFromCart,
        removeAllOfItem,
        addItemToCart,
        clearCart,
        toggleCart,
    } = useCartStore();
    
    const totalPrice = (cartItems || []).reduce((acc, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        return acc + (price * quantity);
    }, 0);
    
    const totalFormatado = formatPrice(totalPrice);
    const storeName = activeStore ? activeStore.name : "Carrinho Vazio";

    const handleAddItem = (item) => {
        addItemToCart(item, null, 1);
    };

    // --- FUNÇÃO PARA CONECTAR COM O BACKEND ---
    const handleFinalizarPedido = async () => {
        if (isAgendado && !dataAgendamento) {
            alert("Por favor, selecione uma data para o agendamento.");
            return;
        }

        setLoading(true);

        // Montagem do payload exatamente como o Java espera
        const payload = {
            agendado: isAgendado,
            dataEntregaAgendada: isAgendado ? dataAgendamento : null,
            loja: { id: activeStore.id },
            cliente: { id: 1 }, // Substituir pelo ID do usuário logado do seu contexto de Auth
            itens: cartItems.map(item => ({
                produto: { id: item.id },
                quantidade: item.quantity,
                precoUnitario: item.price
            }))
        };

        try {
            const res = await OrderService.createOrder(payload);
            console.log('Pedido criado com sucesso:', res.data);
            
            // Salva no localStorage para a tela de sucesso/pagamento se necessário
            localStorage.setItem('ultimoPedido', JSON.stringify(res.data));
            
            clearCart(); // Limpa o carrinho após sucesso
            toggleCart(); // Fecha o componente
            window.location.href = '/docelivery/cliente/pagamento'; // Redireciona
            
        } catch (err) {
            console.error("Erro ao enviar pedido para o SQL Server:", err);
            alert("Erro ao processar pedido. Verifique se o servidor Java está rodando.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={Styles.cart_container}>
                <button className={Styles.close_btn} onClick={toggleCart} aria-label="Fechar Carrinho">
                    <IoCloseCircleOutline size={24} />
                </button>
                
                <h3 className={Styles.cart_title}>{storeName}</h3>

                <div className={Styles.item_list}>
                    {(cartItems || []).length === 0 ? (
                        <div className={Styles.empty_cart}>
                            <div className={Styles.empty_cart_icon}>🛒</div>
                            <p>Seu carrinho está vazio.<br/>Comece a adicionar delícias!</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className={Styles.cart_item}>
                                <img 
                                    src={item.imageUrl || item.image} 
                                    alt={item.name || item.title}
                                    className={Styles.item_image}
                                />
                                <div className={Styles.item_info}>
                                    <div className={Styles.item_name}>{item.name || item.title}</div>
                                    <div className={Styles.item_controls}>
                                        <button onClick={() => removeItemFromCart(item.id)}>-</button>
                                        <span className={Styles.item_quantity}>{item.quantity}</span>
                                        <button onClick={() => handleAddItem(item)}>+</button>
                                    </div>
                                    <div className={Styles.item_price}>
                                        {formatPrice(item.price * item.quantity)}
                                    </div>
                                </div>
                                <button onClick={() => removeAllOfItem(item.id)} className={Styles.remove_btn}>×</button>
                            </div>
                        ))
                    )}
                </div>
            
                {(cartItems || []).length > 0 && (
                    <>
                        {/* SEÇÃO DE AGENDAMENTO IMPLEMENTADA */}
                        <div className={Styles.agendamento_section}>
                            <label className={Styles.checkbox_label}>
                                <input 
                                    type="checkbox" 
                                    checked={isAgendado}
                                    onChange={(e) => setIsAgendado(e.target.checked)}
                                />
                                Encomendar para outra data?
                            </label>

                            {isAgendado && (
                                <input 
                                    type="datetime-local"
                                    className={Styles.date_input}
                                    value={dataAgendamento}
                                    onChange={(e) => setDataAgendamento(e.target.value)}
                                />
                            )}
                        </div>

                        <div className={Styles.cart_summary}>
                            <span>Total: {totalFormatado}</span>
                        </div>

                        <button 
                            className={Styles.checkout_btn}
                            onClick={handleFinalizarPedido}
                            disabled={loading}
                        >
                            {loading ? "Processando..." : "Finalizar Pedido"}
                        </button>
                    </>
                )}
            </div>
        </>
    );
};

export default CartComponent;