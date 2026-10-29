# SPEC-001 — Reformulação do Zera Web (painel do gestor)

| Campo | Valor |
| --- | --- |
| Status | **Aprovada**: decisões de 31/10/2026 incorporadas (seção 13); a Q-15 (publicação) foi respondida em 01/11/2026: o cluster é por conta de outra pessoa do time |
| Data | 2026-10-31 |
| Repositório | `zera-interdisciplinar/zera-web-app` (branch base `main` @ `45f7163`) |
| Público | Quem vai implementar a reformulação (front-end) e quem revisa os PRs |
| Idioma | Spec em pt-BR; **código, nomes de arquivos, tipos, funções e commits em inglês**; textos de interface em pt-BR |

---

## 1. Objetivo e escopo

### 1.1 Objetivo

Reescrever o front-end web do Zera como um **painel de gestão exclusivo do gestor (`MANAGER`)**. O painel deve:

- respeitar as regras de negócio da v1 do back-end;
- ler os indicadores do **BFF de analytics**, e não remontá-los no navegador;
- reproduzir as telas da seção **"WEB — Gestão Zera"** do Figma;
- ter arquitetura explícita e código em inglês, sem modo de demonstração.

### 1.2 Telas desta entrega

| Rota | Tela | Figma |
| --- | --- | --- |
| `/login` | Login | `1824:9749` |
| `/` | Dashboard | `1824:9247` |
| `/items`, `/items/:id` | Itens: lista, cadastro, edição, remoção, detalhe e decisões do gestor | `1824:9407`, `1824:9567` |
| `/models` | Modelos e categorias | sem frame web (ver 8.4) |
| `/settings` | Configurações da unidade: só a capacidade de estoque, em layout genérico (D-10) | sem frame web (ver 8.5) |

A sidebar mostra **somente** essas quatro entradas. Recicladoras, Funcionários e Relatórios saem da navegação (decisão D-02).

### 1.3 Fora do escopo (proibido na web)

| # | O que não entra | Motivo |
| --- | --- | --- |
| X-1 | Login e uso por `EMPLOYEE` | A web é ferramenta do gestor (decisão do time; BR-01). |
| X-2 | Busca de pontos de reciclagem por latitude/longitude (`GET /api/v1/recycling-places`) | Fluxo exclusivo do app mobile (decisão do time; BR-03). |
| X-3 | Registro de descarte (`POST /api/v1/disposals`) e qualquer tela de descarte | Não existe no produto (nem no mobile); o registro de descarte não é feito pela web (BR-04). |
| X-4 | Recicladoras, Funcionários, Relatórios | Fora desta entrega (decisão D-02). |
| X-5 | Modo demonstração, MSW no bundle de produção, dados fictícios | Contamina o código de produção (seção 3). |
| X-6 | Triagem "reutilizável / aproveitável / descartável", relatórios enviados a cooperativas, "lote crítico", meta de reciclagem | Não existem no contrato v1. Vêm do "Escopo Geral v2" (mai/2026), substituído pelo back-end v1 (D-03). |
| X-7 | Página de redefinição de senha | O link de redefinição abre o app mobile por deep link (`zera://reset-password`). |
| X-8 | Fluxos operacionais de item (empréstimo, manutenção, avaliação, transferência de unidade) | São fluxos de campo do app; o painel do gestor decide (aprovar/reprovar/restaurar) e cadastra. |
| X-9 | Gestão de regras de alerta (`/api/v1/rules*`) | Configurações fica genérica, só com a capacidade (D-10). |
| X-10 | Envio de foto do item (`POST /api/v1/items/{id}/photo`) | Decisão D-11. O detalhe só exibe `photoUrl` quando o app já enviou uma foto. |
| X-11 | Geração ou leitura de código de barras por câmera | O código é digitado (D-09). |

---

## 2. Fontes da verdade e precedência

Em caso de conflito, vale a fonte de **menor número**:

