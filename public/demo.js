// Modo demonstração: abre em /?demo e funciona só no navegador, com dados fictícios.
// Nada aqui chega ao servidor nem ao banco real. As mudanças ficam salvas neste
// navegador até clicar em "Restaurar exemplos".

const DEMO_CHAVE = 'rundesk_demo_v1';

// Datas relativas a hoje, para a demo nunca ficar velha.
function demoDia(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('sv-SE');
}
const demoMomento = (dias) => demoDia(dias) + ' 12:00:00';

function demoExemplos() {
  const produtos = [
    { id: 1, nome: 'Agenda Cheia', descricao: 'Confirmação automática de consultas no WhatsApp, lista de espera e painel de faltas.', ativo: 1 },
    { id: 2, nome: 'Estoque Fácil', descricao: 'Controle de estoque e pedidos para lojas e oficinas, sem planilha.', ativo: 1 },
    { id: 3, nome: 'Sistema sob medida', descricao: 'Projeto feito para o processo de cada empresa, com manutenção mensal.', ativo: 1 },
    { id: 4, nome: 'Cardápio Digital', descricao: 'Pedidos por QR Code para restaurantes. Pausado por enquanto.', ativo: 0 },
  ];
  const planos = [
    { id: 1, produto_id: 1, nome: 'Fundador', valor_centavos: 39700, periodicidade: 'mensal', ativo: 1 },
    { id: 2, produto_id: 1, nome: 'Essencial', valor_centavos: 49700, periodicidade: 'mensal', ativo: 1 },
    { id: 3, produto_id: 1, nome: 'Clínica Plus', valor_centavos: 79700, periodicidade: 'mensal', ativo: 1 },
    { id: 4, produto_id: 1, nome: 'Essencial anual', valor_centavos: 497000, periodicidade: 'anual', ativo: 1 },
    { id: 5, produto_id: 2, nome: 'Loja', valor_centavos: 29900, periodicidade: 'mensal', ativo: 1 },
    { id: 6, produto_id: 2, nome: 'Loja + Pedidos', valor_centavos: 44900, periodicidade: 'mensal', ativo: 1 },
    { id: 7, produto_id: 3, nome: 'Projeto', valor_centavos: 850000, periodicidade: 'unico', ativo: 1 },
    { id: 8, produto_id: 3, nome: 'Manutenção', valor_centavos: 65000, periodicidade: 'mensal', ativo: 1 },
    { id: 9, produto_id: 4, nome: 'Básico', valor_centavos: 14900, periodicidade: 'mensal', ativo: 0 },
  ];
  const clientes = [
    { id: 1, nome: 'Dra. Camila Rocha', empresa: 'Sorriso Prime Odontologia', contato: '(11) 98765-4321', documento: '12.345.678/0001-90', notas: 'Primeira cliente. Indicou duas colegas.' },
    { id: 2, nome: 'Dr. Rafael Menezes', empresa: 'OdontoVida Moema', contato: 'rafael@odontovida.com.br', documento: '23.456.789/0001-01', notas: '' },
    { id: 3, nome: 'Juliana Prado', empresa: 'Studio Bella Estética', contato: '(11) 97654-3210', documento: '34.567.890/0001-12', notas: 'Usa para confirmar sessões de estética.' },
    { id: 4, nome: 'Marcos Albuquerque', empresa: 'Auto Peças Albuquerque', contato: '(19) 99876-5432', documento: '45.678.901/0001-23', notas: 'Saiu de uma planilha com 4 mil itens.' },
    { id: 5, nome: 'Dra. Fernanda Lima', empresa: 'Clínica Lima Ortodontia', contato: '(11) 96543-2109', documento: '56.789.012/0001-34', notas: 'Em teste por 30 dias.' },
    { id: 6, nome: 'Paulo Henrique Souza', empresa: 'Distribuidora Souza', contato: 'paulo@distsouza.com.br', documento: '67.890.123/0001-45', notas: 'Sistema de pedidos e rotas de entrega.' },
    { id: 7, nome: 'Dr. André Tavares', empresa: 'Tavares Odonto', contato: '(11) 95432-1098', documento: '78.901.234/0001-56', notas: 'Cancelou: fechou a segunda unidade.' },
    { id: 8, nome: 'Beatriz Nogueira', empresa: 'Pet Shop Amigo Fiel', contato: '(11) 94321-0987', documento: '89.012.345/0001-67', notas: '' },
  ];
  const assinaturas = [
    { id: 1, cliente_id: 1, plano_id: 1, valor_centavos: 39700, status: 'ativa', inicio: demoDia(-150), fim: null, notas: 'Preço de fundador travado por 12 meses.' },
    { id: 2, cliente_id: 2, plano_id: 2, valor_centavos: 49700, status: 'ativa', inicio: demoDia(-95), fim: null, notas: '' },
    { id: 3, cliente_id: 3, plano_id: 4, valor_centavos: 497000, status: 'ativa', inicio: demoDia(-60), fim: null, notas: 'Pagou o ano à vista.' },
    { id: 4, cliente_id: 4, plano_id: 6, valor_centavos: 44900, status: 'ativa', inicio: demoDia(-40), fim: null, notas: '' },
    { id: 5, cliente_id: 5, plano_id: 3, valor_centavos: 79700, status: 'teste', inicio: demoDia(-12), fim: null, notas: 'Teste termina em 18 dias.' },
    { id: 6, cliente_id: 6, plano_id: 7, valor_centavos: 850000, status: 'ativa', inicio: demoDia(-70), fim: null, notas: 'Projeto entregue em 6 semanas.' },
    { id: 7, cliente_id: 6, plano_id: 8, valor_centavos: 65000, status: 'ativa', inicio: demoDia(-20), fim: null, notas: '' },
    { id: 8, cliente_id: 7, plano_id: 2, valor_centavos: 49700, status: 'cancelada', inicio: demoDia(-180), fim: demoDia(-30), notas: '' },
    { id: 9, cliente_id: 8, plano_id: 5, valor_centavos: 29900, status: 'ativa', inicio: demoDia(-3), fim: null, notas: '' },
    { id: 10, cliente_id: 1, plano_id: 5, valor_centavos: 24900, status: 'teste', inicio: demoDia(-5), fim: null, notas: 'Quer controlar o estoque de materiais da clínica.' },
  ];
  const lead = (id, nome, empresa, segmento, contato, origem, status, produto_id, proxima_acao, dias, notas, criado) => ({
    id, nome, empresa, segmento, contato, origem, status, produto_id, proxima_acao,
    proxima_data: dias == null ? null : demoDia(dias), notas,
    criado_em: demoMomento(criado), atualizado_em: demoMomento(Math.min(0, criado + 3)),
  });
  const leads = [
    lead(1, 'Dra. Patrícia Alves', 'Clínica Sorrir Mais', 'Odontologia', '(11) 99123-4567', 'Google Maps', 'novo', 1, 'Primeira mensagem no WhatsApp', 0, '', -2),
    lead(2, 'Ricardo Gomes', 'Ótica Visão Clara', 'Varejo', '(11) 98234-5678', 'Porta a porta', 'novo', 2, 'Passar na loja com o folder', 3, '', -1),
    lead(3, 'Dr. Lucas Ferreira', 'Ferreira Implantes', 'Odontologia', '(11) 97345-6789', 'Instagram', 'novo', 1, null, null, 'Curtiu dois posts.', -4),
    lead(4, 'Amanda Ribeiro', 'Espaço Zen Massoterapia', 'Estética', '(11) 96456-7890', 'Indicação', 'abordado', 1, 'Cobrar resposta', -2, 'Indicação da Juliana (Studio Bella).', -9),
    lead(5, 'Carlos Eduardo Pinto', 'Mecânica Pinto & Filhos', 'Serviços', '(19) 95567-8901', 'Círculo pessoal', 'abordado', 2, 'Ligar depois do almoço', 1, '', -6),
    lead(6, 'Dra. Renata Costa', 'Costa Dermatologia', 'Saúde', 'renata@costaderma.com.br', 'Google Maps', 'conversa', 1, 'Mandar vídeo de demonstração', 0, 'Perde uns 8 pacientes por semana com falta.', -14),
    lead(7, 'Thiago Martins', 'Academia Força Total', 'Serviços', '(11) 94678-9012', 'Instagram', 'conversa', 3, 'Levantar como controlam as matrículas', 4, 'Hoje tudo em planilha do Google.', -11),
    lead(8, 'Dr. Gustavo Nunes', 'Nunes Odontologia Integrada', 'Odontologia', '(11) 93789-0123', 'Indicação', 'demo', 1, 'Demo marcada às 14h', 2, 'Três dentistas, uma recepcionista.', -20),
    lead(9, 'Larissa Monteiro', 'Boutique Monteiro', 'Varejo', '(11) 92890-1234', 'Porta a porta', 'demo', 2, 'Enviar proposta depois da demo', -1, '', -18),
    lead(10, 'Dra. Mariana Duarte', 'Duarte Odontopediatria', 'Odontologia', '(11) 91901-2345', 'Google Maps', 'piloto', 1, 'Reunião de fim de piloto', 5, 'Piloto de 30 dias, sem custo.', -32),
    lead(11, 'Eduardo Barros', 'Barros Materiais de Construção', 'Varejo', '(19) 99012-3456', 'Círculo pessoal', 'piloto', 3, 'Validar tela de orçamento', -3, 'Quer sistema sob medida para orçamentos.', -28),
    lead(12, 'Dra. Camila Rocha', 'Sorriso Prime Odontologia', 'Odontologia', '(11) 98765-4321', 'Círculo pessoal', 'ganho', 1, null, null, 'Virou cliente.', -160),
    lead(13, 'Marcos Albuquerque', 'Auto Peças Albuquerque', 'Varejo', '(19) 99876-5432', 'Indicação', 'ganho', 2, null, null, 'Virou cliente.', -50),
    lead(14, 'Paulo Henrique Souza', 'Distribuidora Souza', 'Serviços', 'paulo@distsouza.com.br', 'Indicação', 'ganho', 3, null, null, 'Virou cliente.', -90),
    lead(15, 'Dr. Felipe Andrade', 'Andrade Odonto', 'Odontologia', '(11) 98111-2222', 'Google Maps', 'perdido', 1, null, null, 'Fechou com o Clinicorp.', -45),
    lead(16, 'Sônia Batista', 'Salão Batista Hair', 'Estética', '(11) 97222-3333', 'Instagram', 'perdido', 1, null, null, 'Achou caro neste momento. Voltar a falar em 6 meses.', -38),
  ];
  return { produtos, planos, leads, clientes, assinaturas };
}

