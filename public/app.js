// Painel do sistema interno da Rundesk (sem framework).

const STATUS_LEAD = {
  novo: 'Novo', abordado: 'Abordado', conversa: 'Conversando', demo: 'Demo',
  piloto: 'Piloto', ganho: 'Ganho', perdido: 'Perdido',
};
const STATUS_ASSINATURA = { teste: 'Em teste', ativa: 'Ativa', cancelada: 'Cancelada' };
const PERIODICIDADE = { mensal: 'Mensal', anual: 'Anual', unico: 'Pagamento único' };

const dados = { produtos: [], planos: [], leads: [], clientes: [], assinaturas: [] };
let filtroLead = 'abertos';

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reais = (centavos) => (Number(centavos || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBr = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
const hoje = () => new Date().toLocaleDateString('sv-SE');
const opcoes = (lista, rotulo) => lista.map((i) => [i.id, rotulo(i)]);

async function api(caminho, metodo = 'GET', corpo) {
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

// ---------- Formulários ----------

// Campos de cada cadastro. tipo: texto, area, data, dinheiro, escolha
function camposDe(tabela) {
  switch (tabela) {
    case 'leads': return [
      { nome: 'nome', rotulo: 'Nome', obrigatorio: true },
      { nome: 'empresa', rotulo: 'Empresa' },
      { nome: 'segmento', rotulo: 'Segmento' },
      { nome: 'contato', rotulo: 'WhatsApp / e-mail' },
      { nome: 'origem', rotulo: 'Origem (Google Maps, Instagram, indicação...)' },
      { nome: 'status', rotulo: 'Etapa', tipo: 'escolha', opcoes: Object.entries(STATUS_LEAD), padrao: 'novo' },
      { nome: 'produto_id', rotulo: 'Produto de interesse', tipo: 'escolha', opcoes: opcoes(dados.produtos, (p) => p.nome), vazio: true },
      { nome: 'proxima_acao', rotulo: 'Próxima ação' },
      { nome: 'proxima_data', rotulo: 'Data da próxima ação', tipo: 'data' },
      { nome: 'notas', rotulo: 'Notas', tipo: 'area' },
    ];
    case 'clientes': return [
      { nome: 'nome', rotulo: 'Nome', obrigatorio: true },
      { nome: 'empresa', rotulo: 'Empresa' },
      { nome: 'contato', rotulo: 'WhatsApp / e-mail' },
      { nome: 'documento', rotulo: 'CPF / CNPJ' },
      { nome: 'notas', rotulo: 'Notas', tipo: 'area' },
    ];
    case 'assinaturas': return [
      { nome: 'cliente_id', rotulo: 'Cliente', tipo: 'escolha', opcoes: opcoes(dados.clientes, (c) => c.nome + (c.empresa ? ` · ${c.empresa}` : '')), obrigatorio: true },
      { nome: 'plano_id', rotulo: 'Plano', tipo: 'escolha', opcoes: opcoes(dados.planos, (p) => `${p.produto_nome} · ${p.nome} (${reais(p.valor_centavos)})`), obrigatorio: true },
      { nome: 'valor_centavos', rotulo: 'Valor cobrado (R$)', tipo: 'dinheiro', ajuda: 'Deixe em branco para usar o preço do plano' },
      { nome: 'status', rotulo: 'Situação', tipo: 'escolha', opcoes: Object.entries(STATUS_ASSINATURA), padrao: 'ativa' },
      { nome: 'inicio', rotulo: 'Início', tipo: 'data', obrigatorio: true, padrao: hoje() },
      { nome: 'fim', rotulo: 'Fim (se cancelou)', tipo: 'data' },
      { nome: 'notas', rotulo: 'Notas', tipo: 'area' },
    ];
    case 'produtos': return [
      { nome: 'nome', rotulo: 'Nome', obrigatorio: true },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'area' },
      { nome: 'ativo', rotulo: 'Situação', tipo: 'escolha', opcoes: [['1', 'Ativo'], ['0', 'Inativo']], padrao: '1' },
    ];
    case 'planos': return [
      { nome: 'produto_id', rotulo: 'Produto', tipo: 'escolha', opcoes: opcoes(dados.produtos, (p) => p.nome), obrigatorio: true },
      { nome: 'nome', rotulo: 'Nome do plano', obrigatorio: true },
      { nome: 'valor_centavos', rotulo: 'Preço (R$)', tipo: 'dinheiro', obrigatorio: true },
      { nome: 'periodicidade', rotulo: 'Cobrança', tipo: 'escolha', opcoes: Object.entries(PERIODICIDADE), padrao: 'mensal' },
      { nome: 'ativo', rotulo: 'Situação', tipo: 'escolha', opcoes: [['1', 'Ativo'], ['0', 'Inativo']], padrao: '1' },
    ];
  }
}

const TITULOS = { leads: 'lead', clientes: 'cliente', assinaturas: 'assinatura', produtos: 'produto', planos: 'plano' };
let edicao = null; // { tabela, id }

function abrirModal(tabela, item = null) {
  if (tabela === 'planos' && !dados.produtos.length) return alert('Cadastre um produto primeiro.');
  if (tabela === 'assinaturas' && (!dados.clientes.length || !dados.planos.length)) return alert('Cadastre um cliente e um plano primeiro.');
  edicao = { tabela, id: item?.id ?? null };
  $('#titulo-modal').textContent = (item ? 'Editar ' : 'Novo ') + TITULOS[tabela];
  $('#excluir').hidden = !item;
  $('#campos').innerHTML = camposDe(tabela).map((c) => {
    let v = item ? item[c.nome] : c.padrao;
    if (c.tipo === 'dinheiro') v = v == null || v === '' ? '' : (v / 100).toFixed(2);
    if (v == null) v = '';
    const req = c.obrigatorio ? 'required' : '';
    let campo;
    if (c.tipo === 'area') campo = `<textarea name="${c.nome}" ${req}>${esc(v)}</textarea>`;
    else if (c.tipo === 'escolha') {
      const ops = (c.vazio || !c.padrao ? '<option value="">—</option>' : '') +
        c.opcoes.map(([k, r]) => `<option value="${esc(k)}" ${String(k) === String(v) ? 'selected' : ''}>${esc(r)}</option>`).join('');
      campo = `<select name="${c.nome}" ${req}>${ops}</select>`;
    } else if (c.tipo === 'dinheiro') campo = `<input name="${c.nome}" type="number" step="0.01" min="0" inputmode="decimal" value="${esc(v)}" ${req}>`;
    else if (c.tipo === 'data') campo = `<input name="${c.nome}" type="date" value="${esc(v)}" ${req}>`;
    else campo = `<input name="${c.nome}" value="${esc(v)}" ${req}>`;
    return `<label>${esc(c.rotulo)}${campo}${c.ajuda ? `<small>${esc(c.ajuda)}</small>` : ''}</label>`;
  }).join('');
  $('#modal').showModal();
}

$('#form-modal').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { tabela, id } = edicao;
  const form = new FormData(e.target);
  const corpo = {};
  for (const c of camposDe(tabela)) {
    let v = form.get(c.nome);
    if (c.tipo === 'dinheiro') v = v === '' ? null : Math.round(Number(v) * 100);
    else if (c.tipo === 'escolha' && c.nome.endsWith('_id')) v = v === '' ? null : Number(v);
    else if (c.nome === 'ativo') v = Number(v);
    corpo[c.nome] = v;
  }
  if (tabela === 'assinaturas' && corpo.valor_centavos == null) {
    corpo.valor_centavos = dados.planos.find((p) => p.id === corpo.plano_id)?.valor_centavos ?? 0;
  }
  try {
    await api(id ? `${tabela}/${id}` : tabela, id ? 'PUT' : 'POST', corpo);
    $('#modal').close();
    await carregar();
  } catch (err) { alert(err.message); }
});

