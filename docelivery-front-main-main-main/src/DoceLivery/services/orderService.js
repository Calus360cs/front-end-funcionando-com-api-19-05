import ApiService from './api';
import { API_ENDPOINTS } from './constants';

class OrderService {
  // Criar pedido ou agendamento
  async createOrder(dadosPedido) {
    // dadosPedido deve conter: agendado (bool) e dataEntregaAgendada (ISO string)
    return await ApiService.post(API_ENDPOINTS.ORDERS.CREATE, dadosPedido);
  }

  // Obter pedidos da loja (para o confeiteiro)
  async getStoreOrders(lojaId) {
    return await ApiService.get(API_ENDPOINTS.ORDERS.STORE(lojaId));
  }

  // Atualizar status (Chama o PatchMapping do Java)
  async updateOrderStatus(orderId, status) {
    // Enviamos o status como string pura no corpo
    return await ApiService.patch(API_ENDPOINTS.ORDERS.STATUS(orderId), status, {
      headers: { "Content-Type": "text/plain" }
    });
  }

  async getOrderById(orderId) {
    return await ApiService.get(API_ENDPOINTS.ORDERS.BY_ID(orderId));
  }
}

export default new OrderService();