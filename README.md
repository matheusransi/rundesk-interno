# Rundesk · Sistema interno

Controle interno da Rundesk: funil de prospecção, clientes, assinaturas, produtos e planos, com um painel de faturamento mensal.

Projeto independente: banco, código e login próprios, sem nenhuma ligação com o Agenda Cheia. Roda em Cloudflare Workers + D1 (plano gratuito).

## O que tem

- **Visão geral**: receita mensal (MRR) e anual, clientes ativos, funil por etapa, taxa de conversão, próximas ações (atrasadas em destaque) e receita por produto.
- **Funil de vendas**: quadro por etapa (novo, abordado, conversando, demo, piloto, ganho, perdido). No computador, arraste o lead entre as colunas; no celular, troque a etapa dentro do lead.
- **Converter em cliente**: dentro do lead, cria o cliente e já abre a venda com o plano do produto de interesse.
- **Clientes e assinaturas**: tabelas com busca, mensalidade e situação (em teste, ativa, cancelada). Planos anuais contam 1/12 por mês; assinaturas em teste não entram no faturamento.
- **Produtos e preços**: cada produto com seus planos e quantos clientes ativos tem.
- Acesso por senha única; instala no celular como app.

## Demonstração

Em `/?demo` (ou pelo link "Ver demonstração" na tela de login) o sistema abre já preenchido com dados fictícios: 4 produtos, 9 planos, 16 leads em todas as etapas do funil, 8 clientes e 10 assinaturas. As datas são calculadas a partir do dia de hoje, então sempre há ações atrasadas, para hoje e para a semana.

A demonstração roda inteira no navegador (`public/demo.js`): não pede senha, não chama a API e não toca no banco real. Dá para criar, editar, arrastar e excluir à vontade; as mudanças ficam salvas só naquele navegador e o botão "Restaurar exemplos" volta tudo ao início.

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
- `public/`: telas (HTML, CSS e JS puros, sem framework). `demo.js` é a API de mentira usada no modo demonstração.
- `migrations/`: tabelas do banco. Para mudar o banco, crie um novo arquivo numerado e rode `npm run banco:producao`.