$('#excluir').addEventListener('click', async () => {
  const { tabela, id } = edicao;
  if (!confirm(`Excluir este ${TITULOS[tabela]}?`)) return;
  try {
    await api(`${tabela}/${id}`, 'DELETE');
    $('#modal').close();
    await carregar();
  } catch (err) { alert('Não deu para excluir: ' + err.message + '. Ele pode estar em uso em outro cadastro.'); }
});
$('#cancelar').addEventListener('click', () => $('#modal').close());
document.querySelectorAll('[data-novo]').forEach((b) => b.addEventListener('click', () => abrirModal(b.dataset.novo)));

// ---------- Telas ----------

function itemLista(tabela, item, principal, detalhe, direita = '') {
  return `<li data-tabela="${tabela}" data-id="${item.id}">
    <div class="principal"><div>${principal}</div>${detalhe ? `<div class="detalhe">${detalhe}</div>` : ''}</div>${direita}</li>`;
}
const vazio = (texto) => `<li class="vazio">${texto}</li>`;
const etiqueta = (chave, mapa) => `<span class="etiqueta ${chave}">${esc(mapa[chave] || chave)}</span>`;

function quandoAcao(lead) {
  if (!lead.proxima_data) return '';
  const atrasada = lead.proxima_data < hoje() ? 'atrasada' : '';
  return `<span class="${atrasada}">${dataBr(lead.proxima_data)}</span>`;
}

