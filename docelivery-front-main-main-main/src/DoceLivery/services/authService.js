import axios from 'axios';
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
    // Adicione um log para ver exatamente o que o Java devolveu
    console.log("Resposta da API:", response);
    // Aceita tanto respostas de login (com token) quanto objetos de perfil (sem token).
    const resp = response || {};

    // Se houver token na resposta, armazena-o
    if (resp.token) {
      localStorage.setItem('userToken', resp.token);
    }

    // Se o user vier aninhado ou na raiz da resposta
    const u = resp.user || resp.data || resp;

    // Informações Básicas (grava mesmo quando não há token)
    try {
      if (u) {
        // 🟢 Salva o objeto exatamente como veio do banco de dados Java (Requisitado)
        localStorage.setItem('user', JSON.stringify(u));

        if (u.tipo || tipoDefault) localStorage.setItem('userType', ((u.tipo || tipoDefault) + '').toLowerCase());
        const nomeUsuario = u.nome || u.nomeConfeiteiro || u.userName || u.nomeLoja || u.nomeFantasia || '';
        if (nomeUsuario) localStorage.setItem('userName', nomeUsuario);
        if (u.nomeConfeiteiro) localStorage.setItem('nomeConfeiteiro', u.nomeConfeiteiro);

        const lojaDados = u.loja || u;
        const nomeDaLoja = lojaDados?.nomeFantasia || lojaDados?.nomeConfeitaria || lojaDados?.nomeLoja || lojaDados?.nome || lojaDados?.descricao || '';
        if (nomeDaLoja) localStorage.setItem('nomeLoja', nomeDaLoja);
        if (u.nomeLoja) localStorage.setItem('nomeLoja', u.nomeLoja);
        if (u.nomeConfeitaria) localStorage.setItem('nomeLoja', u.nomeConfeitaria);
        if (u.nomeFantasia) localStorage.setItem('nomeLoja', u.nomeFantasia);

        if (u.email) localStorage.setItem('userEmail', u.email);
        if (u.cpf) localStorage.setItem('userCpf', u.cpf);

        // Contato e Nascimento
        if (u.telefone || u.contato) localStorage.setItem('userTelefone', u.telefone || u.contato);
        if (u.dataNascimento) localStorage.setItem('userDataNascimento', u.dataNascimento);

        // Endereço
        if (u.endereco) localStorage.setItem('userEndereco', u.endereco);
        if (u.cep) localStorage.setItem('userCep', u.cep);
        if (u.bairro) localStorage.setItem('userBairro', u.bairro);
        if (u.cidade) localStorage.setItem('userCidade', u.cidade);
        if (u.uf || u.estado) localStorage.setItem('userUf', u.uf || u.estado);

        // Identificador
        const id = u.id || u.idConfeiteiro || u.idCliente || u.idEntregador || u.idUsuario || u.userId;
        if (id) localStorage.setItem('userId', id);

        // armazenar objeto completo do confeiteiro/loja para UI quando fizer sentido
        const maybeConfeiteiro = u.loja || u.confeiteiro || u;
        if (maybeConfeiteiro && (maybeConfeiteiro.nomeLoja || maybeConfeiteiro.nomeConfeitaria || maybeConfeiteiro.loja || maybeConfeiteiro.nomeFantasia || maybeConfeiteiro.nomeConfeiteiro)) {
          localStorage.setItem('dadosConfeiteiro', JSON.stringify(u));
        }

        // Campos específicos
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

  async loginCliente(credenciais) { // credenciais = { email: '...', senha: '...' }
    try {
      const response = await ApiService.post(API_ENDPOINTS.AUTH.LOGIN_CLIENTE, credenciais);
      this._salvarDadosUsuario(response, 'cliente');
      const emailParaBuscar = credenciais.email || response.user?.email || response.data?.email || localStorage.getItem('userEmail');
      try { await this.fetchAndSaveProfile(emailParaBuscar); } catch (e) { console.warn('Não foi possível buscar perfil após login cliente', e); }
      return response;
    } catch (error) {
      console.error("Erro detalhado no login:", error.response?.data);
      throw error; // Repassa o erro para o componente React tratar
    }
  }

  async loginConfeiteiro(credentials) {
    try {
      const response = await axios.post(`http://localhost:8080/api/auth/login`, credentials);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // 🟢 Salva o objeto exatamente como veio do banco de dados Java
        const usuarioGeral = response.data.user || response.data;
        localStorage.setItem('user', JSON.stringify(usuarioGeral));

        this._salvarDadosUsuario(response.data, 'confeiteiro');
        await this.fetchAndSaveProfile(credentials.email, response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error("Não foi possível buscar perfil após login confeiteiro", error);
      throw error;
    }
  }

  async loginAdmin(email, senha) {
    const response = await ApiService.post(API_ENDPOINTS.AUTH.LOGIN_ADMIN, { email, senha });
    this._salvarDadosUsuario(response, 'admin');
    try { await this.fetchAndSaveProfile(email); } catch (e) { console.warn('Não foi possível buscar perfil após login admin', e); }
    return response;
  }

  async loginEntregador(email, senha) {
    const response = await ApiService.post(API_ENDPOINTS.AUTH.LOGIN_ENTREGADOR, { email, senha });
    this._salvarDadosUsuario(response, 'entregador');
    try { await this.fetchAndSaveProfile(email); } catch (e) { console.warn('Não foi possível buscar perfil após login entregador', e); }
    return response;
  }

  // --- MÉTODOS DE CADASTRO (CORRIGIDOS) ---

  async fetchAndSaveProfile(email, token) {
    try {
      const emailParaBuscar = email || localStorage.getItem('userEmail') || localStorage.getItem('email');
      if (!emailParaBuscar) {
        throw new Error('Email não fornecido para buscar perfil do usuário.');
      }

      const authToken = token || localStorage.getItem('userToken') || localStorage.getItem('token');
      const resposta = await axios.get(
        `http://localhost:8080/api/confeiteiro/profile?email=${encodeURIComponent(emailParaBuscar)}`,
        {
          headers: authToken
            ? { Authorization: `Bearer ${authToken}` }
            : undefined
        }
      );

      let profileData = resposta.data;
      // Se o backend não retornou dados da loja (nome fantasia), tentar buscar detalhes completos
      try {
        const hasLoja = profileData && (profileData.loja || profileData.nomeLoja || profileData.nomeFantasia || profileData.nomeConfeitaria);
        if (!hasLoja && profileData && profileData.id) {
          try {
            const detalhes = await ConfeiteiroService.getConfeiteiro(profileData.id);
            // detalhes pode vir aninhado em .data
            const detalhesData = detalhes.data || detalhes;
            // mesclar campos mais relevantes
            profileData = { ...profileData, ...detalhesData };
          } catch (err) {
            console.warn('Não foi possível buscar detalhes do confeiteiro:', err);
          }
        }
      } catch (e) {
        console.warn('Erro ao verificar/mesclar dados de loja:', e);
      }

      // 🟢 CORREÇÃO: Mapeia o JSON para a estrutura que o seu Header e Tabelas esperam
      const usuarioFormatado = {
        id: profileData.id,
        nome: profileData.nome,
        email: profileData.email,
        telefone: profileData.telefone,
        // Facilita o acesso direto no Dashboard
        nomeLoja: profileData.loja?.nomeFantasia || profileData.nomeLoja || "Minha Confeitaria",
        fotoLoja: profileData.loja?.imagem || profileData.loja?.imagemUrl || null,
        // Garantimos que o objeto 'loja' fique no lugar certo para o Front ler
        loja: profileData.loja ? {
          id: profileData.loja.id,
          nomeFantasia: profileData.loja.nomeFantasia,
          descricao: profileData.loja.descricao,
          cnpj: profileData.loja.cnpj,
          telefone: profileData.loja.telefone,
          endereco: profileData.loja.endereco
        } : null
      };

      // 🟢 Salva o objeto bruto vindo do profileData para garantir compatibilidade total com o Java
      localStorage.setItem('user', JSON.stringify(profileData));
      
      localStorage.setItem('dadosConfeiteiro', JSON.stringify(profileData));
      this._salvarDadosUsuario(profileData, 'confeiteiro');

      if (typeof window !== 'undefined') window.dispatchEvent(new Event('localStorageUpdate'));
      return profileData;

    } catch (error) {
      console.warn('Erro ao buscar perfil do usuário:', error);
      throw error;
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
    return localStorage.getItem('userId');
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