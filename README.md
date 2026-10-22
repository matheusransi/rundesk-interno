# Rundesk · Sistema interno

Controle interno da Rundesk: funil de prospecção, clientes, assinaturas, produtos e planos, com um painel de faturamento mensal.

Projeto independente: banco, código e login próprios, sem nenhuma ligação com o Agenda Cheia. Roda em Cloudflare Workers + D1 (plano gratuito).

## O que tem

- **Painel**: faturamento mensal (planos anuais contam 1/12 por mês; assinaturas em teste não contam), clientes ativos, funil por etapa e próximas ações (atrasadas em vermelho).
- **Funil**: leads com etapa (novo, abordado, conversando, demo, piloto, ganho, perdido), próxima ação e data.
- **Clientes e assinaturas**: quem paga, qual plano, valor cobrado, início e fim.
- **Produtos e planos**: catálogo com preço e forma de cobrança (mensal, anual ou único).
- Acesso por senha única; instala no celular como app.

## Publicar pela primeira vez

No computador, dentro da pasta do projeto:

```bash
npm install
npx wrangler login                          # abre o navegador para entrar na Cloudflare
npx wrangler d1 create rundesk-interno      # cria o banco; copie o database_id que aparecer
```

Cole o `database_id` no `wrangler.toml` (no lugar de `COLOQUE_AQUI_O_ID_DO_BANCO`). Depois:

```bash
npm run banco:producao                      # cria as tabelas
npx wrangler secret put SENHA               # escolha a senha de acesso
npm run publicar
```

O endereço sai no final, algo como `https://rundesk-interno.<sua-conta>.workers.dev`.

## Rodar no computador

```bash
echo "SENHA=teste123" > .dev.vars
npm run banco:local
npm run dev                                 # abre em http://localhost:8787
```

## Estrutura

- `src/index.js`: API (`/api/...`) e login.
- `public/`: telas (HTML, CSS e JS puros, sem framework).
- `migrations/`: tabelas do banco. Para mudar o banco, crie um novo arquivo numerado e rode `npm run banco:producao`.
