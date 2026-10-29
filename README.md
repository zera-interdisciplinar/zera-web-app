# Zera

Aplicação web para acompanhar equipamentos eletrônicos, do cadastro ao descarte.

[GitHub Pages](https://zera-interdisciplinar.github.io/zera-web-app/)

## Rodar localmente

1. `git clone https://github.com/zera-interdisciplinar/zera-web-app.git`
2. `cd zera-web-app` e `npm install`
3. Copie `.env.example` para `.env` e preencha `ZERA_APP_API_KEY` (chave do gateway, fornecida pelo time)
4. `npm run dev` (porta padrão 5173)

O login e os dados dependem do ambiente de testes das APIs (`https://www.zeratech.online/qa/...`) e da chave acima: o navegador só chama `/api/<serviço>` e o proxy da aplicação injeta a chave.

Rotas: `/login`, `/` (painel), `/itens`, `/itens/:id`, `/modelos` e `/configuracoes`.
A reformulação para um painel exclusivo do gestor está especificada em [docs/specs/web-manager-refactor.md](docs/specs/web-manager-refactor.md).

As contas de teste são informadas na entrega, não ficam no repositório.

## Verificações

`npm run check` (estrutura e fronteiras entre camadas), `npm run lint`, `npm run test:coverage` (mínimo de 80 % das linhas em `shared/` e `features/*/{schemas,model,api}`), `npm run build` e `npm run test:e2e`. O workflow [ci.yml](.github/workflows/ci.yml) roda todas elas; ele só valida, não publica.

## Publicação (cluster)

Este repositório não publica nada. Para quem for subir no cluster:

- `npm run build` gera `dist/` (arquivos estáticos; as rotas usam o histórico do navegador, então o servidor deve devolver `index.html` para qualquer caminho que não seja `/api`).
- O navegador só chama `/api/administrative`, `/api/inventory` e `/api/analytics`. Quem responde a isso é o proxy de [server/proxy.mjs](server/proxy.mjs) (`npm run api:proxy`) ou o próprio gateway, e é ele que injeta a chave `apiKey`: ela nunca vai para o navegador.
- Variáveis do proxy: `ZERA_ADMIN_URL`, `ZERA_INVENTORY_URL`, `ZERA_ANALYTICS_URL`, `ZERA_APP_API_KEY`, `ZERA_WEB_ORIGINS` (origens permitidas) e `ZERA_PROXY_PORT`. O proxy só aceita as rotas listadas em [server/allowlist.mjs](server/allowlist.mjs).