let demoBanco = null;

function demoCarregar() {
  if (demoBanco) return demoBanco;
  try { demoBanco = JSON.parse(localStorage.getItem(DEMO_CHAVE)); } catch { demoBanco = null; }
  if (!demoBanco) demoRestaurar();
  return demoBanco;
}

function demoSalvar() {
  try { localStorage.setItem(DEMO_CHAVE, JSON.stringify(demoBanco)); } catch { /* sem armazenamento: fica só na memória */ }
}

function demoRestaurar() {
  demoBanco = demoExemplos();
  demoSalvar();
}

// Mesmas regras de ordenação e campos extras das listagens do servidor (src/index.js).
function demoListar(tabela) {
  const b = demoCarregar();
  const porId = (lista) => Object.fromEntries(lista.map((i) => [i.id, i]));
  const produtos = porId(b.produtos), planos = porId(b.planos), clientes = porId(b.clientes);
  const texto = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR');
  switch (tabela) {
    case 'produtos':
      return [...b.produtos].sort((x, y) => y.ativo - x.ativo || texto(x.nome, y.nome));
    case 'planos':
      return b.planos.map((p) => ({ ...p, produto_nome: produtos[p.produto_id]?.nome }))
        .sort((x, y) => texto(x.produto_nome, y.produto_nome) || x.valor_centavos - y.valor_centavos);
    case 'leads':
      return b.leads.map((l) => ({ ...l, produto_nome: produtos[l.produto_id]?.nome ?? null }))
        .sort((x, y) => (x.proxima_data == null) - (y.proxima_data == null) || texto(x.proxima_data, y.proxima_data) || texto(y.atualizado_em, x.atualizado_em));
    case 'clientes':
      return b.clientes.map((c) => ({ ...c, assinaturas_ativas: b.assinaturas.filter((a) => a.cliente_id === c.id && a.status === 'ativa').length }))
        .sort((x, y) => texto(x.nome, y.nome));
    case 'assinaturas': {
      const ordem = { ativa: 0, teste: 1, cancelada: 2 };
      return b.assinaturas.map((a) => {
        const plano = planos[a.plano_id];
        return { ...a, cliente_nome: clientes[a.cliente_id]?.nome, plano_nome: plano?.nome, periodicidade: plano?.periodicidade, produto_nome: produtos[plano?.produto_id]?.nome };
      }).sort((x, y) => ordem[x.status] - ordem[y.status] || texto(y.inicio, x.inicio));
    }
  }
}

