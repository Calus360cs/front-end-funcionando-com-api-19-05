import ApiService from './api';

class PaymentService {
  async processarPagamento(dadosPagamento) {
    // Aponta para a rota @RequestMapping("/api/pagamentos") -> @PostMapping("/processar") do seu Java
    return await ApiService.post('/api/pagamentos/processar', dadosPagamento);
  }
}

export default new PaymentService();