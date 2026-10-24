// Painel do sistema interno da Rundesk (sem framework).

const ETAPAS = [
  ['novo', 'Novo', '#a1a1aa'],
  ['abordado', 'Abordado', '#60a5fa'],
  ['conversa', 'Conversando', '#a78bfa'],
  ['demo', 'Demo', '#fbbf24'],
  ['piloto', 'Piloto', '#fb923c'],
  ['ganho', 'Ganho', '#34d399'],
  ['perdido', 'Perdido', '#f87171'],
];
const ETAPA = Object.fromEntries(ETAPAS.map(([k, nome, cor]) => [k, { nome, cor }]));
const SITUACAO = { teste: ['Em teste', '#fbbf24'], ativa: ['Ativa', '#34d399'], cancelada: ['Cancelada', '#f87171'] };
const PERIODICIDADE = { mensal: 'Mensal', anual: 'Anual', unico: 'Pagamento único' };
const SUFIXO = { mensal: '/mês', anual: '/ano', unico: '' };

const ROTAS = {
  painel: { nome: 'Visão geral', curto: 'Início', icone: 'painel' },
  funil: { nome: 'Funil de vendas', curto: 'Funil', icone: 'funil' },
  clientes: { nome: 'Clientes', curto: 'Clientes', icone: 'clientes' },
  assinaturas: { nome: 'Assinaturas', curto: 'Receita', icone: 'assinaturas' },
  produtos: { nome: 'Produtos e preços', curto: 'Produtos', icone: 'produtos' },
};

const dados = { produtos: [], planos: [], leads: [], clientes: [], assinaturas: [] };
let resumo = null;
let rota = 'painel';
let busca = '';
let filtro = 'todos';
// Em /?demo tudo roda no navegador com dados fictícios (public/demo.js), sem tocar no banco.
const modoDemo = new URLSearchParams(location.search).has('demo');

// ---------- Utilidades ----------

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icone = (nome) => `<svg><use href="#i-${nome}"/></svg>`;
const reais = (centavos, casas = 2) => (Number(centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: casas, maximumFractionDigits: casas });
const hoje = () => new Date().toLocaleDateString('sv-SE');
const dataCurta = (iso) => (iso ? new Date(iso.slice(0, 10) + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '') : '—');
const iniciais = (nome) => String(nome || '?').trim().split(/\s+/).filter((p) => !/^(dr|dra|sr|sra)\.?$/i.test(p)).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const normal = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const combina = (item, campos) => !busca || campos.some((c) => normal(item[c]).includes(normal(busca)));
const mensal = (a) => (a.periodicidade === 'anual' ? a.valor_centavos / 12 : a.periodicidade === 'mensal' ? a.valor_centavos : 0);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const etiqueta = (texto, cor) => `<span class="etiqueta" style="--cor:${cor}">${esc(texto)}</span>`;

function prazo(iso) {
  if (!iso) return '';
  const dias = Math.round((new Date(iso + 'T12:00') - new Date(hoje() + 'T12:00')) / 864e5);
  if (dias < 0) return `<span class="prazo atrasado">${icone('relogio')}${-dias}d atrasado</span>`;
  if (dias === 0) return `<span class="prazo hoje">${icone('relogio')}Hoje</span>`;
  if (dias === 1) return `<span class="prazo">${icone('relogio')}Amanhã</span>`;
  return `<span class="prazo">${icone('relogio')}${dataCurta(iso)}</span>`;
}

function vazio(ico, titulo, texto, botao) {
  return `<div class="vazio">${icone(ico)}<strong>${titulo}</strong><p>${texto}</p>${botao || ''}</div>`;
}

function avisar(texto, erro = false) {
  const el = document.createElement('div');
  el.className = 'aviso' + (erro ? ' erro' : '');
  el.innerHTML = icone(erro ? 'x' : 'check') + esc(texto);
  $('#avisos').append(el);
  setTimeout(() => el.remove(), 2800);
}

