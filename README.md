# Zera Web — Site

TypeScript · React · Licença MIT

## Apresentação

O Zera Web é o site do sistema de gestão e controle de lixo eletrônico corporativo. No navegador, gestores e funcionários acompanham itens, modelos, descartes e indicadores. O site foi feito em React 19, TypeScript e Vite para a disciplina Desenvolvimento de Aplicações Dinâmicas.

## Sumário

- [Apresentação](#apresentação)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Stack](#stack)
- [Como executar](#como-executar)
- [Publicação](#publicação)
- [Licença](#licença)

## Funcionalidades

O menu apresenta estas telas conforme o perfil:

| Perfil | Telas disponíveis |
|---|---|
| Gestor | Dashboard da unidade, itens e detalhes, modelos e categorias, locais de reciclagem, descartes e funcionários. |
| Funcionário | Dashboard pessoal e indicadores da unidade, itens e detalhes, modelos e categorias, locais de reciclagem e descartes. |

O dashboard tem seis abas: Inventário em operação, Visão geral, Itens e vida útil, Evolução e movimentações, Qualidade dos dados e alertas, e Materiais e sustentabilidade. Categorias são consultadas na tela de Modelos e também aparecem no cadastro de itens.

Há rotas de triagem, relatórios e configurações no código, mas as permissões atuais não as oferecem aos perfis reais.

## Arquitetura

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
styles/    estilos globais, variáveis visuais e módulos CSS
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

## Como executar

O site usa o proxy público da Vercel por padrão e funciona sem criar nenhum arquivo de configuração.

## Publicação

O site está na [Vercel](https://zera-web-app-kappa.vercel.app). Atualmente, o deploy de produção é feito pela CLI da Vercel.

## Licença

MIT. Consulte o arquivo [LICENSE](LICENSE).
