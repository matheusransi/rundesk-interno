# Rundesk · Sistema interno

Controle interno da Rundesk: funil de prospecção, clientes, assinaturas, produtos e planos, com um painel de faturamento mensal.

Projeto independente: banco, código e login próprios, sem nenhuma ligação com o Agenda Cheia. Roda em Cloudflare Workers + D1 (plano gratuito).

## O que tem

- **Painel**: faturamento mensal (planos anuais contam 1/12 por mês; assinaturas em teste não contam), clientes ativos, funil por etapa e próximas ações (atrasadas em vermelho).
- **Funil**: leads com etapa (novo, abordado, conversando, demo, piloto, ganho, perdido), próxima ação e data.
- **Clientes e assinaturas**: quem paga, qual plano, valor cobrado, início e fim.
- **Produtos e planos**: catálogo com preço e forma de cobrança (mensal, anual ou único).
- Acesso por senha única; instala no celular como app.

## Publicação

O sistema é publicado pela Cloudflare ligada ao GitHub: cada mudança enviada para a branch `main` entra no ar sozinha.

Configuração (feita uma vez, no painel da Cloudflare):

1. Banco D1 `rundesk-interno` (o id já está no `wrangler.toml`).
2. **Workers & Pages → Create → Import a repository** → `rundesk-interno`, com o comando de deploy `npm run publicar` (ele cria/atualiza as tabelas e publica).
3. **Settings → Variables and Secrets**: segredo `SENHA` com a senha de acesso.

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
