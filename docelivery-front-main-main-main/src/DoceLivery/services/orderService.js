import ApiService from './api';
import { API_ENDPOINTS } from './constants';

class OrderService {
  async createOrder(dadosPedido) {
    return await ApiService.post(API_ENDPOINTS.ORDERS.CREATE, dadosPedido);
  }

  async getStoreOrders(lojaId) {
    return await ApiService.get(API_ENDPOINTS.ORDERS.STORE(lojaId));
  }

  async getOrderById(orderId) {
    return await ApiService.get(API_ENDPOINTS.ORDERS.BY_ID(orderId));
  }

  async getFilaTrabalho(confeiteiroId) {
    return await ApiService.get(API_ENDPOINTS.ORDERS.FILA(confeiteiroId));
  }

  // 🟢 CORREÇÃO CRÍTICA: Envia o status dentro de um objeto JSON no corpo da requisição
  // O caminho usa apenas '/pedidos/' para não duplicar o '/api' que já vem configurado na instância do Axios
  async atualizarStatus(pedidoId, novoStatus) {
    return await ApiService.patch(`/pedidos/${pedidoId}`, {
      status: novoStatus.toUpperCase().trim()
    });
  }

  async despacharPedido(pedidoId) {
    return await ApiService.put(`/pedidos/${pedidoId}/despachar`);
  }

  async getTodosPedidos(confeiteiroId) {
    return await ApiService.get(API_ENDPOINTS.ORDERS.HISTORICO(confeiteiroId));
  }
}

export default new OrderService();