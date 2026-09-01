import React, { useState, useEffect } from 'react';
import { IoSearchOutline, IoEyeOutline } from 'react-icons/io5';
import Styles from './AdminPanel.module.css';
import ApiService from '../services/api';

const AdminStores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      try {
        setLoading(true);
        // Busca os dados puros do backend sem nenhuma transformação que quebre o DTO
        const res = await ApiService.get('/confeiteiro');
        setStores(Array.isArray(res) ? res : []);
        setErro(null);
      } catch (err) {
        setErro('Não foi possível carregar as lojas.');
        console.error("Erro ao carregar lojas:", err);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, []);

  // Filtro corrigido para buscar corretamente nos campos do objeto aninhado
  const filteredStores = stores.filter(confeiteiro => {
    const name = confeiteiro.loja?.nomeFantasia || confeiteiro.loja?.nomeLoja || '';
    const owner = confeiteiro.nome || confeiteiro.usuario?.nome || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           owner.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className={Styles.adminPanel}>
      <div className={Styles.panelHeader}>
        <div className={Styles.searchContainer}>
          <IoSearchOutline className={Styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar lojas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={Styles.searchInput}
          />
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', color: '#856404' }}>
          ⚠️ {erro}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8a2be2' }}>Carregando lojas...</div>
      ) : (
        <div className={Styles.tableContainer}>
          <table className={Styles.dataTable}>
            <thead>
              <tr>
                <th>Loja</th>
                <th>Proprietário</th>
                <th>Telefone</th>
                <th>Cidade</th>
                <th>CNPJ</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : (
                filteredStores.map((confeiteiro, idx) => {
                  const dadosLoja = confeiteiro.loja || {};
                  
                  return (
                    <tr key={confeiteiro.id ?? idx}>
                      {/* 1. Coluna LOJA */}
                      <td>{dadosLoja.nomeFantasia || dadosLoja.nomeLoja || "Sem nome"}</td>
                      
                      {/* 2. Coluna PROPRIETÁRIO */}
                      <td>{confeiteiro.nome || confeiteiro.usuario?.nome || "Não informado"}</td>
                      
                      {/* 3. Coluna TELEFONE */}
                      <td>{confeiteiro.telefone || dadosLoja.telefone || "-"}</td>
                      
                      {/* 4. Coluna CIDADE */}
                      <td>{confeiteiro.cidade || dadosLoja.cidade || "Barueri"}</td>
                      
                      {/* 5. Coluna CNPJ */}
                      <td>{dadosLoja.cnpj || "-"}</td>

                      {/* 6. Coluna AÇÕES */}
                      <td>
                        <button 
                          className={Styles.actionBtn} 
                          onClick={() => setSelectedStore(confeiteiro)} 
                          title="Ver detalhes"
                        >
                          <IoEyeOutline size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedStore && (
        <div className={Styles.modal} onClick={() => setSelectedStore(null)}>
          <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes da Loja</h3>
            <div className={Styles.userDetails}>
              
              <p><strong>Nome:</strong> {selectedStore.loja?.nomeFantasia || '-'}</p>
              <p><strong>Proprietário:</strong> {selectedStore.nome || '-'}</p>
              <p><strong>Email:</strong> {selectedStore.email || '-'}</p>
              <p><strong>Telefone:</strong> {selectedStore.loja?.telefone || selectedStore.telefone || '-'}</p>
              <p><strong>CNPJ:</strong> {selectedStore.loja?.cnpj || '-'}</p>
              <p><strong>Endereço:</strong> {selectedStore.loja?.endereco || '-'}</p>
              <p><strong>Status:</strong> {selectedStore.codStatus || '-'}</p>
              
            </div>
            <button className={Styles.closeBtn} onClick={() => setSelectedStore(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStores;