import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Styles from './ConfeiteiroDashboard.module.css';
import { IoHome, IoReceipt, IoRestaurant, IoStatsChart, IoCalendar, IoSettings, IoLogOut, IoNotifications, IoMenu } from 'react-icons/io5';
import { useStore } from '../context/StoreContext';
import { useLoja } from '../context/LojaContext';
import AuthService from '../services/authService';
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
  
  // 🟢 CORRIGIDO: Estrutura inicial espelhando as propriedades do banco de dados Java
  const [userData, setUserData] = useState({ nome: '', loja: '', email: '', fotoLoja: '' });
  
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
    try {
      localStorage.clear();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('localStorageUpdate'));
    } catch (e) {
      console.warn('Erro limpando localStorage durante logout', e);
    }
    navigate('/docelivery/confeiteiro/cadastro');
  };
  
  const checkIfStoreIsOpen = () => {
    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = businessHours[currentDay];
    if (!todayHours.isOpen) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken') || localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    
    // Função auxiliar e robusta para extrair as informações corretas do localStorage
    const extrairDadosUsuario = () => {
      const rawStorage = localStorage.getItem('user');
      if (!rawStorage) return { nome: 'Confeiteiro', loja: 'Minha Confeitaria', email: '', fotoLoja: '' };
      
      try {
        const parsed = JSON.parse(rawStorage);
        
        // 🟢 RESOLVE O LOG 1: Se a API salvou como { user: { nome: '...' } }
        // 🟢 RESOLVE O LOG 2: Se a API salvou o usuário diretamente na raiz { nome: '...' }
        const dadosReais = parsed.user ? parsed.user : parsed;

        // Extração segura do Nome do Confeiteiro
        const nomeConfeiteiro = dadosReais.nome || dadosReais.name || parsed.nome || 'Confeiteiro';

        // Extração segura do Nome da Loja (Varre todas as estruturas retornadas no seu log)
        const nomeDaLoja = 
          dadosReais.loja?.nomeFantasia || 
          parsed.loja?.nomeFantasia || 
          dadosReais.nomeLoja || 
          parsed.nomeLoja || 
          'Minha Confeitaria';

        return {
          nome: nomeConfeiteiro,
          loja: nomeDaLoja,
          email: dadosReais.email || parsed.email || '',
          fotoLoja: dadosReais.fotoLoja || parsed.fotoLoja || ''
        };
      } catch (e) {
        console.error("Erro ao fazer parse do usuário do localStorage", e);
        return { nome: 'Confeiteiro', loja: 'Minha Confeitaria', email: '', fotoLoja: '' };
      }
    };

    if (!token && !userEmail) {
      navigate('/docelivery/confeiteiro/login-confeiteiro');
      return;
    }

    // 1. Define o estado inicial com base no cache do localStorage tratado
    setUserData(extrairDadosUsuario());

    const refreshProfile = async () => {
      if (token && userEmail) {
        try {
          // Executa a busca no banco de dados via AuthService
          await AuthService.fetchAndSaveProfile(userEmail, token);
          
          // 2. Atualiza o estado com a varredura inteligente pós-atualização da API
          setUserData(extrairDadosUsuario());
        } catch (error) {
          console.warn('Não foi possível atualizar perfil do confeiteiro no dashboard:', error);
        }
      }
    };

    refreshProfile();
    
    const savedBusinessHours = localStorage.getItem('businessHours');
    if (savedBusinessHours) {
      try {
        setBusinessHours(JSON.parse(savedBusinessHours));
      } catch (error) {
        console.error('Erro ao carregar horários salvos:', error);
      }
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const isOpen = checkIfStoreIsOpen();
      setStoreOpen(isOpen);
    }, 60000);

    const isOpen = checkIfStoreIsOpen();
    setStoreOpen(isOpen);

    return () => clearInterval(interval);
  }, [businessHours]);
  
  const menuItems = [
    { id: 'home', nome: 'Dashboard', icone: <IoHome size={20} />, titulo: 'Painel Principal', descricao: 'Visão geral do seu negócio' },
    { id: 'pedidos', nome: 'Pedidos', icone: <IoReceipt size={20} />, titulo: 'Gerenciar Pedidos', descricao: 'Acompanhe todos os pedidos da sua confeitaria' },
    { id: 'cardapio', nome: 'Cardápio', icone: <IoRestaurant size={20} />, titulo: 'Gerenciar Cardápio', descricao: 'Adicione e edite seus produtos' },
    { id: 'finance', nome: 'Financeiro', icone: <IoStatsChart size={20} />, titulo: 'Controle Financeiro', descricao: 'Acompanhe receitas, despesas e lucros' },
    { id: 'agendamento', nome: 'Agendamentos', icone: <IoCalendar size={20} />, titulo: 'Agenda de Encomendas', descricao: 'Organize suas encomendas e prazos' },
    { id: 'perfil', nome: 'Perfil da Loja', icone: <IoSettings size={20} />, titulo: 'Configurações da Loja', descricao: 'Edite informações e configurações' },
    { id: 'horarios', nome: 'Horários', icone: <IoCalendar size={20} />, titulo: 'Horário de Funcionamento', descricao: 'Configure os horários de abertura e fechamento' },
  ];

  const renderConteudo = () => {
    switch (secaoAtiva) {
      case 'pedidos': return <PedidosPage />;
      case 'cardapio': return <CardapioManager />;
      case 'home': return <DashboardHome />;
      case 'finance': return <FinanceiroModerno />;
      case 'agendamento': return <AgendamentosModerno />;
      case 'perfil': return <PerfilLoja onUserDataUpdate={setUserData} />;
      case 'horarios':
        return (
          <div className={Styles.horariosContainer}>
            <h2>Horário de Funcionamento</h2>
            <p>Configure os horários de abertura e fechamento da sua loja. O status será atualizado automaticamente.</p>
            <div className={Styles.horariosGrid}>
              {Object.entries(businessHours).map(([day, hours]) => {
                const dayNames = {
                  monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
                  thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo'
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
                            const newHours = { ...businessHours, [day]: { ...hours, isOpen: e.target.checked } };
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
                              const newHours = { ...businessHours, [day]: { ...hours, open: e.target.value } };
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
                              const newHours = { ...businessHours, [day]: { ...hours, close: e.target.value } };
                              setBusinessHours(newHours);
                              localStorage.setItem('businessHours', JSON.stringify(newHours));
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {!hours.isOpen && <p className={Styles.closedDay}>Fechado</p>}
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
      <aside className={`${Styles.sidebar} ${sidebarOpen ? Styles.open : Styles.closed}`}>
        <div className={Styles.sidebarHeader}>
          <img src={storeLogo} alt="Logo da loja" className={Styles.sidebarLogo} />
          <div className={Styles.sidebarBrand}>
            <h2>Docelivery</h2>
            {/* 🟢 CORRIGIDO: Prioriza os dados do banco mapeados no userData */}
            <span>{userData.loja || dadosLoja.nomeFantasia || 'Minha Confeitaria'}</span>
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

      <div className={Styles.mainArea}>
        <header className={Styles.header}>
          <div className={Styles.headerLeft}>
            <button className={Styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
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
                <span className={Styles.statusText}>{storeOpen ? 'Aberta' : 'Fechada'}</span>
                <small className={Styles.autoLabel}>Automático</small>
              </div>
            </div>
            
            <button className={Styles.notificationBtn} onClick={() => setShowNotifications(!showNotifications)}>
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
              <div className={Styles.avatar} style={{ overflow: 'hidden' }}>
                {userData.fotoLoja ? (
                  <img 
                    src={`http://localhost:8080/uploads/${userData.fotoLoja}`} 
                    alt="Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  userData.nome?.charAt(0).toUpperCase() || '🧁'
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={Styles.content}>
          <div className={Styles.contentWrapper}>
            {renderConteudo()}
          </div>
        </main>
      </div>
      
      {showNotifications && (
        <div className={Styles.notificationsDropdown}>
          <h3>Notificações</h3>
          <div className={Styles.notificationItem}><span>Novo pedido recebido</span><small>2 min atrás</small></div>
          <div className={Styles.notificationItem}><span>Pagamento confirmado</span><small>15 min atrás</small></div>
          <div className={Styles.notificationItem}><span>Produto em falta no estoque</span><small>1 hora atrás</small></div>
        </div>
      )}
    </div>
  );
};

export default ConfeiteiroDashboard;