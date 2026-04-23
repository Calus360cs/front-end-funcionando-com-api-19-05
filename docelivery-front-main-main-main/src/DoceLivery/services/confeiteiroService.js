import ApiService from './api';
import authService from './authService';

class ConfeiteiroService {
  // Obter todas as confeiteiras
  async getConfeiteiros() {
    return await ApiService.get('/confeiteiras');
  }

  // Obter uma confeiteira específica pelo ID
  async getConfeiteiro(id) {
    return await ApiService.get(`/confeiteiras/${id}`);
  }

  // Criar uma nova confeiteira
  async createConfeiteiro(dadosConfeiteiro) {
    return await ApiService.post('/confeiteiras', dadosConfeiteiro);
  }

  // Atualizar uma confeiteira existente
  async updateConfeiteiro(id, dadosConfeiteiro) {
    return await ApiService.put(`/confeiteiras/${id}`, dadosConfeiteiro);
  }

  // Atualizar perfil do confeiteiro logado
  async atualizarPerfil(dados) {
    let id = authService.getUserId();

    // Fallback: tenta extrair o ID do token JWT
    if (!id) {
      const token = localStorage.getItem('userToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Payload do token JWT:', payload);
          id = payload.id || payload.sub || payload.idConfeiteiro || payload.idUsuario || payload.userId;
          if (id) localStorage.setItem('userId', id);
        } catch (e) {
          console.error('Erro ao decodificar token:', e);
        }
      }
    }

    if (!id) throw new Error('Usuário não autenticado.');

    const payload = {
      nomeLoja: dados.nome,
      telefone: dados.telefone,
      cep: dados.cep,
      endereco: `${dados.logradouro}, ${dados.numero}`,
      bairro: dados.bairro,
      cidade: dados.cidade,
      uf: dados.estado,
      cnpj: dados.cnpj,
    };

    console.log('ID que estou enviando:', id);
    console.log('Dados que estou enviando:', payload);

    const response = await ApiService.put(`/confeiteiro/atualizar/${id}`, payload);

    // Atualiza localStorage com os novos dados
    if (dados.nome) localStorage.setItem('nomeLoja', dados.nome);
    if (dados.telefone) localStorage.setItem('userTelefone', dados.telefone);
    if (dados.email) localStorage.setItem('userEmail', dados.email);
    if (dados.cnpj) localStorage.setItem('userCnpj', dados.cnpj);
    if (dados.cep) localStorage.setItem('userCep', dados.cep);
    if (dados.bairro) localStorage.setItem('userBairro', dados.bairro);
    if (dados.cidade) localStorage.setItem('userCidade', dados.cidade);
    if (dados.estado) localStorage.setItem('userUf', dados.estado);

    return response;
  }

  // Deletar uma confeiteira
  async deleteConfeiteiro(id) {
    return await ApiService.delete(`/confeiteiras/${id}`);
  }

  // Obter pedidos atribuídos a uma confeiteira
  async getPedidosAtribuidos(id) {
    return await ApiService.get(`/confeiteiras/${id}/pedidos`);
  }
}

export default new ConfeiteiroService();