function demoPainel() {
  const b = demoCarregar();
  const hojeIso = demoDia(0);
  const limite = demoDia(7);
  const inicioMes = hojeIso.slice(0, 8) + '01';
  const planos = Object.fromEntries(b.planos.map((p) => [p.id, p]));
  let mrr = 0;
  for (const a of b.assinaturas) {
    if (a.status !== 'ativa') continue;
    const per = planos[a.plano_id]?.periodicidade;
    mrr += per === 'mensal' ? a.valor_centavos : per === 'anual' ? a.valor_centavos / 12 : 0;
  }
  const funil = {};
  b.leads.forEach((l) => { funil[l.status] = (funil[l.status] || 0) + 1; });
  return {
    hoje: hojeIso,
    mrr_centavos: Math.round(mrr),
    em_teste: b.assinaturas.filter((a) => a.status === 'teste').length,
    clientes_ativos: new Set(b.assinaturas.filter((a) => a.status === 'ativa').map((a) => a.cliente_id)).size,
    novos_no_mes: b.assinaturas.filter((a) => a.status === 'ativa' && a.inicio >= inicioMes).length,
    funil,
    proximas_acoes: b.leads
      .filter((l) => l.proxima_data && l.proxima_data <= limite && !['ganho', 'perdido'].includes(l.status))
      .sort((x, y) => x.proxima_data.localeCompare(y.proxima_data)).slice(0, 20)
      .map(({ id, nome, empresa, status, proxima_acao, proxima_data }) => ({ id, nome, empresa, status, proxima_acao, proxima_data })),
  };
}

