import ApiService from './api';
import AuthService from './authService';

class ProductService {
  // Obter produtos da loja
  async getStoreProducts(storeId) {
    return await ApiService.get(`/products/store/${storeId}`);
  }

  // Obter produto por ID
  async getProductById(productId) {
    return await ApiService.get(`/products/${productId}`);
  }

  // Criar produto (confeiteiro)
  async createProduct(dadosProduto, idConfeiteiro = null) {
    // Se não passar um ID, tenta pegar o do usuário logado no momento
    const id = idConfeiteiro || AuthService.getUserId();
    
    if (!id) {
      throw new Error("Sessão expirada ou usuário não identificado.");
    }

    // O ApiService já inclui o prefixo /api configurado no baseURL
    // O endpoint final será http://localhost:8080/api/products?confeiteiroId=...
    return await ApiService.post(`/products?confeiteiroId=${id}`, dadosProduto);
  }

  // Atualizar produto (confeiteiro)
  async updateProduct(productId, dadosProduto) {
    return await ApiService.put(`/products/${productId}`, dadosProduto);
  }

  // Deletar produto (confeiteiro)
  async deleteProduct(productId) {
    return await ApiService.delete(`/products/${productId}`);
  }

  // Obter ofertas
  async getOffers() {
    return await ApiService.get('/products/offers');
  }

  // Obter categorias
  async getCategories() {
    return await ApiService.get('/products/categories');
  }

  // Buscar produtos
  async searchProducts(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters }).toString();
    return await ApiService.get(`/products/search?${params}`);
  }

  // Upload de imagem do produto
  async uploadProductImage(productId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return await ApiService.request(`/products/${productId}/image`, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type para FormData
    });
  }
}

export default new ProductService();