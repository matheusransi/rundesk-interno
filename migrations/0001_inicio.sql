CREATE TABLE produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE planos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  nome TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL DEFAULT 0,
  periodicidade TEXT NOT NULL DEFAULT 'mensal' CHECK (periodicidade IN ('mensal', 'anual', 'unico')),
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  empresa TEXT,
  segmento TEXT,
  contato TEXT,
  origem TEXT,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'abordado', 'conversa', 'demo', 'piloto', 'ganho', 'perdido')),
  produto_id INTEGER REFERENCES produtos(id),
  proxima_acao TEXT,
  proxima_data TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  empresa TEXT,
  contato TEXT,
  documento TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE assinaturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  plano_id INTEGER NOT NULL REFERENCES planos(id),
  valor_centavos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('teste', 'ativa', 'cancelada')),
  inicio TEXT NOT NULL,
  fim TEXT,
  notas TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_assinaturas_cliente ON assinaturas(cliente_id);
