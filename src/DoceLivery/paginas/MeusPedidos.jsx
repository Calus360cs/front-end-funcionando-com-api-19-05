import React from 'react';
import Styles from './MeusPedidos.module.css';

const MeusPedidos = () => {
    return (
        <div className={Styles.container}>
            <h1 className={Styles.title}>Meus Pedidos</h1>
            <p>Em breve, o histórico de pedidos será exibido aqui.</p>
        </div>
    );
};

export default MeusPedidos;
