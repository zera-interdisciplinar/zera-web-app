# Auditoria DAD — Zera Web

Revalidado em 02/10/2026. Evidências executadas e limites em [AUDITORIA.md](AUDITORIA.md), nos testes e em `docs/evidencias/`. Respostas controladas e MSW não comprovam integração autenticada em produção.

| Item | Status | Evidência concreta | Pendência |
|---|---|---|---|
| M1 Vite, React, TypeScript | Atendido | package.json/lockfile e build executado; scripts de src são .ts/.tsx, sem .js/.jsx. | Nenhuma para a stack; CSS/imagens são assets. |
| M2 Pastas e index.tsx | Atendido | Páginas/componentes com index.tsx e imports resolvidos no build. | Nenhuma. |
| M3 Seis componentes de responsabilidade única | Atendido | Button, FieldCard, DataTable, KpiCard, BarChart e DonutChart tipados, sem serviços. | Nenhuma. |
| M4 Tipagem sem any | Atendido | src/types, busca sem any, TypeScript/ESLint passaram. | Nenhuma. |
| M5 Serviços/promises/erros/env | Parcial | Serviços isolados, paginação, AbortSignal e erros HTTP testados; snapshot do OpenAPI. | HTTPS QA e leitura autenticada real ausentes; operações Actor bloqueadas. |
| M6 Estado agrupado e imutável | Atendido | Formulários/filtros em objetos com spread; reducer retorna novos estados. | Nenhuma. |
| M7 Dependências de effects | Atendido | exhaustive-deps executado; cancelamento/expiração com cleanup. | Nenhuma. |
| M8 Keys estáveis | Atendido | Tabelas por ID, navegação por rota, gráficos por rótulo; UUID testado. | Nenhuma. |
| M9 Params/undefined | Atendido | Guards detalhe/triagem; IDs inválidos abertos no browser; UUID real preservado. | Nenhuma. |
| M10 Rotas/navegação/404 | Atendido | 13 rotas/estados diretos; curinga/skip link; produção protege acesso direto e refresh. | Nenhuma para roteamento local. |
| M11 WCAG 2.1 AA | Parcial | Axe, teclado, 26 combinações de reflow 320 CSS px/100–200%, login estreito e 14 testes de contraste. | Leitor de tela, zoom nativo, toque, todas as paletas/estados e revisão manual integral; análises axe inconclusivas. |
| M12 Loading/sucesso/erro no DOM | Parcial | Skeleton/status/alerts; categoria criada e etiqueta inexistente observadas em MSW; erros/cancelamento de serviços testados. | Estados autenticados das APIs reais não observados. |
| M13 Aplicação publicada | Não atendido | Repositório público criado; preview local; Vercel USER_NOT_LOGGED_IN. | Implantação e URL pública da aplicação. |
| M14 20 commits/quatro semanas | Não atendido | Checkout recebido sem Git; histórico novo, commits reais. | Histórico temporal ausente, sem fabricação/retroação. |

| Item | Status | Evidência concreta | Pendência |
|---|---|---|---|
| E1 Context/hook | Atendido | AuthProvider/useAuth e AcessibilidadeContext/useAcessibilidade exercitados no browser. | Nenhuma. |
| E2 Reducer/union | Atendido | triagemReducer define State/Action discriminados; TypeScript passou. | Integração da triagem real permanece bloqueada separadamente. |
| E3 Hook tipado/cancelamento | Atendido | useRequisicao/AbortController/cleanup; teste preserva AbortError. | Nenhuma para o hook. |
| E4 lazy/Suspense | Atendido | AppRoutes, chunks no build e recursos observados no preview. | Nenhuma. |
| E5 Storage versionado | Atendido | _versao/migrações/preferências; token real apenas em memória; produção ignora sessão demo. | Nenhuma para armazenamento frontend. |
| E6 Memoização justificada | Parcial | Filtros derivados em useMemo, callbacks estáveis como dependências. | React Profiler e medição de ganho não executados. |
| E7 XSS | Atendido | Sem dangerouslySetInnerHTML; JSX/sanitização e teste com tags maliciosas. | Evidência frontend; backend não auditado integralmente. |
| E8 Validação/sanitização | Parcial | Formulários com erros anunciados; payload categoria/PATCH testados. | Cadastros/transições Actor sem serialização/autorização validada. |
| E9 Rotas privadas | Parcial | Guard/menus; dez combinações funcionário/gestor testadas; admin demo nas áreas administrativas. | ADMIN ausente no QA; autorização real e divergência do escopo v2 pendentes. |
| E10 ARIA/foco/landmarks | Parcial | Modal inert/ciclo de Tab/retorno, Escape, painel no login, tabelas/alternativa textual, modo foco. | Leitor de tela, voz real, todos os modais/paletas e estados autenticados. |
