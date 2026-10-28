# Zera

Aplicação web para inventário, movimentações e sustentabilidade de resíduos eletrônicos.

## Aplicação publicada

Ainda não publicada na Vercel. No novo diagnóstico autorizado de 19/10/2026, o login de QA retornou HTTP 401 sem `apiKey` e HTTP 503 com `apiKey` (campos `message` e `request_id` em ambos). Sem JWT, `/health` e o overview não foram consultados. A causa do 503 deve ser confirmada pela equipe do gateway/admin-core; não houve autenticação real comprovada.

## Como rodar

Requer Node.js 22.12 ou superior e npm 10 ou superior. Execute `npm run dev`. O Vite encaminha as chamadas para os três serviços remotos, sem precisar de Docker ou de um segundo processo de proxy. Docker só é iniciado quando `ZERA_START_DOCKER=true`.

Para modo real, configure `VITE_USE_MSW=false`, `VITE_DASHBOARD_DEMO_MODE=false` e as bases públicas abaixo. As bases privadas e a chave são lidas somente pelo servidor. O arquivo local `.env.local`, ignorado pelo Git, pode sobrescrever URLs e flags de `.env`; não copie credenciais para ele.

Para demonstração, configure `VITE_USE_MSW=true` e `VITE_DASHBOARD_DEMO_MODE=true` e acesse `/demonstracao` pelo link do login. Essa rota é somente de leitura e não cria sessão nem libera áreas privadas. Reinicie o Vite após mudar flags ou bases. Não execute testes de login real contra QA enquanto houver bloqueio e sem autorização para novas tentativas.

## Variáveis de ambiente

Configuração pública recomendada, tanto local como na Vercel:

```env
VITE_USE_MSW=false
VITE_DASHBOARD_DEMO_MODE=false
VITE_API_BASE_URL=/api/analytics
VITE_ADMIN_API_URL=/api/administrative
VITE_INVENTORY_API_URL=/api/inventory
```

Não acrescente `/api` ao final das bases; o código acrescenta `/api/v1/...`. As rotas públicas de proxy contêm o prefixo de serviço e encaminham somente o restante para o backend.

As variáveis `VITE_*` são incorporadas ao bundle e ficam visíveis no navegador. Não use esse prefixo para senhas ou chaves privadas.

Credenciais de QA ficam somente no `.env`: `QA_GESTOR_EMAIL`, `QA_GESTOR_PASSWORD`, `QA_OPERARIO_EMAIL` e `QA_OPERARIO_PASSWORD`. A configuração privada usa `ZERA_APP_API_KEY`, `ZERA_ANALYTICS_URL`, `ZERA_ADMIN_URL` e `ZERA_INVENTORY_API_ORIGIN`. As bases privadas devem apontar para a raiz HTTPS de cada serviço, sem `/api`, Swagger ou credenciais na URL. `ZERA_ADMIN_API_ORIGIN` continua aceito como nome legado. HTTP só é permitido em loopback.

Na Vercel, configure essas variáveis privadas no ambiente da função, nunca como `VITE_*`. As funções `api/administrative/[...path].ts`, `api/inventory/[...path].ts` e `api/analytics/[...path].ts` reutilizam o proxy Node. Ele injeta `apiKey`, preserva JWT/unidade/status e transmite SSE sem acumular a resposta. A função analytics tem duração máxima configurada em 300 segundos; após encerramento, o cliente reabre a conexão. A publicação Vercel ainda precisa ser validada em um domínio real.

O proxy Node independente (`npm run api:proxy`) também lê `.env` e `.env.local`; só é necessário para consumidores fora do Vite. Ele escuta em loopback, na porta `ZERA_PROXY_PORT` (padrão 8787). Origens adicionais podem ser configuradas em `ZERA_WEB_ORIGINS`; requisições de mesma origem são aceitas.

## Dados do Databricks e bancos

O website não conecta diretamente a Databricks, PostgreSQL ou Neo4j. O admin-core autentica e fornece os recursos administrativos; o inventário fornece os recursos operacionais; o BFF entrega o lote analítico publicado pelo cron. Credenciais desses bancos não são lidas pelo React nem repassadas ao cliente.

O dashboard usa `GET /api/v1/dashboard/overview`, `Authorization: Bearer` e `ReadableStream`. A troca de filtro cancela a conexão anterior. Snapshot, ausência de lote, erro de autorização e reconexão são estados distintos; `unavailable` não é substituído por dados fictícios. JWT nunca é enviado na query string.

No modo real, a visão geral mostra os KPIs documentados, categorias, situações, série mensal de cadastros/encaminhamentos e alertas por gravidade. Percentuais nulos aparecem como `—`. Os gráficos detalhados das outras abas, sem campos no contrato fornecido, continuam identificados como sem fonte confirmada; não são calculados a partir de dados inexistentes.

## Modo real e modo de demonstração

No modo real, login e serviços usam as APIs configuradas; o token fica somente em memória, é apagado no logout e exige novo login após recarregar a página. Essa escolha evita persistir o token no navegador. No modo de demonstração, somente o perfil demonstrativo é persistido em `localStorage` versionado, com expiração. A conexão real com analytics depende do BFF público e do contrato OpenAPI confirmado.

No Plano B, o dashboard apresenta fixtures sintéticas com o aviso “DADOS DE DEMONSTRAÇÃO: API de analytics indisponível neste ambiente.” e selo `DEMONSTRAÇÃO` em cada card e gráfico. Exige `VITE_USE_MSW=true`; `VITE_DASHBOARD_DEMO_MODE=false` também o desativa. Com `VITE_USE_MSW=false`, nenhuma fixture é apresentada e `/demonstracao` não existe. Em desenvolvimento com MSW ligado, o login legado é simulado; não deve ser interpretado como autenticação QA bem-sucedida. Use o link público de demonstração, que não pede credenciais.

O bundle de produção não incorpora as variáveis do `.env` local nem inicia o Service Worker. As configurações privadas só são usadas no proxy do servidor. Para publicar demonstração, configure explicitamente as duas flags públicas no ambiente de build. O modo real não faz fallback silencioso para fixtures.

## Rotas

`/login`, `/esqueci-senha`, `/demonstracao` (apenas quando habilitada), `/`, `/itens`, `/itens/:id`, `/itens/:id/triagem`, `/modelos`, `/recicladoras`, `/descartes`, `/funcionarios`, `/relatorios` e `/configuracoes`.

## Estrutura de pastas

`src/components`, `src/pages`, `src/services`, `src/types` e `src/utils`.

## Usuários de teste

As credenciais QA são carregadas localmente de `.env`; não as inclua no repositório.

## Acessibilidade

Meta: WCAG 2.1 AA. Execute `npm run test:e2e -- dashboard.playwright.ts` para verificar as cinco abas de demonstração, os selos, a desativação com MSW=false e o fluxo real com respostas controladas (loading, snapshot, filtros, logout, HTTP 401/403/503). As chamadas de API são interceptadas nesses testes, sem acessar QA; aprovação não comprova disponibilidade externa. Os testes de proxy usam upstreams locais. A validação manual com NVDA ou VoiceOver ainda está pendente.

## Autor e disciplina

Autor e disciplina: a confirmar pela equipe do projeto.
