# Zera Web — Site

TypeScript · React · Licença MIT

O Zera Web é o site do sistema de gestão e controle de lixo eletrônico corporativo. No navegador, gestores e funcionários acompanham itens, modelos, descartes e indicadores. O site foi feito em React 19, TypeScript e Vite para a disciplina Desenvolvimento de Aplicações Dinâmicas.

## Sumário

- [O que o site faz](#o-que-o-site-faz)
- [Como conversa com o backend](#como-conversa-com-o-backend)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Stack](#stack)
- [Executando localmente](#executando-localmente)
- [Configuração](#configuração)
- [Publicação](#publicação)
- [Links úteis](#links-úteis)
- [Licença](#licença)

## O que o site faz

O menu apresenta estas telas conforme o perfil:

| Perfil | Telas disponíveis |
|---|---|
| Gestor | Dashboard da unidade, itens e detalhes, modelos e categorias, locais de reciclagem, descartes e funcionários. |
| Funcionário | Dashboard pessoal e indicadores da unidade, itens e detalhes, modelos e categorias, locais de reciclagem e descartes. |

O dashboard tem seis abas: Inventário em operação, Visão geral, Itens e vida útil, Evolução e movimentações, Qualidade dos dados e alertas, e Materiais e sustentabilidade. Categorias são consultadas na tela de Modelos e também aparecem no cadastro de itens.

Há rotas de triagem, relatórios e configurações no código, mas as permissões atuais não as oferecem aos perfis reais.

## Como conversa com o backend

```text
Navegador → /api/{administrative|inventory|analytics} → api/proxy.ts → server/proxy.mjs → APIs do Zera
```

O navegador fala com a função proxy da Vercel. Ela encaminha as requisições aos serviços e injeta a chave no servidor. O site não acessa bancos de dados.

| Serviço | Grupos de rotas usados pelo site |
|---|---|
| ms-administrative-core | `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/users`, `/api/v1/users/{id}`, `/api/v1/recyclings` e `/api/v1/recycling-places`. |
| ms-inventory | `/api/v1/categories`, `/api/v1/materials`, `/api/v1/models`, `/api/v1/items` (detalhes, eventos e transições), `/api/v1/disposals`, `/api/v1/unit-settings` e `/api/v1/dashboard/home`, `/api/v1/dashboard/indicators`, `/api/v1/dashboard/by-category`. |
| ms-analytics-bff | `/health` e `/api/v1/dashboard/overview` (SSE). |

## Estrutura de pastas

```text
src/       páginas, componentes, hooks, serviços e regras do site
styles/    estilos globais, tokens e módulos CSS
api/       função da Vercel que recebe chamadas do navegador
server/    proxy Node e configuração de encaminhamento às APIs
public/    arquivos estáticos públicos, como o favicon
```

## Stack

| Área | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Interface | React 19 |
| Build | Vite 7 |
| Rotas | React Router DOM 7 |
| Estilos | CSS Modules |
| Gráficos | Recharts |
| Lint | ESLint 9 |
| Hospedagem | Vercel |

## Executando localmente

Pré-requisitos: Node.js 22.12.0 ou superior e npm 10 ou superior.

```sh
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Por padrão, o navegador usa o proxy público da Vercel; não é necessário criar arquivo de configuração. O acesso depende de as APIs remotas estarem disponíveis.

## Configuração

| Variável | Função |
|---|---|
| `VITE_API_BASE_URL` | Define a base pública do serviço de analytics no navegador. |
| `VITE_ADMIN_API_URL` | Define a base pública do proxy administrativo no navegador. |
| `VITE_INVENTORY_API_URL` | Define a base pública do proxy de inventário no navegador. |
| `VITE_ROUTER_MODE` | Seleciona o modo de navegação do React Router. |
| `VITE_USE_MSW` | Flag de execução controlada, efetiva somente em desenvolvimento no modo correspondente. |
| `ZERA_ADMIN_URL` / `ZERA_ADMIN_API_ORIGIN` | Configuram a origem administrativa usada pelo proxy; a primeira tem precedência. |
| `ZERA_INVENTORY_API_ORIGIN` | Configura a origem do serviço de inventário no proxy. |
| `ZERA_ANALYTICS_URL` | Configura a origem do serviço de analytics no proxy. |
| `ZERA_APP_API_KEY` | Chave que o proxy envia ao serviço, mantida no servidor. |
| `ZERA_WEB_ORIGINS` | Define as origens aceitas pelo CORS; há padrão local e a Vercel acrescenta suas origens. |
| `ZERA_PROXY_PORT` | Define a porta do proxy Node local. |
| `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL` | Variáveis da Vercel usadas para reconhecer as origens da publicação. |

As URLs do front e as opções locais têm padrões no código. As origens privadas das APIs e a chave do proxy precisam ser configuradas no ambiente de servidor; não há padrão para elas.

## Publicação

O site está na [Vercel](https://zera-web-app-kappa.vercel.app). Atualmente, o deploy de produção é feito pela CLI da Vercel.

## Links úteis

- [Escopo Geral v2](https://zerainterdisciplinar.atlassian.net/wiki/spaces/Engenharia/pages/917676/Escopo+Geral+v2)

## Licença

MIT. Consulte o arquivo [LICENSE](LICENSE).
