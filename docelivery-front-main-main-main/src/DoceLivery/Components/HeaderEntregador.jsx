import React, { useState, useEffect } from 'react';
import { IoNotifications, IoCarOutline, IoStatsChart, IoWallet, IoPersonOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import Styles from './HeaderEntregador.module.css';
import EntregadorService from '../services/entregadorService';

const HeaderEntregador = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [userData, setUserData] = useState({ nome: 'Entregador', veiculo: '' });
  const [statusEntrega, setStatusEntrega] = useState(() => localStorage.getItem('deliveryStatus') || 'disponivel');
  const [ganhosDia, setGanhosDia] = useState(null);
  const [entregasHoje, setEntregasHoje] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const carregarDados = async () => {
      const nomeEntregador = localStorage.getItem('nomeEntregador') || 'Entregador';
      const veiculo = localStorage.getItem('veiculo') || '';
      setUserData({ nome: nomeEntregador, veiculo });

      const ganhosSalvos = localStorage.getItem('ganhosDia');
      const entregasSalvas = localStorage.getItem('entregasHoje');

      if (ganhosSalvos) setGanhosDia(Number(ganhosSalvos));
      if (entregasSalvas) setEntregasHoje(Number(entregasSalvas));

      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const response = await EntregadorService.getEntregador(userId);
        const perfil = response?.data || response?.entregador || response?.dados || response?.usuario || response || {};
        const nomeAtualizado = encontrarValor(perfil, ['nome', 'nomeCompleto', 'name', 'fullName', 'nomeUsuario']) || nomeEntregador;
        const veiculoAtualizado = encontrarValor(perfil, ['veiculo', 'tipoVeiculo', 'tipo', 'vehicleType', 'veiculoTipo']) || veiculo;

        setUserData({ nome: nomeAtualizado, veiculo: veiculoAtualizado });
        localStorage.setItem('nomeEntregador', nomeAtualizado);
        localStorage.setItem('veiculo', veiculoAtualizado);
      } catch (error) {
        console.warn('Não foi possível carregar o perfil do entregador no header:', error);
      }
    };

    carregarDados();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    localStorage.removeItem('nomeEntregador');
    localStorage.removeItem('veiculo');
    localStorage.removeItem('deliveryStatus');
    navigate('/docelivery/entregador/login');
  };

  const getStatusColor = () => {
    switch (statusEntrega) {
      case 'disponivel': return '#10b981';
      case 'ocupado': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (statusEntrega) {
      case 'disponivel': return 'Disponível';
      case 'ocupado': return 'Em Entrega';
      case 'offline': return 'Offline';
      default: return 'Indefinido';
    }
  };

  return (
    <header className={Styles.header}>
      <div className={Styles.headerLeft}>
        <div className={Styles.logo}>
          <IoCarOutline size={28} color="#8a2be2" />
          <span>Docelivery</span>
        </div>
        <div>
          <h1>Painel do Entregador</h1>
          <p>Gerencie suas entregas e ganhos</p>
        </div>
      </div>
      
      <div className={Styles.headerRight}>
        <div className={Styles.statsQuick}>
          <div className={Styles.statItem}>
            <IoWallet size={16} />
            <span>{ganhosDia != null ? `R$ ${ganhosDia.toFixed(2)}` : '—'}</span>
            <small>Hoje</small>
          </div>
          <div className={Styles.statItem}>
            <IoStatsChart size={16} />
            <span>{entregasHoje != null ? entregasHoje : '—'}</span>
            <small>Entregas</small>
          </div>
        </div>

        <div className={Styles.statusEntrega}>
          <span className={Styles.statusLabel}>Status:</span>
          <div 
            className={Styles.statusIndicator}
            style={{ backgroundColor: getStatusColor() }}
            onClick={async () => {
              const nextStatus = statusEntrega === 'disponivel' ? 'offline' : 'disponivel';
              const apiStatus = nextStatus === 'disponivel' ? 'ONLINE' : 'OFFLINE';
              setStatusEntrega(nextStatus);
              localStorage.setItem('deliveryStatus', nextStatus);

              const userId = localStorage.getItem('userId');
              if (userId) {
                try {
                  await EntregadorService.updateStatus(userId, apiStatus);
                } catch (error) {
                  console.warn('Não foi possível atualizar o status no backend:', error);
                }
              }
            }}
          >
            <div className={Styles.statusDot}></div>
            <span>{getStatusText()}</span>
          </div>
        </div>
        
        <button 
          className={Styles.notificationBtn}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <IoNotifications size={20} />
          <span className={Styles.notificationBadge}>0</span>
        </button>
        
        <div className={Styles.userProfile}>
          <div className={Styles.userInfo}>
            <div className={Styles.userName}>{userData.nome}</div>
            <div className={Styles.userVehicle}>{userData.veiculo}</div>
          </div>
          <div className={Styles.avatar}>
            <IoPersonOutline size={20} />
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className={Styles.notificationsDropdown}>
          <h3>Notificações</h3>
          <div className={Styles.notificationItem}>
            <span>Nenhuma notificação no momento.</span>
            <small>As novas mensagens aparecerão aqui.</small>
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderEntregador;