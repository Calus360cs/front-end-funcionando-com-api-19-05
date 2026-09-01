import React, { useEffect, useMemo, useState } from 'react';
import { IoSearchOutline, IoCarOutline, IoEyeOutline, IoPersonOutline } from 'react-icons/io5';
import Styles from './AdminPanel.module.css';
import ApiService from '../services/api';

const encontrarValor = (obj, chaves) => {
  if (!obj || typeof obj !== 'object') return undefined;
  const fila = [obj];

  while (fila.length > 0) {
    const atual = fila.shift();

    if (Array.isArray(atual)) {
      fila.push(...atual);
      continue;
    }

    if (!atual || typeof atual !== 'object') continue;

    for (const chave of chaves) {
      if (Object.prototype.hasOwnProperty.call(atual, chave)) {
        const valor = atual[chave];
        if (valor !== undefined && valor !== null && valor !== '') return valor;
      }
    }

    fila.push(...Object.values(atual));
  }

  return undefined;
};

const normalizarLista = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.entregadores)) return payload.entregadores;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;

  const arrays = Object.values(payload).filter(Array.isArray);
  if (arrays.length > 0) return arrays[0];
  return [payload];
};

const normalizarEntregador = (item, index) => {
  const base = item?.entregador || item?.dados || item?.usuario || item?.data || item || {};

  const nome = encontrarValor(base, ['nome', 'nomeCompleto', 'name', 'fullName', 'nomeUsuario', 'usuarioNome']) || base.nomeEntregador || 'Sem nome';
  const email = encontrarValor(base, ['email', 'mail', 'emailUsuario']) || base.emailEntregador || '-';
  const telefone = encontrarValor(base, ['telefone', 'phone', 'celular', 'whatsapp', 'telefoneContato']) || base.contato || '-';
  const cpf = encontrarValor(base, ['cpf', 'documento']) || base.cpfEntregador || '-';
  const cnh = encontrarValor(base, ['cnh', 'numeroCnh']) || '-';
  const veiculo = encontrarValor(base, ['veiculo', 'tipoVeiculo', 'tipo', 'vehicleType', 'veiculoTipo', 'meioTransporte']) || base.veiculoTipo || 'Não informado';
  const placa = encontrarValor(base, ['placa', 'plate', 'placaVeiculo']) || '-';
  const status = base.status || base.disponibilidade || base.situacao || 'Ativo';

  return {
    ...base,
    id: base.id || base.idEntregador || base.entregadorId || base.userId || `entregador-${index}`,
    nome,
    email,
    telefone,
    cpf,
    cnh,
    veiculo,
    placa,
    status,
  };
};

const AdminEntregadores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [entregadores, setEntregadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [selectedEntregador, setSelectedEntregador] = useState(null);

  useEffect(() => {
    const carregarEntregadores = async () => {
      try {
        setLoading(true);
        const endpoints = ['/entregadores', '/entregador', '/admin/entregadores', '/api/entregadores'];
        const respostas = await Promise.allSettled(endpoints.map((url) => ApiService.get(url)));

        const lista = respostas
          .filter((resposta) => resposta.status === 'fulfilled')
          .flatMap((resposta) => normalizarLista(resposta.value))
          .map((item, index) => normalizarEntregador(item, index));

        const unicos = lista.filter((item, index, self) => self.findIndex((outro) => String(outro.id) === String(item.id)) === index);

        setEntregadores(unicos);
        setErro(null);
      } catch (err) {
        console.error('Erro ao carregar entregadores:', err);
        setErro('Não foi possível carregar os entregadores.');
      } finally {
        setLoading(false);
      }
    };

    carregarEntregadores();
  }, []);

  const filteredEntregadores = useMemo(() => {
    return entregadores.filter((entregador) => {
      const nome = String(entregador.nome || '').toLowerCase();
      const email = String(entregador.email || '').toLowerCase();
      const status = String(entregador.status || '').toLowerCase();
      const matchesSearch = nome.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || status === filterStatus.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [entregadores, filterStatus, searchTerm]);

  return (
    <div className={Styles.adminPanel}>
      <div className={Styles.panelHeader}>
        <div className={Styles.searchContainer}>
          <IoSearchOutline className={Styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar entregador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={Styles.searchInput}
          />
        </div>

        <div className={Styles.filterContainer}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={Styles.filterSelect}>
            <option value="all">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="disponivel">Disponíveis</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#856404' }}>
          ⚠️ {erro}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando entregadores...</div>
      ) : (
        <div className={Styles.tableContainer}>
          <table className={Styles.dataTable}>
            <thead>
              <tr>
                <th>Entregador</th>
                <th>Telefone</th>
                <th>Veículo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntregadores.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                    Nenhum entregador encontrado.
                  </td>
                </tr>
              ) : filteredEntregadores.map((entregador) => (
                <tr key={String(entregador.id)}>
                  <td>
                    <div className={Styles.userInfo}>
                      <div className={Styles.userAvatar}>
                        {entregador.veiculo && entregador.veiculo.toLowerCase().includes('moto') ? <IoCarOutline size={16} /> : <IoPersonOutline size={16} />}
                      </div>
                      <div>
                        <div className={Styles.userName}>{entregador.nome}</div>
                        <div className={Styles.userEmail}>{entregador.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{entregador.telefone}</td>
                  <td>{`${entregador.veiculo || '-'}${entregador.placa ? ` • ${entregador.placa}` : ''}`}</td>
                  <td>
                    <span className={`${Styles.status} ${Styles[entregador.status?.toLowerCase() === 'disponivel' ? 'ativo' : entregador.status?.toLowerCase() === 'offline' ? 'suspenso' : 'pendente']}`}>
                      {entregador.status || 'Ativo'}
                    </span>
                  </td>
                  <td>
                    <button className={Styles.actionBtn} onClick={() => setSelectedEntregador(entregador)} title="Ver detalhes">
                      <IoEyeOutline size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEntregador && (
        <div className={Styles.modal} onClick={() => setSelectedEntregador(null)}>
          <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Entregador</h3>
            <div className={Styles.userDetails}>
              <p><strong>Nome:</strong> {selectedEntregador.nome}</p>
              <p><strong>Email:</strong> {selectedEntregador.email}</p>
              <p><strong>Telefone:</strong> {selectedEntregador.telefone}</p>
              <p><strong>CPF:</strong> {selectedEntregador.cpf}</p>
              <p><strong>CNH:</strong> {selectedEntregador.cnh}</p>
              <p><strong>Veículo:</strong> {selectedEntregador.veiculo}</p>
              <p><strong>Placa:</strong> {selectedEntregador.placa}</p>
              <p><strong>Status:</strong> {selectedEntregador.status || 'Ativo'}</p>
            </div>
            <button className={Styles.closeBtn} onClick={() => setSelectedEntregador(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEntregadores;