async function desenharPainel() {
  const p = await api('painel');
  const funilTotal = Object.values(p.funil).reduce((a, b) => a + b, 0);
  $('#numeros').innerHTML = [
    ['Faturamento mensal', reais(p.mrr_centavos)],
    ['Clientes ativos', p.clientes_ativos],
    ['Assinaturas em teste', p.em_teste],
    ['Leads no funil', funilTotal],
  ].map(([r, v]) => `<div class="numero"><span>${r}</span><strong>${v}</strong></div>`).join('');

  const max = Math.max(1, ...Object.values(p.funil));
  $('#barras-funil').innerHTML = Object.entries(STATUS_LEAD).map(([k, r]) => {
    const n = p.funil[k] || 0;
    return `<div class="barra"><span>${r}</span><div class="trilho"><div class="cheio" style="width:${(n / max) * 100}%"></div></div><b>${n}</b></div>`;
  }).join('');

  $('#proximas').innerHTML = p.proximas_acoes.length
    ? p.proximas_acoes.map((l) => itemLista('leads', l, esc(l.proxima_acao || 'Sem ação definida'),
        esc([l.nome, l.empresa].filter(Boolean).join(' · ')), quandoAcao(l))).join('')
    : vazio('Nada marcado para os próximos dias.');
}

function desenharFunil() {
  const filtros = [['abertos', 'Em aberto'], ...Object.entries(STATUS_LEAD), ['todos', 'Todos']];
  $('#filtro-status').innerHTML = filtros.map(([k, r]) => {
    const n = k === 'todos' ? dados.leads.length
      : k === 'abertos' ? dados.leads.filter((l) => !['ganho', 'perdido'].includes(l.status)).length
      : dados.leads.filter((l) => l.status === k).length;
    return `<button data-filtro="${k}" class="${k === filtroLead ? 'ativa' : ''}">${r} ${n}</button>`;
  }).join('');
  const leads = dados.leads.filter((l) => filtroLead === 'todos' ||
    (filtroLead === 'abertos' ? !['ganho', 'perdido'].includes(l.status) : l.status === filtroLead));
  $('#lista-leads').innerHTML = leads.length
    ? leads.map((l) => itemLista('leads', l,
        esc(l.nome) + (l.empresa ? ` <span class="sutil">· ${esc(l.empresa)}</span>` : ''),
        [l.proxima_acao && esc(l.proxima_acao), quandoAcao(l)].filter(Boolean).join(' · '),
        etiqueta(l.status, STATUS_LEAD))).join('')
    : vazio('Nenhum lead aqui.');
}

