// src/DoceLivery/Context/CartContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

// 1. Cria o Objeto Contexto
export const CartContextStore = createContext(null);

// 2. Componente Provider que gerencia o estado do carrinho
export const CartProviderStore = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addItemToCart = useCallback((product, storeInfo, quantity) => {
        setCartItems(prevItems => [
            ...prevItems, 
            { ...product, storeInfo, quantity }
        ]);
    }, []);

    const clearCart = () => setCartItems([]);

    return (
        <CartContextStore.Provider value={{ cartItems, addItemToCart, clearCart }}>
            {children}
        </CartContextStore.Provider>
    );
};

// 2. Hook personalizado para consumir o Contexto
export const useCartStore = () => {
    const context = useContext(CartContextStore);
    
    if (!context) {
        throw new Error('useCartStore deve ser usado dentro de um CartProviderStore');
    }
    
    return context;
};