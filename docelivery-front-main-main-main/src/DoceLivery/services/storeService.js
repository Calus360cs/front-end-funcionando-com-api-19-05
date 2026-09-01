import ApiService from './api';

class StoreService {
  // --- ROTAS DO FLUXO DE CLIENTES / CONFEITEIROS ---

  // Obter todas as lojas (Fluxo público do app)
  async getStores() {
    return await ApiService.get('/stores');
  }

  // Obter loja por ID
  async getStoreById(id) {
    return await ApiService.get(`/stores/${id}`);
  }

  // Obter lojas em destaque
  async getFeaturedStores() {
    return await ApiService.get('/stores/featured');
  }

  // Obter lojas próximas
  async getNearbyStores(lat, lng, radius = 10) {
    return await ApiService.get(`/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Buscar lojas
  async searchStores(query) {
    return await ApiService.get(`/stores/search?q=${encodeURIComponent(query)}`);
  }

  // Obter cardápio da loja
  async getStoreMenu(storeId) {
    return await ApiService.get(`/stores/${storeId}/menu`);
  }

  // Atualizar dados da loja (confeiteiro)
  async updateStore(storeId, dadosLoja) {
    return await ApiService.put(`/stores/${storeId}`, dadosLoja);
  }

  // Atualizar horário de funcionamento
  async updateBusinessHours(storeId, horarios) {
    return await ApiService.put(`/stores/${storeId}/hours`, horarios);
  }

  // Obter avaliações da loja
  async getStoreReviews(storeId) {
    return await ApiService.get(`/stores/${storeId}/reviews`);
  }

  // Adicionar avaliação
  async addReview(storeId, avaliacao) {
    return await ApiService.post(`/stores/${storeId}/reviews`, avaliacao);
  }

  // --- MÉTODOS DO PAINEL ADMINISTRATIVO (Alinhados com o AdminController.java) ---

  // 🚀 Busca todas as lojas do banco de dados especificamente para o painel Admin
  async getAdminStores() {
    return await ApiService.get('/admin/stores');
  }

  // 🚀 Altera o status de uma confeitaria (Ativar/Suspender) diretamente pelo Admin
  async toggleStoreStatus(storeId, status) {
    return await ApiService.patch(`/admin/lojas/${storeId}/status`, { status });
  }
}

export default new StoreService();