async function api(caminho, metodo = 'GET', corpo) {
  if (modoDemo) return apiDemo(caminho, metodo, corpo);
  const r = await fetch('/api/' + caminho, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : {},
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (r.status === 401 && caminho !== 'login') { mostrarLogin(); throw new Error('Sessão expirada'); }
  const json = await r.json();
  if (!r.ok) throw new Error(json.erro || 'Erro');
  return json;
}

async function carregar() {
  const nomes = Object.keys(dados);
  const [listas, p] = await Promise.all([Promise.all(nomes.map((n) => api(n))), api('painel')]);
  nomes.forEach((n, i) => { dados[n] = listas[i]; });
  resumo = p;
  desenhar();
}

// ---------- Navegação ----------

function desenharMenu() {
  const contagem = {
    funil: dados.leads.filter((l) => !['ganho', 'perdido'].includes(l.status)).length,
    clientes: dados.clientes.length,
    assinaturas: dados.assinaturas.filter((a) => a.status !== 'cancelada').length,
    produtos: dados.produtos.length,
  };
  $('#menu').innerHTML = Object.entries(ROTAS).map(([k, r]) =>
    `<button class="menu-item ${k === rota ? 'ativo' : ''}" data-rota="${k}">${icone(r.icone)}${r.nome}${contagem[k] ? `<span class="contador">${contagem[k]}</span>` : ''}</button>`).join('');
  $('#abas-movel').innerHTML = Object.entries(ROTAS).map(([k, r]) =>
    `<button class="${k === rota ? 'ativo' : ''}" data-rota="${k}">${icone(r.icone)}${r.curto}</button>`).join('');
}

function ir(nova) {
  if (!ROTAS[nova]) nova = 'painel';
  if (nova !== rota) { busca = ''; filtro = 'todos'; }
  rota = nova;
  if (location.hash.slice(1) !== nova) history.replaceState(null, '', '#' + nova);
  desenhar();
  window.scrollTo(0, 0);
}

function desenhar() {
  desenharMenu();
  $('#titulo').textContent = ROTAS[rota].nome;
  const telas = { painel: telaPainel, funil: telaFunil, clientes: telaClientes, assinaturas: telaAssinaturas, produtos: telaProdutos };
  telas[rota]();
}

function cabecalho(sobre, acoes) {
  $('#sobretitulo').textContent = sobre;
  $('#acoes').innerHTML = acoes || '';
}

function campoBusca(placeholder) {
  return `<label class="busca">${icone('busca')}<input type="search" id="busca" placeholder="${placeholder}" value="${esc(busca)}"></label>`;
}

function ligarBusca(redesenhar) {
  $('#busca')?.addEventListener('input', (e) => { busca = e.target.value; redesenhar(); });
}

// ---------- Visão geral ----------

function telaPainel() {
  const data = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  cabecalho(data, `<button class="btn" data-novo="leads">${icone('mais')}Lead</button><button class="btn btn-primario" data-novo="assinaturas">${icone('mais')}Venda</button>`);

  const abertos = dados.leads.filter((l) => !['ganho', 'perdido'].includes(l.status));
  const ganhos = dados.leads.filter((l) => l.status === 'ganho').length;
  const perdidos = dados.leads.filter((l) => l.status === 'perdido').length;
  const conversao = ganhos + perdidos ? Math.round((ganhos / (ganhos + perdidos)) * 100) + '%' : '—';
  const pilotos = dados.leads.filter((l) => l.status === 'piloto').length;

  const kpis = `<div class="kpis">
    <div class="bloco kpi destaque"><div class="kpi-topo">Receita mensal (MRR)<span class="kpi-icone">${icone('receita')}</span></div>
      <div class="kpi-valor num">${reais(resumo.mrr_centavos)}</div><div class="kpi-rodape">${reais(resumo.mrr_centavos * 12, 0)} por ano</div></div>
    <div class="bloco kpi"><div class="kpi-topo">Clientes ativos<span class="kpi-icone">${icone('clientes')}</span></div>
      <div class="kpi-valor num">${resumo.clientes_ativos}</div><div class="kpi-rodape">${resumo.em_teste} em teste · ${plural(resumo.novos_no_mes, 'novo', 'novos')} no mês</div></div>
    <div class="bloco kpi"><div class="kpi-topo">Funil em aberto<span class="kpi-icone">${icone('funil')}</span></div>
      <div class="kpi-valor num">${abertos.length}</div><div class="kpi-rodape">${pilotos} em piloto</div></div>
    <div class="bloco kpi"><div class="kpi-topo">Taxa de conversão<span class="kpi-icone">${icone('alvo')}</span></div>
      <div class="kpi-valor num">${conversao}</div><div class="kpi-rodape">${plural(ganhos, 'ganho', 'ganhos')} · ${plural(perdidos, 'perdido', 'perdidos')}</div></div>
  </div>`;

  const passos = [
    [dados.produtos.length > 0, 'Cadastre um produto', 'Ex.: Agenda Cheia', 'produtos'],
    [dados.planos.length > 0, 'Defina os planos e preços', 'Quanto cada um custa', 'planos'],
    [dados.leads.length > 0, 'Adicione seu primeiro lead', 'Quem você vai abordar', 'leads'],
  ];
  const guia = passos.every((p) => p[0]) ? '' : `<div class="bloco passos"><p><strong>Primeiros passos</strong> <span class="apagado">· configure em 2 minutos</span></p>
    ${passos.map(([feito, t, s, tab], i) => `<button class="passo ${feito ? 'feito' : ''}" ${feito ? '' : `data-novo="${tab}"`}>
      <span class="passo-num">${feito ? icone('check') : i + 1}</span><span><b>${t}</b><span>${s}</span></span></button>`).join('')}</div>`;

  const max = Math.max(1, ...ETAPAS.map(([k]) => resumo.funil[k] || 0));
  const funil = `<div class="bloco"><div class="bloco-topo"><h3>Funil por etapa</h3><span class="sutil">${plural(dados.leads.length, 'lead', 'leads')} no total</span></div>
    <div class="etapas">${ETAPAS.map(([k, nome, cor]) => {
      const n = resumo.funil[k] || 0;
      return `<div class="etapa" data-rota="funil" style="--cor:${cor}"><span class="etapa-nome"><span class="bolinha"></span>${nome}</span>
        <div class="etapa-trilho"><div class="etapa-cheio" style="width:${(n / max) * 100}%"></div></div><b class="num">${n}</b></div>`;
    }).join('')}</div></div>`;

  const proximas = `<div class="bloco"><div class="bloco-topo"><h3>Próximas ações</h3><span class="sutil">atrasadas e próximos 7 dias</span></div>
    ${resumo.proximas_acoes.length ? `<ul class="linhas">${resumo.proximas_acoes.map((l) => `<li class="linha" data-abrir="leads" data-id="${l.id}">
      <span class="avatar">${esc(iniciais(l.nome))}</span>
      <div class="linha-corpo"><div class="linha-titulo">${esc(l.proxima_acao || 'Definir próxima ação')}</div><div class="linha-sub">${esc([l.nome, l.empresa].filter(Boolean).join(' · '))}</div></div>
      ${prazo(l.proxima_data)}</li>`).join('')}</ul>`
      : vazio('check', 'Agenda em dia', 'Nada atrasado nem marcado para os próximos 7 dias.')}</div>`;

  const porProduto = {};
  dados.assinaturas.filter((a) => a.status === 'ativa').forEach((a) => { porProduto[a.produto_nome] = (porProduto[a.produto_nome] || 0) + mensal(a); });
  const itens = Object.entries(porProduto).sort((a, b) => b[1] - a[1]);
  const maxR = Math.max(1, ...itens.map((i) => i[1]));
  const receita = `<div class="bloco" style="grid-column:1/-1"><div class="bloco-topo"><h3>Receita mensal por produto</h3><button class="btn" data-rota="assinaturas">Ver assinaturas ${icone('seta')}</button></div>
    ${itens.length ? `<div class="etapas">${itens.map(([nome, v]) => `<div class="etapa" style="--cor:var(--acento);grid-template-columns:160px 1fr 120px"><span class="etapa-nome">${esc(nome)}</span>
      <div class="etapa-trilho"><div class="etapa-cheio" style="width:${(v / maxR) * 100}%"></div></div><b class="num">${reais(v)}</b></div>`).join('')}</div>`
      : vazio('receita', 'Nenhuma receita ainda', 'Quando você registrar a primeira venda, a receita de cada produto aparece aqui.')}</div>`;

  $('#tela').innerHTML = `<div class="carregando">${guia}${kpis}<div class="grade-painel">${funil}${proximas}${receita}</div></div>`;
}

// ---------- Funil (quadro) ----------

function telaFunil() {
  cabecalho(plural(dados.leads.filter((l) => !['ganho', 'perdido'].includes(l.status)).length, 'oportunidade em aberto', 'oportunidades em aberto'),
    campoBusca('Buscar lead...') + `<button class="btn btn-primario" data-novo="leads">${icone('mais')}Novo lead</button>`);
  $('#tela').innerHTML = '<div class="quadro" id="quadro"></div>';
  ligarBusca(desenharQuadro);
  desenharQuadro();
}

function desenharQuadro() {
  const leads = dados.leads.filter((l) => combina(l, ['nome', 'empresa', 'segmento', 'contato', 'proxima_acao']));
  $('#quadro').innerHTML = ETAPAS.map(([k, nome, cor]) => {
    const daqui = leads.filter((l) => l.status === k);
    return `<section class="coluna" data-etapa="${k}" style="--cor:${cor}">
      <header class="coluna-topo"><span class="bolinha"></span><h3>${nome}</h3><span class="contador">${daqui.length}</span>
        <button class="btn-icone" data-novo="leads" data-etapa-nova="${k}" aria-label="Novo lead em ${nome}">${icone('mais')}</button></header>
      <div class="coluna-cartoes">${daqui.length ? daqui.map(cartaoLead).join('') : '<div class="coluna-vazia">Arraste um lead para cá</div>'}</div>
    </section>`;
  }).join('');
}

function cartaoLead(l) {
  const tags = [l.segmento, l.produto_nome].filter(Boolean).map((t) => etiqueta(t, '#a1a1aa')).join('');
  return `<article class="cartao-lead" draggable="true" data-abrir="leads" data-id="${l.id}">
    <div class="nome">${esc(l.nome)}</div>${l.empresa ? `<div class="empresa">${esc(l.empresa)}</div>` : ''}
    ${tags ? `<div class="tags">${tags}</div>` : ''}
    ${l.proxima_acao || l.proxima_data ? `<div class="acao"><span>${esc(l.proxima_acao || 'Sem ação definida')}</span>${prazo(l.proxima_data)}</div>` : ''}
  </article>`;
}

let arrastado = null;
document.addEventListener('dragstart', (e) => {
  const c = e.target.closest?.('.cartao-lead');
  if (!c) return;
  arrastado = Number(c.dataset.id);
  c.classList.add('arrastando');
  e.dataTransfer.effectAllowed = 'move';
});
document.addEventListener('dragend', (e) => { e.target.classList?.remove('arrastando'); $$('.coluna.alvo').forEach((c) => c.classList.remove('alvo')); });
document.addEventListener('dragover', (e) => {
  const col = e.target.closest?.('.coluna');
  if (!col || arrastado == null) return;
  e.preventDefault();
  $$('.coluna.alvo').forEach((c) => c !== col && c.classList.remove('alvo'));
  col.classList.add('alvo');
});
document.addEventListener('drop', async (e) => {
  const col = e.target.closest?.('.coluna');
  if (!col || arrastado == null) return;
  e.preventDefault();
  const lead = dados.leads.find((l) => l.id === arrastado);
  arrastado = null;
  if (!lead || lead.status === col.dataset.etapa) return desenharQuadro();
  await mudarEtapa(lead, col.dataset.etapa);
});

async function mudarEtapa(lead, etapa) {
  const anterior = lead.status;
  lead.status = etapa;
  if (rota === 'funil') desenharQuadro();
  try {
    await api(`leads/${lead.id}`, 'PUT', { status: etapa });
    avisar(`${lead.nome} → ${ETAPA[etapa].nome}`);
    await carregar();
  } catch (err) {
    lead.status = anterior;
    desenhar();
    avisar(err.message, true);
  }
}

// ---------- Clientes ----------

function telaClientes() {
  cabecalho(`${resumo.clientes_ativos} com assinatura ativa`,
    campoBusca('Buscar cliente...') + `<button class="btn btn-primario" data-novo="clientes">${icone('mais')}Novo cliente</button>`);
  if (!dados.clientes.length) {
    $('#tela').innerHTML = `<div class="bloco">${vazio('clientes', 'Nenhum cliente ainda', 'Cadastre um cliente aqui, ou abra um lead no funil e clique em “Converter em cliente”.', `<button class="btn btn-primario" data-novo="clientes">${icone('mais')}Novo cliente</button>`)}</div>`;
    return;
  }
  $('#tela').innerHTML = `<div class="bloco tabela-wrap"><table>
    <thead><tr><th>Cliente</th><th>Contato</th><th>Produtos</th><th class="direita">Mensalidade</th><th class="direita">Situação</th></tr></thead>
    <tbody id="linhas"></tbody></table></div>`;
  ligarBusca(desenharClientes);
  desenharClientes();
}

function desenharClientes() {
  const lista = dados.clientes.filter((c) => combina(c, ['nome', 'empresa', 'contato', 'documento']));
  $('#linhas').innerHTML = lista.map((c) => {
    const ass = dados.assinaturas.filter((a) => a.cliente_id === c.id && a.status !== 'cancelada');
    const total = ass.filter((a) => a.status === 'ativa').reduce((s, a) => s + mensal(a), 0);
    const situacao = ass.some((a) => a.status === 'ativa') ? etiqueta('Ativo', '#34d399') : ass.length ? etiqueta('Em teste', '#fbbf24') : etiqueta('Sem plano', '#6b6b75');
    return `<tr data-abrir="clientes" data-id="${c.id}">
      <td><div class="celula-nome"><span class="avatar">${esc(iniciais(c.nome))}</span><div><b>${esc(c.nome)}</b><span>${esc(c.empresa || '')}</span></div></div></td>
      <td class="so-pc sutil">${esc(c.contato || '—')}</td>
      <td class="so-pc sutil">${esc([...new Set(ass.map((a) => a.produto_nome))].join(', ') || '—')}</td>
      <td class="direita num so-pc">${total ? reais(total) : '—'}</td>
      <td class="direita">${situacao}</td></tr>`;
  }).join('') || `<tr><td colspan="5">${vazio('busca', 'Nada encontrado', 'Tente outro termo de busca.')}</td></tr>`;
}

// ---------- Assinaturas ----------

function telaAssinaturas() {
  cabecalho(`${reais(resumo.mrr_centavos)} de receita mensal recorrente`, `<button class="btn btn-primario" data-novo="assinaturas">${icone('mais')}Nova venda</button>`);
  if (!dados.assinaturas.length) {
    $('#tela').innerHTML = `<div class="bloco">${vazio('assinaturas', 'Nenhuma venda registrada', 'Cada venda é uma assinatura: um cliente, um plano e o valor cobrado.', `<button class="btn btn-primario" data-novo="assinaturas">${icone('mais')}Registrar venda</button>`)}</div>`;
    return;
  }
  const filtros = [['todos', 'Todas'], ...Object.entries(SITUACAO).map(([k, [n]]) => [k, n])];
  $('#tela').innerHTML = `<div class="filtros">${filtros.map(([k, n]) => {
      const qtd = k === 'todos' ? dados.assinaturas.length : dados.assinaturas.filter((a) => a.status === k).length;
      return `<button class="filtro ${filtro === k ? 'ativo' : ''}" data-filtro="${k}">${n} <span class="num">${qtd}</span></button>`;
    }).join('')}</div>
    <div class="bloco tabela-wrap"><table>
    <thead><tr><th>Cliente</th><th>Produto</th><th>Início</th><th class="direita">Valor</th><th class="direita">Situação</th></tr></thead>
    <tbody>${dados.assinaturas.filter((a) => filtro === 'todos' || a.status === filtro).map((a) => `<tr data-abrir="assinaturas" data-id="${a.id}">
      <td><div class="celula-nome"><span class="avatar">${esc(iniciais(a.cliente_nome))}</span><div><b>${esc(a.cliente_nome)}</b><span>${esc(a.produto_nome)} · ${esc(a.plano_nome)}</span></div></div></td>
      <td class="so-pc sutil">${esc(a.produto_nome)} · ${esc(a.plano_nome)}</td>
      <td class="so-pc sutil num">${dataCurta(a.inicio)}${a.fim ? ' → ' + dataCurta(a.fim) : ''}</td>
      <td class="direita num">${reais(a.valor_centavos)}<span class="apagado">${SUFIXO[a.periodicidade]}</span></td>
      <td class="direita">${etiqueta(...SITUACAO[a.status])}</td></tr>`).join('')}</tbody></table></div>`;
}

// ---------- Produtos ----------

function telaProdutos() {
  cabecalho(`${dados.produtos.filter((p) => p.ativo).length} produtos ativos · ${dados.planos.length} planos`,
    `<button class="btn" data-novo="planos">${icone('mais')}Plano</button><button class="btn btn-primario" data-novo="produtos">${icone('mais')}Novo produto</button>`);
  if (!dados.produtos.length) {
    $('#tela').innerHTML = `<div class="bloco">${vazio('produtos', 'Nenhum produto cadastrado', 'Cadastre o que a Rundesk vende (por exemplo, o Agenda Cheia) e depois os planos e preços de cada um.', `<button class="btn btn-primario" data-novo="produtos">${icone('mais')}Cadastrar produto</button>`)}</div>`;
    return;
  }
  $('#tela').innerHTML = `<div class="grade-produtos">${dados.produtos.map((p) => {
    const planos = dados.planos.filter((pl) => pl.produto_id === p.id);
    const clientes = new Set(dados.assinaturas.filter((a) => a.status === 'ativa' && planos.some((pl) => pl.id === a.plano_id)).map((a) => a.cliente_id)).size;
    return `<div class="bloco">
      <div class="produto-topo" data-abrir="produtos" data-id="${p.id}">
        <span class="produto-icone">${icone('raio')}</span>
        <div style="flex:1;min-width:0"><h3>${esc(p.nome)}</h3><p>${esc(p.descricao || 'Sem descrição')}</p></div>
        ${p.ativo ? etiqueta(`${clientes} cliente${clientes === 1 ? '' : 's'}`, '#34d399') : etiqueta('Inativo', '#6b6b75')}
      </div>
      <div class="planos">${planos.map((pl) => `<div class="plano" data-abrir="planos" data-id="${pl.id}">
          <span class="plano-nome">${esc(pl.nome)}${pl.ativo ? '' : ' <span class="apagado">(inativo)</span>'}</span>
          <span class="apagado" style="font-size:12px">${PERIODICIDADE[pl.periodicidade]}</span>
          <span class="plano-preco num">${reais(pl.valor_centavos)}<small>${SUFIXO[pl.periodicidade]}</small></span></div>`).join('')}
        <button class="btn add-plano" data-novo="planos" data-produto="${p.id}">${icone('mais')}Adicionar plano</button>
      </div></div>`;
  }).join('')}</div>`;
}

// ---------- Gaveta de edição ----------

function camposDe(tabela) {
  const opcoes = (lista, rotulo) => lista.map((i) => [i.id, rotulo(i)]);
  switch (tabela) {
    case 'leads': return [
      { nome: 'nome', rotulo: 'Nome do contato', obrigatorio: true, inteiro: true },
      { nome: 'empresa', rotulo: 'Empresa' },
      { nome: 'segmento', rotulo: 'Segmento', lista: ['Odontologia', 'Estética', 'Saúde', 'Varejo', 'Serviços'] },
      { nome: 'contato', rotulo: 'WhatsApp / e-mail' },
      { nome: 'origem', rotulo: 'Origem', lista: ['Google Maps', 'Instagram', 'Indicação', 'Porta a porta', 'Círculo pessoal'] },
      { nome: 'status', rotulo: 'Etapa do funil', tipo: 'etapa', padrao: 'novo', inteiro: true },
      { nome: 'produto_id', rotulo: 'Produto de interesse', tipo: 'escolha', opcoes: opcoes(dados.produtos, (p) => p.nome), vazio: true, inteiro: true },
      { nome: 'proxima_acao', rotulo: 'Próxima ação', placeholder: 'Ex.: mandar vídeo de demonstração' },
      { nome: 'proxima_data', rotulo: 'Quando', tipo: 'data' },
      { nome: 'notas', rotulo: 'Anotações', tipo: 'area', inteiro: true },
    ];
    case 'clientes': return [
      { nome: 'nome', rotulo: 'Nome', obrigatorio: true, inteiro: true },
      { nome: 'empresa', rotulo: 'Empresa' },
      { nome: 'documento', rotulo: 'CPF / CNPJ' },
      { nome: 'contato', rotulo: 'WhatsApp / e-mail', inteiro: true },
      { nome: 'notas', rotulo: 'Anotações', tipo: 'area', inteiro: true },
    ];
    case 'assinaturas': return [
      { nome: 'cliente_id', rotulo: 'Cliente', tipo: 'escolha', opcoes: opcoes(dados.clientes, (c) => c.nome + (c.empresa ? ` · ${c.empresa}` : '')), obrigatorio: true, inteiro: true },
      { nome: 'plano_id', rotulo: 'Plano', tipo: 'escolha', opcoes: opcoes(dados.planos.filter((p) => p.ativo), (p) => `${p.produto_nome} · ${p.nome} — ${reais(p.valor_centavos)}${SUFIXO[p.periodicidade]}`), obrigatorio: true, inteiro: true },
      { nome: 'valor_centavos', rotulo: 'Valor cobrado (R$)', tipo: 'dinheiro', ajuda: 'Em branco usa o preço do plano' },
      { nome: 'status', rotulo: 'Situação', tipo: 'escolha', opcoes: Object.entries(SITUACAO).map(([k, [n]]) => [k, n]), padrao: 'ativa' },
      { nome: 'inicio', rotulo: 'Início', tipo: 'data', obrigatorio: true, padrao: hoje() },
      { nome: 'fim', rotulo: 'Fim (se cancelou)', tipo: 'data' },
      { nome: 'notas', rotulo: 'Anotações', tipo: 'area', inteiro: true },
    ];
    case 'produtos': return [
      { nome: 'nome', rotulo: 'Nome do produto', obrigatorio: true, inteiro: true },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'area', inteiro: true },
      { nome: 'ativo', rotulo: 'Situação', tipo: 'escolha', opcoes: [['1', 'Ativo'], ['0', 'Inativo']], padrao: '1' },
    ];
    case 'planos': return [
      { nome: 'produto_id', rotulo: 'Produto', tipo: 'escolha', opcoes: opcoes(dados.produtos, (p) => p.nome), obrigatorio: true, inteiro: true },
      { nome: 'nome', rotulo: 'Nome do plano', obrigatorio: true, placeholder: 'Ex.: Fundador' },
      { nome: 'valor_centavos', rotulo: 'Preço (R$)', tipo: 'dinheiro', obrigatorio: true },
      { nome: 'periodicidade', rotulo: 'Cobrança', tipo: 'escolha', opcoes: Object.entries(PERIODICIDADE), padrao: 'mensal' },
      { nome: 'ativo', rotulo: 'Situação', tipo: 'escolha', opcoes: [['1', 'Ativo'], ['0', 'Inativo']], padrao: '1' },
    ];
  }
}

