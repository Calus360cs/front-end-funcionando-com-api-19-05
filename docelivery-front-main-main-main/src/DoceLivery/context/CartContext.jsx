/* eslint-disable react-refresh/only-export-components */
// src/DoceLivery/Context/CartContext.js
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// 1. Cria o Objeto Contexto
export const CartContextStore = createContext(null);

// 2. Componente Provider que gerencia o estado do carrinho
export const CartProviderStore = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [activeStore, setActiveStore] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const addItemToCart = useCallback((product, storeInfo, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id 
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                );
            }
            return [...prevItems, { ...product, storeInfo, quantity }];
        });
    }, []);

    const removeItemFromCart = useCallback((productId) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === productId);
            if (existingItem && existingItem.quantity > 1) {
                return prevItems.map(item =>
                    item.id === productId 
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
                );
            }
            return prevItems.filter(item => item.id !== productId);
        });
    }, []);

    const removeAllOfItem = useCallback((productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    }, []);

    const clearCart = () => setCartItems([]);

    const toggleCart = useCallback(() => {
        setIsCartOpen(prev => !prev);
    }, []);

    const value = useMemo(() => ({
        cartItems,
        addItemToCart,
        removeItemFromCart,
        removeAllOfItem,
        clearCart,
        activeStore,
        setActiveStore,
        isCartOpen,
        toggleCart
    }), [
        cartItems, 
        addItemToCart, 
        removeItemFromCart, 
        removeAllOfItem, 
        activeStore, 
        setActiveStore,
        isCartOpen, 
        toggleCart
    ]);

    return (
        <CartContextStore.Provider value={value}>
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