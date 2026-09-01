import React, { useEffect, useState } from 'react';
import { IoPersonOutline, IoCarOutline, IoSparklesOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import Styles from './EntregadorPerfil.module.css';
import EntregadorService from '../services/entregadorService';

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

const extrairPerfilPrincipal = (payload) => {
  if (!payload || typeof payload !== 'object') return {};

  const candidatos = [];
  const visitar = (valor) => {
    if (!valor || typeof valor !== 'object') return;

    if (Array.isArray(valor)) {
      valor.forEach(visitar);
      return;
    }

    const temCamposPerfil = ['nome', 'nomeCompleto', 'name', 'fullName', 'email', 'telefone', 'phone', 'celular', 'cpf', 'documento', 'dataNascimento', 'data_nascimento', 'birthDate', 'cnh', 'numeroCnh', 'placa', 'veiculo', 'tipoVeiculo', 'marcaVeiculo', 'modeloVeiculo'].some((chave) => Object.prototype.hasOwnProperty.call(valor, chave));

    if (temCamposPerfil) {
      candidatos.push(valor);
    }

    Object.values(valor).forEach(visitar);
  };

  visitar(payload);

  if (candidatos.length === 0) return payload;

  return candidatos.sort((a, b) => Object.keys(b).length - Object.keys(a).length)[0] || payload;
};

const formatarDataParaInput = (valor) => {
  if (!valor) return '';

  if (typeof valor === 'string') {
    const dataSemTempo = valor.includes('T') ? valor.split('T')[0] : valor;
    const match = dataSemTempo.match(/(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    const data = new Date(valor);
    if (!Number.isNaN(data.getTime())) {
      return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    }
  }

  if (valor instanceof Date) {
    return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`;
  }

  return String(valor);
};

const normalizarVeiculo = (valor) => {
  if (!valor) return '';

  const texto = String(valor).toLowerCase();
  if (texto.includes('moto')) return 'Moto';
  if (texto.includes('carro')) return 'Carro';
  if (texto.includes('bicicleta')) return 'Bicicleta';
  return String(valor);
};

const EntregadorPerfil = ({ onUserDataUpdate }) => {
  const [dadosPessoais, setDadosPessoais] = useState({
    nome: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    telefone: localStorage.getItem('userTelefone') || '',
    cpf: localStorage.getItem('userCpf') || '',
    dataNascimento: localStorage.getItem('userDataNascimento') || '',
    cnh: localStorage.getItem('userCnh') || '',
  });

  const [dadosVeiculo, setDadosVeiculo] = useState({
    tipo: localStorage.getItem('userVeiculo') || '',
    placa: localStorage.getItem('userPlacaVeiculo') || '',
    marca: '',
    modelo: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  useEffect(() => {
    const carregarPerfil = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setCarregandoPerfil(false);
        return;
      }

      try {
        const response = await EntregadorService.getEntregador(userId);
        const perfil = extrairPerfilPrincipal(response?.data || response?.entregador || response?.dados || response?.usuario || response || {});

        const dadosPessoaisApi = {
          nome: encontrarValor(perfil, ['nome', 'nomeCompleto', 'name', 'fullName', 'nomeUsuario', 'usuarioNome']),
          email: encontrarValor(perfil, ['email', 'mail', 'emailUsuario']),
          telefone: encontrarValor(perfil, ['telefone', 'phone', 'celular', 'whatsapp', 'telefoneContato']),
          cpf: encontrarValor(perfil, ['cpf', 'documento']),
          dataNascimento: formatarDataParaInput(encontrarValor(perfil, ['dataNascimento', 'data_nascimento', 'birthDate', 'dataAniversario'])),
          cnh: encontrarValor(perfil, ['cnh', 'numeroCnh'])
        };

        const dadosVeiculoApi = {
          tipo: normalizarVeiculo(encontrarValor(perfil, ['veiculo', 'tipoVeiculo', 'tipo', 'vehicleType', 'veiculoTipo', 'meioTransporte'])),
          placa: encontrarValor(perfil, ['placa', 'plate', 'placaVeiculo']),
          marca: encontrarValor(perfil, ['marcaVeiculo', 'marca', 'vehicleBrand', 'marcaVeiculoEntregador']),
          modelo: encontrarValor(perfil, ['modeloVeiculo', 'modelo', 'vehicleModel', 'modeloVeiculoEntregador'])
        };

        const dadosPessoaisAtualizados = Object.fromEntries(
          Object.entries(dadosPessoaisApi).filter(([, value]) => value !== undefined && value !== null && value !== '')
        );

        const dadosVeiculoAtualizados = Object.fromEntries(
          Object.entries(dadosVeiculoApi).filter(([, value]) => value !== undefined && value !== null && value !== '')
        );

        setDadosPessoais((prev) => ({ ...prev, ...dadosPessoaisAtualizados }));
        setDadosVeiculo((prev) => ({ ...prev, ...dadosVeiculoAtualizados }));

        if (onUserDataUpdate) {
          onUserDataUpdate({
            nome: dadosPessoaisAtualizados.nome || localStorage.getItem('nomeEntregador') || 'Entregador',
            veiculo: `${dadosVeiculoAtualizados.marca || ''} ${dadosVeiculoAtualizados.modelo || ''}`.trim() || dadosVeiculoAtualizados.tipo || localStorage.getItem('veiculo') || 'Moto'
          });
        }

        if (dadosPessoaisAtualizados.nome) localStorage.setItem('userName', dadosPessoaisAtualizados.nome);
        if (dadosPessoaisAtualizados.email) localStorage.setItem('userEmail', dadosPessoaisAtualizados.email);
        if (dadosPessoaisAtualizados.telefone) localStorage.setItem('userTelefone', dadosPessoaisAtualizados.telefone);
        if (dadosVeiculoAtualizados.tipo) localStorage.setItem('userVeiculo', dadosVeiculoAtualizados.tipo);
        if (dadosVeiculoAtualizados.placa) localStorage.setItem('userPlacaVeiculo', dadosVeiculoAtualizados.placa);
        if (dadosPessoaisAtualizados.nome) localStorage.setItem('nomeEntregador', dadosPessoaisAtualizados.nome);
        if (dadosVeiculoAtualizados.tipo || dadosVeiculoAtualizados.marca || dadosVeiculoAtualizados.modelo) {
          localStorage.setItem('veiculo', `${dadosVeiculoAtualizados.marca || ''} ${dadosVeiculoAtualizados.modelo || ''}`.trim() || dadosVeiculoAtualizados.tipo || 'Moto');
        }
      } catch (error) {
        console.warn('Não foi possível carregar o perfil do entregador:', error);
      } finally {
        setCarregandoPerfil(false);
      }
    };

    carregarPerfil();
  }, []);

  const handleSalvarPerfil = async () => {
    setSalvando(true);
    const userId = localStorage.getItem('userId');

    const dadosAtualizados = {
      nome: dadosPessoais.nome,
      email: dadosPessoais.email,
      telefone: dadosPessoais.telefone,
      cpf: dadosPessoais.cpf,
      dataNascimento: dadosPessoais.dataNascimento,
      cnh: dadosPessoais.cnh,
      veiculo: dadosVeiculo.tipo,
      placa: dadosVeiculo.placa,
      marca: dadosVeiculo.marca,
      modelo: dadosVeiculo.modelo,
    };

    localStorage.setItem('userName', dadosPessoais.nome);
    localStorage.setItem('userEmail', dadosPessoais.email);
    localStorage.setItem('userTelefone', dadosPessoais.telefone);
    localStorage.setItem('userVeiculo', dadosVeiculo.tipo);
    localStorage.setItem('userPlacaVeiculo', dadosVeiculo.placa);
    localStorage.setItem('nomeEntregador', dadosPessoais.nome);
    localStorage.setItem('veiculo', `${dadosVeiculo.marca} ${dadosVeiculo.modelo}`.trim() || dadosVeiculo.tipo);

    if (userId) {
      try {
        await EntregadorService.updateEntregador(userId, dadosAtualizados);
      } catch (error) {
        console.warn('Não foi possível salvar o perfil no backend:', error);
      }
    }

    if (onUserDataUpdate) {
      onUserDataUpdate({
        nome: dadosPessoais.nome,
        veiculo: `${dadosVeiculo.marca} ${dadosVeiculo.modelo}`.trim() || dadosVeiculo.tipo
      });
    }

    setSalvando(false);
    alert('Perfil atualizado com sucesso!');
  };

  return (
    <div className={Styles.perfilContainer}>
      <div className={Styles.perfilHeader}>
        <div className={Styles.headerTitleWrap}>
          <div className={Styles.iconBadge}><IoSparklesOutline size={20} /></div>
          <div>
            <h2>Meu Perfil</h2>
            <p>Gerencie seus dados com o mesmo padrão de excelência do seu atendimento.</p>
          </div>
        </div>
        <div className={Styles.headerStatus}>
          <IoCheckmarkCircleOutline size={16} />
          <span>{carregandoPerfil ? 'Sincronizando com a API...' : 'Dados atualizados'}</span>
        </div>
      </div>

      <div className={Styles.secaoCard}>
        <div className={Styles.secaoHeader}>
          <IoPersonOutline size={24} color="#8a2be2" />
          <h3>Dados Pessoais</h3>
        </div>
        
        <div className={Styles.formGrid}>
          <div className={Styles.formGroup}>
            <label>Nome Completo</label>
            <input
              type="text"
              value={dadosPessoais.nome}
              onChange={(e) => setDadosPessoais({...dadosPessoais, nome: e.target.value})}
            />
          </div>
          
          <div className={Styles.formGroup}>
            <label>E-mail</label>
            <input
              type="email"
              value={dadosPessoais.email}
              onChange={(e) => setDadosPessoais({...dadosPessoais, email: e.target.value})}
            />
          </div>
          
          <div className={Styles.formGroup}>
            <label>Telefone</label>
            <input
              type="tel"
              value={dadosPessoais.telefone}
              onChange={(e) => setDadosPessoais({...dadosPessoais, telefone: e.target.value})}
            />
          </div>
          
          <div className={Styles.formGroup}>
            <label>CPF</label>
            <input
              type="text"
              value={dadosPessoais.cpf}
              disabled
              className={Styles.disabled}
            />
          </div>

          <div className={Styles.formGroup}>
            <label>Data de Nascimento</label>
            <input
              type="date"
              value={dadosPessoais.dataNascimento}
              onChange={(e) => setDadosPessoais({...dadosPessoais, dataNascimento: e.target.value})}
            />
          </div>

          <div className={Styles.formGroup}>
            <label>CNH</label>
            <input
              type="text"
              value={dadosPessoais.cnh}
              disabled
              className={Styles.disabled}
            />
          </div>
        </div>
      </div>

      <div className={Styles.secaoCard}>
        <div className={Styles.secaoHeader}>
          <IoCarOutline size={24} color="#10b981" />
          <h3>Dados do Veículo</h3>
        </div>
        
        <div className={Styles.formGrid}>
          <div className={Styles.formGroup}>
            <label>Tipo</label>
            <select
              value={dadosVeiculo.tipo}
              onChange={(e) => setDadosVeiculo({...dadosVeiculo, tipo: e.target.value})}
            >
              <option value="Moto">Moto</option>
              <option value="Carro">Carro</option>
              <option value="Bicicleta">Bicicleta</option>
            </select>
          </div>
          
          <div className={Styles.formGroup}>
            <label>Marca</label>
            <input
              type="text"
              value={dadosVeiculo.marca}
              onChange={(e) => setDadosVeiculo({...dadosVeiculo, marca: e.target.value})}
            />
          </div>
          
          <div className={Styles.formGroup}>
            <label>Modelo</label>
            <input
              type="text"
              value={dadosVeiculo.modelo}
              onChange={(e) => setDadosVeiculo({...dadosVeiculo, modelo: e.target.value})}
            />
          </div>
          
          <div className={Styles.formGroup}>
            <label>Placa</label>
            <input
              type="text"
              value={dadosVeiculo.placa}
              onChange={(e) => setDadosVeiculo({...dadosVeiculo, placa: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className={Styles.acoes}>
        <button className={Styles.salvarBtn} onClick={handleSalvarPerfil} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default EntregadorPerfil;