import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Styles from './ConfeiteiroDashboard.module.css';
import { IoHome, IoReceipt, IoRestaurant, IoStatsChart, IoCalendar, IoSettings, IoLogOut, IoNotifications, IoAdd, IoCreate, IoMenu } from 'react-icons/io5';
import { useStore } from '../context/StoreContext';
import { useLoja } from '../context/LojaContext';
import PedidosPage from "../Components/PedidosPage";
import CardapioManager from "../Components/CardapioManager";
import DashboardHome from "../Components/DashboardHome";
import FinanceiroModerno from '../Components/FinanceiroModerno';
import AgendamentosModerno from '../Components/AgendamentosModerno';
import PerfilLoja from '../Components/PerfilLoja';
import AppLogo from '../assests/img/doce_Livre_3.jpg';


const ConfeiteiroDashboard = () => {
  const [secaoAtiva, setSecaoAtiva] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userData, setUserData] = useState({ nome: '', loja: '' });
  const [storeOpen, setStoreOpen] = useState(true);
  const [businessHours, setBusinessHours] = useState({
    monday: { open: '08:00', close: '18:00', isOpen: true },
    tuesday: { open: '08:00', close: '18:00', isOpen: true },
    wednesday: { open: '08:00', close: '18:00', isOpen: true },
    thursday: { open: '08:00', close: '18:00', isOpen: true },
    friday: { open: '08:00', close: '18:00', isOpen: true },
    saturday: { open: '08:00', close: '16:00', isOpen: true },
    sunday: { open: '08:00', close: '14:00', isOpen: false }
  });
  const { storeData } = useStore();
  const { dadosLoja } = useLoja();
  const storeLogo = dadosLoja.imagem || AppLogo;
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('nomeConfeiteiro');
    navigate('/');
  };
  
  // Função para verificar se a loja está aberta baseado no horário
  const checkIfStoreIsOpen = () => {
    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = businessHours[currentDay];
    if (!todayHours.isOpen) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userType = localStorage.getItem('userType');
    const userEmail = localStorage.getItem('userEmail');
    
    // Verificação mais flexível - aceita tanto 'confeiteiro' quanto login direto
    if (!token && !userEmail) {
      navigate('/docelivery/confeiteiro/login-confeiteiro');
      return;
    }
    
    // Carregar dados do usuário
    const nomeConfeiteiro = localStorage.getItem('userName') || 
                           localStorage.getItem('nomeConfeiteiro') || 
                           dadosLoja.nome ||
                           'Confeiteiro';
    const nomeLoja = dadosLoja.nome ||
                     storeData.name || 
                     localStorage.getItem('nomeLoja') || 
                     'Minha Confeitaria';
    const savedBusinessHours = localStorage.getItem('businessHours');
    
    if (savedBusinessHours) {
      try {
        setBusinessHours(JSON.parse(savedBusinessHours));
      } catch (error) {
        console.error('Erro ao carregar horários salvos:', error);
      }
    }
    
    setUserData({ nome: nomeConfeiteiro, loja: nomeLoja });
  }, [navigate, storeData.name]);

  // Verificar status da loja a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const isOpen = checkIfStoreIsOpen();
      setStoreOpen(isOpen);
    }, 60000); // Verifica a cada minuto

    // Verificação inicial
    const isOpen = checkIfStoreIsOpen();
    setStoreOpen(isOpen);

    return () => clearInterval(interval);
  }, [businessHours]);
  
  const menuItems = [
    { 
      id: 'home', 
      nome: 'Dashboard', 
      icone: <IoHome size={20} />,
      titulo: 'Painel Principal',
      descricao: 'Visão geral do seu negócio'
    },
    { 
      id: 'pedidos', 
      nome: 'Pedidos', 
      icone: <IoReceipt size={20} />,
      titulo: 'Gerenciar Pedidos',
      descricao: 'Acompanhe todos os pedidos da sua confeitaria'
    },
    { 
      id: 'cardapio', 
      nome: 'Cardápio', 
      icone: <IoRestaurant size={20} />,
      titulo: 'Gerenciar Cardápio',
      descricao: 'Adicione e edite seus produtos'
    },
    { 
      id: 'finance', 
      nome: 'Financeiro', 
      icone: <IoStatsChart size={20} />,
      titulo: 'Controle Financeiro',
      descricao: 'Acompanhe receitas, despesas e lucros'
    },
    { 
      id: 'agendamento', 
      nome: 'Agendamentos', 
      icone: <IoCalendar size={20} />,
      titulo: 'Agenda de Encomendas',
      descricao: 'Organize suas encomendas e prazos'
    },
    { 
      id: 'perfil', 
      nome: 'Perfil da Loja', 
      icone: <IoSettings size={20} />,
      titulo: 'Configurações da Loja',
      descricao: 'Edite informações e configurações'
    },
    { 
      id: 'horarios', 
      nome: 'Horários', 
      icone: <IoCalendar size={20} />,
      titulo: 'Horário de Funcionamento',
      descricao: 'Configure os horários de abertura e fechamento'
    },
  ];

  const renderConteudo = () => {
    switch (secaoAtiva) {
      case 'pedidos':
        return <PedidosPage />;
      case 'cardapio':
        return <CardapioManager />;
      case 'home':
        return <DashboardHome />;
      case 'finance':
        return <FinanceiroModerno />;
      case 'agendamento':
        return <AgendamentosModerno />;
      case 'perfil':
        return <PerfilLoja onUserDataUpdate={setUserData} />;
      case 'horarios':
        return (
          <div className={Styles.horariosContainer}>
            <h2>Horário de Funcionamento</h2>
            <p>Configure os horários de abertura e fechamento da sua loja. O status será atualizado automaticamente.</p>
            
            <div className={Styles.horariosGrid}>
              {Object.entries(businessHours).map(([day, hours]) => {
                const dayNames = {
                  monday: 'Segunda-feira',
                  tuesday: 'Terça-feira', 
                  wednesday: 'Quarta-feira',
                  thursday: 'Quinta-feira',
                  friday: 'Sexta-feira',
                  saturday: 'Sábado',
                  sunday: 'Domingo'
                };
                
                return (
                  <div key={day} className={Styles.horarioCard}>
                    <div className={Styles.dayHeader}>
                      <h3>{dayNames[day]}</h3>
                      <label className={Styles.switchContainer}>
                        <input
                          type="checkbox"
                          checked={hours.isOpen}
                          onChange={(e) => {
                            const newHours = {
                              ...businessHours,
                              [day]: { ...hours, isOpen: e.target.checked }
                            };
                            setBusinessHours(newHours);
                            localStorage.setItem('businessHours', JSON.stringify(newHours));
                          }}
                        />
                        <span className={Styles.slider}></span>
                      </label>
                    </div>
                    
                    {hours.isOpen && (
                      <div className={Styles.timeInputs}>
                        <div className={Styles.timeGroup}>
                          <label>Abertura:</label>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => {
                              const newHours = {
                                ...businessHours,
                                [day]: { ...hours, open: e.target.value }
                              };
                              setBusinessHours(newHours);
                              localStorage.setItem('businessHours', JSON.stringify(newHours));
                            }}
                          />
                        </div>
                        <div className={Styles.timeGroup}>
                          <label>Fechamento:</label>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => {
                              const newHours = {
                                ...businessHours,
                                [day]: { ...hours, close: e.target.value }
                              };
                              setBusinessHours(newHours);
                              localStorage.setItem('businessHours', JSON.stringify(newHours));
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {!hours.isOpen && (
                      <p className={Styles.closedDay}>Fechado</p>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className={Styles.currentStatus}>
              <h3>Status Atual:</h3>
              <div className={`${Styles.statusIndicator} ${storeOpen ? Styles.open : Styles.closed}`}>
                {storeOpen ? '🟢 Loja Aberta' : '🔴 Loja Fechada'}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className={Styles.emptyState}>
            <h2>Seção em Desenvolvimento</h2>
            <p>Esta funcionalidade estará disponível em breve.</p>
          </div>
        );
    }
  };

  return (
    <div className={Styles.dashboardContainer}>
      
      {/* Sidebar Moderna */}
      <aside className={`${Styles.sidebar} ${sidebarOpen ? Styles.open : Styles.closed}`}>
        <div className={Styles.sidebarHeader}>
          <img src={storeLogo} alt="Logo da loja" className={Styles.sidebarLogo} />
          <div className={Styles.sidebarBrand}>
            <h2>Docelivery</h2>
            <span>{dadosLoja.nome || userData.loja}</span>
          </div>
        </div>
        
        <nav className={Styles.sidebarNav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSecaoAtiva(item.id)}
              className={`${Styles.navItem} ${secaoAtiva === item.id ? Styles.active : ''}`}
            >
              {item.icone}
              <span>{item.nome}</span>
            </button>
          ))}
        </nav>
        
        <div className={Styles.sidebarFooter}>
          <button className={Styles.logoutBtn} onClick={handleLogout}>
            <IoLogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className={Styles.mainArea}>
        
        {/* Header Moderno */}
        <header className={Styles.header}>
          <div className={Styles.headerLeft}>
            <button 
              className={Styles.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <IoMenu size={24} />
            </button>
            <div>
              <h1>{menuItems.find(item => item.id === secaoAtiva)?.titulo || 'Dashboard'}</h1>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', fontWeight: '400' }}>
                {menuItems.find(item => item.id === secaoAtiva)?.descricao || 'Painel de controle'}
              </p>
            </div>
          </div>
          
          <div className={Styles.headerRight}>
            <div className={Styles.storeStatus}>
              <span className={Styles.statusLabel}>Loja:</span>
              <div className={`${Styles.autoStatus} ${storeOpen ? Styles.open : Styles.closed}`}>
                <div className={Styles.statusIndicator}></div>
                <span className={Styles.statusText}>
                  {storeOpen ? 'Aberta' : 'Fechada'}
                </span>
                <small className={Styles.autoLabel}>Automático</small>
              </div>
            </div>
            
            <button 
              className={Styles.notificationBtn}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <IoNotifications size={20} />
              <span className={Styles.notificationBadge}>3</span>
            </button>
            
            <div className={Styles.userProfile}>
              <div style={{ textAlign: 'right', marginRight: '10px' }}>
                <div style={{ fontWeight: '600', color: '#8a2be2', fontSize: '0.9rem' }}>
                  {userData.nome}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {userData.loja}
                </div>
              </div>
              <div className={Styles.avatar}>
                {userData.nome.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className={Styles.content}>
          <div className={Styles.contentWrapper}>
            {renderConteudo()}
          </div>
        </main>
      </div>
      
      {/* Notificações Dropdown */}
      {showNotifications && (
        <div className={Styles.notificationsDropdown}>
          <h3>Notificações</h3>
          <div className={Styles.notificationItem}>
            <span>Novo pedido recebido</span>
            <small>2 min atrás</small>
          </div>
          <div className={Styles.notificationItem}>
            <span>Pagamento confirmado</span>
            <small>15 min atrás</small>
          </div>
          <div className={Styles.notificationItem}>
            <span>Produto em falta no estoque</span>
            <small>1 hora atrás</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfeiteiroDashboard;