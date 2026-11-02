# zera-web-app

[![Node](https://img.shields.io/badge/Node-22-339933.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Painel web do Zera para o **gestor** acompanhar equipamentos eletrônicos, do cadastro ao descarte:
dashboard de indicadores, itens, modelos e gestão de estoque da unidade. Consome o
[`ms-administrative-core`](https://github.com/zera-interdisciplinar/ms-administrative-core)
(autenticação e unidade), o [`ms-inventory`](https://github.com/zera-interdisciplinar/ms-inventory)
(itens, modelos, categorias) e o [`ms-analytics-bff`](https://github.com/zera-interdisciplinar/ms-analytics-bff)
(indicadores do dashboard), sempre pelo gateway ([`infra-gtw-kong`](https://github.com/zera-interdisciplinar/infra-gtw-kong)).

- Painel: https://gestao.zeratech.online
- QA: https://qa.zeratech.online
- GitHub Pages (somente produção): https://zera-interdisciplinar.github.io/zera-web-app/

A landing page e o cadastro por servlets continuam em https://www.zeratech.online (`Projeto-Zera`).
Os domínios só ficam disponíveis após DNS, TLS e rollout; confira [`k8s/README.md`](k8s/README.md).

## Sumário

- [Domínio](#domínio)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Executando localmente](#executando-localmente)
- [Configuração](#configuração)
- [API e proxy](#api-e-proxy)
- [Testes e verificações](#testes-e-verificações)
- [Deploy](#deploy)
- [Licença](#licença)

## Domínio

O painel é **exclusivo do gestor** (`MANAGER`): ele acompanha, edita e avalia os itens cadastrados
pelos funcionários. O cadastro de itens não está disponível na interface do gestor. A reformulação
para esse formato está especificada em [`docs/specs/web-manager-refactor.md`](docs/specs/web-manager-refactor.md).

| Rota | Tela |
|---|---|
| `/login` | Login e recuperação de senha |
| `/` | Dashboard (indicadores vindos do BFF de analytics, atualizados por SSE) |
| `/itens`, `/itens/:id` | Lista de itens, detalhe e decisões do gestor (aprovar, reprovar, editar, remover, restaurar) |
| `/modelos` | Modelos e categorias |

A capacidade e a ocupação do estoque ficam em "Gestão do estoque", dentro de Itens;
`/configuracoes` redireciona para Itens. A lista de itens permite múltiplos status e categorias,
aplicados em conjunto e preservados na URL. Para múltiplas seleções, a camada de serviços lê todas
as páginas necessárias antes de combinar os resultados e paginar a lista.

## Arquitetura

```
src/
├── components/<Nome>/index.tsx   Componentes de interface, um por pasta
├── pages/<Nome>/index.tsx        Telas, uma por rota
├── routes/                       Definição das rotas
├── hooks/  context/  reducers/   Estado e composição
├── services/                     Única camada com fetch, um arquivo por recurso
├── types/                        Entidades e props
└── utils/                        Validação, schemas da API, formatação, localStorage versionado
server/                           Servidor Node: serve o build e executa o proxy com allowlist
styles/  assets/                  Estilos e imagens (dentro de src/ só há .ts e .tsx)
e2e/  tests/                      Playwright e Vitest
k8s/                              Kustomize (base + overlays qa e production)
```

As dependências entre as pastas têm direção fixa — telas e componentes falam com hooks, hooks com
services, e services e utils não conhecem a interface. Essas fronteiras são checadas por
`npm run check`.

## Stack

| | |
|---|---|
| Linguagem | **TypeScript** 5.9 |
| Framework | React 19, React Router 7 |
| Build | Vite 7 (`npm`, Node ≥ 22.12) |
| Dados | TanStack Query, Zod (schemas das respostas da API), React Hook Form |
| Gráficos | Recharts |
| Testes | Vitest, MSW, Playwright (com axe-core para acessibilidade) |
| Servidor | Node (`server/web.mjs`): arquivos estáticos + proxy de API |

## Executando localmente

Pré-requisitos: Node 22.12 ou superior.

```bash
git clone https://github.com/zera-interdisciplinar/zera-web-app.git
cd zera-web-app
npm install
cp .env.example .env     # e preencha ZERA_APP_API_KEY
npm run dev              # porta padrão 5173
```

O login e os dados dependem do ambiente de QA das APIs (`https://www.zeratech.online/qa/...`) e da
chave do gateway: o navegador só chama `/api/<serviço>` e o proxy da aplicação injeta a chave. As
contas de teste são informadas na entrega, não ficam no repositório.

## Configuração

Tudo o que começa com `VITE_` vai para o navegador — **nunca coloque segredos ali**; o
`npm run check:bundle` falha o CI se algum valor privado aparecer no bundle. Referência completa em
[`.env.example`](.env.example).

### Obrigatórias

| Variável | Efeito |
|---|---|
| `ZERA_APP_API_KEY` | Chave do gateway (header `apikey`), injetada pelo proxy. Peça ao time; nunca a versione. O servidor se recusa a subir sem ela |
| `ZERA_ADMIN_URL`, `ZERA_INVENTORY_URL`, `ZERA_ANALYTICS_URL` | Raiz HTTPS de cada serviço, sem `/api` nem `/swagger-ui`. HTTP só é aceito em `localhost`/`127.0.0.1`/`::1` |

### Opcionais

| Variável | Efeito |
|---|---|
| `VITE_API_BASE_URL`, `VITE_ADMIN_API_URL`, `VITE_INVENTORY_API_URL` | Caminhos que o navegador chama na própria origem (padrão: `/api/analytics`, `/api/administrative`, `/api/inventory`) |
| `VITE_ADMIN_OPENAPI_URL`, `VITE_INVENTORY_OPENAPI_URL` | URLs de documentação, sem credenciais |
| `ZERA_PROXY_PORT` (default `8787`), `ZERA_WEB_ORIGINS` | Porta do proxy autônomo (`npm run api:proxy`) e origens aceitas pelo CORS |
| `ZERA_QA_GESTOR_*`, `ZERA_QA_FUNCIONARIO_*` | Contas de teste dos testes de QA. Nunca prefixar com `VITE_` |
| `ZERA_RUN_LIVE_QA=true` | Habilita o login remoto de navegador nos testes; por padrão eles usam respostas controladas |

## API e proxy

O navegador chama `/api/administrative`, `/api/inventory` e `/api/analytics` na **mesma origem**; o
servidor Node (`server/`) encaminha para o gateway, injeta a chave e preserva o JWT, o
`X-Unit-Id` e o SSE. Só as rotas listadas em [`server/allowlist.mjs`](server/allowlist.mjs) passam;
qualquer outra responde 404. Para liberar uma rota nova, ela precisa entrar nessa lista.

## Testes e verificações

```bash
npm run check           # estrutura e fronteiras entre camadas
npm run lint
npm run test:coverage   # mínimo de 80 % das linhas em src/services, src/utils e src/reducers
npm run build
npm run test:e2e        # Playwright
```

O workflow [`ci.yml`](.github/workflows/ci.yml) roda todas elas (mais `check:bundle`) e é
reutilizado pelo deploy. Os testes de navegador usam respostas controladas; eles não substituem a
validação com credenciais reais em QA.

## Deploy

O painel usa o mesmo GKE e o mesmo Kong dos microsserviços. Caminho da requisição: navegador →
Cloudflare → Kong → `zera-web-app:80` → Node:8080.

| Ambiente | Evento que publica |
|---|---|
| QA | Push na branch `qa` |
| Produção | GitHub Release estável (sem prerelease) com commit presente em `main` |
| GitHub Pages | Push em `main` (publica somente produção, veja [GitHub Pages](#github-pages)) |

Uma tag isolada **não** publica, e um push em `main` nunca publica no GKE (só no GitHub Pages). O `Dockerfile` faz o build sem segredos e roda
apenas o servidor e os arquivos estáticos. `npm run build` gera `dist/` e `npm start` serve o build
e o proxy juntos na porta 8080. Ingress, HTTPS e renovação de certificados ficam no
`infra-gtw-kong`; o DNS é administrado no Cloudflare. Domínios, Secret, pipelines, verificações e
rollback estão em [`k8s/README.md`](k8s/README.md) — sempre a fonte da verdade para o que precisa
existir em cada ambiente antes do deploy.

### GitHub Pages

O mesmo painel também fica em https://zera-interdisciplinar.github.io/zera-web-app/, publicado pelo
workflow [`pages.yml`](.github/workflows/pages.yml) a cada push em `main`. É independente do deploy do
GKE.

O Pages publica **somente produção**. Ele só serve arquivos estáticos, então a chave do gateway não
vai para o navegador: as chamadas de API vão, por URL absoluta, para o proxy de produção do cluster
(`gestao.zeratech.online`), que já guarda a chave. O QA não usa o Pages.

Configuração única no GitHub:

1. **Settings → Pages → Source:** `GitHub Actions`.
2. **Settings → Secrets and variables → Actions → Variables:** `VITE_ADMIN_API_URL`,
   `VITE_INVENTORY_API_URL` e `VITE_API_BASE_URL`, com
   `https://gestao.zeratech.online/api/administrative`, `https://gestao.zeratech.online/api/inventory`
   e `https://gestao.zeratech.online/api/analytics`. O build falha, com uma mensagem clara, se alguma
   estiver vazia ou não for https.

Do lado do cluster nada fica manual: `https://zera-interdisciplinar.github.io` já está em
`ZERA_WEB_ORIGINS` do overlay de produção
([`k8s/overlays/production`](k8s/overlays/production/kustomization.yaml)) e vale a partir da próxima
GitHub Release publicada. Até lá o Pages abre, mas o login falha por CORS.

No build do Pages o app é gerado com `--base=/<repositório>/`; `404.html` é uma cópia de `index.html`
(assim o F5 em `/itens` funciona) e `.nojekyll` evita o processamento do Jekyll. Para repetir o mesmo
build localmente: `npm run build -- --base=/zera-web-app/ && node scripts/prepare-pages.mjs`.

## Licença

[MIT](LICENSE)
