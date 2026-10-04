# Verificação técnica — atualizada em 04/10/2026

## Continuação de 04/10/2026

O usuário indicou os microsserviços QA. Nenhuma credencial de banco foi copiada para arquivos, frontend, logs ou Git. As credenciais compartilhadas no chat devem ser rotacionadas; não foram utilizadas em conexões HTTP nem em acesso direto aos bancos. O `.env` permaneceu intacto; inspecionaram-se apenas os nomes e a presença ativa de VITE_API_BASE_URL e VITE_USE_MSW. Não foram adicionadas variáveis públicas.

Os dois swagger-config apontaram para `/qa/{administrative|inventory}/swagger-ui/api-docs`, ambos OpenAPI 3.1.0. Administrativo: server HTTP terminado em `/qa/administrative/swagger-ui`, UserOutput.role MANAGER/EMPLOYEE. Inventário: server `/`, sem securitySchemes; GET anônimo na origem declarada `/api/v1/items` retornou 404, enquanto GET administrativo `/api/v1/users` retornou 401. As tentativas HTTPS dos documentos falharam no transporte. `localhost:8000/api` não respondeu. São leituras anônimas, não autenticação comprovada. Não se presumiu a base do gateway a partir do Swagger UI. Actor continua sendo um objeto em query sem comportamento autenticado validado; não foram enviados claims ou mutações. Não há endpoint Neo4j confirmado. A conta de aplicação e a URL HTTPS segura continuam necessárias; as credenciais de banco/basic-auth não substituem LoginRequest.

Docker Desktop estava desligado. Iniciaram-se somente os serviços Zera postgres, redis e backend-api do Compose já existente: os dois primeiros healthy, backend running. A documentação local em localhost:8080 não respondeu dentro do timeout de 10 segundos nesta rodada. Essa API Java tem contrato diferente do QA; não foi usada como fallback nem alegada como integração dos microsserviços. Não houve modificação do workspace pai nem de dados, volumes ou bancos existentes.

Correções implementadas: 401 autenticado invalida token/unidade e informa o AuthContext; 403 preserva a sessão e informa falta de permissão; 401 atrasado de uma sessão anterior não encerra uma nova sessão. Login limpa sessão anterior e rejeita identidade divergente ou incompleta. Testes usam respostas controladas e valores efêmeros, não credenciais reais. Continuidade de dados PostgreSQL na UI permanece sem prova.

O painel passou a oferecer leitura em voz alta opcional, apenas com voz local em português, sem microfone ou leitura de formulários, conteúdo oculto/inert e campos marcados data-sensivel. A leitura para ao fechar o painel, trocar de rota, ocultar a aba ou desmontar o componente. Chromium enumerou duas vozes locais em português; ativação por Tab/Enter mudou o botão para Parar leitura e speechSynthesis.speaking para true; Enter e Escape interromperam a fala. Não se verificou a saída de áudio por escuta humana. O recurso não substitui NVDA/VoiceOver, nem comprova teste com leitor de tela do sistema. NVDA não localizado nas instalações consultadas; node_repl/automação Windows não disponível nesta sessão. Microfone real não foi ativado. Comandos de voz agora encerram também na ocultação da aba.

Navegação SPA atualiza document.title e foca main após a página carregar; observado em Dashboard → Modelos por Enter. Validação de login move o foco para o primeiro campo inválido. Toast mantém uma região status persistente e atomic. A auditoria encontrou e corrigiu headings h3 dos KPIs que pulavam h2, ausência de main/h1 no fallback lazy e ausência de h1 no erro/carregamento da triagem. Erro de categorias também bloqueia a triagem, em vez de ignorar o checklist.

Verificações finais desta rodada: npm ci instalou 249 pacotes e reportou zero vulnerabilidades; npm test passou 73 testes em 8 arquivos; npm run lint e npm run build/TypeScript passaram. O Node 24.18.1 do PATH falhou em lstat de C:\Users\bart\AppData; usou-se o Node 22.14.0 existente somente no PATH dos processos da tarefa. Nenhuma alteração global de Node/PATH. Dev HTTP 200. Auditoria axe em 42 combinações de 14 rotas/estados e três perfis fictícios MSW: zero violações finais, contraste SVG do dashboard inconclusivo nos três perfis (13 nós por dashboard), mantido como pendência. Não é prova de dados ou RBAC autenticado real. Relatório local completo em artifacts/continuation-20261004/rotas.json; resumo publicável em docs/evidencias/browser-20261004.json.

