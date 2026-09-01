import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSupportTicketPayload, getSupportTicketEndpoints } from './supportContact.js';

test('buildSupportTicketPayload inclui contexto do usuário e mensagem', () => {
  const payload = buildSupportTicketPayload({
    userType: 'cliente',
    userId: '42',
    assunto: 'Pedido',
    mensagem: 'Preciso de ajuda com a entrega',
  });

  assert.equal(payload.assunto, 'Pedido');
  assert.equal(payload.mensagem, 'Preciso de ajuda com a entrega');
  assert.equal(payload.tipoUsuario, 'CLIENTE');
  assert.equal(payload.usuarioId, '42');
  assert.equal(payload.origem, 'app');
});

test('getSupportTicketEndpoints fornece rotas de fallback', () => {
  const endpoints = getSupportTicketEndpoints();

  assert.deepEqual(endpoints, ['/support/tickets', '/tickets', '/suporte']);
});
