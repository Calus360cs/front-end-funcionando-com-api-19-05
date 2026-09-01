import ApiService from './api';
import ConfeiteiroService from './confeiteiroService';
import { API_ENDPOINTS } from './constants';

class AuthService {
  /**
   * Salva os dados do usuário e o token no localStorage após o login.
   * @param {Object} response - Resposta vinda da API
   * @param {string} tipoDefault - Tipo de usuário caso não venha no objeto (cliente, confeiteiro, etc)
   */
  _salvarDadosUsuario(response, tipoDefault) {
    const resp = response || {};
    const token = resp.token || resp.accessToken || resp.jwt || resp.data?.token || resp.data?.accessToken || resp.data?.jwt || resp.user?.token || resp.user?.accessToken || resp.user?.jwt;

    if (token) {
      localStorage.setItem('userToken', token);
      localStorage.setItem('token', token);
    }

    const u = resp.user || resp.data?.user || resp.data || resp;

    try {
      if (u) {
        const tipoFinal = String(u.tipo || u.userType || tipoDefault || '').toLowerCase();
        const id = u.id || u.idConfeiteiro || u.idCliente || u.idEntregador || u.idUsuario || u.userId || u.confeiteiroId || u.loja?.id || u.confeiteiro?.id || u.usuario?.id;

        for (const key of ['user', 'userType', 'userId', 'userName', 'userEmail', 'userCpf', 'nomeConfeiteiro', 'nomeLoja', 'dadosConfeiteiro', 'userTelefone', 'userDataNascimento', 'userEndereco', 'userCep', 'userBairro', 'userCidade', 'userUf', 'userCnh', 'userVeiculo', 'userPlacaVeiculo', 'userCnpj']) {
          localStorage.removeItem(key);
        }

        localStorage.setItem('user', JSON.stringify(u));

        if (tipoFinal) localStorage.setItem('userType', tipoFinal);

        const nomeUsuario = u.nome || u.nomeConfeiteiro || u.userName || u.nomeLoja || u.nomeFantasia || u.loja?.nomeFantasia || '';
        if (nomeUsuario) {
          localStorage.setItem('userName', nomeUsuario);
          if (tipoFinal === 'entregador') {
            localStorage.setItem('nomeEntregador', nomeUsuario);
          }
        }
        if (u.nomeConfeiteiro) localStorage.setItem('nomeConfeiteiro', u.nomeConfeiteiro);

        const lojaDados = u.loja || u.confeiteiro || u;
        const nomeDaLoja = lojaDados?.nomeFantasia || lojaDados?.nomeConfeitaria || lojaDados?.nomeLoja || lojaDados?.nome || lojaDados?.descricao || '';
        if (nomeDaLoja) localStorage.setItem('nomeLoja', nomeDaLoja);
        if (u.nomeLoja) localStorage.setItem('nomeLoja', u.nomeLoja);
        if (u.nomeConfeitaria) localStorage.setItem('nomeLoja', u.nomeConfeitaria);
        if (u.nomeFantasia) localStorage.setItem('nomeLoja', u.nomeFantasia);

        if (u.email) localStorage.setItem('userEmail', u.email);
        if (u.cpf) localStorage.setItem('userCpf', u.cpf);

        if (u.telefone || u.contato) localStorage.setItem('userTelefone', u.telefone || u.contato);
        if (u.dataNascimento) localStorage.setItem('userDataNascimento', u.dataNascimento);

        if (u.endereco) localStorage.setItem('userEndereco', u.endereco);
        if (u.cep) localStorage.setItem('userCep', u.cep);
        if (u.bairro) localStorage.setItem('userBairro', u.bairro);
        if (u.cidade) localStorage.setItem('userCidade', u.cidade);
        if (u.uf || u.estado) localStorage.setItem('userUf', u.uf || u.estado);

        if (id) localStorage.setItem('userId', String(id));

        const maybeConfeiteiro = u.loja || u.confeiteiro || u;
        if (maybeConfeiteiro && (maybeConfeiteiro.nomeLoja || maybeConfeiteiro.nomeConfeitaria || maybeConfeiteiro.loja || maybeConfeiteiro.nomeFantasia || maybeConfeiteiro.nomeConfeiteiro)) {
          localStorage.setItem('dadosConfeiteiro', JSON.stringify(u));
        }

        if (u.cnh) localStorage.setItem('userCnh', u.cnh);
        if (u.veiculo) localStorage.setItem('userVeiculo', u.veiculo);
        if (u.placaVeiculo) localStorage.setItem('userPlacaVeiculo', u.placaVeiculo);
        if (u.cnpj) localStorage.setItem('userCnpj', u.cnpj);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('localStorageUpdate'));
        }
      }
    } catch (e) {
      console.warn('Não foi possível salvar dados do usuário no localStorage', e);
    }
  }

  // --- MÉTODOS DE LOGIN ---

  async loginCliente(credenciais) {
    try {
      const response = await ApiService.post(API_ENDPOINTS.AUTH.LOGIN_CLIENTE, credenciais);
      this._salvarDadosUsuario(response, 'cliente');
      const emailParaBuscar = credenciais.email || response.user?.email || response.data?.email || localStorage.getItem('userEmail');
      try { await this.fetchAndSaveProfile(emailParaBuscar, undefined, 'cliente'); } catch (e) { console.warn('Não foi possível buscar perfil após login cliente', e); }
      return response;
    } catch (error) {
      console.error("Erro detalhado no login:", error.response?.data);
      throw error;
    }
  }

  async loginConfeiteiro(credentials) {
    try {
      const response = await ApiService.post(API_ENDPOINTS.AUTH.LOGIN_CONFEITEIRO, credentials);
      this._salvarDadosUsuario(response, 'confeiteiro');

      const dadosUsuario = response?.user || response?.data || response || {};
      const emailParaBuscar = credentials.email || dadosUsuario?.email || localStorage.getItem('userEmail');

      try {
        if (emailParaBuscar) {
          await this.fetchAndSaveProfile(emailParaBuscar, undefined, 'confeiteiro');
        } else {
          const dadosLocais = localStorage.getItem('user');
          if (dadosLocais) {
            const perfilFallback = JSON.parse(dadosLocais);
            this._salvarDadosUsuario({ user: perfilFallback }, 'confeiteiro');
          }
        }
      } catch (e) {
        console.warn('Não foi possível buscar perfil após login confeiteiro', e);
      }

      return response;
    } catch (error) {
      console.error('Erro no login do confeiteiro:', error.response?.data);
      throw error;
    }
  }

  async loginAdmin(email, senha) {
    const response = await ApiService.post(API_ENDPOINTS.AUTH.LOGIN_ADMIN, { email, senha });
    this._salvarDadosUsuario(response, 'admin');
    try { await this.fetchAndSaveProfile(email, undefined, 'admin'); } catch (e) { console.warn('Não foi possível buscar perfil após login admin', e); }
    return response;
  }

  async loginEntregador(email, senha) {
    try {
      const response = await ApiService.post(API_ENDPOINTS.AUTH.LOGIN_ENTREGADOR, { email, senha });
      this._salvarDadosUsuario(response, 'entregador');

      const dadosUsuario = response?.user || response?.data || response || {};
      const userId = dadosUsuario?.id || dadosUsuario?.idEntregador || dadosUsuario?.entregadorId || localStorage.getItem('userId');

      if (userId) {
        localStorage.setItem('userId', String(userId));
      }

      try {
        const perfilResposta = await ApiService.get(API_ENDPOINTS.AUTH.ENTREGADOR_PROFILE);
        if (perfilResposta) {
          this._salvarDadosUsuario({ user: perfilResposta, token: response?.token || localStorage.getItem('userToken') }, 'entregador');
        }
      } catch (e) {
        console.warn('Perfil do entregador não disponível na rota /auth/entregador/me, usando dados do login.', e);
      }

      try {
        await this.fetchAndSaveProfile(email, undefined, 'entregador');
      } catch (e) {
        console.warn('Não foi possível buscar perfil após login entregador', e);
      }

      return response;
    } catch (error) {
      console.error('Erro no login do entregador:', error.response?.data || error.message);
      throw error;
    }
  }

  // --- MÉTODOS DE CADASTRO E PERFIL ---

  async fetchAndSaveProfile(email, token, userType = 'confeiteiro') {
    try {
      const emailParaBuscar = email || localStorage.getItem('userEmail') || localStorage.getItem('email');
      const dadosLocais = localStorage.getItem('user');
      const dadosUsuario = dadosLocais ? JSON.parse(dadosLocais) : null;

      if (!emailParaBuscar && !dadosUsuario) {
        throw new Error('Email não fornecido para buscar perfil do usuário.');
      }

      if (userType === 'entregador' || userType === 'admin') {
        console.log(`Perfil de ${userType} carregado através dos dados de autenticação.`);
        return dadosUsuario || { email: emailParaBuscar, tipo: userType };
      }

      if (emailParaBuscar) {
        try {
          const profileData = await ApiService.get(
            `/confeiteiro/profile?email=${encodeURIComponent(emailParaBuscar)}`
          );
          localStorage.setItem('user', JSON.stringify(profileData));
          localStorage.setItem('dadosConfeiteiro', JSON.stringify(profileData));
          this._salvarDadosUsuario(profileData, userType);
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('localStorageUpdate'));
          return profileData;
        } catch (error) {
          console.warn('Endpoint de perfil do confeiteiro indisponível, usando dados locais do login.', error);
          return dadosUsuario || { email: emailParaBuscar, tipo: userType };
        }
      }

      return dadosUsuario || { tipo: userType };

    } catch (error) {
      console.warn('Erro ao buscar perfil do usuário:', error);
      return { email: email || localStorage.getItem('userEmail') || '', tipo: userType };
    }
  }

  async cadastroCliente(dadosCliente) {
    return await ApiService.post(API_ENDPOINTS.AUTH.CADASTRO_CLIENTE, dadosCliente);
  }

  async cadastroConfeiteiro(dadosConfeiteiro) {
    return await ApiService.post(API_ENDPOINTS.AUTH.CADASTRO_CONFEITEIRO, dadosConfeiteiro);
  }

  async cadastroEntregador(dadosEntregador) {
    return await ApiService.post(API_ENDPOINTS.AUTH.CADASTRO_ENTREGADOR, dadosEntregador);
  }

  // --- UTILITÁRIOS ---

  logout() {
    localStorage.clear();
    window.location.href = '/';
  }

  isAuthenticated() {
    return !!localStorage.getItem('userToken');
  }

  getUserType() {
    return localStorage.getItem('userType');
  }

  getUserName() {
    return localStorage.getItem('userName');
  }

  getUserId() {
    const idDoStorage = localStorage.getItem('userId');
    if (idDoStorage && idDoStorage !== 'null' && idDoStorage !== 'undefined') {
      return idDoStorage;
    }

    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return null;

      const parsed = JSON.parse(rawUser);
      const base = parsed?.user || parsed?.data || parsed;
      const id = base?.id || base?.idConfeiteiro || base?.confeiteiroId || base?.loja?.id || base?.confeiteiro?.id || base?.usuario?.id || base?.idUsuario || base?.userId;
      return id ? String(id) : null;
    } catch (error) {
      console.warn('Não foi possível recuperar o ID do usuário do localStorage', error);
      return null;
    }
  }

  getCurrentUser() {
    const type = localStorage.getItem('userType');
    return {
      id: localStorage.getItem('userId'),
      nome: localStorage.getItem('userName'),
      email: localStorage.getItem('userEmail'),
      roles: type ? [type.toUpperCase(), `ROLE_${type.toUpperCase()}`] : []
    };
  }

  async recuperarSenha(email) {
    return await ApiService.post(API_ENDPOINTS.AUTH.RECUPERAR_SENHA, { email });
  }
}

export default new AuthService();