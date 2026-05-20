import React, { createContext, useContext, useEffect, useState } from 'react';

const LojaContext = createContext();

export const useLoja = () => {
    const context = useContext(LojaContext);
    if (!context) {
        throw new Error('useLoja deve ser usado dentro de LojaProvider');
    }
    return context;
};

const getInitialDadosLoja = () => {
    const saved = localStorage.getItem('dadosLoja');
    if (saved) return JSON.parse(saved);
    const cadastro = JSON.parse(localStorage.getItem('dadosConfeiteiro') || '{}');
    const lojaSalva = cadastro.loja || {};
    return {
        id: 1,
        nome: lojaSalva.nomeFantasia || cadastro.nomeConfeitaria || cadastro.nomeLoja || localStorage.getItem('nomeLoja') || 'Minha Confeitaria',
        endereco: lojaSalva.endereco || cadastro.endereco || 'Rua das Flores, 123 - Centro',
        telefone: lojaSalva.telefone || cadastro.telefone || '(11) 99999-9999',
        descricao: lojaSalva.descricao || cadastro.descricao || 'Confeitaria artesanal feita com carinho.',
        imagem: lojaSalva.imagem || null,
        avaliacao: 4.8,
        totalAvaliacoes: 127,
        horarioFuncionamento: lojaSalva.horarioFuncionamento || {
            segunda: '8:00 - 18:00',
            terca: '8:00 - 18:00',
            quarta: '8:00 - 18:00',
            quinta: '8:00 - 18:00',
            sexta: '8:00 - 18:00',
            sabado: '8:00 - 16:00',
            domingo: 'Fechado'
        }
    };
};

export const LojaProvider = ({ children }) => {
    const [dadosLoja, setDadosLoja] = useState(getInitialDadosLoja);

    useEffect(() => {
        const handleStorageUpdate = () => setDadosLoja(getInitialDadosLoja());
        window.addEventListener('localStorageUpdate', handleStorageUpdate);
        return () => window.removeEventListener('localStorageUpdate', handleStorageUpdate);
    }, []);

    const atualizarDadosLoja = (novosDados) => {
        setDadosLoja(prev => {
            const updated = { ...prev, ...novosDados };
            localStorage.setItem('dadosLoja', JSON.stringify(updated));
            return updated;
        });
    };

    const atualizarHorarioFuncionamento = (novoHorario) => {
        setDadosLoja(prev => {
            const updated = {
                ...prev,
                horarioFuncionamento: { ...prev.horarioFuncionamento, ...novoHorario }
            };
            localStorage.setItem('dadosLoja', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <LojaContext.Provider value={{
            dadosLoja,
            atualizarDadosLoja,
            atualizarHorarioFuncionamento
        }}>
            {children}
        </LojaContext.Provider>
    );
};