Login/painel a 320 CSS px: clientWidth/scrollWidth 305/305; texto interno 200%: 305/305 e painel 288px. Zoom nativo Chromium 200%: DPR 2, raiz 16px, viewport CSS 640px e largura/scrollWidth 632/632, separadamente do controle interno. Contraste medido no novo botão de leitura: rgb(23,27,46) sobre branco, 17,04:1. Skip link, foco no primeiro campo inválido, sequência de nove Tab até leitura, ativação/parada por Enter, Escape e retorno ao gatilho verificados. Campos fictícios de formulário, elementos ocultos e data-sensivel excluídos da leitura; conteúdo público incluído. Não se declara revisão manual integral de todos os modais/paletas, leitor de tela, toque ou WCAG completa.

PR #1 já integrado antes desta rodada, main 50d062e. A branch de trabalho foi avançada por fast-forward para essa main, preservando alterações. ENTREGAS.md continua somente local e ignorado por .git/info/exclude; nenhum arquivo foi removido por limpeza. A publicação do frontend não resolve os bloqueios da API descritos acima. O registro anterior abaixo preserva as evidências de 02/10, sem convertê-las em validações de integração real.

## Registro anterior de 02/10/2026

## Workspace, fontes e preservação

Pasta confirmada: `C:\Users\enzolanzani-ieg\OneDrive - Instituto J&F\Área de Trabalho\Projetos e Estudos\Tech\ZERA - Entrega Final\Zera-Web`. Nenhum AGENTS.md local adicional encontrado. Os dois anexos pasted-text.txt estavam acessíveis: emissor original (9.266 linhas, incluindo assets codificados) e escopo v2 (308 linhas). Foram processados integralmente como arquivos; a inspeção textual exibida do emissor foi parcial, com saídas truncadas. Não se declara leitura visual integral das 9.266 linhas. Assets locais da marca foram inspecionados; novas referências visuais separadas não estavam acessíveis.

Checkout recebido sem Git válido; a pasta .git vazia do pai foi preservada. Snapshot anterior às alterações mantido no diretório temporário local, sem .env. Nenhum arquivo foi removido por limpeza: redundância não demonstrada.

Artefatos encontrados no workspace pai e consultados sem modificação:

- `01 - Modelagem de Dados/sql/01_schema.sql`;
- `02 - Banco de Dados 2/neo4j/grafo.cypher`;
- `07 - Operacoes Ageis (DevOps)/Infraestrutura (Docker)/docker-compose.yml`;
- `05 - Dev 2 (API Java)/API Principal`.

SQL/Cypher não equivalem ao contrato QA (identificadores/enums/modelos diferentes). O Cypher contém `MATCH (n) DETACH DELETE n`: não foi executado. O serviço web do Compose aponta para outro frontend, `06 - Aplicacoes Dinamicas (Web)`. Nenhum backend foi copiado para o repositório.

## Contratos e transporte

Swagger carregou `swagger-initializer.js` → `/qa/{administrative|inventory}/swagger-ui/api-docs/swagger-config` → `/qa/{administrative|inventory}/swagger-ui/api-docs`. Ambos os documentos retornaram 200 e OpenAPI 3.1.0. Na reconsulta, servers administrativo declara `http://34.95.129.59/qa/administrative/swagger-ui`; inventário declara `/`, divergindo do registro anterior. O gateway de inventário não tem base HTTPS comprovada; o caminho da UI não é usado como prova dessa base.

HTTPS desses documentos no mesmo IP falhou no transporte (TRANSPORT_ERROR). GET anônimo `/api/v1/users` e `/api/v1/items`, nas bases declaradas, retornou 401. Nenhuma credencial foi enviada por HTTP. OpenAPI não documenta consistentemente security/schemas de erros; 401 não comprova autorização por operação. O cliente exige HTTPS, recusa redirects e mantém token apenas em memória. Nenhuma sessão real foi criada.

Legenda: A = token administrativo em memória; I = token + X-Unit-Id. Todos os adaptadores reais aguardam smoke autenticado. PageResponse usa content/totalPages/page/size; paginação validada pelo cliente. Listas administrativas são arrays no documento; completude no servidor não comprovada.

