import React from 'react';
import Style from './Lojas.module.css';

function Lojas() {
  return (
    <section className={Style.lojas}>
      <h2>Nossas Lojas Parceiras</h2>
      <div className={Style.lojasGrid}>
        <div className={Style.lojaCard}>
          <h3>Doce Mimi</h3>
          <p>Especializada em bolos e doces artesanais</p>
        </div>
        <div className={Style.lojaCard}>
          <h3>Doce Paladar</h3>
          <p>Brigadeiros gourmet e sobremesas</p>
        </div>
        <div className={Style.lojaCard}>
          <h3>Doce Sabor</h3>
          <p>Tortas e cupcakes personalizados</p>
        </div>
      </div>
    </section>
  );
}

export default Lojas;