// Sistema interno da Rundesk: API em /api/* e o painel em public/.

const TABELAS = {
  produtos: ['nome', 'descricao', 'ativo'],
  planos: ['produto_id', 'nome', 'valor_centavos', 'periodicidade', 'ativo'],
  leads: ['nome', 'empresa', 'segmento', 'contato', 'origem', 'status', 'produto_id', 'proxima_acao', 'proxima_data', 'notas'],
  clientes: ['nome', 'empresa', 'contato', 'documento', 'notas'],
  assinaturas: ['cliente_id', 'plano_id', 'valor_centavos', 'status', 'inicio', 'fim', 'notas'],
};

const LISTAGENS = {
  produtos: 'SELECT * FROM produtos ORDER BY ativo DESC, nome',
  planos: `SELECT p.*, pr.nome AS produto_nome FROM planos p
           JOIN produtos pr ON pr.id = p.produto_id ORDER BY pr.nome, p.valor_centavos`,
  leads: `SELECT l.*, pr.nome AS produto_nome FROM leads l
          LEFT JOIN produtos pr ON pr.id = l.produto_id
          ORDER BY CASE WHEN l.proxima_data IS NULL THEN 1 ELSE 0 END, l.proxima_data, l.atualizado_em DESC`,
  clientes: `SELECT c.*,
               (SELECT COUNT(*) FROM assinaturas a WHERE a.cliente_id = c.id AND a.status = 'ativa') AS assinaturas_ativas
             FROM clientes c ORDER BY c.nome`,
  assinaturas: `SELECT a.*, c.nome AS cliente_nome, p.nome AS plano_nome, p.periodicidade, pr.nome AS produto_nome
                FROM assinaturas a
                JOIN clientes c ON c.id = a.cliente_id
                JOIN planos p ON p.id = a.plano_id
                JOIN produtos pr ON pr.id = p.produto_id
                ORDER BY CASE a.status WHEN 'ativa' THEN 0 WHEN 'teste' THEN 1 ELSE 2 END, a.inicio DESC`,
};

const COOKIE = 'rundesk_sessao';
const DURACAO_SESSAO = 60 * 60 * 24 * 30; // 30 dias

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    try {
      if (url.pathname === '/api/login' && request.method === 'POST') return login(request, env);
      if (url.pathname === '/api/logout' && request.method === 'POST') return logout();
      if (!(await sessaoValida(request, env))) return json({ erro: 'Não autorizado' }, 401);
      return await rotear(request, env, url);
    } catch (e) {
      return json({ erro: e.message || 'Erro inesperado' }, 400);
    }
  },
};

async function rotear(request, env, url) {
  if (url.pathname === '/api/painel' && request.method === 'GET') return json(await painel(env));

  const [, , tabela, idTexto] = url.pathname.split('/');
  const colunas = TABELAS[tabela];
  if (!colunas) return json({ erro: 'Rota não encontrada' }, 404);
  const id = idTexto ? Number(idTexto) : null;

  if (request.method === 'GET' && !id) {
    const { results } = await env.DB.prepare(LISTAGENS[tabela]).all();
    return json(results);
  }
  if (request.method === 'POST' && !id) {
    const dados = filtrar(await request.json(), colunas);
    const nomes = Object.keys(dados);
    if (!nomes.length) return json({ erro: 'Nada para salvar' }, 400);
    const sql = `INSERT INTO ${tabela} (${nomes.join(', ')}) VALUES (${nomes.map(() => '?').join(', ')}) RETURNING id`;
    const linha = await env.DB.prepare(sql).bind(...Object.values(dados)).first();
    return json(linha, 201);
  }
  if (request.method === 'PUT' && id) {
    const dados = filtrar(await request.json(), colunas);
    const nomes = Object.keys(dados);
    if (!nomes.length) return json({ erro: 'Nada para salvar' }, 400);
    const extra = tabela === 'leads' ? ", atualizado_em = datetime('now')" : '';
    const sql = `UPDATE ${tabela} SET ${nomes.map((n) => `${n} = ?`).join(', ')}${extra} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...Object.values(dados), id).run();
    return json({ id });
  }
  if (request.method === 'DELETE' && id) {
    await env.DB.prepare(`DELETE FROM ${tabela} WHERE id = ?`).bind(id).run();
    return json({ id });
  }
  return json({ erro: 'Método não permitido' }, 405);
}

function filtrar(corpo, colunas) {
  const dados = {};
  for (const c of colunas) {
    if (!(c in corpo)) continue;
    const v = corpo[c];
    dados[c] = v === '' || v === undefined ? null : v;
  }
  return dados;
}

async function painel(env) {
  const hoje = new Date().toISOString().slice(0, 10);
  // Assinaturas em teste não entram no faturamento; planos anuais contam 1/12 por mês.
  const [receita, clientes, funil, proximas, ganhosMes] = await env.DB.batch([
    env.DB.prepare(`SELECT
        COALESCE(SUM(CASE WHEN a.status = 'ativa' THEN
          CASE p.periodicidade WHEN 'mensal' THEN a.valor_centavos WHEN 'anual' THEN a.valor_centavos / 12.0 ELSE 0 END
        END), 0) AS mrr,
        COALESCE(SUM(CASE WHEN a.status = 'teste' THEN 1 ELSE 0 END), 0) AS em_teste
      FROM assinaturas a JOIN planos p ON p.id = a.plano_id`),
    env.DB.prepare(`SELECT COUNT(DISTINCT cliente_id) AS ativos FROM assinaturas WHERE status = 'ativa'`),
    env.DB.prepare(`SELECT status, COUNT(*) AS total FROM leads GROUP BY status`),
    env.DB.prepare(`SELECT id, nome, empresa, status, proxima_acao, proxima_data FROM leads
                    WHERE proxima_data IS NOT NULL AND proxima_data <= date(?, '+7 days')
                      AND status NOT IN ('ganho', 'perdido')
                    ORDER BY proxima_data LIMIT 20`).bind(hoje),
    env.DB.prepare(`SELECT COUNT(*) AS total FROM assinaturas WHERE status = 'ativa' AND inicio >= date(?, 'start of month')`).bind(hoje),
  ]);
  return {
    hoje,
    mrr_centavos: Math.round(receita.results[0].mrr),
    em_teste: receita.results[0].em_teste,
    clientes_ativos: clientes.results[0].ativos,
    novos_no_mes: ganhosMes.results[0].total,
    funil: Object.fromEntries(funil.results.map((r) => [r.status, r.total])),
    proximas_acoes: proximas.results,
  };
}

// Sessão: cookie "validade.assinatura", assinado com HMAC usando a senha como chave.
async function assinar(texto, env) {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SENHA), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(texto));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]);
}

async function sessaoValida(request, env) {
  if (!env.SENHA) return false;
  const cookie = request.headers.get('Cookie') || '';
  const valor = cookie.split(/;\s*/).find((c) => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!valor) return false;
  const [validade, sig] = valor.split('.');
  if (!validade || Number(validade) < Date.now() / 1000) return false;
  return sig === (await assinar(validade, env));
}

async function login(request, env) {
  if (!env.SENHA) return json({ erro: 'Senha não configurada no servidor' }, 500);
  const { senha } = await request.json();
  if (senha !== env.SENHA) return json({ erro: 'Senha incorreta' }, 401);
  const validade = String(Math.floor(Date.now() / 1000) + DURACAO_SESSAO);
  const token = `${validade}.${await assinar(validade, env)}`;
  return json({ ok: true }, 200, {
    'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURACAO_SESSAO}`,
  });
}

function logout() {
  return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
}

function json(dados, status = 200, headers = {}) {
  return new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}