| Tela/operação | Método/endpoint confirmado | Schema | Auth | Estado/limite |
|---|---|---|---|---|
| Login | POST /api/v1/auth/login | LoginRequest → TokenResponse | Anônimo | Implementado; envio QA bloqueado por HTTP. |
| Identidade | GET /api/v1/users/{id} | UserOutput | A | MANAGER/EMPLOYEE; desconhecidos rejeitados; ADMIN ausente. |
| Funcionários | GET /api/v1/users | UserOutput[] | A | Lista adaptada; rota atual admin. POST /users ausente; backend usa convites. |
| Recicladoras | GET/POST /api/v1/recyclings | RecyclingBusiness[] / RegisterRecyclingRequest → RecyclingBusiness | A | Lista/cadastro name/cnpj/email; cidade não inventada. |
| Categorias | GET/POST /api/v1/categories | CategoryResponse[] / CreateCategoryRequest → CategoryResponse | I | Nome/descrição; campos legados não enviados; UI gestor/admin. |
| Modelos | GET /api/v1/models | PageResponseModelResponse | I | Lista/materiais/vida útil; categoria filtrada localmente, sem query inexistente. |
| Criar modelo | POST /api/v1/models | CreateModelRequest + Actor na query | I | Apenas demo; serialização/autorização Actor não validadas. |
| Inventário | GET /api/v1/items | PageResponseItemResponse | I | UUID/oito estados/paginação/filtros; sem fixtures no modo real. |
| Detalhe | GET /api/v1/items/{id} | ItemResponse | I | Identificadores preservados e estados assíncronos. |
| Etiqueta | GET /api/v1/items/by-barcode/{barcode} | ItemResponse | I | Entrada manual/leitor como teclado, caminho codificado; câmera não implementada. |
| Editar item | PATCH /api/v1/items/{id} | UpdateItemRequest → ItemResponse | I | Nome/condição/notas; vazio preserva notas; somente teste controlado. |
| Criar/excluir item | POST /api/v1/items; DELETE /api/v1/items/{id} | CreateItemRequest / Actor obrigatório | I | Bloqueados até confirmar Actor; nenhum DELETE disparado. |
| Eventos | GET /api/v1/items/{id}/events | PageResponseEventResponse | I | Nova aba com loading/erro/lista. |
| Dashboard | GET /api/v1/dashboard/home; GET /api/v1/dashboard/indicators | HomeSummaryResponse / DisposalIndicatorsResponse | I | Indicadores e kg descartados; não apresentados como recuperação comprovada. |
| Descartes | GET /api/v1/disposals | PageResponseDisposalResponse | I | Tabela gestor/admin; demo explicita ausência de dados reais. |
| Confirmar descarte | POST /api/v1/disposals | CreateDisposalRequest + Actor | I | Sem escrita real, autorização/Actor não validados. |
| Configurações | GET /api/v1/unit-settings | UnitSettingsResponse | I | Capacidade de estoque; rota admin atual. |
| Alterar capacidade | PUT /api/v1/unit-settings | UpdateUnitSettingsRequest + Actor | I | Bloqueado; configurações legadas sem equivalência. |
| Triagem/manutenção | Transições /api/v1/items/{id}/... | Schemas próprios + Actor | I | Não equivalem a /triage/formulário legado; somente demo. |
| Preventiva/alertas | Sem contrato equivalente confirmado | — | — | Regras legadas somente demo, sem sucesso fictício em produção. |
| Prévia/envio de relatório | Sem contrato equivalente confirmado | — | — | Descartes não são relatórios enviados; somente demo. |
| Leitura Neo4j | Nenhum endpoint encontrado | — | — | Nenhum driver/conexão direta no frontend. |

Política alinhada ao escopo v2: Funcionários/Configurações exclusivos do administrador; gestor/admin consultam relatórios e geram prévias, somente admin confirma envio; triagem funcionário/admin; descartes gestor/admin. Teste de gestor confirmou menu, rota e ausência de controles de envio. Não existe ADMIN documentado no QA. Frontend não substitui autorização do backend.

## Docker/backend local

Docker CLI/server 24.0.6 disponível. Compose config --services passou. Executado somente `up -d postgres redis backend-api`: PostgreSQL/Redis healthy, backend running. Outros processos/serviços/volumes preservados; neo4j-init não iniciado.

