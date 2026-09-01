import ApiService from './api';
import { API_ENDPOINTS } from './constants';

class EntregadorService {
  async _requestWithFallbacks(urls, method = 'get', data = null) {
    const attempts = Array.isArray(urls) ? urls : [urls];

    for (const url of attempts) {
      try {
        if (method === 'get') return await ApiService.get(url);
        if (method === 'post') return await ApiService.post(url, data);
        if (method === 'put') return await ApiService.put(url, data);
        if (method === 'patch') return await ApiService.patch(url, data);
        if (method === 'delete') return await ApiService.delete(url);
      } catch (error) {
        const status = error?.response?.status;
        if (status && status !== 404 && status !== 400) {
          throw error;
        }
      }
    }

    throw new Error('Nenhuma rota do entregador respondeu com sucesso');
  }

  // Obter todos os entregadores
  async getEntregadores() {
    return await this._requestWithFallbacks(['/entregadores', '/entregador', '/api/entregadores']);
  }

  // Obter o perfil do entregador autenticado ou pelo ID
  async getEntregador(id) {
    return await this._requestWithFallbacks([
      '/auth/entregador/me',
      `/entregadores/${id}`,
      `/entregador/${id}`,
      `/entregadores/id/${id}`,
      `/entregador/perfil/${id}`
    ]);
  }

  // Criar um novo entregador
  async createEntregador(dadosEntregador) {
    return await this._requestWithFallbacks(['/entregadores', '/entregador'], 'post', dadosEntregador);
  }

  // Atualizar um entregador existente
  async updateEntregador(id, dadosEntregador) {
    return await this._requestWithFallbacks([
      '/auth/entregador/me',
      `/entregadores/${id}`,
      `/entregador/${id}`,
      `/entregador/perfil/${id}`
    ], 'put', dadosEntregador);
  }

  // Deletar um entregador
  async deleteEntregador(id) {
    return await this._requestWithFallbacks([`/entregadores/${id}`, `/entregador/${id}`], 'delete');
  }

  // Obter entregas atribuídas a um entregador
  async getEntregasAtribuidas(id) {
    return await this._requestWithFallbacks([
      `/entregadores/${id}/entregas`,
      `/entregador/${id}/entregas`,
      `/pedidos/entregador/${id}`,
      `/pedidos/entregador/${id}/historico`
    ]);
  }

  // Obter dados resumidos do dashboard do entregador
  async getDashboardData(id) {
    return await this._requestWithFallbacks([
      `/entregadores/${id}/dashboard`,
      `/entregador/${id}/dashboard`,
      `/entregador/${id}/resumo`,
      `/entregador/me`
    ]);
  }

  // Obter resumo financeiro do entregador
  async getResumoFinanceiro(id, periodo = 'hoje') {
    return await this._requestWithFallbacks([
      `/entregadores/${id}/ganhos?periodo=${periodo}`,
      `/entregador/${id}/ganhos?periodo=${periodo}`,
      `/entregador/${id}/financeiro?periodo=${periodo}`,
      `/entregador/me`
    ]);
  }

  // Atualizar status do entregador
  async updateStatus(id, status) {
    return await this._requestWithFallbacks([
      `/entregadores/${id}/status`,
      `/entregador/${id}/status`,
      `/entregador/${id}/online`
    ], 'patch', { status });
  }

  // Buscar dados de suporte do entregador
  async getSuporteData(id) {
    return await this._requestWithFallbacks([
      `/entregadores/${id}/suporte`,
      `/entregador/${id}/suporte`,
      `/suporte/entregador/${id}`,
      `/suporte/entregador`,
      `/tickets/entregador/${id}`,
      `/tickets/entregador`
    ]);
  }

  // Criar chamado de suporte para o entregador
  async createSupportTicket(id, dadosTicket) {
    return await this._requestWithFallbacks([
      `/entregadores/${id}/suporte`,
      `/entregador/${id}/suporte`,
      `/suporte/entregador/${id}`,
      `/tickets/entregador`
    ], 'post', {
      entregadorId: id,
      mensagem: dadosTicket?.mensagem || '',
      tipo: dadosTicket?.tipo || 'ENTREGADOR'
    });
  }
}

export default new EntregadorService();