// Quem aponta para cada tabela (o banco real recusa excluir um registro em uso).
const DEMO_LIGACOES = {
  produtos: [['planos', 'produto_id'], ['leads', 'produto_id']],
  planos: [['assinaturas', 'plano_id']],
  clientes: [['assinaturas', 'cliente_id']],
};

// Responde como a API do servidor, mas usando os dados do navegador.
async function apiDemo(caminho, metodo = 'GET', corpo) {
  if (caminho === 'login' || caminho === 'logout') return { ok: true };
  if (caminho === 'painel') return demoPainel();
  const b = demoCarregar();
  const [tabela, idTexto] = caminho.split('/');
  const lista = b[tabela];
  if (!lista) throw new Error('Rota não encontrada');
  const id = idTexto ? Number(idTexto) : null;
  const agora = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const limpo = (obj) => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k, v === '' || v === undefined ? null : v]));

  if (metodo === 'GET') return demoListar(tabela);
  if (metodo === 'POST') {
    const novoId = Math.max(0, ...lista.map((i) => i.id)) + 1;
    const extra = tabela === 'leads' ? { criado_em: agora, atualizado_em: agora } : {};
    lista.push({ ...limpo(corpo), ...extra, id: novoId });
    demoSalvar();
    return { id: novoId };
  }
  const item = lista.find((i) => i.id === id);
  if (!item) throw new Error('Registro não encontrado');
  if (metodo === 'PUT') {
    Object.assign(item, limpo(corpo), tabela === 'leads' ? { atualizado_em: agora } : {});
    demoSalvar();
    return { id };
  }
  if (metodo === 'DELETE') {
    const emUso = (DEMO_LIGACOES[tabela] || []).some(([outra, campo]) => b[outra].some((i) => i[campo] === id));
    if (emUso) throw new Error('Registro em uso');
    b[tabela] = lista.filter((i) => i.id !== id);
    demoSalvar();
    return { id };
  }
  throw new Error('Método não permitido');
}