GET `http://localhost:8080/v3/api-docs` retornou 200/OpenAPI 3.1.0. GET anônimo /api/produtos retornou 401. Login local /api/auth/login retorna LoginResponse diferente do QA e usa /api/..., não /api/v1/.... O SecurityConfig local confirma FUNCIONARIO/GESTOR/ADMINISTRADOR, enquanto o QA só documenta EMPLOYEE/MANAGER. Criar usuário local requer ADMINISTRADOR e não há bootstrap público no código consultado. Sem conta de teste autenticada disponível por fluxo documentado, não se criou JWT nem se alterou banco/usuários existentes. O frontend não adapta esse backend legado nem o apresenta como os microsserviços. Persistência PostgreSQL autenticada e dados Neo4j não foram comprovados na UI.

## Segurança/ambiente

.env inspecionado somente por nomes/presença: VITE_API_BASE_URL e VITE_USE_MSW ativos. Não editado/publicado. .env.example também declara VITE_ADMIN_API_URL, VITE_INVENTORY_API_URL, VITE_ADMIN_OPENAPI_URL e VITE_INVENTORY_OPENAPI_URL. VITE_ROUTER_MODE adicionada como configuração pública de roteamento; o workflow usa hash e base /zera-web-app/. QA HTTP não ativado como API real.

Senha demonstrativa movida para fixtures.local/admin.json ignorado. Vite gera digest exclusivamente para validação local de desenvolvimento; produção elimina imports demo. MSW usa logs silenciosos. Login de administrador demo com entrada incorreta permaneceu no login, não criou sessão e passou axe; senha real da fixture não foi escrita no teste/relatório. Tokens reais ficam em memória, expiram e são limpos ao sair, sem localStorage. Redirects de fetch recusados para impedir downgrade de HTTPS.

Revalidação de 411 conteúdos rastreados, bundle e blobs do histórico sem correspondência da credencial demonstrativa/digest nem padrões de chave privada/token GitHub/conexão de banco com senha. .env, fixture local, node_modules, dist e backend ausentes do índice. Busca estática não comprova ausência de todo segredo possível.

## Browser/acessibilidade

Chromium via agent-browser 0.27.0/CDP. Relatórios em docs/evidencias, sem campos de login. Nova rodada principal: 0 violações axe, 1 análise inconclusiva de contraste SVG/dashboard; zero falhas de teclado/RBAC/reflow e zero erros de runtime. 13 rotas/estados abertos diretamente; 26 combinações em 320 CSS px com texto 100%/200%. Login de produção a 320 CSS px/200% mediu clientWidth/scrollWidth iguais (305 px).

Teclado real: primeiro foco no skip link, Enter para main, Tab/Shift/Shift+Tab sem modal espontâneo, painel/foco/Escape/retorno, login, digitação e ciclo do modal. Categoria vazia/sucesso e código encontrado/inexistente passaram em MSW. Produção protege acesso direto/refresh, não ativa MSW e carrega página em chunk separado. Relatórios complementares contêm análises de contraste inconclusivas em estados adicionais; não tratadas como passes. Filtros por Enter/setas, rolagem horizontal de tabela por seta e abas por seta passaram. A falha de região rolável da prévia foi corrigida com foco e retestada sem violações axe.

Estilos computados dos textos do gráfico sobre card branco: rótulos/eixo/meta 5:1 e valor central 13,1:1. 14 testes de contraste incluem texto normal 4,5:1 e foco/arco 3:1. Zoom nativo em 200% executado pelo controle settingsPrivate do Chromium, sem CSS zoom ou aumento do texto: preferência 2, devicePixelRatio dobrou, font-size raiz permaneceu 16px. Foram 33 combinações de 11 rotas com três perfis MSW, sem overflow de página/erros. Axe manteve inconclusivos no dashboard e na sexta coluna de itens fora da região visível; não foram descartados. Tab percorreu 639 paradas de foco em 20 combinações de rota/largura 1280 e 320 px, sem foco encoberto. Login medido em normal/hover/foco/erro/alto contraste: texto mínimo 4,70:1, contorno de foco 13,10:1 contra fundo adjacente; desabilitado identificado como estado dispensado do critério, sem fingir razão composta pela opacidade. Todas as paletas, overlays e componentes/estados não possuem revisão manual completa. Tabelas têm região rolável/caption; barras têm tabela textual visível via details; donut tem alternativa em texto/aria-label.

