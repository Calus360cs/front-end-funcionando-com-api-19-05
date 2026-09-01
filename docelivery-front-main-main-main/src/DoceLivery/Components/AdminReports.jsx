import React, { useState, useEffect } from 'react';
import { IoTrendingUp, IoPersonOutline, IoRestaurant, IoReceipt, IoCarOutline } from 'react-icons/io5';
import Styles from './AdminPanel.module.css';
import ApiService from '../services/api';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [topLojas, setTopLojas] = useState([]);
  const [topProdutos, setTopProdutos] = useState([]);
  const [entregadores, setEntregadores] = useState([]);

  useEffect(() => {
    const buscarDadosRelatorio = async () => {
      try {
        setLoading(true);

        const extrairLista = (payload) => {
          if (Array.isArray(payload)) return payload;
          if (!payload || typeof payload !== 'object') return [];
          if (Array.isArray(payload.data)) return payload.data;
          if (Array.isArray(payload.entregadores)) return payload.entregadores;
          if (Array.isArray(payload.content)) return payload.content;
          if (Array.isArray(payload.items)) return payload.items;
          const arrays = Object.values(payload).filter(Array.isArray);
          return arrays[0] || [];
        };

        const [clientesRes, confeiteirosRes, pedidosRes, entregadoresRes] = await Promise.allSettled([
          ApiService.get('/cliente'),
          ApiService.get('/confeiteiro'),
          ApiService.get('/admin/pedidos'),
          Promise.allSettled([
            ApiService.get('/entregadores'),
            ApiService.get('/entregador'),
            ApiService.get('/admin/entregadores'),
            ApiService.get('/api/entregadores'),
          ]),
        ]);

        const clientes = extrairLista(clientesRes.status === 'fulfilled' ? clientesRes.value : []);
        const confeiteiros = extrairLista(confeiteirosRes.status === 'fulfilled' ? confeiteirosRes.value : []);
        const todosPedidos = extrairLista(pedidosRes.status === 'fulfilled' ? pedidosRes.value : []);
        const entregadoresLista = entregadoresRes.status === 'fulfilled'
          ? entregadoresRes.value.filter((item) => item.status === 'fulfilled').flatMap((item) => extrairLista(item.value))
          : [];
        const entregadoresNormalizados = entregadoresLista.map((item, index) => {
          const base = item?.entregador || item?.dados || item?.usuario || item?.data || item || {};
          return {
            id: base.id || base.idEntregador || base.entregadorId || base.userId || index,
            nome: base.nome || base.nomeCompleto || base.name || base.fullName || 'Sem nome',
            email: base.email || base.mail || '-',
            status: base.status || base.disponibilidade || base.situacao || 'Ativo',
          };
        });

        // 🚀 Ajustado para ler 'valorPedido' da sua Entidade Java
        const receitaTotal = todosPedidos.reduce((acc, p) => acc + Number(p.valorPedido ?? 0), 0);
        const entregues = todosPedidos.filter(p => (p.status || '').toLowerCase().includes('entregue')).length;
        const cancelados = todosPedidos.filter(p => (p.status || '').toLowerCase() === 'cancelado').length;

        setMetrics({
          totalClientes: clientes.length,
          totalConfeiteiros: confeiteiros.length,
          totalEntregadores: entregadoresNormalizados.length,
          totalPedidos: todosPedidos.length,
          receitaTotal,
          pedidosEntregues: entregues,
          pedidosCancelados: cancelados,
        });
        setEntregadores(entregadoresNormalizados);

        // Agrupamento de Top Lojas por número de pedidos com base na lista geral
        const lojaMap = new Map();
        todosPedidos.forEach(p => {
          const nomeLoja = p.loja?.nomeFantasia || p.nomeLoja || p.confeiteiro?.nome || 'Loja Sem Nome';
          const valor = Number(p.valorPedido ?? 0);
          
          if (lojaMap.has(nomeLoja)) {
            const atual = lojaMap.get(nomeLoja);
            lojaMap.set(nomeLoja, { nome: nomeLoja, totalPedidos: atual.totalPedidos + 1, receita: atual.receita + valor });
          } else {
            lojaMap.set(nomeLoja, { nome: nomeLoja, totalPedidos: 1, receita: valor });
          }
        });

        const rankLojas = Array.from(lojaMap.values())
          .sort((a, b) => b.totalPedidos - a.totalPedidos)
          .slice(0, 5);
        setTopLojas(rankLojas);

        // 🚀 Corrigido para mapear 'itens' (exatamente igual à sua List<ItemPedido> itens do Java)
        const produtoMap = new Map();
        todosPedidos.forEach(p => {
          const listaItens = p.itens || []; // Alterado de itensPedido/items para 'itens'
          listaItens.forEach(item => {
            const nome = item.nomeProduto || item.name || item.produto?.nome || 'Doce';
            const qtd = item.quantidade || item.quantity || 0;
            const precoUnit = item.precoUnitario || item.price || (qtd > 0 ? Number(p.valorPedido ?? 0) / qtd : 0);
            const receita = qtd * Number(precoUnit);
            
            if (produtoMap.has(nome)) {
              const atual = produtoMap.get(nome);
              produtoMap.set(nome, { nome, vendas: atual.vendas + qtd, receita: atual.receita + receita });
            } else {
              produtoMap.set(nome, { nome, vendas: qtd, receita });
            }
          });
        });

        const rankProdutos = Array.from(produtoMap.values())
          .sort((a, b) => b.vendas - a.vendas)
          .slice(0, 5);
        setTopProdutos(rankProdutos);

      } catch (err) {
        console.error('Erro ao processar métricas do relatório:', err);
      } finally {
        setLoading(false);
      }
    };
    buscarDadosRelatorio();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando relatórios...</div>;
  if (!metrics) return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Não foi possível carregar os dados analíticos.</div>;

  const cards = [
    { label: 'Receita Total', value: `R$ ${metrics.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <IoTrendingUp size={24} />, bg: 'linear-gradient(135deg, #ff69b4 0%, #8a2be2 100%)' },
    { label: 'Total de Pedidos', value: metrics.totalPedidos, icon: <IoReceipt size={24} />, bg: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' },
    { label: 'Clientes', value: metrics.totalClientes, icon: <IoPersonOutline size={24} />, bg: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' },
    { label: 'Confeiteiros', value: metrics.totalConfeiteiros, icon: <IoRestaurant size={24} />, bg: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' },
    { label: 'Entregadores', value: metrics.totalEntregadores, icon: <IoCarOutline size={24} />, bg: 'linear-gradient(135deg, #7B1FA2 0%, #512DA8 100%)' },
  ];

  return (
    <div className={Styles.adminPanel}>
      <div className={Styles.panelHeader}>
        <h2 style={{ color: '#8a2be2', margin: 0 }}>Relatórios e Análises</h2>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>
          Entregues: <strong>{metrics.pedidosEntregues}</strong> &nbsp;|&nbsp; Cancelados: <strong>{metrics.pedidosCancelados}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: card.bg, color: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              {card.icon}
              <h3 style={{ margin: 0 }}>{card.label}</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#8a2be2', marginBottom: '1.5rem' }}>Top Lojas por Pedidos</h3>
          {topLojas.length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Nenhum dado disponível.</p>
          ) : topLojas.map((loja, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < topLojas.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>{i + 1}. {loja.nome}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{loja.totalPedidos} pedidos</p>
              </div>
              <p style={{ margin: 0, fontWeight: 600, color: '#8a2be2' }}>R$ {loja.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#8a2be2', marginBottom: '1.5rem' }}>Top Produtos Vendidos</h3>
          {topProdutos.length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Nenhum dado disponível.</p>
          ) : topProdutos.map((prod, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < topProdutos.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>{i + 1}. {prod.nome}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{prod.vendas} unidades</p>
              </div>
              <p style={{ margin: 0, fontWeight: 600, color: '#8a2be2' }}>R$ {prod.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#8a2be2', marginBottom: '1.5rem' }}>Entregadores</h3>
          {entregadores.length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Nenhum entregador encontrado.</p>
          ) : entregadores.slice(0, 5).map((entregador, i) => (
            <div key={entregador.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < Math.min(entregadores.length, 5) - 1 ? '1px solid #f0f0f0' : 'none' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#333' }}>{entregador.nome}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{entregador.email}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 600, color: '#1976D2' }}>{entregador.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;