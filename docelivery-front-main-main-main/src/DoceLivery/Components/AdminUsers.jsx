import React, { useState, useEffect } from 'react';
import { IoSearchOutline, IoPersonOutline, IoRestaurant, IoCarOutline, IoEyeOutline } from 'react-icons/io5';
import Styles from './AdminPanel.module.css';
import ApiService from '../services/api';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        setLoading(true);
        const [clientes, confeiteiros, entregadores] = await Promise.allSettled([
          ApiService.get('/cliente'),
          ApiService.get('/confeiteiro'),
          ApiService.get('/entregadores')
        ]);

        const listaClientes = clientes.status === 'fulfilled'
          ? (Array.isArray(clientes.value) ? clientes.value : []).map(c => ({ ...c, tipoUsuario: 'cliente' }))
          : [];

        const listaConfeiteiros = confeiteiros.status === 'fulfilled'
          ? (Array.isArray(confeiteiros.value) ? confeiteiros.value : []).map(c => ({ ...c, tipoUsuario: 'confeiteiro' }))
          : [];

        const listaEntregadores = entregadores.status === 'fulfilled'
          ? (Array.isArray(entregadores.value) ? entregadores.value : []).map(c => ({ ...c, tipoUsuario: 'entregador' }))
          : [];

        setUsuarios([...listaClientes, ...listaConfeiteiros, ...listaEntregadores]);
        setErro(null);
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
        setErro('Não foi possível carregar os usuários.');
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  const filteredUsers = usuarios.filter(user => {
    const nome = user.nome || user.name || user.nomeConfeiteiro || '';
    const email = user.email || '';
    const tipo = user.tipoUsuario || '';
    const matchesSearch = nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || tipo === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={Styles.adminPanel}>
      <div className={Styles.panelHeader}>
        <div className={Styles.searchContainer}>
          <IoSearchOutline className={Styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={Styles.searchInput}
          />
        </div>
        <div className={Styles.filterContainer}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={Styles.filterSelect}>
            <option value="all">Todos os usuários</option>
            <option value="cliente">Clientes</option>
            <option value="confeiteiro">Confeiteiros</option>
            <option value="entregador">Entregadores</option>
          </select>
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#856404' }}>
          ⚠️ {erro}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando usuários...</div>
      ) : (
        <div className={Styles.tableContainer}>
          <table className={Styles.dataTable}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Tipo</th>
                <th>Telefone</th>
                <th>CPF / CNPJ</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Nenhum usuário encontrado.</td></tr>
              ) : filteredUsers.map((user, idx) => {
                const nome = user.nome || user.name || user.nomeConfeiteiro || 'Sem nome';
                const tipo = user.tipoUsuario;
                const doc = user.cpf || user.cnpj || user.documento || '-';
                const tel = user.telefone || user.contato || user.whatsapp || '-';
                return (
                  <tr key={user.id ?? idx}>
                    <td>
                      <div className={Styles.userInfo}>
                        <div className={Styles.userAvatar}>
                          {tipo === 'confeiteiro' ? <IoRestaurant size={16} /> : tipo === 'entregador' ? <IoCarOutline size={16} /> : <IoPersonOutline size={16} />}
                        </div>
                        <div>
                          <div className={Styles.userName}>{nome}</div>
                          <div className={Styles.userEmail}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${Styles.userType} ${Styles[tipo]}`}>
                        {tipo === 'cliente' ? 'Cliente' : tipo === 'entregador' ? 'Entregador' : 'Confeiteiro'}
                      </span>
                    </td>
                    <td>{tel}</td>
                    <td>{doc}</td>
                    <td>
                      <button className={Styles.actionBtn} onClick={() => setSelectedUser(user)} title="Ver detalhes">
                        <IoEyeOutline size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className={Styles.modal} onClick={() => setSelectedUser(null)}>
          <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Usuário</h3>
            <div className={Styles.userDetails}>
              <p><strong>Nome:</strong> {selectedUser.nome || selectedUser.name || selectedUser.nomeConfeiteiro}</p>
              <p><strong>Email:</strong> {selectedUser.email || '-'}</p>
              <p><strong>Telefone:</strong> {selectedUser.telefone || selectedUser.contato || '-'}</p>
              <p><strong>Tipo:</strong> {selectedUser.tipoUsuario}</p>
              <p><strong>CPF/CNPJ:</strong> {selectedUser.cpf || selectedUser.cnpj || selectedUser.documento || '-'}</p>
              {selectedUser.veiculo && <p><strong>Veículo:</strong> {selectedUser.veiculo}</p>}
              {selectedUser.placa && <p><strong>Placa:</strong> {selectedUser.placa}</p>}
              <p><strong>Endereço:</strong> {selectedUser.endereco || selectedUser.logradouro || '-'}</p>
              {selectedUser.cidade && <p><strong>Cidade:</strong> {selectedUser.cidade} - {selectedUser.uf || selectedUser.estado || ''}</p>}
              {selectedUser.loja && <p><strong>Loja:</strong> {selectedUser.loja.nomeFantasia || selectedUser.loja.nomeLoja || '-'}</p>}
            </div>
            <button className={Styles.closeBtn} onClick={() => setSelectedUser(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