function desenharClientes() {
  $('#lista-clientes').innerHTML = dados.clientes.length
    ? dados.clientes.map((c) => itemLista('clientes', c, esc(c.nome),
        esc([c.empresa, c.contato].filter(Boolean).join(' · ')),
        c.assinaturas_ativas ? '<span class="etiqueta ativa">Ativo</span>' : '')).join('')
    : vazio('Nenhum cliente ainda.');
  $('#lista-assinaturas').innerHTML = dados.assinaturas.length
    ? dados.assinaturas.map((a) => itemLista('assinaturas', a,
        `${esc(a.cliente_nome)} <span class="sutil">· ${esc(a.produto_nome)} ${esc(a.plano_nome)}</span>`,
        `desde ${dataBr(a.inicio)}${a.fim ? ` até ${dataBr(a.fim)}` : ''}`,
        `<span class="valor">${reais(a.valor_centavos)}${a.periodicidade === 'anual' ? '/ano' : a.periodicidade === 'mensal' ? '/mês' : ''}</span>${etiqueta(a.status, STATUS_ASSINATURA)}`)).join('')
    : vazio('Nenhuma assinatura ainda.');
}

function desenharProdutos() {
  $('#lista-produtos').innerHTML = dados.produtos.length
    ? dados.produtos.map((p) => itemLista('produtos', p, esc(p.nome), esc(p.descricao),
        p.ativo ? '' : '<span class="etiqueta">Inativo</span>')).join('')
    : vazio('Nenhum produto ainda.');
  $('#lista-planos').innerHTML = dados.planos.length
    ? dados.planos.map((p) => itemLista('planos', p, `${esc(p.produto_nome)} · ${esc(p.nome)}`, PERIODICIDADE[p.periodicidade],
        `<span class="valor">${reais(p.valor_centavos)}</span>${p.ativo ? '' : '<span class="etiqueta">Inativo</span>'}`)).join('')
    : vazio('Nenhum plano ainda.');
}

async function carregar() {
  const nomes = Object.keys(dados);
  const listas = await Promise.all(nomes.map((n) => api(n)));
  nomes.forEach((n, i) => { dados[n] = listas[i]; });
  desenharFunil();
  desenharClientes();
  desenharProdutos();
  await desenharPainel();
}

document.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-tabela]');
  if (li) {
    const item = dados[li.dataset.tabela].find((i) => i.id === Number(li.dataset.id));
    if (item) abrirModal(li.dataset.tabela, item);
  }
  const filtro = e.target.closest('[data-filtro]');
  if (filtro) { filtroLead = filtro.dataset.filtro; desenharFunil(); }
});

$('#abas').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('#abas button').forEach((x) => x.classList.toggle('ativa', x === b));
  document.querySelectorAll('[data-tela]').forEach((s) => { s.hidden = s.dataset.tela !== b.dataset.aba; });
  try { localStorage.setItem('aba', b.dataset.aba); } catch {}
});

// ---------- Login ----------

function mostrarLogin() { $('#app').hidden = true; $('#tela-login').hidden = false; }

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('login', 'POST', { senha: new FormData(e.target).get('senha') });
    $('#erro-login').hidden = true;
    iniciar();
  } catch (err) { $('#erro-login').textContent = err.message; $('#erro-login').hidden = false; }
});

$('#sair').addEventListener('click', async () => { await api('logout', 'POST'); mostrarLogin(); });

async function iniciar() {
  try {
    await carregar();
    $('#tela-login').hidden = true;
    $('#app').hidden = false;
    let aba = 'painel';
    try { aba = localStorage.getItem('aba') || 'painel'; } catch {}
    document.querySelector(`#abas [data-aba="${aba}"]`)?.click();
  } catch { mostrarLogin(); }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
iniciar();
