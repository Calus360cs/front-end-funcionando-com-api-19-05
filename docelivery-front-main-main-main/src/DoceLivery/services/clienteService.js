import ApiService from './api';

class ClienteService {
  // Obter todos os clientes
  async getClientes() {
    return await ApiService.get('/clientes');
  }

  // Obter um cliente específico pelo ID
  async getCliente(id) {
    return await ApiService.get(`/clientes/${id}`);
  }

  // Criar um novo cliente
  async createCliente(dadosCliente) {
    return await ApiService.post('/clientes', dadosCliente);
  }

  // Atualizar um cliente existente
  async updateCliente(id, dadosCliente) {
    return await ApiService.put(`/clientes/${id}`, dadosCliente);
  }

  // Deletar um cliente
  async deleteCliente(id) {
    return await ApiService.delete(`/clientes/${id}`);
  }
}

export default new ClienteService();