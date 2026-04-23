import React, { createContext, useContext, useState } from 'react';

const StoreContext = createContext();

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore deve ser usado dentro de StoreProvider');
    }
    return context;
};

export const StoreProvider = ({ children }) => {
    const dadosSalvos = JSON.parse(localStorage.getItem('dadosConfeiteiro') || '{}');

    const [storeData, setStoreData] = useState({
        name: dadosSalvos.nomeConfeitaria || localStorage.getItem('userName') || 'Minha Confeitaria',
        description: 'Doces artesanais feitos com carinho',
        phone: dadosSalvos.telefone || '(11) 99999-9999',
        email: dadosSalvos.email || localStorage.getItem('userEmail') || 'contato@minhaconfeitaria.com',
        address: dadosSalvos.endereco || 'Rua das Flores, 123 - Centro',
        cidade: dadosSalvos.cidade || '',
        estado: dadosSalvos.estado || '',
        cnpj: dadosSalvos.cnpj || '',
        nomeConfeiteiro: dadosSalvos.nome || localStorage.getItem('userName') || 'Confeiteiro',
        workingHours: '08:00 - 18:00',
        logo: null,
        banner: null,
        specialties: ['Bolos', 'Cupcakes', 'Tortas'],
        deliveryFee: 5.00,
        minOrder: 20.00,
        isOpen: true
    });

    const [products, setProducts] = useState([
        {
            id: 1,
            name: 'Bolo de Chocolate',
            description: 'Delicioso bolo de chocolate com cobertura',
            price: 35.00,
            category: 'Bolos',
            image: null,
            available: true
        }
    ]);

    const updateStoreData = (newData) => {
        setStoreData(prev => ({ ...prev, ...newData }));
    };

    const addProduct = (product) => {
        setProducts(prev => [...prev, { ...product, id: Date.now() }]);
    };

    const updateProduct = (id, updatedProduct) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
    };

    const deleteProduct = (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    return (
        <StoreContext.Provider value={{
            storeData,
            products,
            updateStoreData,
            addProduct,
            updateProduct,
            deleteProduct
        }}>
            {children}
        </StoreContext.Provider>
    );
};