Painel oferece tamanho, contraste, espaçamento, fonte do sistema, modo foco, guia não interativo, simulações aproximadas e ajuda por botão. Voz inicia somente por ativação explícita; parar/estado/aviso de processamento externo, encerramento ao fechar painel. Ciclo de ativação explícita/pt-BR/parada ao fechar testado com API de voz simulada, sem microfone. Microfone real não exercitado. OpenDyslexic não incluída sem asset/licença. Áudio/vídeo: não aplicável, nenhum existente encontrado.

Limites: NVDA não localizado no PATH nem nas pastas de instalação consultadas; VoiceOver não se aplica ao Windows. Leitor de tela real não executado. O navegador enumera um audioinput e expõe SpeechRecognition, mas permissão de microfone permanece prompt; não houve captura nem comando falado real, e não se concedeu permissão silenciosamente. Ferramenta Windows node_repl/sky indisponível nesta sessão. Toque, todos os modais/paletas/estados autenticados reais não executados. 320 CSS px + texto 200% é registrado separadamente do zoom nativo. Não se afirma conformidade WCAG integral.

Para validação posterior com NVDA no Windows/Chrome: abrir login, usar Tab/Enter no skip link e confirmar anúncio do conteúdo; percorrer menu, filtros e cabeçalhos de tabelas em cada perfil; provocar erro de formulário, abrir modal, verificar leitura, ciclo Tab/Shift+Tab, Escape e retorno do foco. Para voz: permitir o microfone pela interface do navegador após ativação explícita, falar um destino permitido e verificar encerramento/alternativa por teclado.

## Comandos/resultados

- npm ci: 249 pacotes instalados pelo lockfile; 0 vulnerabilidades reportadas; aviso de suporte da versão fixada de ESLint.
- npm run lint: passou.
- npm run build: TypeScript/Vite passaram; chunks por página.
- npm test: 63 testes, 7 arquivos; serviços/erros/paginação/HTTPS/OpenAPI/mapeamentos/14 contrastes e oito regressões de autenticação/limpeza em 401/403/papel não documentado/isolamento da validação demo com valores efêmeros.
- npm run dev: localhost:5173 verificado. Flags extras via npm shim não documentadas, pois uma tentativa falhou no caminho Windows.
- npm run preview: localhost:4173 observado.
- npm run msw:init: CLI local passou, worker necessário preservado.
- git diff --check e --cached --check: passaram após normalização de whitespace/CRLF apontados.

## GitHub/implantação

Git Credential Manager confirmou EnzoCasares, membro ativo e criação pública autorizada. Repo inicialmente 404; criado público em https://github.com/zera-interdisciplinar/zera-web-app. Main inicializada pelo GitHub; workspace baseado na main remota por reset mixed, preservando arquivos. Branch feat/complete-zera-web.

Commit implementação: 5870645, feat: implement Zera frontend and confirmed API contract adapters. Documentação/evidências em commit próprio. Publicação de código não é implantação. Vercel respondeu USER_NOT_LOGGED_IN; GitHub CLI ausente, usados Git/REST. Vercel revalidada: USER_NOT_LOGGED_IN. Permissão administrativa GitHub confirmada, sem rulesets/proteção legada da main; Pages habilitado com build_type workflow e HTTPS obrigatório. Workflow valida npm ci/lint/63 testes/build/scope no PR e só implanta a main; hash routing preserva refresh no hosting estático. Skip link corrigido após falha observada no preview (hash #conteudo causava 404); reteste manteve #/login e focou main. Deploy público depende da execução pós-merge e não é presumido por esse registro pré-merge. M14 continua sem 20 commits/quatro semanas: os commits verdadeiros do histórico observado são de 02/10/2026. Sem force push, histórico reescrito ou datas retroativas.

ENTREGAS.md removido somente do índice no commit 436d2f8, preservado localmente e excluído por .git/info/exclude. Confirmado ausente na árvore origin/feat/complete-zera-web e na lista de arquivos do PR em relação à main. Commits históricos ainda contêm o documento comum; não houve reescrita. Nenhum outro arquivo removido por limpeza.
