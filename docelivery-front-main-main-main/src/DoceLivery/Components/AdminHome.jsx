import React, { useState, useEffect } from 'react';
import { IoPersonOutline, IoRestaurant, IoReceipt, IoTrendingUp, IoCheckmarkCircleOutline, IoTimeOutline, IoStatsChartOutline, IoAlertCircleOutline, IoCarOutline } from 'react-icons/io5';
import Styles from './DashboardHome.module.css';
import ApiService from '../services/api';

const AdminHome = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState({
    totalClientes: 0,
    totalConfeiteiros: 0,
    totalEntregadores: 0,
    totalLojas: 0,
    totalPedidos: 0,
    pedidosPendentes: 0,
    pedidosEntregues: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const buscar = async () => {
      try {
        setLoading(true);

        const extrairLista = (resposta) => {
          if (resposta.status !== 'fulfilled') return [];
          const payload = resposta.value;
          if (Array.isArray(payload)) return payload;
          if (payload && typeof payload === 'object') {
            if (Array.isArray(payload.data)) return payload.data;
            if (Array.isArray(payload.entregadores)) return payload.entregadores;
            if (Array.isArray(payload.content)) return payload.content;
            if (Array.isArray(payload.items)) return payload.items;
            const arrays = Object.values(payload).filter(Array.isArray);
            return arrays[0] || [];
          }
          return [];
        };

        // 1. Busca os dados de Clientes, Confeiteiros, Entregadores e Lojas em paralelo
        const [clientesRes, confeiteirosRes, entregadoresRes, lojasRes] = await Promise.allSettled([
          ApiService.get('/cliente'),
          ApiService.get('/confeiteiro'),
          Promise.allSettled([
            ApiService.get('/entregadores'),
            ApiService.get('/entregador'),
            ApiService.get('/admin/entregadores'),
            ApiService.get('/api/entregadores'),
          ]),
          ApiService.get('/admin/stores'),
        ]);

        const clientes = extrairLista(clientesRes);
        const confeiteiros = extrairLista(confeiteirosRes);
        const entregadores = entregadoresRes.status === 'fulfilled'
          ? entregadoresRes.value
              .filter((item) => item.status === 'fulfilled')
              .flatMap((item) => extrairLista(item))
          : [];
        const lojas = extrairLista(lojasRes);

        // 2. 🚀 SOLUÇÃO DO LOOP: Busca TODOS os pedidos do sistema de uma única vez!
        let unicos = [];
        try {
          const todosPedidos = await ApiService.get('/admin/pedidos');
          if (Array.isArray(todosPedidos)) {
            unicos = todosPedidos;
          }
        } catch (pedidoErr) {
          console.error('Erro ao buscar endpoint unificado de pedidos:', pedidoErr);
        }
        // 3. Filtra os status usando os dados unificados recebidos
        const pendentes = unicos.filter(p => 
          ['pendente', 'preparando', 'agendado', 'pronto', 'novo', 'pago', 'aguardando_pagamento']
            .includes((p.status || '').toLowerCase())
        ).length;
        const entregues = unicos.filter(p => 
          (p.status || '').toLowerCase().includes('entregue') || (p.status || '').toLowerCase() === 'finalizado'
        ).length;

        setResumo({
          totalClientes: clientes.length,
          totalConfeiteiros: confeiteiros.length,
          totalEntregadores: entregadores.length,
          totalLojas: lojas.length,
          totalPedidos: unicos.length,
          pedidosPendentes: pendentes,
          pedidosEntregues: entregues,
        });
      } catch (err) {
        console.error('Erro geral ao carregar resumo admin:', err);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  const stats = [
    { title: 'Clientes', value: resumo.totalClientes, icon: <IoPersonOutline size={24} />, color: '#ff69b4' },
    { title: 'Confeiteiros', value: resumo.totalConfeiteiros, icon: <IoRestaurant size={24} />, color: '#8a2be2' },
    { title: 'Entregadores', value: resumo.totalEntregadores, icon: <IoCarOutline size={24} />, color: '#1976D2' },
    { title: 'Total de Pedidos', value: resumo.totalPedidos, icon: <IoReceipt size={24} />, color: '#4CAF50' },
    { title: 'Lojas Cadastradas', value: resumo.totalLojas, icon: <IoTrendingUp size={24} />, color: '#FF9800' },
  ];

  return (
    <div className={Styles.dashboardHome}>
      <div className={Styles.dashboardHeader}>
        <div className={Styles.timeInfo}>
          <h2>Painel Administrativo</h2>
          <p>{currentTime.toLocaleString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className={Styles.systemStatus}>
          <div className={`${Styles.statusIndicator} ${Styles.excellent}`}>
            <IoCheckmarkCircleOutline size={20} />
            <span>Sistema Online</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando dados...</div>
      ) : (
        <>
          <div className={Styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={Styles.statCard}>
                <div className={Styles.statIcon} style={{ color: stat.color }}>{stat.icon}</div>
                <div className={Styles.statContent}>
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={Styles.quickStatsGrid}>
            <div className={Styles.quickStat}>
              <IoReceipt size={24} color="#4CAF50" />
              <div>
                <span className={Styles.statNumber}>{resumo.pedidosEntregues}</span>
                <span className={Styles.statLabel}>Pedidos Entregues</span>
              </div>
            </div>
            <div className={Styles.quickStat}>
              <IoAlertCircleOutline size={24} color="#FF9800" />
              <div>
                <span className={Styles.statNumber}>{resumo.pedidosPendentes}</span>
                <span className={Styles.statLabel}>Pedidos em Aberto</span>
              </div>
            </div>
            <div className={Styles.quickStat}>
              <IoStatsChartOutline size={24} color="#8a2be2" />
              <div>
                <span className={Styles.statNumber}>{resumo.totalPedidos > 0 ? Math.round((resumo.pedidosEntregues / resumo.totalPedidos) * 100) : 0}%</span>
                <span className={Styles.statLabel}>Taxa de Entrega</span>
              </div>
            </div>
            <div className={Styles.quickStat}>
              <IoTimeOutline size={24} color="#ff69b4" />
              <div>
                <span className={Styles.statNumber}>{resumo.totalClientes + resumo.totalConfeiteiros + resumo.totalEntregadores}</span>
                <span className={Styles.statLabel}>Total de Usuários</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminHome;
