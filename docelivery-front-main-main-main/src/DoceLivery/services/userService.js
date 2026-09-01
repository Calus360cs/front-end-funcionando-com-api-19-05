import ApiService from './api';

class UserService {
  // Obter perfil do usuário
  async getUserProfile() {
    return await ApiService.get('/user/profile');
  }

  // Atualizar perfil do usuário
  async updateUserProfile(dadosUsuario) {
    return await ApiService.put('/user/profile', dadosUsuario);
  }

  // Obter endereços do cliente
  async getUserAddresses() {
    return await ApiService.get('/user/addresses');
  }

  // Adicionar endereço
  async addAddress(endereco) {
    return await ApiService.post('/user/addresses', endereco);
  }

  // Atualizar endereço
  async updateAddress(addressId, endereco) {
    return await ApiService.put(`/user/addresses/${addressId}`, endereco);
  }

  // Remover endereço
  async deleteAddress(addressId) {
    return await ApiService.delete(`/user/addresses/${addressId}`);
  }

  // Obter favoritos
  async getFavorites() {
    return await ApiService.get('/user/favorites');
  }

  // Adicionar aos favoritos
  async addToFavorites(itemId, tipo) {
    return await ApiService.post('/user/favorites', { itemId, tipo });
  }

  // Remover dos favoritos
  async removeFromFavorites(itemId, tipo) {
    return await ApiService.delete(`/user/favorites/${itemId}?tipo=${tipo}`);
  }

  // --- MÉTODOS DO PAINEL ADMINISTRATIVO (Alinhados com o AdminController.java) ---

  // 🚀 Busca os clientes reais filtrados no banco
  async getClientes() {
    return await ApiService.get('/cliente');
  }

  // 🚀 Busca os confeiteiros reais filtrados no banco
  async getConfeiteiros() {
    return await ApiService.get('/confeiteiro');
  }

  // Suspender/ativar usuário (admin) 
  // Nota: Caso queira usar essa rota no futuro, lembre-se de mapear o @PutMapping correspondente no backend
  async toggleUserStatus(userId, status) {
    return await ApiService.put(`/admin/users/${userId}/status`, { status });
  }
}

export default new UserService();