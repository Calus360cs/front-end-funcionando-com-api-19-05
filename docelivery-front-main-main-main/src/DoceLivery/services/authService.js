import ApiService from './api';

// Interceptor para injetar o token JWT automaticamente em todas as requisições
ApiService.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

class AuthService {
  /**
   * Salva os dados do usuário e o token no localStorage após o login.
   * @param {Object} response - Resposta vinda da API
   * @param {string} tipoDefault - Tipo de usuário caso não venha no objeto (cliente, confeiteiro, etc)
   */
  _salvarDadosUsuario(response, tipoDefault) {
    if (response && response.token && response.user) {
      const u = response.user;
      
      // Token de Autenticação
      localStorage.setItem('userToken', response.token);
      
      // Informações Básicas
      localStorage.setItem('userType', (u.tipo || tipoDefault).toLowerCase());
      localStorage.setItem('userName', u.nome || '');
      localStorage.setItem('userEmail', u.email || '');
      localStorage.setItem('userCpf', u.cpf || '');
      
      // Contato e Nascimento
      localStorage.setItem('userTelefone', u.telefone || u.contato || '');
      localStorage.setItem('userDataNascimento', u.dataNascimento || '');
      
      // Endereço (Garante compatibilidade com diferentes nomes de campos)
      localStorage.setItem('userEndereco', u.endereco || '');
      localStorage.setItem('userCep', u.cep || '');
      localStorage.setItem('userBairro', u.bairro || '');
      localStorage.setItem('userCidade', u.cidade || '');
      localStorage.setItem('userUf', u.uf || u.estado || '');
      
      // Identificador Único (Tenta mapear qualquer variação de ID vinda do Banco)
      const id = u.id || u.idConfeiteiro || u.idCliente || u.idEntregador || u.idUsuario || u.userId;
      if (id) localStorage.setItem('userId', id);

      // Campos específicos para Confeiteiros/Entregadores
      if (u.cnh) localStorage.setItem('userCnh', u.cnh);
      if (u.veiculo) localStorage.setItem('userVeiculo', u.veiculo);
      if (u.placaVeiculo) localStorage.setItem('userPlacaVeiculo', u.placaVeiculo);
      if (u.nomeConfeitaria) localStorage.setItem('nomeLoja', u.nomeConfeitaria);
      if (u.cnpj) localStorage.setItem('userCnpj', u.cnpj);
    }
  }

  // --- MÉTODOS DE LOGIN ---

  async loginCliente(email, senha) {
    try {
      const response = await ApiService.post('/auth/login', { email, senha });
      this._salvarDadosUsuario(response, 'cliente');
      return response;
    } catch (error) {
      console.error("Erro no login:", error.response?.data || error.message);
      throw error; // Repassa o erro para o componente React tratar
    }
  }

  async loginConfeiteiro(email, senha) {
    try {
      const response = await ApiService.post('/auth/login', { email, senha });
      this._salvarDadosUsuario(response, 'confeiteiro');
      return response;
    } catch (error) {
      console.error("Erro no login confeiteiro:", error.response?.data || error.message);
      throw error;
    }
  }

  async loginAdmin(email, senha) {
    const response = await ApiService.post('/auth/login', { email, senha });
    this._salvarDadosUsuario(response, 'admin');
    return response;
  }

  async loginEntregador(email, senha) {
    const response = await ApiService.post('/auth/login', { email, senha });
    this._salvarDadosUsuario(response, 'entregador');
    return response;
  }

  // --- MÉTODOS DE CADASTRO (CORRIGIDOS) ---

  /**
   * Envia os dados para o endpoint de cadastro de clientes.
   * Certifique-se que o Java tem @RequestMapping("/api/auth/cadastro") e @PostMapping("/cliente")
   */
  async cadastroCliente(dadosCliente) {
    // Se o seu ApiService já incluir '/api', use apenas '/auth/cadastro/cliente'
    // Se o seu log de erro mostrou '/api/auth/cadastro/cliente', use o caminho abaixo:
    return await ApiService.post('/auth/cadastro/cliente', dadosCliente);
  }

  async cadastroConfeiteiro(dadosConfeiteiro) {
    return await ApiService.post('/auth/cadastro/confeiteiro', dadosConfeiteiro);
  }

  // --- UTILITÁRIOS ---

  logout() {
    const keys = [
      'userToken', 'userType', 'userName', 'userEmail', 'userCpf',
      'userTelefone', 'userDataNascimento', 'userEndereco', 'userCep',
      'userBairro', 'userCidade', 'userUf', 'userId', 'userCnh',
      'userVeiculo', 'userPlacaVeiculo', 'nomeLoja', 'userCnpj'
    ];
    
    keys.forEach(k => localStorage.removeItem(k));
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

  async recuperarSenha(email) {
    return await ApiService.post('/auth/recuperar-senha', { email });
  }
}

export default new AuthService();