const NOMES = { leads: 'Lead', clientes: 'Cliente', assinaturas: 'Venda', produtos: 'Produto', planos: 'Plano' };
const NOVO = { leads: 'Novo lead', clientes: 'Novo cliente', assinaturas: 'Registrar venda', produtos: 'Novo produto', planos: 'Novo plano' };
const SALVO = { leads: 'Lead cadastrado', clientes: 'Cliente cadastrado', assinaturas: 'Venda registrada', produtos: 'Produto cadastrado', planos: 'Plano cadastrado' };
let edicao = null;

function abrirGaveta(tabela, item = null, padroes = {}) {
  if (tabela === 'planos' && !dados.produtos.length) { avisar('Cadastre um produto primeiro', true); return abrirGaveta('produtos'); }
  if (tabela === 'assinaturas' && !dados.planos.length) { avisar('Crie um plano antes de registrar uma venda', true); return abrirGaveta('planos'); }
  if (tabela === 'assinaturas' && !dados.clientes.length) { avisar('Cadastre o cliente primeiro', true); return abrirGaveta('clientes'); }
  edicao = { tabela, id: item?.id ?? null };
  $('#gaveta-tipo').textContent = NOMES[tabela];
  $('#gaveta-titulo').textContent = item ? (item.nome || item.cliente_nome) : NOVO[tabela];
  $('#excluir').hidden = !item;
  $('#gaveta-extra').innerHTML = tabela === 'leads' && item && item.status !== 'ganho'
    ? `<button type="button" class="btn" id="converter">${icone('check')}Converter em cliente</button>` : '';
  const valores = { ...padroes, ...(item || {}) };
  $('#gaveta-campos').innerHTML = camposDe(tabela).map((c) => {
    let v = valores[c.nome] ?? c.padrao ?? '';
    if (c.tipo === 'dinheiro') v = v === '' || v == null ? '' : (v / 100).toFixed(2);
    const req = c.obrigatorio ? 'required' : '';
    const ph = c.placeholder ? `placeholder="${esc(c.placeholder)}"` : '';
    let campo;
    if (c.tipo === 'area') campo = `<textarea name="${c.nome}" ${req}>${esc(v)}</textarea>`;
    else if (c.tipo === 'etapa') {
      campo = `<input type="hidden" name="status" value="${esc(v)}"><div class="seletor-etapas">${ETAPAS.map(([k, n, cor]) =>
        `<button type="button" data-etapa="${k}" class="${k === v ? 'ativo' : ''}" style="--cor:${cor}"><span class="bolinha"></span>${n}</button>`).join('')}</div>`;
    } else if (c.tipo === 'escolha') {
      const ops = (c.vazio || !c.padrao ? '<option value="">Selecione...</option>' : '') +
        c.opcoes.map(([k, r]) => `<option value="${esc(k)}" ${String(k) === String(v) ? 'selected' : ''}>${esc(r)}</option>`).join('');
      campo = `<select name="${c.nome}" ${req}>${ops}</select>`;
    } else if (c.tipo === 'dinheiro') campo = `<input name="${c.nome}" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0,00" value="${esc(v)}" ${req}>`;
    else if (c.tipo === 'data') campo = `<input name="${c.nome}" type="date" value="${esc(v)}" ${req}>`;
    else campo = `<input name="${c.nome}" value="${esc(v)}" ${ph} ${req} ${c.lista ? `list="lista-${c.nome}"` : ''}>${c.lista ? `<datalist id="lista-${c.nome}">${c.lista.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}`;
    return `<label class="campo ${c.inteiro ? 'inteiro' : ''}"><span>${esc(c.rotulo)}${c.obrigatorio ? ' *' : ''}</span>${campo}${c.ajuda ? `<small>${esc(c.ajuda)}</small>` : ''}</label>`;
  }).join('');
  $('#gaveta-fundo').hidden = false;
  $('#gaveta').classList.add('aberta');
  $('#gaveta').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#gaveta-campos input:not([type=hidden]), #gaveta-campos select')?.focus({ preventScroll: true }), 280);
}

function fecharGaveta() {
  $('#gaveta').classList.remove('aberta');
  $('#gaveta').setAttribute('aria-hidden', 'true');
  $('#gaveta-fundo').hidden = true;
  edicao = null;
}

function lerFormulario(tabela) {
  const form = new FormData($('#form-gaveta'));
  const corpo = {};
  for (const c of camposDe(tabela)) {
    let v = form.get(c.nome);
    if (c.obrigatorio && (v === null || v === '')) throw new Error(`Preencha: ${c.rotulo}`);
    if (c.tipo === 'dinheiro') v = v === '' ? null : Math.round(Number(v) * 100);
    else if (c.nome.endsWith('_id')) v = v === '' ? null : Number(v);
    else if (c.nome === 'ativo') v = Number(v);
    corpo[c.nome] = v;
  }
  if (tabela === 'assinaturas' && corpo.valor_centavos == null) {
    corpo.valor_centavos = dados.planos.find((p) => p.id === corpo.plano_id)?.valor_centavos ?? 0;
  }
  return corpo;
}

$('#form-gaveta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { tabela, id } = edicao;
  try {
    const corpo = lerFormulario(tabela);
    await api(id ? `${tabela}/${id}` : tabela, id ? 'PUT' : 'POST', corpo);
    fecharGaveta();
    avisar(id ? 'Alterações salvas' : SALVO[tabela]);
    await carregar();
  } catch (err) { avisar(err.message, true); }
});

$('#excluir').addEventListener('click', async () => {
  const { tabela, id } = edicao;
  if (!confirm(`Excluir este registro? Isso não pode ser desfeito.`)) return;
  try {
    await api(`${tabela}/${id}`, 'DELETE');
    fecharGaveta();
    avisar('Excluído');
    await carregar();
  } catch {
    avisar('Não dá para excluir: ele está ligado a outro cadastro', true);
  }
});

$('#gaveta').addEventListener('click', async (e) => {
  const etapa = e.target.closest('[data-etapa]');
  if (etapa && edicao) {
    $('#gaveta [name=status]').value = etapa.dataset.etapa;
    $$('.seletor-etapas button').forEach((b) => b.classList.toggle('ativo', b === etapa));
  }
  if (e.target.closest('#converter')) await converterLead(edicao.id);
  if (e.target.closest('[data-fechar]')) fecharGaveta();
});
$('#gaveta-fundo').addEventListener('click', fecharGaveta);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && edicao) fecharGaveta(); });

// Cria o cliente a partir do lead, marca o lead como ganho e já abre a venda.
async function converterLead(id) {
  try {
    const dadosForm = lerFormulario('leads');
    const lead = { ...dados.leads.find((l) => l.id === id), ...dadosForm };
    const cliente = await api('clientes', 'POST', { nome: lead.nome, empresa: lead.empresa, contato: lead.contato, notas: lead.notas });
    await api(`leads/${id}`, 'PUT', { ...dadosForm, status: 'ganho' });
    fecharGaveta();
    avisar(`${lead.nome} agora é cliente`);
    await carregar();
    if (dados.planos.length) {
      const plano = dados.planos.find((p) => p.produto_id === lead.produto_id && p.ativo);
      abrirGaveta('assinaturas', null, { cliente_id: cliente.id, plano_id: plano?.id, status: 'teste' });
    }
  } catch (err) { avisar(err.message, true); }
}

// ---------- Cliques gerais ----------

document.addEventListener('click', (e) => {
  if (e.target.closest('#gaveta')) return;
  const r = e.target.closest('[data-rota]');
  if (r) return ir(r.dataset.rota);
  const novo = e.target.closest('[data-novo]');
  if (novo) {
    const padroes = {};
    if (novo.dataset.etapaNova) padroes.status = novo.dataset.etapaNova;
    if (novo.dataset.produto) padroes.produto_id = Number(novo.dataset.produto);
    return abrirGaveta(novo.dataset.novo, null, padroes);
  }
  const f = e.target.closest('[data-filtro]');
  if (f) { filtro = f.dataset.filtro; return desenhar(); }
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) {
    const item = dados[abrir.dataset.abrir].find((i) => i.id === Number(abrir.dataset.id));
    if (item) abrirGaveta(abrir.dataset.abrir, item);
  }
});
window.addEventListener('hashchange', () => ir(location.hash.slice(1)));

// ---------- Login ----------

function mostrarLogin() { $('#app').hidden = true; $('#tela-login').hidden = false; }

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const botao = $('#form-login button');
  botao.disabled = true;
  try {
    await api('login', 'POST', { senha: new FormData(e.target).get('senha') });
    $('#erro-login').hidden = true;
    await iniciar();
  } catch (err) { $('#erro-login').textContent = err.message; $('#erro-login').hidden = false; }
  botao.disabled = false;
});

async function sair() {
  if (modoDemo) { location.href = '/'; return; }
  await api('logout', 'POST');
  mostrarLogin();
}
$('#restaurar-demo').addEventListener('click', async () => {
  if (!confirm('Voltar aos dados de exemplo? O que você mudou na demonstração será apagado.')) return;
  demoRestaurar();
  avisar('Exemplos restaurados');
  await carregar();
});
$('#sair').addEventListener('click', sair);
$('#sair-movel').addEventListener('click', sair);

async function iniciar() {
  if (modoDemo) {
    document.title = 'Rundesk · Demonstração';
    $('#faixa-demo').hidden = false;
    $('.lateral .selo').textContent = 'Demo';
  }
  try {
    rota = ROTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'painel';
    await carregar();
    $('#tela-login').hidden = true;
    $('#app').hidden = false;
  } catch { mostrarLogin(); }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
iniciar();