1. **Decisões do time** registradas na seção 13.1.
2. **Código-fonte dos serviços**, que é o comportamento real:
   - [`ms-inventory`](https://github.com/zera-interdisciplinar/ms-inventory) @ `92dc2ed`
   - [`ms-administrative-core`](https://github.com/zera-interdisciplinar/ms-administrative-core) (`main` em 31/10/2026)
3. **OpenAPI** servida no QA:
   - `https://www.zeratech.online/qa/administrative/swagger-ui/api-docs`
   - `https://www.zeratech.online/qa/inventory/swagger-ui/api-docs`
   - a do analytics exige JWT e não foi lida; para ela vale o Confluence pág. 7.
4. **Confluence, espaço Back-end**:
   - [Zera Back-end v1](https://zerainterdisciplinar.atlassian.net/wiki/spaces/Backend/pages/55803906)
   - páginas 2 (máquina de estados), 3 (API ms-inventory), 4 (contratos), 5 (API admin-core), 6 (regras e alertas) e **7 (API ms-analytics-bff — SSE para o website)**.
5. **Figma**, arquivo `UgR9qvEmfkTsEUAdIxLR2g`, seção `1824:9246` "WEB — Gestão Zera".
6. Código atual do `zera-web-app`: só como referência do que **não** repetir.

### 2.1 Conflitos detectados e como ficam

| # | Conflito | Resolução |
| --- | --- | --- |
| C-1 | O Figma desenha o CRUD de item na web; a regra inicial proibia. | **Resolvido (D-01):** a web cadastra, edita e remove item. |
| C-2 | O Figma mostra "Circularidade — Meta anual / meta 75%"; o back-end não tem meta. | **Resolvido (D-03):** sem meta. |
| C-3 | O modal do Figma tem os campos ITEM / MATERIAL / MARCA / CONDIÇÃO. O contrato `POST /items` exige `barcode` e `modelId` (ou `model` novo); material e marca são do **modelo**, e o `submit` exige `name`, `model`, `condition`, `hasDamages` (e `damages` se houver dano) e `usageIntensity`. | O formulário segue **o contrato**, com o visual do Figma (8.3.2). |
| C-4 | O Confluence pág. 3 lista os filtros `condition`, `createdBy` e `query` em `GET /items`. O código do `ms-inventory` (`ItemController`) aceita só `status, categoryId, modelId, q, eligibleForDisposal, page, size`. | **Resolvido (D-08):** vale o código. Abrir correção da pág. 3 do Confluence. |
| C-5 | O Figma usa **Inter** no app e **Instrument Sans** no login; o código atual usa Public Sans e JetBrains Mono. | Seguir o Figma (seção 9). |
| C-6 | O label "MATERIAL" do modal tem o placeholder "Selecione uma categoria". | O campo vira **Modelo** (select de modelos, com opção "Novo modelo"); categoria e materiais pertencem ao modelo. |

---

## 3. Diagnóstico do estado atual (resumo)

| Problema | Evidência no código atual |
| --- | --- |
| Funcionário entra na web | [authService.ts](../../src/services/authService.ts) aceita `EMPLOYEE`. [permissoes.ts](../../src/utils/permissoes.ts) dá `ler: true` ao funcionário. Existe até [PainelPessoal](../../src/components/PainelPessoal/index.tsx) só para ele. |
| Busca por lat/lng exposta | [LocaisReciclagem](../../src/components/LocaisReciclagem/index.tsx) e `buscarLocaisReciclagem` em [descarteService.ts](../../src/services/descarteService.ts). |
| Formulário de descarte | [RegistroDescarte](../../src/components/RegistroDescarte/index.tsx) e [useRegistroDescarte.ts](../../src/hooks/useRegistroDescarte.ts) (`POST /disposals`). |
| Cadastro de item fora do contrato | [useCadastroItens.ts](../../src/hooks/useCadastroItens.ts) mistura o fluxo real com o demo; não chama `submit`, então o item fica em `DRAFT`. |
| Dashboard montado no cliente | [DistribuicaoInventario](../../src/components/DistribuicaoInventario/index.tsx), [CadastrosInventario](../../src/components/CadastrosInventario/index.tsx) e [useCondicoesDashboard.ts](../../src/hooks/useCondicoesDashboard.ts) baixam **todos** os itens (`size=20` sequencial) para agrupar no navegador. |
| SSE usado como polling | [dashboardSse.ts](../../src/services/dashboardSse.ts) fecha o stream depois do primeiro `snapshot` e reconsulta a cada 30 s. O contrato manda manter a conexão aberta: o servidor reenvia quando `batch_id` muda. |
| KPIs do BFF escondidos | Itens cadastrados, taxa de reciclagem, aguardando aprovação e impacto só renderizam com `demo=true`, que ninguém passa. São exatamente os 4 cards do Figma. |
| Modo demonstração | 116 ocorrências de `modoDemonstracao`; cerca de 1.600 linhas inalcançáveis em produção. |
| Sessão | F5 desloga. O logout não chama `POST /auth/logout`, então o refresh token continua válido no servidor. |
| Código em português e boilerplate | 13 hooks com `setEstadoLocal` e `useMemo` artificiais, impostos por [check-project.mjs](../../scripts/check-project.mjs). |
| Fontes e tokens divergentes | Public Sans no lugar de Inter. Texto `#171B2E` no lugar de `#122038`. Sidebar com 232 px no lugar de 248. Topbar com 64 px no lugar de 72. |
| Barra de acessibilidade | Problemas listados na seção 10. |

---

## 4. Regras de negócio

Cada regra traz a fonte, a camada que a garante (seção 6) e o teste que a prova (seção 11).

| ID | Regra | Fonte | Camadas | Teste |
| --- | --- | --- | --- | --- |
| **BR-01** | Só `role = MANAGER` usa a web. Login de `EMPLOYEE` é recusado com a mensagem "Esta área é exclusiva para gestores. Use o app Zera." Em seguida a sessão é **encerrada no servidor** (`POST /auth/logout` com o refresh token) e nada fica em memória ou storage. | Decisão do time | L5 | T-01, T-02 |
| **BR-02** | O papel é sempre lido de `GET /api/v1/users/{sub}` (`UserOutput.role` e `status`), nunca do formulário. A cada refresh o papel e o status são revalidados; se o usuário deixar de ser `MANAGER`/`ACTIVE`, a sessão termina. | Código admin-core (`RefreshSessionImpl` emite com `user.role()` atual) | L5 | T-03 |
| **BR-03** | A web **não** chama `GET /api/v1/recycling-places` e não tem nenhuma UI de latitude/longitude. | Decisão do time | L1, L7 | T-04 |
| **BR-04** | A web **não** registra, corrige nem cancela descarte (`/api/v1/disposals*`). | Decisão do time | L1, L7 | T-04 |
| **BR-05** | Os indicadores do dashboard vêm do `ms-analytics-bff` (`snapshot`). O front **não** agrega a listagem de itens para produzir gráficos. | Conf. pág. 7; pág. 3 ("o app não deve montar o gráfico a partir da listagem") | L4, L7 | T-05 |
| **BR-06** | Mudar um filtro do dashboard (`period`, `from`/`to`, `category`, `status`, `unit_id`, `responsible`, `q`, `view`) abre uma **nova** conexão SSE. | Conf. pág. 7 | L2 | T-06 |
| **BR-07** | `from` e `to` só vão juntos, com `from ≤ to`, no formato `YYYY-MM-DD`. `period ∈ {30d, 6m, 12m}`; `view ∈ {todos, pendentes, categoria}`. | Conf. pág. 7 | L6 | T-07 |
| **BR-08** | **Nulo significa "sem como calcular", não zero.** Exemplos: `change_percent`, `change_points`, `circularidade.percent`, `occupancyPercent`. Renderizar "—" com o tooltip "Sem base de comparação", nunca "0%". | Conf. pág. 3 (Painel) | L4, L7 | T-08 |
| **BR-09** | Toda chamada ao ms-inventory leva `X-Unit-Id`; o `unitId` nunca vai no corpo. Na v1 a unidade ativa é a do usuário (`UserOutput.unitId`). O seletor de unidade segue a Q-09 (suposição padrão aplicada). | Conf. pág. 1 / 3 / 7 | L2 | T-09 |
| **BR-10** | **Cadastro de item = `POST /items` seguido de `POST /items/{id}/submit`.** Como o autor é gestor, o submit leva o item direto a `IN_STOCK` e aprova o modelo criado junto. Se o submit responder `422`, os `missingFields` são marcados no formulário e o item permanece `DRAFT` (aparece na lista como "Rascunho", com ação "Concluir cadastro"). | Conf. pág. 2 (regras 1, 2 e 4); `SubmitItemImpl` | L6, L7 | T-10 |
| **BR-11** | Validação do item espelha o contrato: `barcode` obrigatório (não vazio); exatamente um de `modelId` / `model`; `name` 1–120; `usageIntensity` inteiro 0–10; `notes` ≤ 500; `serialNumber` ≤ 120; `condition ∈ {NEW, USED, SEMI_DAMAGED, DAMAGED}`; `hasDamages = true` exige ao menos um item em `damages ⊂ {BROKEN_SCREEN, MISSING_PART, DOES_NOT_POWER_ON, OXIDATION, OTHER}`; `acquiredAt` data ISO não futura; `manufacturingYear` ≤ ano atual. **Modelo novo:** `name` e `manufacturer` não vazios, `categoryId` obrigatório, `materials` não vazio (`MaterialCode`), `estimatedWeightKg > 0` quando informado. | `CreateItemRequest`, `NewItemModelRequest`, `UpdateItemRequest`, `Item.missingRequiredFields()` | L6 (+ L3 nas respostas) | T-11 |
| **BR-12** | **Edição de item** usa `PATCH /items/{id}` só com os campos alterados. Campo ausente não muda; string vazia em `notes`/`serialNumber` **apaga** o valor, e a UI deve deixar isso explícito ("Limpar"). | Conf. pág. 3 (`PATCH /items/{id}`) | L6 | T-12 |
| **BR-13** | **Remoção de item** é lógica (`DELETE /items/{id}` → `REMOVED`) e pede confirmação ("O item sai das listagens e pode ser restaurado"). Item `DISPOSED` não pode ser removido (o botão some; `409` é a rede de segurança). Item `REMOVED` mostra "Restaurar" (`POST /items/{id}/restore`). | Conf. pág. 2 (regra 3) | L7 | T-13 |
| **BR-14** | Decisões do gestor: `PENDING_APPROVAL` → "Aprovar" / "Reprovar" (motivo obrigatório, 1–500 caracteres). As ações vêm de `status`; a tabela de transições **não** é reimplementada. `409` recarrega o item e mostra "O item mudou desde a última leitura". | Conf. pág. 2 ("Ao implementar no cliente"); `RejectItemRequest` | L6, L7 | T-14 |
| **BR-15** | Listagens paginadas usam paginação **do servidor** (`page` zero-based, `size ≤ 100`). É proibido baixar tudo para filtrar no cliente. Exceção: `GET /categories` e `GET /materials` devolvem arrays (sem paginação) por contrato. | Conf. pág. 3; OpenAPI | L2, L7 | T-15 |
| **BR-16** | Categorias: criar (`name` e `description` obrigatórios), renomear, editar descrição e excluir são só do gestor. Excluir categoria com modelo devolve `409` ("Categoria em uso por modelos"). | `CategoryController`, `CreateCategoryRequest` | L6, L7 | T-16 |
| **BR-17** | Modelos: criar (`POST /models`: `name`, `manufacturer`, `categoryId`, `materials` obrigatórios; `warrantyMonths`, `expectedLifespanMonths` > 0 opcionais), editar cada atributo pelo seu `PATCH`, excluir (`409` se houver item vinculado). `approvalStatus ∈ {PENDING, APPROVED, REJECTED}` é **só leitura**: não há endpoint de aprovação de modelo; ele é aprovado junto com o item. | `ModelController`, `CreateModelRequest`, `ApproveItemImpl` | L6, L7 | T-17 |
| **BR-18** | Configurações: `stockCapacity` obrigatório no envio, inteiro ≥ 0 (`PUT /unit-settings`). Na leitura, `null` significa "não configurada": exibir "Não configurada" e explicar que, sem ela, a ocupação do estoque e a regra "Estoque cheio" ficam inativas. | `UpdateUnitSettingsRequest` (`@NotNull @Min(0)`); Conf. pág. 3 e 6 | L6, L7 | T-18 |
| **BR-19** | "Esqueci minha senha" chama `POST /auth/password-reset/request` e mostra **sempre** a mesma mensagem ("Se o e-mail tiver conta ativa, enviaremos o link — abra-o no app Zera"), qualquer que seja o resultado. | Conf. pág. 5 | L6, L7 | T-19 |
| **BR-20** | **Encerrar sessão sempre chama `POST /api/v1/auth/logout`** com `{ refreshToken }` (rota pública; revoga o refresh). Vale para: botão "Sair", recusa de papel (BR-01/02), falha definitiva de refresh, `403` do BFF. A chamada é *best-effort*: a limpeza local acontece mesmo se a API falhar. | Decisão D-05; `AuthController.logout`, `LogoutImpl` | L5 | T-20 |
| **BR-21** | Sessão sobrevive a F5: **só o refresh token** fica em `sessionStorage` (escopo da aba); o access token fica em memória. No boot, `POST /auth/refresh` restaura a sessão e revalida o papel (BR-02). O refresh **rotaciona** o token (o anterior é revogado), então as chamadas de refresh são *single-flight* (uma por vez, as demais aguardam a mesma promessa). | Decisão D-05; `RefreshSessionImpl` (revoga o atual) | L5 | T-21 |
| **BR-22** | Não existe meta de reciclagem ou circularidade. | D-03; Conf. pág. principal | L7 | T-08 |
| **BR-23** | O JWT nunca vai na URL. O proxy recusa `access_token` na query; o SSE usa `fetch` com `Authorization`, não `EventSource` nativo. | Segurança | L1, L2 | T-22 |
| **BR-24** | Toda resposta de API passa por um schema de runtime. Se o contrato divergir, aparece um erro explícito ("Resposta fora do contrato"), e não um dado parcial. | Qualidade | L3 | T-23 |

---

## 5. Arquitetura alvo

### 5.1 Stack

| Camada | Escolha | Observação |
| --- | --- | --- |
| UI | React 19 + TypeScript (strict) + Vite | Mantém a stack atual. |
| Roteamento | React Router (`createBrowserRouter`, data routers) | Guards em `loader`, para bloquear antes de renderizar. |
| Server state | **TanStack Query** | Cache, deduplicação e invalidação após mutações. *Nova dependência.* |
| Validação | **zod** | Schemas das respostas (L3) e dos formulários (L6). *Nova dependência.* |
| Formulários | **react-hook-form** + `@hookform/resolvers/zod` | Formulário de item tem 12+ campos e um sub-formulário condicional (novo modelo). *Nova dependência.* |
| Estilo | CSS Modules + tokens CSS (seção 9) | Sem Tailwind. |
| Gráficos | Recharts (já instalado) | Barras mensais e donut. |
| Ícones | lucide-react (já instalado) | Os ícones customizados do Figma entram como SVG em `src/shared/assets/icons`. |
| Testes | Vitest + Testing Library + MSW (**somente em `tests/`**) + Playwright + axe | MSW nunca é importado de `src/`. |

### 5.2 Estrutura de pastas (feature-sliced)

```
src/
  app/                 # bootstrap: providers, router, layout shell, error boundary
    providers.tsx
    router.tsx
    layout/            # AppShell, Sidebar, Topbar
  shared/
    api/               # httpClient, sseClient, ApiError, problemDetail
    auth/              # session store, role gate, token refresh (single-flight), logout
    config/            # env parsing (zod) — VITE_* lidos UMA vez
    ui/                # Button, Card, DataTable, Modal, ConfirmDialog, TextField, Select, Checkbox, KpiCard, EmptyState, ErrorState, Skeleton, Pagination
    lib/               # format (number, date, percent), pagination helpers
    accessibility/     # AccessibilityProvider, AccessibilityPanel, read-aloud (seção 10)
    assets/
  features/
    auth/              # LoginPage, ForgotPasswordDialog
    dashboard/         # OverviewPage, useOverviewStream
    items/             # ItemsPage, ItemDetailPage, ItemFormDialog, decision dialogs
    models/            # ModelsPage, ModelFormDialog, CategoriesPanel
    settings/          # SettingsPage (seções genéricas), StockCapacityForm
  main.tsx
```

Cada feature segue a mesma forma:

```
features/<name>/
  api/        # uma função por endpoint; chama httpClient; nenhuma lógica de UI
  schemas/    # zod: DTOs da API e formulários
  model/      # tipos de domínio + mappers DTO → domain + rótulos pt-BR dos enums
  hooks/      # useXQuery / useXMutation (TanStack Query)
  components/
  pages/
  copy.ts     # textos pt-BR da feature
  index.ts    # API pública da feature
```

**Regras de dependência** (verificadas por lint, seção 11):

- `features/*` importa de `shared/*`, nunca de outra feature. Exceção explícita: `items` pode importar `models/index.ts` (o select de modelo e o sub-formulário de novo modelo são reutilizados).
- `pages`/`components` não importam `api/` direto; passam por `hooks/`.
- `shared/` não importa de `features/` nem de `app/`.
- `fetch` só existe em `shared/api/`; `sessionStorage`/`localStorage` só em `shared/auth` e `shared/accessibility`.

### 5.3 Convenções de código

- Inglês em tudo que é código: `useOverviewStream`, `ItemStatus`, `approveItem`, `formatPercent`. Strings de UI em pt-BR (Q-11, suposição padrão aplicada), em `copy.ts`; sem lib de i18n na v1.
- DTOs com o nome do contrato (`ItemResponse`, `DashboardSnapshot`); tipos de domínio sem sufixo (`Item`, `Overview`).
- Enums da API como `z.enum([...])` com os valores **do código do back-end** (5.4). Rótulos pt-BR num **único** mapa por enum, dentro da feature dona.
- Um `useState` por pedaço de estado é permitido. Estado relacionado usa `useReducer`. Fica proibido o padrão atual de `setEstadoLocal` com `useMemo`.
- `useMemo`/`useCallback` só com motivo real; sem exigência de comentário.
- Sem `any`, sem `@ts-ignore`, sem `dangerouslySetInnerHTML`.

### 5.4 Enums do contrato (fonte: código do ms-inventory)

| Enum | Valores | Rótulo pt-BR |
| --- | --- | --- |
| `ItemStatus` | `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, `IN_STOCK`, `IN_USE`, `IN_MAINTENANCE`, `AWAITING_EVALUATION`, `DISPOSED`, `REMOVED` | Rascunho, Em aprovação, Reprovado, Em estoque, Emprestado, Em manutenção, Aguardando avaliação, Descartado, Removido |
| `ItemCondition` | `NEW`, `USED`, `SEMI_DAMAGED`, `DAMAGED` | Novo, Usado, Semidanificado, Danificado |
| `DamageType` | `BROKEN_SCREEN`, `MISSING_PART`, `DOES_NOT_POWER_ON`, `OXIDATION`, `OTHER` | Tela quebrada, Peça faltando, Não liga, Oxidação, Outro |
| `MaterialCode` | `PLASTIC`, `METAL`, `GLASS`, `PAPER`, `BATTERY`, `CIRCUIT_BOARD`, `CABLE`, `SCREEN`, `OTHER` | Plástico, Metal, Vidro, Papel, Bateria, Placa de circuito, Cabo, Tela, Outro |
| `ApprovalStatus` (modelo) | `PENDING`, `APPROVED`, `REJECTED` | Pendente, Aprovado, Reprovado |

### 5.5 Fluxo de dados

```
Page ─► hook (TanStack Query) ─► feature/api fn ─► shared/api/httpClient ─► /api/<service>/... (proxy) ─► Kong ─► serviço
                                         │                     │
                                   zod.parse(DTO)       Authorization, X-Unit-Id, timeout, retry(GET), 401→refresh
                                         │
                                   mapper DTO→domain ─► componente
```

O dashboard usa `shared/api/sseClient` com o mesmo cabeçalho e a mesma política de refresh. Mutações invalidam as queries afetadas: item → `['items']`, `['item', id]`; modelo → `['models']`; categoria → `['categories']`, `['models']`.

---

## 6. Camadas de validação

| Camada | Onde | Garante |
| --- | --- | --- |
| **L1 — Proxy** | `server/proxy.mjs` (único; reutilizado no Vite dev e no `npm run api:proxy`) | **Allowlist** de rotas por serviço e método (7.2). Injeta a `apiKey`. CORS restrito. Recusa `access_token` na query. Corpo ≤ 64 KB. Repassa SSE sem buffer. Responde `404` a tudo que não estiver na allowlist (BR-03/04). |
| **L2 — Cliente HTTP / SSE** | `shared/api/` | Base por serviço, `Authorization`, `X-Unit-Id`, timeout de 15 s, retry só em `GET` para 502/503/504 (máx. 2, backoff 300 → 600 ms), `redirect: 'error'`, `credentials: 'omit'`. `401` faz **um** refresh (single-flight) e repete; o segundo `401` encerra a sessão (BR-20). `ProblemDetail` (RFC 9457) vira `ApiError { status, title, detail, fieldErrors?, missingFields? }`. |
| **L3 — Schema** | `features/*/schemas` | `zod.parse` em toda resposta; falha vira `ApiError(kind: 'contract')`. Datas ISO validadas, enums fechados (5.4), `null` preservado. |
| **L4 — Domínio** | `features/*/model` | Mappers puros DTO → domínio, sem efeito colateral e sem "default inventado" (nada de `'Não informado'` no mapper; isso é papel da UI). |
| **L5 — Autorização / sessão** | `shared/auth` + `loader` das rotas | Gate de papel no login, no refresh e em toda rota privada (BR-01/02). Logout sempre no servidor (BR-20). Refresh single-flight e persistência do refresh token (BR-21). |
| **L6 — Formulários** | zod + react-hook-form | Espelha as constraints do contrato (BR-07, 11, 12, 14, 16, 17, 18, 19). Erros `400` (campo em `detail`), `409` e `422` (`missingFields`) do servidor são mapeados de volta ao campo. |
| **L7 — UI** | componentes | Ações visíveis só quando permitidas por `status`. Estados obrigatórios em toda consulta: *loading*, *empty*, *error* (com "Tentar novamente") e *success*. `409` recarrega. Confirmação em toda ação destrutiva. |

---

## 7. Integração com as APIs

### 7.1 Ambientes e proxy

- O navegador chama apenas `/api/{administrative|inventory|analytics}/...` (mesma origem).
- O proxy reescreve para a base do serviço e adiciona `apiKey: ${ZERA_APP_API_KEY}`.
  - Verificado em 31/10: sem a chave o Kong responde "No API key found in request".

| Variável | Valor de QA |
| --- | --- |
| `ZERA_ADMIN_URL` | `https://www.zeratech.online/qa/administrative` |
| `ZERA_INVENTORY_URL` | `https://www.zeratech.online/qa/inventory` (renomeia `ZERA_INVENTORY_API_ORIGIN`) |
| `ZERA_ANALYTICS_URL` | `https://www.zeratech.online/qa/analytics` |
| `ZERA_APP_API_KEY` | segredo; nunca no repositório |

- **Uma implementação só** (`server/proxy.mjs`). O Vite dev a monta como middleware (`configureServer`), no lugar da lógica duplicada em [vite.config.ts](../../vite.config.ts).  O mesmo código roda como servidor autônomo (`npm run api:proxy`).
- Remover o filtro de `EMPLOYEE` (decodificação de JWT e `createdBy`), que é inútil com BR-01.
- `POST /items/{id}/photo` (multipart) fica fora da allowlist (D-11); por isso o limite de corpo de 64 KB se mantém.
- O cliente **deve** reconectar quando o stream terminar (7.4): proxies intermediários podem encerrar conexões longas.
- **Sem deploy na Vercel** (D-12): `api/proxy.ts` e `vercel.json` foram removidos no PR 2. O destino de publicação está em aberto (Q-15).
- `.env.example`: `VITE_*_URL` relativos (`/api/analytics` etc.) e as variáveis `ZERA_*` acima, com os valores do QA e sem a chave.

### 7.2 Allowlist do proxy (L1)

| Serviço | Método | Rotas permitidas |
| --- | --- | --- |
| administrative | POST | `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/password-reset/request` |
| administrative | GET | `/api/v1/users/{id}`, `/api/v1/unit/{id}` |
| inventory | GET | `/api/v1/items`, `/api/v1/items/{id}`, `/api/v1/items/{id}/events`, `/api/v1/models`, `/api/v1/models/{id}`, `/api/v1/models/{id}/items`, `/api/v1/categories`, `/api/v1/categories/{id}`, `/api/v1/materials`, `/api/v1/unit-settings` |
| inventory | POST | `/api/v1/items`, `/api/v1/items/{id}/submit`, `/api/v1/items/{id}/approve`, `/api/v1/items/{id}/reject`, `/api/v1/items/{id}/restore`, `/api/v1/models`, `/api/v1/categories` |
| inventory | PATCH | `/api/v1/items/{id}`, `/api/v1/models/{id}/name`, `/api/v1/models/{id}/manufacturer`, `/api/v1/models/{id}/warranty-months`, `/api/v1/models/{id}/expected-lifespan-months`, `/api/v1/models/{id}/materials`, `/api/v1/categories/{id}/name`, `/api/v1/categories/{id}/description` |
| inventory | PUT | `/api/v1/unit-settings` |
| inventory | DELETE | `/api/v1/items/{id}`, `/api/v1/models/{id}`, `/api/v1/categories/{id}` |
| analytics | GET | `/health`, `/api/v1/dashboard/overview` |

Tudo fora da tabela recebe `404`, inclusive `recycling-places`, `/disposals*`, `/rules*`, `/items/{id}/photo`, `/items/{id}/lend|return|maintenance/*|evaluate|status|unit` e `/users` (lista).

### 7.3 Sessão (L2 + L5)

1. **Login:** `POST /auth/login` devolve `TokenResponse { userId, accessToken, refreshToken, tokenType, expiresIn }`.
2. **Gate:** `GET /users/{userId}` com o novo token devolve `UserOutput`.
   - Se `role !== 'MANAGER'` ou `status !== 'ACTIVE'`, executar o **logout** (passo 6) e mostrar a mensagem do BR-01 (ou "Conta inativa").
3. **Sessão:** access token e `user` ficam em memória; o **refresh token** fica em `sessionStorage['zera.session.refresh']`.
4. **Boot (F5):** se houver refresh token, chamar `POST /auth/refresh` e depois o passo 2.
   - Falha → limpar o storage e ir para `/login` (sem logout no servidor; o token já é inválido).
5. **Refresh agendado** em `expiresAt − 60 s` e **sob demanda** no `401`, sempre single-flight. O novo refresh token substitui o anterior no storage.
6. **Logout** (BR-20), na ordem:
   1. `POST /auth/logout { refreshToken }`, com timeout de 5 s, ignorando o erro;
   2. limpar o `sessionStorage`;
   3. `queryClient.clear()`;
   4. abortar o SSE;
   5. navegar para `/login`.

Limitação conhecida: fechar a aba não revoga o refresh token no servidor (não há evento confiável que distinga fechar de recarregar). O token expira pelo TTL do admin-core, e `/maintenance/tokens/revoke-expired` faz a limpeza.

### 7.4 Cliente SSE do dashboard (L2)

- Implementação: `fetch(url, { headers: { Authorization, Accept: 'text/event-stream', 'X-Unit-Id' } })` e leitura do `ReadableStream`. O parser atual (`analisarChunkSse`, já testado) é portado como `parseSseChunk`.
- Eventos:
  - `snapshot` → `zod.parse`, depois render;
  - `unavailable` → "Ainda não há dados processados para este filtro";
  - `error` → mostrar `detail` e encerrar;
  - `: heartbeat` → ignorado, mas reinicia o timer de inatividade (90 s).
- **A conexão permanece aberta.** Fechar depois do primeiro snapshot (como hoje) é proibido.
- Queda, fim do stream (incluindo limites de tempo de proxies intermediários) ou inatividade: reconectar com backoff de 1 s, 2 s, 4 s… até no máximo 30 s, mantendo o último snapshot na tela com o selo "Reconectando…".
- Filtro novo: abortar a conexão e abrir outra (BR-06).
- HTTP antes do stream:
  - `400` → erro de filtro, sem reconexão;
  - `401` → refresh e uma reabertura;
  - `403` → logout (BR-20);
  - `503` → "Serviço de indicadores indisponível", com reconexão.

### 7.5 Matriz tela × endpoint

| Tela | Serviço | Endpoints |
| --- | --- | --- |
| Login | administrative | `POST /api/v1/auth/login`, `GET /api/v1/users/{id}`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/password-reset/request` |
| Shell | administrative | `GET /api/v1/unit/{id}` (nome da unidade no topbar) |
| Dashboard | analytics | `GET /api/v1/dashboard/overview` (SSE): **fonte única** |
| Itens — lista | inventory | `GET /api/v1/items?page&size&q&status&categoryId&modelId`, `GET /api/v1/categories` |
| Itens — cadastro | inventory | `GET /api/v1/models?approvalStatus&page&size`, `GET /api/v1/materials`, `POST /api/v1/items`, `POST /api/v1/items/{id}/submit` |
| Itens — edição / remoção | inventory | `PATCH /api/v1/items/{id}`, `DELETE /api/v1/items/{id}`, `POST /api/v1/items/{id}/restore` |
| Itens — detalhe e decisões | inventory | `GET /api/v1/items/{id}`, `GET /api/v1/items/{id}/events?page&size`, `POST /api/v1/items/{id}/approve`, `POST /api/v1/items/{id}/reject` |
| Modelos | inventory | `GET /api/v1/models`, `GET /api/v1/models/{id}`, `GET /api/v1/models/{id}/items`, `POST /api/v1/models`, `PATCH /api/v1/models/{id}/name` (e `/manufacturer`, `/warranty-months`, `/expected-lifespan-months`, `/materials`), `DELETE /api/v1/models/{id}`, `GET /api/v1/materials` |
| Categorias (dentro de Modelos) | inventory | `GET /api/v1/categories`, `POST /api/v1/categories`, `PATCH /api/v1/categories/{id}/name`, `PATCH /api/v1/categories/{id}/description`, `DELETE /api/v1/categories/{id}` |
| Configurações | inventory | `GET /api/v1/unit-settings`, `PUT /api/v1/unit-settings` |

---

## 8. Telas

Critérios comuns a todas as telas:

- layout do Figma em **1440 × 900** e funcional a partir de **1280 px** (painel de desktop);
- os quatro estados (loading / empty / error / success);
- foco visível;
- `axe` sem violações *serious* ou *critical*;
- toda mutação com feedback (toast `role="status"`) e botão desabilitado durante o envio.

### 8.1 Login — Figma `1824:9749`

- Painel esquerdo creme (`#F2EAD9`) com o logo, o tagline "TRANSFORMANDO DESCARTE EM SOLUÇÃO" e os contatos. Painel direito com gradiente azul (`#2A58CE` → `#162F71`) e o card do formulário (480 px, raio 24, fundo `#F2EBD8`).
- Fonte **Instrument Sans**: título 36/42 bold `#203B7E`; subtítulo 16/24 medium `#5C6980`; labels 14 bold; inputs com 52 px, raio 12 e borda `#929BAD`.
- Ícones mail e lock nos campos; alternância de visibilidade da senha (eye) com `aria-pressed`.
- "Esqueci minha senha" segue o BR-19.
- Aceite:
  - gestor entra e cai no Dashboard;
  - funcionário vê a mensagem do BR-01, `POST /auth/logout` é chamado e ele permanece no login;
  - credencial inválida mostra "E-mail ou senha inválidos.";
  - F5 com sessão ativa mantém o usuário logado (BR-21).

### 8.2 Dashboard — Figma `1824:9247`

| Elemento do Figma | Origem dos dados (snapshot do BFF) |
| --- | --- |
| Topbar: "Período • Categoria • Status • Responsável" | `applied_filters` (texto) + popover com as opções de `available_filters.{periods, categories, statuses, responsibles}` |
| Busca "Pesquisar por ID, Nome ou Material..." | query `q` (debounce de 400 ms, nova conexão) |
| Chips Todos / Pendentes / Categoria | query `view` = `todos` / `pendentes` / `categoria` |
| Card "Itens cadastrados" + variação | `kpis.itens_cadastrados.value` / `.change_percent` ("no período") |
| Card "Taxa de reciclagem" + variação | `kpis.taxa_reciclagem.percent` / `.change_points` (exibir "p.p.") |
| Card "Aguardando aprovação" + "N prioritários" | `kpis.aguardando_aprovacao.value` / `.prioritarios`. O card é um link para `/items?status=PENDING_APPROVAL` |
| Card "Impacto recuperado" | `kpis.impacto_recuperado.tonnes` (em kg quando < 1 t) |
| "Itens por mês" (Cadastrados / Encaminhados) | `itens_por_mes[]`: barras agrupadas, duas séries |
| "Circularidade" (donut) | `circularidade.percent`. **Sem "Meta anual" e sem "meta 75%"** (D-03); o subtítulo vira "Itens com destino circular no período" |
| Card inferior largo | (D-04) Três blocos: **por categoria** (`por_categoria`, barras horizontais com quantidade e %), **por situação** (`por_status`, rótulos do `ItemStatus`) e **alertas abertos por gravidade** (`alertas.abertos` + `alertas.por_gravidade`) |
| Rodapé dos cards | `extracted_at` ("Atualizado há N min") |

Outros pontos:

- **Selo de conexão**: "Atualizando…", "Ao vivo", "Reconectando…" ou "Indisponível".
- Aceite:
  - nenhuma requisição ao ms-inventory ao abrir o dashboard (T-05);
  - trocar um filtro gera exatamente uma nova conexão (T-06);
  - `null` aparece como "—" (T-08);
  - não há texto "meta" (T-08).

### 8.3 Itens — Figma `1824:9407` e `1824:9567`

#### 8.3.1 Lista

- Título "Gestão de itens"; subtítulo "Cadastre, filtre e acompanhe o ciclo de cada item." (como no Figma).
- Busca (`q`; casa com `displayCode`, nome do item, nome do modelo ou material) e filtros de status, categoria e modelo, todos **server-side**. Os filtros ficam refletidos na URL (`?q=&status=&categoryId=&page=`).
- Botão âmbar **"Adicionar item"** (Figma) abre o formulário (8.3.2).
- Tabela "Todos os itens" com as colunas do Figma:

  | Coluna | Campo |
  | --- | --- |
  | Item | `name` (+ `displayCode` em fonte tabular) |
  | Categoria | `model.category.name` |
  | Status | rótulo + cor |
  | Responsável | `createdByName` |
  | Atualização | `updatedAt` relativo |
  | Ação | Editar (lápis) e Remover (lixeira), como no Figma, mais as ações por status: Aprovar/Reprovar em `PENDING_APPROVAL`, Concluir cadastro em `DRAFT`/`REJECTED`, Restaurar em `REMOVED` |

- Cores de status: `PENDING_APPROVAL` âmbar (Figma); `IN_STOCK` verde; `DRAFT` / `REJECTED` / `REMOVED` cinza-escuro; `IN_USE` / `IN_MAINTENANCE` / `AWAITING_EVALUATION` azul; `DISPOSED` neutro.
- Por padrão a API lista só os **ativos**; um filtro "Removidos" (`status=REMOVED`) permite restaurar.
- Paginação do servidor (20 por página; seletor 20/50/100). A linha inteira abre o detalhe.

#### 8.3.2 Formulário de item (cadastro e edição)

Modal com o visual do Figma `1824:9567`: fundo navy `#162F71`, raio 30, campos brancos com label caixa-alta de 10 px, botões "Concluir cadastro" (âmbar) e "Cancelar". Os campos seguem **o contrato** (C-3, C-6):

| Campo | Cadastro | Edição | Regra (BR-11) |
| --- | --- | --- | --- |
| Código de barras | obrigatório, **digitado** (D-09) | só leitura | texto não vazio, sem espaços nas pontas (`trim`); sem geração nem leitura por câmera |
| Nome do item | obrigatório | editável | 1–120 |
| Modelo | select de modelos (busca) **ou** "Novo modelo" | só leitura | exatamente um |
| └ Novo modelo: categoria, nome, fabricante (o "MARCA" do Figma), materiais (multi-select de `MaterialCode`), peso estimado (kg) | obrigatórios exceto peso | — | BR-11 |
| Condição | obrigatório | editável | `ItemCondition` |
| Possui danos? | obrigatório (sim/não) | editável | se "sim", ao menos um tipo de dano |
| Tipos de dano | condicional | editável | `DamageType[]` |
| Intensidade de uso (0–10) | obrigatório | editável | slider com input numérico |
| Número de série | opcional | editável (com "Limpar") | ≤ 120 |
| Data de aquisição | opcional | editável | não futura |
| Ano de fabricação | opcional | editável | ≤ ano atual |
| Observações | opcional | editável (com "Limpar") | ≤ 500 |

O modal tem altura máxima de 90vh, rolagem interna e o sub-formulário de novo modelo como `<fieldset>`.

Fluxo de envio (BR-10):

1. Cadastro: `POST /items` com o corpo validado, sem `status` e sem `unitId`.
2. Em seguida, `POST /items/{id}/submit`.
   - Sucesso: toast "Item cadastrado e incluído no estoque".
   - `422`: o item fica `DRAFT`, os `missingFields` são destacados e o modal permanece aberto em modo edição.
3. Erros:
   - `409` com código de barras duplicado → erro no campo `barcode`;
   - `400` → erro no campo citado em `detail`, ou geral.
4. Edição: `PATCH /items/{id}` só com os campos alterados (BR-12).

Gerar o `id` no cliente (`crypto.randomUUID()`) torna o `POST /items` idempotente: um reenvio após timeout não duplica o item.

#### 8.3.3 Detalhe do item (sem frame no Figma)

- Cabeçalho: nome, `displayCode`, status, ações conforme BR-13/BR-14.
- Dados:
  - os campos do `ItemResponse` (modelo, categoria, condição, danos, intensidade, série, aquisição, fabricação, observações);
  - `predictedFailureDate` ("Previsão de falha", ou "Sem previsão");
  - `missingFields` ("Faltam: …");
  - `photoUrl` (imagem com `alt` = nome do item; sem foto, mostrar placeholder).
- Timeline paginada de `events` (tipo, de → para, motivo, autor, data).
- "Reprovar" abre um diálogo com motivo obrigatório (1–500 caracteres, contador).

### 8.4 Modelos (sem frame web; usar os componentes das telas desenhadas)

- Abas "Modelos" e "Categorias".
- **Modelos:**
  - tabela paginada (nome, fabricante, categoria, materiais, vida útil, garantia, peso, aprovação) com filtro `approvalStatus`;
  - "Novo modelo" (BR-17);
  - edição por campo (cada campo salva no seu `PATCH`);
  - excluir com confirmação (`409` → "Há itens vinculados a este modelo");
  - o detalhe lista os itens do modelo (`/models/{id}/items`).
- **Categorias:**
  - lista;
  - criar (nome + descrição), renomear, editar descrição, excluir (BR-16).
  - Usar como referência os frames mobile "Categoria-gestor", "Cadastro categoria- Gestor" e "Cadastro modelo- Gestor" da seção "versão final".

### 8.5 Configurações (sem frame web; genérica — D-10)

Página propositalmente simples: `PageHeader` "Configurações" / "Parâmetros da unidade" e **uma** seção em `Card`:

| Seção | Conteúdo |
| --- | --- |
| Capacidade do estoque | Valor atual (ou "Não configurada"), última alteração (`updatedByName`, `updatedAt`), campo numérico e "Salvar" (`PUT /unit-settings`, BR-18). Texto de apoio: "Número máximo de itens que a unidade comporta. Usado para calcular a ocupação do estoque." |

A página é composta por uma lista de seções (`SettingsSection[]`), para que novas configurações entrem sem mudar o layout. Nenhuma outra seção é implementada nesta entrega.

---

## 9. Design system (tokens do Figma)

Extraído do Figma em 31/10/2026, frames `1824:9247`, `1824:9567` e `1824:9749`. Substitui [styles/tokens.css](../../styles/tokens.css).

**Medidas em `rem`** (1 rem = 16 px). Exigência da escala de texto da seção 10: medidas em px no Figma são convertidas para rem.

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-bg` | `#F2EAD9` | Fundo do conteúdo |
| `--color-surface` | `#FFFFFF` | Cards, topbar, campos do modal |
| `--color-navy-900` | `#162F71` | Sidebar, modal de item, ícone de card, barras |
| `--color-navy-700` | `#24438C` | Card de perfil na sidebar |
| `--color-navy-login` | `#203B7E` | Títulos e labels do login |
| `--color-blue-600` | `#2A58CE` | Acento, início do gradiente do login |
| `--color-blue-100` | `#D8E2FF` | Texto secundário na sidebar |
| `--color-green-500` | `#25B988` | Ícone de reciclagem, barra, donut |
| `--color-green-700` | `#168763` | Variação positiva |
| `--color-amber-500` | `#EC9E1D` | Pendências, CTA "Adicionar item"/"Concluir cadastro", avatar |
| `--color-text` | `#122038` | Títulos e valores |
| `--color-text-muted` | `#5C6980` | Subtítulos, eixos, labels, borda dos campos do modal |
| `--color-placeholder` | `#99A1B2` | Placeholder da busca (`#7B8395` no login) |
| `--color-border` | `#D8E0EE` | Busca, divisores |
| `--color-border-input` | `#75819A` (Figma: `#929BAD`, ver desvios acima) | Contorno dos campos |
| `--font-app` | `'Inter', system-ui, sans-serif` | Shell e telas internas (400 / 500 / 600 / 700) |
| `--font-auth` | `'Instrument Sans', system-ui, sans-serif` | Login (400 / 500 / 600 / 700) |
| `--layout-sidebar` | `15.5rem` (248 px) | |
| `--layout-topbar` | `4.5rem` (72 px) | |
| `--radius-card` | `1.25rem` (20 px); KPIs `1.125rem` (18 px) | Q-06, suposição padrão aplicada |
| `--radius-input` | `0.75rem` (login) / `0.9375rem` (busca) / `1.25rem` (modal de item) | |
| `--radius-modal` | `1.875rem` (30 px) | Modal de item |
| `--radius-nav` | `0.75rem` | Item ativo da sidebar |

Tipografia do app (Inter):

| Elemento | Especificação |
| --- | --- |
| Título de página | 28 bold `#122038` |
| Subtítulo | 14 regular `#5C6980` |
| Rótulo de KPI | 12 medium |
| Valor de KPI | 28 bold |
| Apoio de KPI | 11 semibold |
| Título de card | 18 semibold |
| Navegação | 14 medium (ativo: semibold) |
| Label de campo do modal | 10 bold caixa-alta |
| Valor de campo | 14 regular |

Fontes via `@fontsource/inter`, `@fontsource/instrument-sans` e `@fontsource/atkinson-hyperlegible` (seção 10). Remover `@fontsource/public-sans` e `@fontsource/jetbrains-mono`.

O contraste dos pares texto/fundo deve passar AA; o teste [contraste.test.ts](../../tests/contraste.test.ts) é mantido e atualizado. **Desvios do Figma por contraste (WCAG), decididos no PR 5 e para registrar com o time de design:**

| Figma | Contraste | Aplicado |
| --- | --- | --- |
| Texto branco sobre âmbar `#EC9E1D` (botões) | 2,2:1 | Texto navy `#162F71` sobre âmbar (5,6:1) |
| Contorno dos campos `#929BAD` | 2,8:1 sobre branco (mínimo 3:1, WCAG 1.4.11) | `#75819A` (3,9:1), token `--color-border-input` |
| Texto verde `#168763` (variação positiva) | 4,49:1 sobre branco e 3,75:1 sobre o creme | `#307050` (`--verde-texto`) para texto; `#168763` só em elementos gráficos |
| Placeholder `#99A1B2` | 2,6:1 | Mantido o placeholder legado (`--texto-secundario`) |

---

## 10. Barra de acessibilidade (mantida e corrigida — D-07)

Problemas encontrados em [BarraAcessibilidade](../../src/components/BarraAcessibilidade/index.tsx), [useControleAcessibilidade.ts](../../src/hooks/useControleAcessibilidade.ts), [AcessibilidadeContext.tsx](../../src/context/AcessibilidadeContext.tsx) e [global.css](../../styles/global.css):

| # | Problema | Correção |
| --- | --- | --- |
| A-1 | O painel fecha sozinho a qualquer mudança de foco para fora dele (`focusin`). Com leitor de tela em modo de navegação, ou ao usar Tab para conferir o efeito na página, o painel some. | Tornar o painel um **diálogo não modal** (`role="dialog"`, `aria-modal="false"`, `aria-labelledby`). Fecha só por "Fechar", `Esc` ou pelo botão de abrir; o foco volta ao gatilho. |
| A-2 | "Fonte legível alternativa" troca para **Comic Sans MS**, que não é fonte de acessibilidade e nem existe em Linux/Android. | Usar **Atkinson Hyperlegible** (via `@fontsource`). |
| A-3 | "Espaçamento" usa `line-height: 1.8` e parágrafo de `1.2em`, fora do WCAG 1.4.12. | Aplicar exatamente os valores do 1.4.12: entrelinha 1.5, parágrafo 2em, letras 0.12em, palavras 0.16em. Verificar que nada corta ou sobrepõe (teste visual). |
| A-4 | A escala de texto (100–200 %) muda `font-size` do `html`, mas parte dos estilos é fixa em px. | Tokens e componentes em `rem` (seção 9). Teste: a 200 % não há corte nem scroll horizontal em 1280 px (WCAG 1.4.4 / 1.4.10). |
| A-5 | "Alto contraste" redefine variáveis antigas (`--texto`, `--navy`…), que deixam de existir na refatoração. | Redefinir os tokens novos com contraste ≥ 7:1 (AAA). Respeitar `@media (prefers-contrast: more)` como valor inicial. |
| A-6 | "Modo de foco" quase não tem efeito (tira sombras e limita a largura do `main`). | Substituir por **"Reduzir movimento"**: desliga transições e animações, inclusive dos gráficos Recharts (`isAnimationActive=false`). Respeitar `prefers-reduced-motion` como valor inicial. |
| A-7 | "Simulação de daltonismo" é ferramenta de inspeção para designers, não recurso assistivo (o próprio texto avisa que "não corrige a percepção"). | Remover do painel do usuário. |
| A-8 | Comandos de voz têm rotas fixas e desatualizadas (recicladoras, funcionários, relatórios, login). | Gerar os comandos da **mesma configuração de rotas** do router ("ir para dashboard / itens / modelos / configurações"), só com rotas permitidas para a sessão. Manter o aviso de privacidade do microfone. |
| A-9 | "Ler conteúdo" lê todo o `main`, inclusive tabelas inteiras. | Manter; acrescentar "Parar" e "Ler a partir da seleção" (texto selecionado) e pular `aria-hidden` e o conteúdo de gráficos (que já têm a tabela alternativa da 8.2). |
| A-10 | O gatilho flutuante (60 px, canto inferior direito) cobre a coluna "Ação" da tabela de itens. | Reservar `padding-bottom` no `main` e posicionar o gatilho fora da área de conteúdo (rodapé da sidebar, junto do card de perfil). |
| A-11 | Gráficos sem alternativa textual. | Cada gráfico tem `<figure>` com `<figcaption>` e uma tabela de dados acessível (oculta visualmente, alternável por "Ver dados"). |

As preferências ficam em `localStorage['zera.a11y.v1']`, validadas por zod; preferência inválida volta ao padrão. Código em `src/shared/accessibility/` (nomes em inglês: `AccessibilityPanel`, `useReadAloud`, `useVoiceNavigation`).

---

## 11. Remoções

| Grupo | Caminhos |
| --- | --- |
| Modo demonstração | `modoDemonstracao` em [apiReal.ts](../../src/services/apiReal.ts); [useAmbiente.ts](../../src/hooks/useAmbiente.ts); [http.ts](../../src/services/http.ts); ramo MSW de [main.tsx](../../src/main.tsx); alias `tests/mocks/browser` e plugin `serve-test-only-msw-worker` em [vite.config.ts](../../vite.config.ts); `SeloDemonstracao` |
| Serviços sem contrato | [alertaService.ts](../../src/services/alertaService.ts), [manutencaoService.ts](../../src/services/manutencaoService.ts), [relatorioService.ts](../../src/services/relatorioService.ts), [configuracaoService.ts](../../src/services/configuracaoService.ts), [dashboardService.ts](../../src/services/dashboardService.ts) |
| Triagem (não existe na v1) | [TriagemPage](../../src/pages/TriagemPage/index.tsx), [FluxoTriagem](../../src/components/FluxoTriagem/index.tsx), [triagemReducer.ts](../../src/reducers/triagemReducer.ts), [Stepper](../../src/components/Stepper/index.tsx) |
| Proibidos (BR-03/04) | [LocaisReciclagem](../../src/components/LocaisReciclagem/index.tsx), [RegistroDescarte](../../src/components/RegistroDescarte/index.tsx), [useRegistroDescarte.ts](../../src/hooks/useRegistroDescarte.ts), [DescartesPage](../../src/pages/DescartesPage/index.tsx), `descarteService.ts`, `cicloService.ts` (parte de descartes) |
| Telas fora da entrega (D-02) | [RecicladorasPage](../../src/pages/RecicladorasPage/index.tsx), [CadastroRecicladoras](../../src/components/CadastroRecicladoras/index.tsx), [FuncionariosPage](../../src/pages/FuncionariosPage/index.tsx), [RelatoriosPage](../../src/pages/RelatoriosPage/index.tsx) e hooks/serviços associados |
| Fluxos operacionais (X-8) | [FluxoItemReal](../../src/components/FluxoItemReal/index.tsx), [transicaoItemService.ts](../../src/services/transicaoItemService.ts) (só `approve`/`reject` são portados) |
| Funcionário | [PainelPessoal](../../src/components/PainelPessoal/index.tsx), [usePainelUsuario.ts](../../src/hooks/usePainelUsuario.ts), [escopoItens.ts](../../src/utils/escopoItens.ts); filtro `EMPLOYEE` em [proxy.mjs](../../server/proxy.mjs) |
| Agregação no cliente | [DistribuicaoInventario](../../src/components/DistribuicaoInventario/index.tsx), [CadastrosInventario](../../src/components/CadastrosInventario/index.tsx), [useCondicoesDashboard.ts](../../src/hooks/useCondicoesDashboard.ts) |
| Código morto | [KpiCard](../../src/components/KpiCard/index.tsx), [ChartCard](../../src/components/DashboardTabs/ChartCard/index.tsx), [DashboardTabs/index.tsx](../../src/components/DashboardTabs/index.tsx), [usePreferenciasInventario.ts](../../src/hooks/usePreferenciasInventario.ts) |
| Regras de lint que geram boilerplate | Em [check-project.mjs](../../scripts/check-project.mjs): "agrupe o estado relacionado", "useCallback/useMemo sem justificativa", "props precisam de interface em types" |
| Testes do demo | `tests/dashboardDemo.test.ts`, `tests/demoUsers.test.ts`, `tests/envDemo.ts`, `tests/mocks/demoUsers.ts`, handlers MSW de rotas inexistentes (`/dashboard/summary`, `/alerts/batches`, `/disposal-reports`, `/settings`, `/maintenances`, `/triage`) |
| GitHub Pages (**removido no PR 9**, D-13) | Job `deploy`, build com `--base` e `VITE_ROUTER_MODE=hash` em [.github/workflows/pages.yml](../../.github/workflows/pages.yml); `HashRouter` em [App.tsx](../../src/App.tsx); [usePublicacao.ts](../../src/hooks/usePublicacao.ts); link do Pages no [README.md](../../README.md) |

A pasta `src/` inteira é migrada para a estrutura da 5.2. Lógica aproveitável é **portada e renomeada**, não copiada:

| Arquivo atual | Destino |
| --- | --- |
| parser SSE de [dashboardSse.ts](../../src/services/dashboardSse.ts) | `shared/api/sse/parseSseChunk.ts` |
| timeout e retry de [apiReal.ts](../../src/services/apiReal.ts) | `shared/api/httpClient.ts` |
| leitura em voz de [leituraService.ts](../../src/services/leituraService.ts) | `shared/accessibility/readAloud.ts` |
| reconhecimento de voz | `shared/accessibility/useVoiceNavigation.ts` |

---

## 12. Qualidade e testes

### 12.1 Ferramentas e regras

| Item | Regra |
| --- | --- |
| TypeScript | `strict`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` |
| ESLint | Config atual + `eslint-plugin-boundaries` (ou `import/no-restricted-paths`) com as regras da 5.2 + `no-restricted-imports` para `msw` em `src/` |
| Script de checagem | `scripts/check-project.mjs` passa a verificar só: `fetch` fora de `shared/api`; storage fora de `shared/auth` e `shared/accessibility`; imports entre features; tokens CSS ⇄ `design-tokens.json`; símbolos exportados e nomes de arquivo sem identificadores em português (lista: `modoDemonstracao`, `requisitar`, `usuario`, `produto`, `cadastro`, `descarte`…) |
| Cobertura | ≥ 80 % de linhas em `shared/` e `features/*/{schemas,model,api}` |

### 12.2 Testes obrigatórios

| ID | Tipo | Cenário |
| --- | --- | --- |
| T-01 | unit + e2e | Login com `role=EMPLOYEE` → mensagem do BR-01, `POST /auth/logout` chamado com o refresh token, nenhuma rota privada acessível, `sessionStorage` vazio. |
| T-02 | e2e | `/items` sem sessão → `/login`. Refresh token de funcionário no storage → boot recusa, chama logout e limpa. |
| T-03 | unit | Refresh que devolve usuário com `role` ou `status` diferentes → sessão encerrada com logout. |
| T-04 | e2e (rede) + proxy | Nenhuma requisição a `recycling-places` ou `/disposals*` em nenhuma rota; o proxy responde `404` a elas e às rotas operacionais da X-8. |
| T-05 | e2e (rede) | Abrir o dashboard → zero requisições ao ms-inventory; uma conexão a `/api/analytics/api/v1/dashboard/overview`. |
| T-06 | unit (sseClient) | Trocar o filtro aborta a conexão anterior e abre exatamente uma nova; heartbeat reinicia o timer; o fim do stream reconecta com backoff. |
| T-07 | unit | Filtros: `from` sem `to`, `from > to`, `period` inválido → erros de campo. |
| T-08 | unit (componente) | `change_percent = null` → "—"; `circularidade.percent = null` → "Sem dados"; o texto "meta" não aparece. |
| T-09 | unit | `httpClient` envia `X-Unit-Id` da sessão e nunca `unitId` no corpo. |
| T-10 | integração (MSW) | Cadastro: `POST /items` + `submit` → toast e lista invalidada. `submit` `422` → `missingFields` marcados, item `DRAFT`, modal em modo edição. |
| T-11 | unit (schema) | Cada regra do BR-11: barcode vazio, modelo duplo/ausente, intensidade 11, `hasDamages=true` sem danos, modelo novo sem materiais, data futura. |
| T-12 | unit | Edição envia só os campos alterados; "Limpar observações" envia `notes: ""`. |
| T-13 | integração | Remover pede confirmação e chama `DELETE`; `DISPOSED` não mostra "Remover"; `REMOVED` mostra "Restaurar". |
| T-14 | integração | `PENDING_APPROVAL` mostra Aprovar/Reprovar; reprovar sem motivo bloqueia; `409` recarrega o item. |
| T-15 | integração | A lista pede `page=0&size=20`; a próxima página pede `page=1`; nenhum loop de páginas. |
| T-16 | integração | Categoria: criar sem descrição bloqueia; excluir com `409` mostra "Categoria em uso por modelos". |
| T-17 | integração | Modelo: criar sem materiais bloqueia; excluir com `409` mostra a mensagem; `approvalStatus` sem ação de aprovar. |
| T-18 | unit + integração | `stockCapacity` vazio, negativo ou decimal bloqueia; `null` na leitura mostra "Não configurada"; salvar envia `{ stockCapacity }` e atualiza a página. |
| T-19 | unit | "Esqueci minha senha" mostra a mesma mensagem para `202` e para erro de rede. |
| T-20 | unit + e2e | "Sair" chama `POST /auth/logout { refreshToken }`, limpa storage e cache e aborta o SSE, mesmo com a API fora. |
| T-21 | unit + e2e | F5 com refresh token restaura a sessão; dois `401` simultâneos disparam **um** refresh; o novo refresh token substitui o antigo. |
| T-22 | unit + proxy | O cliente nunca coloca o token na URL; o proxy responde `400` a `access_token`. |
| T-23 | unit | Snapshot e `ItemResponse` fora do contrato → `ApiError(kind: 'contract')`, sem render parcial. |
| T-24 | e2e + axe | Login, Dashboard, Itens (lista, modal, detalhe), Modelos e Configurações sem violações serious/critical. |
| T-25 | e2e | Acessibilidade: o painel não fecha ao sair com Tab; a 200 % não há scroll horizontal em 1280 px; espaçamento 1.4.12 sem corte; comando de voz só lista rotas existentes. |
| T-26 | visual | Login, Dashboard e Itens em 1440 × 900 contra o baseline aprovado do Figma (tolerância de 2 %). |

### 12.3 CI

`npm ci` → `check` → `lint` → `typecheck` → `test --coverage` → `build` → Playwright (projeto `mocked` sempre; projeto `live-qa` só com `ZERA_RUN_LIVE_QA=true` e secrets de conta gestor e conta funcionário — a de funcionário prova o BR-01 contra o QA). O repositório não publica: o workflow só valida (D-13).

---

## 13. Decisões e perguntas

### 13.1 Decisões tomadas (31/10/2026)

| ID | Pergunta original | Decisão |
| --- | --- | --- |
| D-01 | CRUD de item na web? | **Sim**: cadastrar, editar e remover item, além de aprovar/reprovar/restaurar (BR-10 a BR-14). |
| D-02 | Quais telas? | **Dashboard, Itens, Modelos e Configurações.** Recicladoras, Funcionários e Relatórios saem. |
| D-03 | Meta de circularidade? | Não existe; remover. |
| D-04 | Card inferior do dashboard? | Proposta aceita: por categoria + por situação + alertas por gravidade, tudo do snapshot. |
| D-05 | Sessão sobrevive a F5? | Sim, com o refresh token em `sessionStorage`; **encerrar sessão sempre via `POST /auth/logout`** (BR-20, BR-21). |
| D-06 | Descontinuar o GitHub Pages? | **Superada por D-12/Q-15**: a opção era "só Vercel", e a Vercel saiu. O Pages permanece até a Q-15 ser respondida. |
| D-13 | Publicação (Q-15) | Fora deste repositório: será no cluster, por outra pessoa do time. O PR 9 só removeu o que publicava (workflow do Pages, `HashRouter`, `check-publication`, que virou `check-bundle`) e deixou no README o que o cluster precisa (`dist/`, o proxy e suas variáveis). |
| D-12 | Deploy na Vercel? | Não: foi um erro do colega. Removidos `api/proxy.ts`, `vercel.json`, o link e as variáveis `VERCEL_*`. |
| D-07 | Barra de acessibilidade? | Mantida e corrigida (seção 10). |
| D-08 | Filtros de `GET /items`? | Vale o código do `ms-inventory` (`q`, `status`, `categoryId`, `modelId`, `eligibleForDisposal`). Corrigir o Confluence pág. 3. |
| D-09 | Origem do código de barras no cadastro web? | Digitado pelo gestor; sem geração nem câmera. |
| D-10 | Conteúdo de Configurações? | Página genérica e enxuta, só com a capacidade de estoque da unidade; sem regras de alerta. |
| D-11 | Envio de foto no cadastro web? | Não. |
| — | Q-06 (raios), Q-09 (seletor de unidade), Q-11 (UI em pt-BR) | Sem resposta: aplicadas as suposições padrão (raio 18/20; sem seletor, unidade do usuário; UI em pt-BR). |

### 13.2 Perguntas restantes

| ID | Pergunta | Por que a documentação não resolve | Suposição padrão | Bloqueia |
| --- | --- | --- | --- | --- |
| **Q-15** (respondida: D-13) | Onde o front será publicado, e quem injeta a `apiKey` do gateway Kong? Sem a Vercel, o GitHub Pages serve só arquivos estáticos e não pode guardar a chave. | O browser nunca deve conhecer a chave (BR-23); alguém precisa rodar o proxy. | Publicar `dist/` e `server/proxy.mjs` juntos em um host Node do time (ou atrás do Kong, que pode injetar a chave) | PR 9 |

Uma dúvida nova durante a implementação entra aqui como `Q-16` em diante, com suposição padrão e o PR que ela bloqueia.

---

## 14. Plano de execução (PRs)

Cada PR é mergeável sozinho e mantém a `main` verde.

| # | PR | Conteúdo | Definition of Done |
| --- | --- | --- | --- |
| 1 | `chore: remove demo mode, dead code and out-of-scope screens` | Seção 11, exceto acessibilidade e GitHub Pages | Build e testes verdes; `grep -ri "modoDemonstracao\|VITE_USE_MSW" src` vazio |
| 2 | `feat(proxy): single allowlisted proxy` | 7.1 + 7.2; Vite usa o mesmo middleware; `.env.example` novo | T-04 (proxy), T-22 |
| 3 | `refactor: app skeleton and shared layer` | 5.2: `app/`, `shared/api`, `shared/config`, TanStack Query, zod | T-09, T-23 |
| 4 | `feat(auth): manager-only session with server logout` | 7.3, guards, BR-01/02/19/20/21. O visual do login do Figma (8.1) entra no PR 5, junto com as fontes e os tokens; o roteamento segue em `<Routes>` com `PrivateRoute`, porque os requisitos Req 18 e Req 23 de `tests/requisitos.test.ts` leem esses arquivos | T-01, T-02, T-03, T-19, T-20, T-21 |
| 5 | `feat(design-system): figma tokens, fonts and accessibility panel` | Seções 9 e 10, componentes `shared/ui` | T-25; contraste AA; T-26 (login) |
| 6 | `feat(dashboard): overview from analytics SSE` | 7.4 + 8.2; sem agregação no cliente | T-05, T-06, T-07, T-08, T-26 |
| 7 | `feat(items): list, create, edit, remove and manager decisions` | 8.3, BR-10 a BR-15 | T-10 a T-15 |
| 8 | `feat: models, categories and stock capacity settings` | 8.4, 8.5, BR-16 a BR-18 | T-16, T-17, T-18, T-24 |
| 9 | `chore(ci): boundaries lint, coverage, deploy target` | 12.1, 12.3, Q-15 | CI completo verde; workflow de publicação conforme a Q-15 |

---

## 15. Rastreabilidade

| Regra | Camadas | Testes | PR |
| --- | --- | --- | --- |
| BR-01 | L5 | T-01, T-02 | 4 |
| BR-02 | L5 | T-03 | 4 |
| BR-03 | L1, L7 | T-04 | 1, 2 |
| BR-04 | L1, L7 | T-04 | 1, 2 |
| BR-05 | L4, L7 | T-05 | 6 |
| BR-06 | L2 | T-06 | 6 |
| BR-07 | L6 | T-07 | 6 |
| BR-08 | L4, L7 | T-08 | 6 |
| BR-09 | L2 | T-09 | 3 |
| BR-10 | L6, L7 | T-10 | 7 |
| BR-11 | L6, L3 | T-11 | 7 |
| BR-12 | L6 | T-12 | 7 |
| BR-13 | L7 | T-13 | 7 |
| BR-14 | L6, L7 | T-14 | 7 |
| BR-15 | L2, L7 | T-15 | 7, 8 |
| BR-16 | L6, L7 | T-16 | 8 |
| BR-17 | L6, L7 | T-17 | 8 |
| BR-18 | L6, L7 | T-18 | 8 |
| BR-19 | L6, L7 | T-19 | 4 |
| BR-20 | L5 | T-20 | 4 |
| BR-21 | L5 | T-21 | 4 |
| BR-22 | L7 | T-08 | 6 |
| BR-23 | L1, L2 | T-22 | 2, 6 |
| BR-24 | L3 | T-23 | 3 |

---

## 16. Status de implementação

| PR | Estado | Observações |
| --- | --- | --- |
| 1 a 6 | Entregues | — |
| 7 | Entregue | Desvios: sem clique na linha inteira (o link do nome abre o detalhe); intensidade de uso é um campo numérico, sem slider; o seletor de modelos mostra os 100 primeiros. As rotas seguem em português (`/itens`, `/modelos`, `/configuracoes`). |
| 8 | Entregue | Aprovação de modelo é só leitura. Garantia e vida útil, uma vez informadas, só podem ser trocadas (a API não apaga). O código legado (`services/`, `utils/guarda*`, hooks e componentes de cadastro em português) foi removido; ficaram só os arquivos que os requisitos da disciplina leem. |
| 9 | Entregue | CI só de validação (sem publicação), regra de fronteiras entre camadas no `check-project`, cobertura ≥ 80 % de linhas em `shared/` e `features/*/{schemas,model,api}` (componentes e hooks ficam com o Playwright). Sem plugin novo de lint: a regra de dependência vive em `scripts/check-project.mjs` (`models → items` é a única dependência entre features). |

**Dashboard e o lote do BFF.** O `ms-analytics-bff` serve o último lote do cron (de hora em hora no QA), então os números nunca são ao vivo; a tela mostra de quando é o lote. Em 01/11/2026 o lote do gestor QA veio com `itens_cadastrados = 0` apesar de 25 itens no inventário da unidade: o pipeline do BFF perde os itens ao ligá-los à organização. É um problema do backend, não do front.
